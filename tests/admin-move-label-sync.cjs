/* Mobile integration smoke test for all admin tabs. Uses synthetic fixture data only. */
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const chars = Array.from({length:35}, (_,i) => ({
  id: i===0 ? "alisa" : i===1 ? "bryan" : "fighter"+i,
  name: i===0 ? "アリサ" : i===1 ? "ブライアン" : "キャラクター"+i,
  en: i===0 ? "Alisa" : i===1 ? "Bryan" : "Fighter "+i,
  moves: Array.from({length:18}, (_,k) => ({
    k, name: k === 0 ? "リードジャブ" : "ストップビットの長い技名" + k,
    a: {command:k===0 ? "LP" : "LP LP WP DF+"+k}
  }))
}));
const preview = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
var CHARACTERS = ${JSON.stringify(chars)};
var COLS = [{id:"command",label:"コマンド"},{id:"hit",label:"ヒット時"}];
var INFO_TAGS = [{id:"test",label:"テストタグ",full:"テスト"}];
function moveInfo(){return {tags:[]};}
var PTIcons = {catalog:[{id:"homing",label:"ホーミング",cmd:true},{id:"tornado",label:"トルネード",cmd:false}], autoSplit:function(){return {c:[],g:[],a:[]};}};
</script></body></html>`;
const entries = [
  { character_id:"alisa",move_name:"リードジャブ",site_k:0,status:"published",media:{video:"/videos/example.mp4"}},
  { character_id:"bryan",move_name:"ストップビット",site_k:1,status:"draft",media:{} }
];
const server = http.createServer(async (req,res)=>{
  const pathname = new URL(req.url,"http://localhost").pathname;
  if(pathname === "/pc.html" || pathname === "/sp.html"){
    res.writeHead(200,{"Content-Type":"text/html;charset=utf-8"});res.end(preview);return;
  }
  if(/^\/(admin\.html|admin\.js|admin-move-icons\.js|admin-move-media\.js|admin-cloud-analysis\.js)$/.test(pathname)){
    const body = await fs.readFile(path.join(process.cwd(), pathname.slice(1)));
    res.writeHead(200,{"Content-Type":pathname.endsWith(".html")?"text/html;charset=utf-8":"text/javascript;charset=utf-8"});res.end(body);return;
  }
  if(pathname.startsWith("/icons/")){res.writeHead(404);res.end();return;}
  res.writeHead(404);res.end();
});

const savedReviews = new Map();
const iconWrites = [], videoUploads = [];
const fixtures = (u) => {
  if(u.pathname==="/api/v1/me") return {is_admin:true,display_name:"管理者テスト",project_t_id:"11111111-2222-4333-8444-555555555555",csrf_token:"test"};
  if(u.pathname==="/api/v1/admin/checksheet") return {characters:[]};
  if(u.pathname.startsWith("/api/v1/admin/checksheet/")) {
    const id=u.pathname.split("/")[5];
    if(id==="bryan"){
      const source=chars.find(c=>c.id==="bryan");
      const moves=JSON.parse(JSON.stringify(source.moves));
      moves[1].name="保存済みブライアン技";moves[1].a.command="6LP+RK";
      return {exists:true,version:1,moves,saved_base_hash:null,current_base_hash:null,manifest_ok:true,published:null};
    }
    return {exists:false,current_base_hash:null,manifest_ok:true,moves:[],published:null};
  }
  if(u.pathname==="/api/v1/admin/move-icons")return {entries:[]};
  if(u.pathname==="/api/v1/admin/move-media")return {entries};
  if(u.pathname==="/api/v1/admin/cloud-analysis/workspace"){
    const bryan={moves_count:250,unique_ids:55,unlabeled_ids:10,rows_with_candidate_edges:8,
      top_unknown_ids:[{id:1021,raw_occurrences:100,candidate_moves:25,priority_score:75},
        {id:439,raw_occurrences:50,candidate_moves:17,priority_score:90}]};
    const cross={characters_found:35,requirements_records_parsed_total:3000,
      requirements_unique_ids_global:200,ids_in_all_analyzed_characters:10,ids_in_exactly_one_character:20,
      bryan_unlabeled_found_in_overview:15,top_priority_ids:[
        {req_id:1021,characters_present:35,records_all_characters:100,parameter_variants:5,investigation_score_heuristic:72},
        {req_id:439,characters_present:1,records_all_characters:8,parameter_variants:2,investigation_score_heuristic:90}
      ]};
    return {reports:{bryan,cross},reviews:[...savedReviews.values()],errors:{},history:{
      bryan:{snapshots:[
        {generated_utc:"2026-11-07",data:{summary:{moves_count:250},ids:bryan.top_unknown_ids}},
        {generated_utc:"2026-11-06",data:{summary:{moves_count:249},ids:[{id:1021,raw_occurrences:99,candidate_moves:25,priority_score:69}]}}
      ]},
      cross:{snapshots:[]}
    }};
  }
  if(u.pathname==="/api/v1/admin/cloud-analysis")return {moves_count:250,unique_ids:55,unlabeled_ids:10,rows_with_candidate_edges:8,
     top_unknown_ids:[{id:1021,raw_occurrences:100,candidate_moves:25,priority_score:75}]};
  if(u.pathname==="/api/v1/admin/cloud-analysis/all-characters")return {characters_found:35,requirements_records_parsed_total:3000,
    requirements_unique_ids_global:200,ids_in_all_analyzed_characters:10,ids_in_exactly_one_character:20,bryan_unlabeled_found_in_overview:15,
    top_priority_ids:[{req_id:1021,characters_present:35,records_all_characters:100,parameter_variants:5,investigation_score_heuristic:72}]};
  if(u.pathname==="/api/v1/admin/audit")return {entries:[{at:"2026-11-07T05:00:00",action:"admin_grant",actor:"11111111",target:"22222222",object_type:"user",details:{reason:"test"}}]};
  return null;
};

(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [320,390,768,1366]){
      const page=await browser.newPage({viewport:{width,height:850}});
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      await page.route("**/api/v1/**", async(route)=>{
        const u=new URL(route.request().url());
        if(u.pathname==="/api/v1/admin/move-icons/set"&&route.request().method()==="POST"){
          iconWrites.push(JSON.parse(route.request().postData()));
          await route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});return;
        }
        if(u.pathname==="/api/v1/admin/move-media/upload"&&route.request().method()==="POST"){
          videoUploads.push(route.request().postData());
          await route.fulfill({status:200,contentType:"application/json",body:'{"move_name":"更新後の技名"}'});return;
        }
        if(u.pathname==="/api/v1/admin/cloud-analysis/review"&&route.request().method()==="POST"){
          assert.equal(route.request().headers()["x-csrf-token"],"test");
          const body=JSON.parse(route.request().postData());
          const saved={...body,updated_by:"11111111-2222-4333-8444-555555555555",updated_at:"2026-11-07T02:00:00Z"};
          savedReviews.set(body.scope+":"+body.req_id,saved);
          await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(saved)});
          return;
        }
        const data=fixtures(u);
        if(data===null){await route.fulfill({status:404,body:"{}"});return;}
        await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
      });
      await page.goto("http://127.0.0.1:"+server.address().port+"/admin.html");
      await page.locator("#ptSheetCharPicker option").first().waitFor({state:"attached"});
      await page.waitForFunction(()=>document.querySelector("#ptSheetMovePicker")&&document.querySelectorAll("#ptSheetMovePicker option").length>1,{timeout:8000}).catch(async err=>{
        console.log("SHEET DEBUG",JSON.stringify({
          errors, page:await page.evaluate(()=>({
            banner:document.querySelector("#banner")?.textContent,
            sheet:document.querySelector("#secSheet")?.textContent.slice(0,1000),
            editor:document.querySelector("#editor")?.textContent.slice(0,400),
            selector:document.querySelector("#ptSheetCharPicker")?.value
          }))
        })); throw err;
      });
      const nameInput=page.locator("#editor .grid input").first();
      await nameInput.fill("更新後の技名");
      const commandInput=page.locator('#editor input[list="dl-command"]').first();
      await commandInput.fill("2LP+RP");
      assert(await page.locator("#btnSave").isEnabled(),"Edited technique is marked dirty");
      const charPicker=page.locator("#ptSheetCharPicker");
      assert.equal(await charPicker.locator("option").count(),35);
      const mobile=width<=800;
      assert.equal(await page.locator("#chars").isVisible(),!mobile);
      assert.equal(await charPicker.isVisible(),mobile);
      const moveSearch=page.locator("#ptSheetMoveSearch");
      await moveSearch.fill("ストップ");
      assert(await moveSearch.evaluate(el=>document.activeElement===el),"Move search should retain focus");
      assert.equal(await page.locator("#ptSheetMovePicker option").count(),18);
      if(mobile){
        const p=page.locator("#ptSheetMovePicker");await p.selectOption("2");
        assert.equal(await p.inputValue(),"2");
      }
      for(const tab of ["icons","media","cloud","audit"]){
        await page.locator('nav.tabs button[data-tab="'+tab+'"]').click();
        const sec=page.locator("#sec"+tab[0].toUpperCase()+tab.slice(1));
        await sec.waitFor({state:"visible"});
        if(tab==="icons"){
          await page.locator("#secIcons .pt-mi-list tbody tr").first().waitFor({timeout:9000}).catch(async err=>{
            console.log("ICONS DEBUG",JSON.stringify({errors,dom:await page.evaluate(()=>({
              text:document.querySelector("#secIcons")?.innerText.slice(0,800),
              char:document.querySelector("#secIcons select")?.value,
              options:document.querySelector("#secIcons select")?.options.length,
              table:!!document.querySelector("#secIcons .pt-mi-list")
            }))})); throw err;
          });
          const row=page.locator("#secIcons .pt-mi-list tbody tr").first();
          assert.equal(await row.evaluate(el=>getComputedStyle(el).display),mobile?"grid":"table-row");
          await page.waitForFunction(()=>document.querySelector("#secIcons .pt-mi-list tbody tr td:nth-child(2)")?.textContent==="更新後の技名",{timeout:15000});
          assert.equal(await row.locator("td:nth-child(3)").textContent(),"2LP+RP","Icons must show changed command");
          await page.locator("#secIcons input[type=search]").fill("2LP+RP");
          await page.waitForFunction(()=>document.querySelectorAll("#secIcons .pt-mi-list tbody tr").length===1);
          await page.locator("#secIcons input[type=search]").fill("");
          await page.locator("#secIcons select").first().selectOption("bryan");
          await page.waitForFunction(()=>Array.from(document.querySelectorAll("#secIcons .pt-mi-list tbody tr")).some(x=>x.children[1]?.textContent==="保存済みブライアン技"),{timeout:15000});
          assert((await page.locator("#secIcons .pt-mi-list tbody").innerText()).includes("6LP+RK"),"Icons use saved draft for other character");
          await page.locator("#secIcons select").first().selectOption("alisa");
          await page.waitForFunction(()=>document.querySelector("#secIcons .pt-mi-list tbody tr td:nth-child(2)")?.textContent==="更新後の技名",{timeout:15000});
          if(width===390){
            await page.locator("#secIcons .pt-mi-list tbody tr").first().locator("td:nth-child(6) button").click();
            await page.locator('#secIcons .pt-mi-editor button').filter({hasText:"この内容で保存"}).click();
            await page.waitForFunction(()=>document.querySelector("#secIcons .pt-mi-list")&&document.querySelector("#secIcons [role=status]")?.textContent.includes("保存しました"),{timeout:15000});
            assert(iconWrites.some(x=>x.character_id==="alisa"&&x.site_k===0&&x.move_name==="更新後の技名"),"Icon save uses edited technique label + same ID");
            await page.keyboard.press("Escape");
          }
          const rowNow=page.locator("#secIcons .pt-mi-list tbody tr").first();
          if(mobile){
            const cmd=await rowNow.locator("td:nth-child(3)").boundingBox();
            assert(cmd.width>130,"Command should have a readable width");
            await rowNow.locator("td:nth-child(6) button").click();
            await page.locator("#secIcons .pt-mi-editor[data-open]").waitFor({state:"visible"});
            assert(await page.locator("#secIcons .pt-mi-backdrop").isVisible(),"Drawer backdrop should be visible");
            await page.keyboard.press("Escape");
            assert(!(await page.locator("#secIcons .pt-mi-backdrop").isVisible()),"Escape closes drawer");
          }
        }
        if(tab==="media"){
          await page.locator("#secMedia .pt-mobile-table tbody tr").first().waitFor();
          await page.waitForFunction(()=>document.querySelector("#secMedia .pt-mobile-table tbody tr")?.textContent.includes("更新後の技名"),{timeout:15000});
          assert((await page.locator("#secMedia .pt-mobile-table tbody tr").nth(1).innerText()).includes("保存済みブライアン技"),"Existing videos resolve saved labels");
          const ch=page.locator("#secMedia form select").first(), mv=page.locator("#secMedia form select").nth(1);
          await ch.selectOption("alisa");
          await page.waitForFunction(()=>document.querySelectorAll("#secMedia form select")[1]?.options[0]?.dataset.moveName==="更新後の技名",{timeout:15000});
          assert((await mv.locator("option").first().textContent()).includes("2LP+RP"),"Upload selection has edited command");
          if(width===390){
            await page.locator("#secMedia input[type=file]").setInputFiles({name:"test.mp4",mimeType:"video/mp4",buffer:Buffer.from([0,0,0,24,102,116,121,112])});
            await page.locator("#secMedia form button[type=submit]").click();
            await page.waitForFunction(()=>document.querySelector("#secMedia [role=status]")?.textContent.includes("登録しました"),{timeout:15000});
            assert(videoUploads.some(x=>x.includes("更新後の技名")&&x.includes('name="site_k"')),"Video upload references edited move name and same site_k");
          }
          await ch.selectOption("bryan");
          await page.waitForFunction(()=>Array.from(document.querySelectorAll("#secMedia form select"))[1]?.options.length===18,{timeout:15000});
          assert((await mv.locator('option[value="1"]').textContent()).includes("保存済みブライアン技"),"Other character saved draft name propagated");
          assert((await mv.locator('option[value="1"]').textContent()).includes("6LP+RK"),"Other character saved draft command propagated");
        }
        if(tab==="cloud"){
          const accordion=page.locator("#secCloud details[data-cloud-panel]");
          assert.equal(await accordion.count(),4,"Four independently collapsible analysis sections");
          const priority=page.locator('#secCloud details[data-cloud-panel="priority"]');
          const cross=page.locator('#secCloud details[data-cloud-panel="cross"]');
          await page.locator("#secCloud .pt-mobile-table tbody tr").first().waitFor();
          assert.equal(await priority.locator(".pt-cloud-id-button").count(),2,"Research IDs visible");
          const search=priority.locator('input[type="search"]');
          await search.fill("1021");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===1);
          assert(await search.evaluate(el=>el===document.activeElement),"Filter retains input focus");
          await search.fill("");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===2);
          await priority.locator(".pt-cloud-filter-label select").first().selectOption("occurrences");
          assert.equal(await priority.locator(".pt-cloud-id-button").first().innerText(),"1021","Occurrence sorting works");
          await priority.locator(".pt-cloud-id-button").first().click();
          const modal=page.locator(".pt-cloud-dialog");
          await modal.waitFor({state:"visible"});
          assert((await modal.innerText()).includes("Requirements ID"),"Detailed ID drawer opens");
          if(width===390){
            await modal.locator("select").selectOption("investigating");
            await modal.locator("textarea").fill("解析中・テスト記録");
            await modal.getByRole("button",{name:"調査状況を保存"}).click();
            await page.waitForFunction(()=>document.querySelector(".pt-cloud-dialog-feedback")?.textContent.includes("保存しました"));
            assert.equal(savedReviews.get("bryan:1021").status,"investigating","Server-shared review saved");
            assert.equal(savedReviews.get("bryan:1021").note,"解析中・テスト記録");
          }
          await page.keyboard.press("Escape");
          assert(!(await modal.isVisible()),"Escape closes research detail");
          if(width===390){
            const filterStatus=priority.locator(".pt-cloud-filter-label select").nth(1);
            await filterStatus.selectOption("investigating");
            assert.equal(await priority.locator(".pt-cloud-id-button").count(),1,"Review status filter");
            await filterStatus.selectOption("all");
            const [csv]=await Promise.all([
              page.waitForEvent("download"),priority.locator(".pt-cloud-list-actions button").click()
            ]);
            assert(csv.suggestedFilename().endsWith(".csv"),"Filtered CSV is downloadable");
          }
          assert(await priority.evaluate(node=>node.open),"Priority list is open by default");
          assert(!(await cross.evaluate(node=>node.open)),"Cross-character summary is initially collapsed");
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"すべて開く"}).click();
          assert.equal(await accordion.evaluateAll(nodes=>nodes.filter(x=>x.open).length),4,"Expand all sections");
          if(width===390){
            const compare=page.locator('#secCloud details[data-cloud-panel="sync"] .pt-cloud-compare');
            assert((await compare.innerText()).includes("追加された上位ID"),"Snapshot difference visible");
            const [diffCsv]=await Promise.all([
              page.waitForEvent("download"),compare.getByRole("button",{name:"差分をCSV出力"}).click()
            ]);
            assert(diffCsv.suggestedFilename().endsWith("-diff.csv"),"Difference CSV can be exported");
            const coverage=page.locator('#secCloud details[data-cloud-panel="crossPriority"] select').last();
            await coverage.selectOption("single");
            assert.equal(await page.locator('#secCloud details[data-cloud-panel="crossPriority"] .pt-cloud-id-button').count(),1,"Coverage filtering");
          }
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"すべて閉じる"}).click();
          assert.equal(await accordion.evaluateAll(nodes=>nodes.filter(x=>x.open).length),0,"Collapse all sections");
          await cross.locator("summary").click();
          assert(await cross.evaluate(node=>node.open),"Individual section opens independently");
          assert(!(await priority.evaluate(node=>node.open)),"Other section stays collapsed");
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"再読み込み"}).click();
          await page.waitForFunction(()=>document.querySelector('#secCloud details[data-cloud-panel="priority"] .pt-cloud-count')?.textContent==="2件");
          assert(await cross.evaluate(node=>node.open),"Reload preserves opened sections");
          assert(!(await priority.evaluate(node=>node.open)),"Reload preserves closed sections");
        }
        if(tab==="audit")await page.locator("#secAudit .pt-mobile-table tbody tr").first().waitFor();
        if(mobile){
          const measure=await page.evaluate(()=>{
            const sec=Array.from(document.querySelectorAll("main > section")).find(x=>!x.hidden);
            return {viewport:innerWidth,doc:document.documentElement.scrollWidth,section:sec.scrollWidth};
          });
          assert(measure.doc<=width,"No viewport overflow: "+tab+" "+JSON.stringify(measure));
        }
      }
      assert.deepEqual(errors,[],"Page errors: "+errors.join("; "));
      await page.screenshot({path:"admin-all-tabs-"+width+".png",fullPage:false});
      console.log("PASS admin technique name/command synchronization at "+width+"px");
      await page.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
