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
chars[1].moves[0] = { k:0, name:"不一致の技", a:{command:"WPRP"} };
chars[1].moves.push({ k:37, name:"スネークピット", a:{command:"WPRP"} });
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
      schema_version:2,source_character_id:"bryan",gameplay_verified:false,
      stats:{requirements_with_master_sample_overlap:1,requirements_with_any_master_overlap:2,
        graph_candidate_edge_records:2,graph_requirement_ids_with_edges:3,
        graph_requirement_ids_with_only_unmatched_sources:1,gameplay_verified_links:0},
      requirements:[
        {requirement_id:1021,source_character_id:"bryan",example_move_indexes:[74,75],
          matched_master_indexes:[],matched_sample_indexes:[],matched_graph_indexes:[],
          graph_edge_evidence:[],candidate_move_count_reported:79,
          graph_candidate_edge_count_total:92,graph_distinct_source_index_count:79,
          graph_unmatched_source_index_count:79,
          graph_unmatched_source_examples:[{source_move_index:1473,edge_occurrences:2,
            example_cancel_index:8286,example_dest_move_id_raw:2165,gameplay_verified:false}],
          parameter_samples:[{values:[10,0,0,0],count:65}]},
        {requirement_id:88,source_character_id:"bryan",example_move_indexes:[],
          matched_master_indexes:[],matched_sample_indexes:[],matched_graph_indexes:[],
          graph_candidate_edge_count_total:269,graph_distinct_source_index_count:21,
          graph_unmatched_source_index_count:21,graph_unmatched_source_examples:[],
          candidate_move_count_reported:21,raw_occurrences:269,priority_score:0,parameter_samples:[]},
        {requirement_id:682,source_character_id:"bryan",example_move_indexes:[],
          matched_master_indexes:[],matched_sample_indexes:[],matched_graph_indexes:[],
          graph_candidate_edge_count_total:254,graph_distinct_source_index_count:33,
          graph_unmatched_source_index_count:33,graph_unmatched_source_examples:[],
          candidate_move_count_reported:33,raw_occurrences:254,priority_score:0,parameter_samples:[]},
        {requirement_id:439,source_character_id:"bryan",example_move_indexes:[74,75],
          matched_master_indexes:[1569],matched_sample_indexes:[],matched_graph_indexes:[1569],
          graph_main_raw_destinations:[{raw_id:2170,occurrences:6}],
          graph_peer_requirement_examples:[{requirement_id:452,shared_indexes:2,jaccard:0.5,same_condition_verified:false}],
          graph_edge_evidence:[{source_move_index:1569,cancel_index:8730,dest_move_id_raw:2170,
            requirement_index:2424,command_hex:"0x4000000600000020",
            frame_window_start_raw:1,frame_window_end_raw:1,
            attribution:"candidate_next_distinct_move_cancel_pointer_not_verified_list_end",gameplay_verified:false}],
          candidate_move_count_reported:92,parameter_samples:[]},
        {requirement_id:509,source_character_id:"bryan",example_move_indexes:[1550,1571],
          matched_master_indexes:[1550],matched_sample_indexes:[1550],matched_graph_indexes:[1550],
          graph_edge_evidence:[{source_move_index:1550,cancel_index:8761,dest_move_id_raw:32769,
            requirement_index:2500,command_hex:"0x4000000600000020",
            frame_window_start_raw:1,frame_window_end_raw:1,
            attribution:"candidate_next_distinct_move_cancel_pointer_not_verified_list_end",gameplay_verified:false}],
          raw_occurrences:3,candidate_move_count_reported:31,priority_score:50,
          parameter_samples:[{values:[11,0,0,0],count:31}]}
      ],
      research:{priority_requirements:[
        {requirement_id:1021,candidate_cancel_rows:92,distinct_source_indexes:79,
          candidate_indexes:[{source_move_index:1473,edge_occurrences:2,example_cancel_index:8286,example_dest_move_id_raw:2165}],
          top_raw_destinations:[{raw_id:2165,occurrences:65},{raw_id:32769,occurrences:27}],
          related_requirements:[{requirement_id:362,shared_source_indexes:79,jaccard:1}]},
        {requirement_id:88,candidate_cancel_rows:269,distinct_source_indexes:21,
          candidate_indexes:[{source_move_index:440,edge_occurrences:22,example_cancel_index:4198,example_dest_move_id_raw:32769}],
          top_raw_destinations:[{raw_id:32769,occurrences:248}],
          related_requirements:[{requirement_id:781,shared_source_indexes:14,jaccard:0.6667}]},
        {requirement_id:682,candidate_cancel_rows:254,distinct_source_indexes:33,
          candidate_indexes:[{source_move_index:2223,edge_occurrences:10,example_cancel_index:12688,example_dest_move_id_raw:2246}],
          top_raw_destinations:[{raw_id:2233,occurrences:42}],
          related_requirements:[{requirement_id:193,shared_source_indexes:16,jaccard:0.4848}]}
        ],coverage:{anmbin_declared_movelist_total:2304,named_master_records:58,
          mvl_entries_total:147,mvl_candidates_with_move_index:56},
        mvl_unresolved_entries:[{source_entry_index:2,name_ja:"ヒート中にできること２ (共通)",command:"説明のみ"}],
        anmbin_reference_candidates:[{motbin_move_index:238,animation_reference_verified:true,display_move_identity_confirmed:false}]},
      indexed_moves:{"1550":{motbin_move_index:1550,motbin_move_id:1489449424,source_character_id:"bryan",
        animation_reference_verified:true,command_list_entries:[{kind:"move",name_ja:"スネークピット",command_plain:"1+22"}],
        site_checksheet_review_candidates:[
          {site_k:37,site_name:"スネークピット",site_command:"WPRP",review_group:"repeat_mvl_entry_same_move",review_status:"unverified",checklist_binding_verified:false},
          {site_k:0,site_name:"スネークピット",site_command:"WPRP",review_group:"single_candidate",review_status:"unverified",checklist_binding_verified:false}
        ],
        gameplay_verified:false,site_move_key:null},
        "1569":{motbin_move_index:1569,motbin_move_id:3812518756,source_character_id:"bryan",
          animation_reference_verified:false,command_list_entries:[{kind:"punishment_drill",name_ja:"確定反撃の練習",command_plain:"立ち途中に 2"}],
          gameplay_verified:false,site_move_key:null}}
    };
    const motbin_coverage={
      schema_version:1,character_id:"bryan",expected_move_count:2304,
      individual_records_present:2,individual_records_missing:2302,
      full_extraction_verified:false,source_status:"partial_known_master_only",
      known_move_indexes:[1444,1550],
      source_motbin_sha256:"15c673d2699985c1854568a021e5cb2de4c3f92dbf5fa87b9c81a0e580b6bee0",
      structural:{requirements_total_in_review:328}
    };
    return {reports:{bryan,cross},linkage,motbin_coverage,reviews:[...savedReviews.values()],errors:{},history:{
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
          assert.equal(await accordion.count(),5,"Five independently collapsible analysis sections");
          const priority=page.locator('#secCloud details[data-cloud-panel="priority"]');
          const cross=page.locator('#secCloud details[data-cloud-panel="cross"]');
          const motbin=page.locator('#secCloud details[data-cloud-panel="motbin"]');
          assert(!(await motbin.evaluate(node=>node.open)),"MOTBIN coverage collapsed by default");
          assert((await motbin.locator("summary").innerText()).includes("2 / 2304件"),
            "Exact individual-record coverage in summary");
          await page.locator("#secCloud .pt-mobile-table tbody tr").first().waitFor();
          assert.equal(await priority.locator(".pt-cloud-id-button").count(),5,"Research IDs visible");
          const focusCards=priority.locator(".pt-cloud-focus-card");
          assert.equal(await focusCards.count(),3,"Three prioritized research cards");
          assert((await focusCards.nth(0).innerText()).includes("ID 1021"),"Priority 1021 shown");
          assert((await focusCards.nth(1).innerText()).includes("ID 88"),"Priority 88 shown");
          assert((await focusCards.nth(2).innerText()).includes("ID 682"),"Priority 682 shown");
          if(width===390){
            const [focusCsv]=await Promise.all([
              page.waitForEvent("download"),priority.getByRole("button",{name:"重点3 IDの候補インデックスCSV"}).click()
            ]);
            const content=await fs.readFile(await focusCsv.path(),"utf8");
            assert(content.includes("1021")&&content.includes("1473")&&content.includes("未検証"),"Focus CSV includes research provenance");
            const coverage=priority.locator(".pt-cloud-research-coverage");
            await coverage.locator("summary").first().click();
            assert((await coverage.innerText()).includes("2304"),"Full game move count explicitly limited");
            const mvl=coverage.locator(".pt-cloud-mvl-unknown");
            await mvl.locator("summary").click();
            assert((await mvl.innerText()).includes("ヒート中にできること２"),"Unlinked MVL entries are separate");
            for(let i=1;i<3;i++){
              await focusCards.nth(i).locator("button").click();
              const detail=page.locator(".pt-cloud-dialog");
              await detail.waitFor({state:"visible"});
              assert((await detail.innerText()).includes("重点調査"),"Focus opens detailed research");
              const peer=detail.locator(".pt-cloud-focus-detail .pt-cloud-graph-details").nth(1);
              await peer.locator("summary").click();
              assert((await peer.innerText()).includes("Jaccard"),"Cooccurrence shown with unverified label");
              await page.keyboard.press("Escape");
            }
          }
          const search=priority.locator('input[type="search"]');
          await search.fill("1021");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===1);
          assert(await search.evaluate(el=>el===document.activeElement),"Filter retains input focus");
          await search.fill("");
          await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===5);
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
          assert(namedText.includes("#37 スネークピット"),"Exact site-k/name/command review candidate appears");
          assert(namedText.includes("レビュー記録のk・技名・コマンド3点一致"),"Reviewed triple labelled unverified");
          assert(!namedText.includes("#0 スネークピット"),"Mismatched site record cannot be promoted");
          assert(namedText.includes("実機未検証"),"Evidence clearly labelled unverified");
          assert(namedText.includes("CSV例示と一致"),"CSV sample provenance visible");
          assert(namedText.includes("遷移グラフ推定"),"Graph inference provenance visible");
          const graph509=namedModal.locator(".pt-cloud-graph-details");
          await graph509.locator("summary").click();
          assert((await graph509.innerText()).includes("キャンセル行 8761"),"Cancel row provenance visible");
          await page.keyboard.press("Escape");
          await charSelect.selectOption("all");
          await priority.getByRole("button",{name:"439",exact:true}).click();
          const graphModal=page.locator(".pt-cloud-dialog");
          await graphModal.waitFor({state:"visible"});
          assert((await graphModal.innerText()).includes("内部move_id：3812518756"),"Original MOTBIN id remains distinct");
          const generic=graphModal.locator(".pt-cloud-cooccurrence");
          assert(await generic.isVisible(),"Generic peer evidence appears for non-priority requirements");
          const rawSummary=generic.locator(".pt-cloud-graph-details").first();
          await rawSummary.locator(":scope > summary").click();
          assert((await rawSummary.innerText()).includes("raw 2170"),"Generic raw destinations visible");
          const peersSummary=generic.locator(".pt-cloud-graph-details").nth(1);
          await peersSummary.locator(":scope > summary").click();
          assert((await peersSummary.innerText()).includes("Requirements 452"),"Generic cooccurrence visible");
          const graphInfo=graphModal.locator(".pt-cloud-graph-details")
            .filter({hasText:"遷移候補の解析根拠"}).first();
          await graphInfo.locator(":scope > summary").click();
          assert((await graphInfo.innerText()).includes("遷移先raw 2170"),"Raw transition is not called internal move ID");
          assert((await graphInfo.innerText()).includes("キャンセル行 8730"),"Graph cancel evidence visible");
          assert((await graphModal.innerText()).includes("境界の推定"),"Heuristic disclaimer visible");
          await page.keyboard.press("Escape");
          await priority.locator(".pt-cloud-filter-label select").first().selectOption("graph_rows");
          assert.equal(await priority.locator(".pt-cloud-id-button").first().innerText(),"88","Graph row sorting works");
          await priority.locator(".pt-cloud-filter-label select").first().selectOption("unmatched_count");
          assert.equal(await priority.locator(".pt-cloud-id-button").first().innerText(),"1021","Unmatched index count sorting works");
          await priority.locator(".pt-cloud-filter-label select").first().selectOption("occurrences");
          assert.equal(await priority.locator(".pt-cloud-id-button").first().innerText(),"88","Occurrence sorting works");
          await priority.getByRole("button",{name:"1021",exact:true}).click();
          const modal=page.locator(".pt-cloud-dialog");
          await modal.waitFor({state:"visible"});
          assert((await modal.innerText()).includes("Requirements ID"),"Detailed ID drawer opens");
          assert((await modal.innerText()).includes("重点調査：ID 1021"),"Priority research detail shown");
          const dest=modal.locator(".pt-cloud-focus-detail .pt-cloud-graph-details").first();
          await dest.locator("summary").click();
          assert((await dest.innerText()).includes("raw 2165"),"Raw destination distribution visible");
          const peers=modal.locator(".pt-cloud-focus-detail .pt-cloud-graph-details").nth(1);
          await peers.locator("summary").click();
          assert((await peers.innerText()).includes("Requirements 362"),"Related requirement shown");
          const indices=modal.locator(".pt-cloud-focus-indexes");
          await indices.locator("summary").click();
          assert((await indices.innerText()).includes("インデックス 1473"),"Candidate source index visible");
          assert((await modal.innerText()).includes("技名未照合インデックス"),"Unmatched source count shown");
          const unknownDetails=modal.locator(".pt-cloud-unmatched");
          await unknownDetails.locator("summary").click();
          assert((await unknownDetails.innerText()).includes("79種類"),"All 79 raw candidates counted");
          assert((await unknownDetails.innerText()).includes("候補技インデックス 1473"),"Raw unnamed index visible");
          assert((await unknownDetails.innerText()).includes("遷移先raw例：2165"),"Raw destination not renamed as MOTBIN ID");
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
            const filterCharacter=priority.locator(".pt-cloud-filter-label").filter({hasText:"キャラクター資料"}).locator("select");
            await filterCharacter.selectOption("bryan_unmatched");
            assert.equal(await priority.locator(".pt-cloud-id-button").count(),3,"Three unnamed fixture source IDs");
            assert(["1021","88","682"].includes(await priority.locator(".pt-cloud-id-button").first().innerText()));
            await filterCharacter.selectOption("all");
            const filterStatus=priority.locator(".pt-cloud-filter-label select").nth(1);
            await filterStatus.selectOption("investigating");
            assert.equal(await priority.locator(".pt-cloud-id-button").count(),1,"Review status filter");
            await filterStatus.selectOption("all");
            const [csv]=await Promise.all([
              page.waitForEvent("download"),priority.locator(".pt-cloud-list-actions button").click()
            ]);
            assert(csv.suggestedFilename().endsWith(".csv"),"Filtered CSV is downloadable");
            const csvText=await fs.readFile(await csv.path(),"utf8");
            assert(csvText.includes("CSVサンプル照合件数"),"Provenance columns exported");
            assert(csvText.includes("遷移推定レコード数"),"Graph evidence count exported");
            assert(csvText.includes("技名未照合インデックス総数"),"Unnamed research leads exported");
            assert(csvText.includes("主な遷移先raw候補"),"CSV includes raw destination provenance");
            assert(csvText.includes("共通インデックスのあるRequirements ID"),"CSV includes shared ID provenance");
            assert(csvText.includes("実機未検証"),"CSV marks inferred data unverified");
          }
          assert(await priority.evaluate(node=>node.open),"Priority list is open by default");
          assert(!(await cross.evaluate(node=>node.open)),"Cross-character summary is initially collapsed");
          await page.locator("#secCloud .pt-cloud-controls button", {hasText:"すべて開く"}).click();
          assert.equal(await accordion.evaluateAll(nodes=>nodes.filter(x=>x.open).length),5,"Expand all sections");
          if(width===390){
            assert((await motbin.innerText()).includes("2,302"),"Missing records clearly identified");
            assert((await motbin.innerText()).includes("部分データ"),"Never claim full MOTBIN extraction");
            const [motbinCsv]=await Promise.all([
              page.waitForEvent("download"),motbin.getByRole("button",{name:"取得状況をCSV出力"}).click()
            ]);
            const motbinCsvText=await fs.readFile(await motbinCsv.path(),"utf8");
            assert(motbinCsvText.includes("1444") && motbinCsvText.includes("1550"),"Known index rows exported");
            assert(motbinCsvText.includes("未取得")&&motbinCsvText.includes("未検証"),"Missing ranges marked");
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
          await page.waitForFunction(()=>document.querySelector('#secCloud details[data-cloud-panel="priority"] .pt-cloud-count')?.textContent==="5件");
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
      if(width===390){
        // Regression for a full Bryan report: 75 additional candidates must not
        // create a 75-card wall immediately, but remain searchable.
        const many=fixtures(new URL("http://localhost/api/v1/admin/cloud-analysis/workspace"));
        many.linkage.requirements=Array.from({length:75},(_,i)=>({
          requirement_id:10000+i,source_character_id:"bryan",example_move_indexes:[1500+i],
          matched_master_indexes:[],raw_occurrences:1,
          candidate_move_count_reported:1,priority_score:1,parameter_samples:[]
        }));
        await page.route("**/api/v1/admin/cloud-analysis/workspace",async(route)=>{
          await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(many)});
        });
        await page.locator('nav.tabs button[data-tab="cloud"]').click();
        await page.locator('#secCloud .pt-cloud-controls button').filter({hasText:"再読み込み"}).click();
        const priorityPanel=page.locator('#secCloud details[data-cloud-panel="priority"]');
        if(!(await priorityPanel.evaluate(d=>d.open)))await priorityPanel.locator(":scope > summary").click();
        await page.waitForFunction(()=>document.querySelector('#secCloud details[data-cloud-panel="priority"] .pt-cloud-count')?.textContent==="77件");
        await page.waitForFunction(()=>document.querySelectorAll('#secCloud details[data-cloud-panel="priority"] .pt-cloud-id-button').length===50);
        assert.equal(await priorityPanel.locator(".pt-cloud-id-button").count(),50,"Only first 50 candidates rendered");
        await priorityPanel.locator(".pt-cloud-more").click();
        assert.equal(await priorityPanel.locator(".pt-cloud-id-button").count(),77,"Additional 27 candidates rendered");
      }
      assert.deepEqual(errors,[],"Page errors: "+errors.join("; "));
      await page.screenshot({path:"admin-all-tabs-"+width+".png",fullPage:false});
      console.log("PASS all admin tabs at "+width+"px");
      await page.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
