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
chars[1].moves[0] = { k:0, name:"スネークピット", a:{command:"1+22"} };
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
const fixtures = (u) => {
  if(u.pathname==="/api/v1/me") return {is_admin:true,display_name:"管理者テスト",project_t_id:"11111111-2222-4333-8444-555555555555",csrf_token:"test"};
  if(u.pathname==="/api/v1/admin/checksheet") return {characters:[]};
  if(u.pathname.startsWith("/api/v1/admin/checksheet/"))return {exists:false,current_base_hash:null,manifest_ok:true,moves:[],published:null};
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
        {req_id:439,characters_present:1,records_all_characters:8,parameter_variants:2,investigation_score_heuristic:90},
        {req_id:509,characters_present:4,records_all_characters:31,parameter_variants:1,investigation_score_heuristic:50}
      ]};
    const linkage={
      schema_version:1,source_character_id:"bryan",gameplay_verified:false,
      requirements:[
        {requirement_id:1021,source_character_id:"bryan",example_move_indexes:[74,75],
          matched_master_indexes:[],candidate_move_count_reported:79,parameter_samples:[{values:[10,0,0,0],count:65}]},
        {requirement_id:439,source_character_id:"bryan",example_move_indexes:[74,75],
          matched_master_indexes:[],candidate_move_count_reported:92,parameter_samples:[]},
        {requirement_id:509,source_character_id:"bryan",example_move_indexes:[1550,1571],
          matched_master_indexes:[1550],raw_occurrences:3,candidate_move_count_reported:31,priority_score:50,
          parameter_samples:[{values:[11,0,0,0],count:31}]}
      ],
      indexed_moves:{"1550":{motbin_move_index:1550,motbin_move_id:1489449424,source_character_id:"bryan",
        animation_reference_verified:true,command_list_entries:[{kind:"move",name_ja:"スネークピット",command_plain:"1+22"}],
        gameplay_verified:false,site_move_key:null}}
    };
    return {reports:{bryan,cross},linkage,reviews:[...savedReviews.values()],errors:{},history:{
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
          if(mobile){
            const cmd=await row.locator("td:nth-child(3)").boundingBox();
            assert(cmd.width>130,"Command should have a readable width");
            await row.locator("td:nth-child(6) button").click();
            await page.locator("#secIcons .pt-mi-editor[data-open]").waitFor({state:"visible"});
            assert(await page.locator("#secIcons .pt-mi-backdrop").isVisible(),"Drawer backdrop should be visible");
            await page.keyboard.press("Escape");
            assert(!(await page.locator("#secIcons .pt-mi-backdrop").isVisible()),"Escape closes drawer");
          }
        }
        if(tab==="media")await page.locator("#secMedia .pt-mobile-table tbody tr").first().waitFor();
        if(tab==="cloud"){
          const accordion=page.locator("#secCloud details[data-cloud-panel]");
          assert.equal(await accordion.count(),4,"Four independently collapsible analysis sections");
          const priority=page.locator('#secCloud details[data-cloud-panel="priority"]');
          const cross=page.locator('#secCloud details[data-cloud-panel="cross"]');
          await page.locator("#secCloud .pt-mobile-table tbody tr").first().waitFor();
          assert.equal(await priority.locator(".pt-cloud-id-button").count(),3,"Research IDs visible");
          const search=priority.locator('input[type="search"]');
          await search.fill("1021");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===1);
          assert(await search.evaluate(el=>el===document.activeElement),"Filter retains input focus");
          await search.fill("");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===3);
          // Character evidence filter distinguishes sourced candidates from confirmed IDs.
          const charSelect=priority.locator(".pt-cloud-filter-label select").last();
          await charSelect.selectOption("bryan_named");
          assert.equal(await priority.locator(".pt-cloud-id-button").count(),1,"Named Bryan candidate filter");
          await priority.locator(".pt-cloud-id-button").first().click();
          const namedModal=page.locator(".pt-cloud-dialog");
          await namedModal.waitFor({state:"visible"});
          const namedText=await namedModal.innerText();
          assert(namedText.includes("MOTBIN技インデックス 1550"),"Source move index exposed");
          assert(namedText.includes("内部move_id：1489449424"),"Internal move ID preserved exactly");
          assert(namedText.includes("スネークピット"),"Source Japanese move name exposed");
          assert(namedText.includes("チェックシートの技名＋コマンドが一致する候補"),"Strict checklist comparison visible");
          assert(namedText.includes("実機未検証"),"Evidence clearly labelled unverified");
          await page.keyboard.press("Escape");
          await charSelect.selectOption("all");
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
            const coverage=page.locator('#secCloud details[data-cloud-panel="crossPriority"] .pt-cloud-filter-label').filter({hasText:"出現範囲"}).locator("select");
            await coverage.selectOption("single");
            assert.equal(await page.locator('#secCloud details[data-cloud-panel="crossPriority"] .pt-cloud-id-button').count(),1,"Coverage filtering");
          }
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"すべて閉じる"}).click();
          assert.equal(await accordion.evaluateAll(nodes=>nodes.filter(x=>x.open).length),0,"Collapse all sections");
          await cross.locator("summary").click();
          assert(await cross.evaluate(node=>node.open),"Individual section opens independently");
          assert(!(await priority.evaluate(node=>node.open)),"Other section stays collapsed");
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"再読み込み"}).click();
          await page.waitForFunction(()=>document.querySelector('#secCloud details[data-cloud-panel="priority"] .pt-cloud-count')?.textContent==="3件");
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
      console.log("PASS all admin tabs at "+width+"px");
      await page.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
