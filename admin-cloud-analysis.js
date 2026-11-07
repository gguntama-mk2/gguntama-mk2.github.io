/* PROJECT T cloud analysis workbench (admin-only, structural data is NOT gameplay verification). */
(function () {
  "use strict";
  const API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  const KEY = "pt-cloud-workbench-prefs-v1";
  const STATUS = {unreviewed:"未調査", investigating:"調査中", verified:"検証済み（管理者記録）", recheck:"要再検証"};
  const PANELS = [
    ["sync","同期状況","解析日時・保存先・基本指標"],
    ["priority","優先調査ID","ブライアンの未解明ID候補"],
    ["cross","全キャラクター横断解析","42キャラクターの構造解析・集計"],
    ["crossPriority","横断解析の優先調査ID","未解明Requirements調査候補"]
  ];
  const FIELDS = {
    bryan:[["id","ID"],["raw_occurrences","元データ出現数"],["candidate_moves","関連技候補数"],["priority_score","優先度"]],
    cross:[["req_id","ID"],["characters_present","対象キャラ数"],["records_all_characters","出現レコード数"],
      ["parameter_variants","パラメータ種類"],["investigation_score_heuristic","調査スコア"]]
  };
  const defaults = {open:{sync:false,priority:true,cross:false,crossPriority:false},
    filters:{bryan:{q:"",sort:"priority",status:"all",coverage:"all",character:"all"},
      cross:{q:"",sort:"priority",status:"all",coverage:"all",character:"all"}}};
  let root, csrfProvider, characterProvider=()=>[], panels={}, state=null, payload=null,
      reviews={}, linkById=new Map(), visibleLimit={bryan:50,cross:50},
      lastFetch=0, pending=null, message, reloadButton, dialog=null;
  function el(tag,txt,cls){const n=document.createElement(tag);if(txt!==null&&txt!==undefined)n.textContent=String(txt);if(cls)n.className=cls;return n;}
  function node(tag,cls){return el(tag,null,cls);}
  function fmt(x){return x===null||x===undefined||x===""?"—":typeof x==="number"?x.toLocaleString("ja-JP"):String(x);}
  function metric(name,value){const d=node("div","pt-cloud-metric");d.append(el("span",name,"pt-cloud-metric-label"),el("strong",fmt(value),"pt-cloud-metric-value"));return d;}
  function metrics(items){const d=node("div","pt-cloud-metrics");items.forEach(x=>d.appendChild(metric(x[0],x[1])));return d;}
  function note(s,cls){return el("p",s,cls||"pt-cloud-note");}
  function loadPrefs(){
    const base=JSON.parse(JSON.stringify(defaults));
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||"null");
      if(saved&&typeof saved==="object"){
        for(const id of Object.keys(base.open))if(typeof saved.open?.[id]==="boolean")base.open[id]=saved.open[id];
        for(const scope of ["bryan","cross"])for(const k of Object.keys(base.filters[scope]))
          if(typeof saved.filters?.[scope]?.[k]==="string"&&saved.filters[scope][k].length<150)
            base.filters[scope][k]=saved.filters[scope][k];
      }
    }catch(_){}
    return base;
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
  function setMessage(s,kind){message.textContent=s;message.className="banner"+(kind?" "+kind:"");}
  function createPanel(id,title,hint){
    const details=node("details","pt-cloud-section");details.dataset.cloudPanel=id;details.open=state.open[id];
    const sum=node("summary","pt-cloud-summary"),main=node("span","pt-cloud-summary-main"),right=node("span","pt-cloud-summary-right");
    main.append(el("strong",title,"pt-cloud-summary-title"),el("span",hint,"pt-cloud-summary-hint"));
    const count=el("span","","pt-cloud-count");count.hidden=true;
    right.append(count,node("span","pt-cloud-chevron"));sum.append(main,right);
    const body=node("div","pt-cloud-content");details.append(sum,body);
    panels[id]={details,body,count,dirty:true,render:null};
    details.addEventListener("toggle",()=>{
      state.open[id]=details.open;persist();
      if(details.open)paintPanel(id);
    });
    return details;
  }
  function markPanel(id,render,count){
    const p=panels[id];p.render=render;p.dirty=true;p.count.textContent=count||"";p.count.hidden=!count;
    if(p.details.open)paintPanel(id);
  }
  function paintPanel(id){
    const p=panels[id];if(!p||!p.dirty||!p.render)return;
    p.body.replaceChildren(...p.render().filter(Boolean));
    p.dirty=false;
  }
  function openAll(on){Object.keys(panels).forEach(id=>{state.open[id]=on;panels[id].details.open=on;if(on)paintPanel(id);});persist();}
  function reviewKey(scope,id){return scope+":"+id;}
  function getReview(scope,id){return reviews[reviewKey(scope,id)]||{scope,req_id:id,status:"unreviewed",note:""};}
  function linkInfo(reqId){return linkById.get(Number(reqId))||null;}
  function sourceRows(scope){
    const report=payload?.reports?.[scope];
    if(!report)return [];
    const top=(scope==="bryan"?report.top_unknown_ids:report.top_priority_ids)||[];
    if(scope!=="bryan"||!payload?.linkage)return top;
    const byId=new Map(top.map(row=>[Number(row.id),row]));
    // The private CSV provides 328 Bryan requirement rows, whereas the
    // original summary only exposes the highest-priority few.
    for(const link of (payload.linkage.requirements||[])){
      if(!byId.has(link.requirement_id))byId.set(link.requirement_id,{
        id:link.requirement_id,raw_occurrences:link.raw_occurrences,
        candidate_moves:link.candidate_move_count_reported,
        priority_score:link.priority_score
      });
    }
    return [...byId.values()];
  }
  function rowId(scope,row){return Number(scope==="bryan"?row.id:row.req_id);}
  function statusLabel(scope,row){return STATUS[getReview(scope,rowId(scope,row)).status]||STATUS.unreviewed;}
  function matchesFor(reqId){
    const link=linkInfo(reqId),moves=payload?.linkage?.indexed_moves||{};
    return (link?.matched_master_indexes||[]).map(index=>moves[String(index)]).filter(Boolean);
  }
  function normalized(v){return String(v??"").normalize("NFKC").replace(/\\s+/g,"").toLowerCase();}
  function checklistCandidates(move){
    const characters=characterProvider?.()||[];
    const char=Array.isArray(characters)?characters.find(c=>c.id===move.source_character_id):null;
    const siteMoves=Array.isArray(char?.moves)?char.moves:[];
    const entries=(move.command_list_entries||[]).filter(e=>e.kind==="move"||e.kind==="key_move");
    const candidates=[];
    for(const m of siteMoves){
      const name=normalized(m.name),cmd=normalized(m.a?.command);
      if(!name||!cmd)continue;
      if(entries.some(e=>normalized(e.name_ja)===name&&normalized(e.command_plain)===cmd)){
        if(!candidates.some(x=>x.k===m.k))candidates.push({k:m.k,name:m.name,command:m.a?.command});
      }
    }
    // Text equality is a *candidate*. Never declare the site k ↔ MOTBIN ID verified.
    return candidates.slice(0,8);
  }
  function options(select,items,current){
    items.forEach(([val,txt])=>{const opt=el("option",txt);opt.value=val;select.append(opt);});
    select.value=current;
  }
  function changeFilter(scope,key,value){
    state.filters[scope][key]=value;visibleLimit[scope]=50;persist();
    const panel=scope==="bryan"?"priority":"crossPriority";
    // Controls stay mounted while typing; update the result list only.
    const results=panels[panel].body.querySelector(".pt-cloud-results");
    if(results)renderRowsInto(scope,results);
    const count=panels[panel].body.querySelector(".pt-cloud-filter-count");
    if(count)count.textContent=filtered(scope).length+" / "+sourceRows(scope).length+"件";
  }
  function availableCharacters(scope){
    const names=new Set();
    sourceRows(scope).forEach(row=>{if(Array.isArray(row.characters))row.characters.forEach(c=>{if(typeof c==="string")names.add(c);});});
    return [...names].sort((a,b)=>a.localeCompare(b,"ja"));
  }
  function filtered(scope){
    const f=state.filters[scope],q=f.q.normalize("NFKC").toLowerCase().trim();
    const bryanIds=new Set(sourceRows("bryan").map(r=>rowId("bryan",r)));
    return sourceRows(scope).filter(row=>{
      const id=rowId(scope,row);
      const evidenceNames=matchesFor(id).flatMap(move=>(move.command_list_entries||[])
        .map(entry=>entry.name_ja+" "+entry.command_plain)).join(" ");
      if(q&&!String(id).includes(q)&&!Object.values(row).some(v=>typeof v==="string"&&v.toLowerCase().includes(q))
          &&!normalized(evidenceNames).includes(normalized(q)))return false;
      if(f.status!=="all"&&getReview(scope,id).status!==f.status)return false;
      if(scope==="cross"){
        const coverage=Number(row.characters_present);
        if(f.coverage==="all42"&&coverage!==42)return false;
        if(f.coverage==="multi"&&!(coverage>=2&&coverage<42))return false;
        if(f.coverage==="single"&&coverage!==1)return false;
        if(f.coverage==="bryan"&&!bryanIds.has(id))return false;
      }
      if(f.character==="bryan_source"&&!linkInfo(id))return false;
      if(f.character==="bryan_named"&&!matchesFor(id).length)return false;
      if(!["all","bryan_source","bryan_named"].includes(f.character)
          &&(!Array.isArray(row.characters)||!row.characters.includes(f.character)))return false;
      return true;
    }).sort((a,b)=>{
      const cmp=(k)=>Number(b[k]||0)-Number(a[k]||0);
      if(f.sort==="id")return rowId(scope,a)-rowId(scope,b);
      if(f.sort==="occurrences")return cmp(scope==="bryan"?"raw_occurrences":"records_all_characters");
      if(f.sort==="characters")return cmp("characters_present");
      return cmp(scope==="bryan"?"priority_score":"investigation_score_heuristic");
    });
  }
  function filtersUI(scope){
    const f=state.filters[scope],wrap=node("div","pt-cloud-filters");
    const search=el("input");search.type="search";search.placeholder="ID・キーワードで検索";
    search.setAttribute("aria-label",scope==="bryan"?"ブライアンのID検索":"横断解析のID検索");
    search.value=f.q;
    let debounce;
    search.addEventListener("input",()=>{clearTimeout(debounce);debounce=setTimeout(()=>changeFilter(scope,"q",search.value),140);});
    wrap.appendChild(search);
    function control(label, key, items, disabled){
      const box=node("label","pt-cloud-filter-label");
      box.append(el("span",label));
      const sel=el("select");sel.disabled=!!disabled;options(sel,items,f[key]);
      sel.addEventListener("change",()=>changeFilter(scope,key,sel.value));
      box.appendChild(sel);wrap.appendChild(box);return sel;
    }
    control("並べ替え","sort",scope==="cross"
      ?[["priority","調査スコア順"],["occurrences","出現レコード順"],["characters","対象キャラ数順"],["id","ID順"]]
      :[["priority","優先度順"],["occurrences","出現数順"],["id","ID順"]]);
    control("調査状況","status",[["all","すべて"],...Object.keys(STATUS).map(k=>[k,STATUS[k]])]);
    if(scope==="cross")control("出現範囲","coverage",[["all","すべて"],["all42","全42キャラ共通"],
      ["multi","2～41キャラ"],["single","1キャラ"],["bryan","ブライアン上位候補と共通"]]);
    const characters=availableCharacters(scope);
    if(payload?.linkage){
      const items=[["all","全ての候補"],
        ["bryan_source","ブライアン資料に例あり（構造候補）"],
        ["bryan_named","ブライアン技名候補あり"]];
      if(characters.length)items.push(...characters.map(v=>[v,v+"（レポートの名前）"]));
      if(!items.some(item=>item[0]===f.character))f.character="all";
      control("キャラクター資料","character",items);
      const info=note("ブライアン以外のキャラクター別Requirements対応は未取得です。上の絞り込みは構造資料との一致であり、実機確定ではありません。");
      info.className="pt-cloud-filter-info";wrap.append(info);
    }else if(characters.length){
      control("キャラクター","character",[["all","全キャラクター"],...characters.map(v=>[v,v])]);
    }else{
      const explanation=note("キャラクター名ごとの確定出現一覧はまだありません。");
      explanation.className="pt-cloud-filter-info";wrap.append(explanation);
    }
    return wrap;
  }
  function renderRowsInto(scope,container){
    const allRows=filtered(scope),rows=allRows.slice(0,visibleLimit[scope]||50),fields=FIELDS[scope];container.replaceChildren();
    if(!rows.length){container.appendChild(note("条件に一致するIDはありません。","pt-cloud-empty"));return;}
    const wrap=node("div","tw pt-cloud-table-wrap"),t=node("table","pt-mobile-table pt-cloud-table"),thead=el("thead"),trh=el("tr"),tbody=el("tbody");
    const cols=payload?.linkage?[...fields,["link","資料照合"],["review","調査状況"]]
      :[...fields,["review","調査状況"]];
    cols.forEach(x=>trh.appendChild(el("th",x[1])));
    thead.appendChild(trh);
    rows.forEach(row=>{
      const tr=el("tr");
      fields.forEach(([key,label],i)=>{
        const td=el("td");td.dataset.label=label;
        if(i===0){
          const btn=el("button",String(row[key]),"pt-cloud-id-button");
          btn.type="button";btn.title="詳細・調査状況を開く";btn.addEventListener("click",()=>openDetail(scope,row));
          td.appendChild(btn);
        }else td.textContent=fmt(row[key]);
        tr.appendChild(td);
      });
      if(payload?.linkage){
        const evidence=linkInfo(rowId(scope,row));
        const matches=matchesFor(rowId(scope,row));
        const td=el("td",!evidence?"資料なし":matches.length?
          "技名候補 "+matches.length+"件":"インデックス例 "+evidence.example_move_indexes.length+"件（技名未照合）");
        td.dataset.label="資料照合";tr.append(td);
      }
      const td=el("td",statusLabel(scope,row));td.dataset.label="調査状況";tr.append(td);tbody.append(tr);
    });
    t.append(thead,tbody);wrap.append(t);container.append(wrap);
    if(rows.length<allRows.length){
      const more=el("button","さらに "+Math.min(50,allRows.length-rows.length)+"件表示（残り "+
        (allRows.length-rows.length)+"件）","btn pt-cloud-more");
      more.type="button";more.addEventListener("click",()=>{
        visibleLimit[scope]+=50;renderRowsInto(scope,container);
      });
      container.append(more);
    }
  }
  function listPanel(scope){
    if(!payload?.reports?.[scope])return [note(payload?.errors?.[scope]||"解析データを取得できませんでした。","pt-cloud-error")];
    const outer=node("div","pt-cloud-worklist");
    outer.append(note("調査ステータスは管理者間で共有されます。「検証済み」は管理者による記録であり、実機検証の証明ではありません。"));
    if(payload?.linkage){
      outer.append(note("ブライアンの資料には328 IDの例示があり、技名まで照合できたものは一部です。MOTBIN技インデックス、内部move_id、チェックシートのkは別の識別子です。"));
    }else{
      outer.append(note("技名紐付けデータは未配備です。既存の優先調査IDは引き続き閲覧できます。","pt-cloud-filter-info"));
    }
    outer.append(filtersUI(scope));
    const counter=el("p",filtered(scope).length+" / "+sourceRows(scope).length+"件","pt-cloud-filter-count");
    const buttons=node("div","pt-cloud-list-actions");
    const csv=el("button","表示中をCSV出力","btn");csv.type="button";csv.addEventListener("click",()=>exportRows(scope));
    buttons.append(csv);outer.append(counter,buttons);
    const results=node("div","pt-cloud-results");renderRowsInto(scope,results);outer.append(results);
    return [outer];
  }
  function historyFor(scope){return payload?.history?.[scope]?.snapshots||[];}
  function diff(scope){
    const snaps=historyFor(scope);
    if(snaps.length<2)return null;
    const newer=snaps[0].data,older=snaps[1].data;
    const key=scope==="bryan"?"id":"req_id";
    const oldMap=new Map((older.ids||[]).map(x=>[Number(x[key]),x]));
    const newMap=new Map((newer.ids||[]).map(x=>[Number(x[key]),x]));
    const added=[...newMap.keys()].filter(id=>!oldMap.has(id));
    const removed=[...oldMap.keys()].filter(id=>!newMap.has(id));
    const changed=[...newMap.keys()].filter(id=>oldMap.has(id)&&JSON.stringify(newMap.get(id))!==JSON.stringify(oldMap.get(id)));
    const metrics=Object.keys(newer.summary||{}).map(k=>({key:k,old:older.summary?.[k],now:newer.summary[k],
      delta:typeof newer.summary[k]==="number"&&typeof older.summary?.[k]==="number"?newer.summary[k]-older.summary[k]:null}));
    return {added,removed,changed,metrics,snaps};
  }
  function comparePanel(scope){
    if(!payload?.reports?.[scope])return [];
    const d=diff(scope),out=[node("div","pt-cloud-compare")];
    if(!d){
      out[0].append(note("比較できる過去の解析版はまだありません。次回、解析内容に変更が生じると差分を表示できます。"));
      return out;
    }
    out[0].append(
      note("最新：" +(d.snaps[0].generated_utc||"不明")+" ／ 前回：" +(d.snaps[1].generated_utc||"不明")),
      metrics([["追加された上位ID",d.added.length],["上位から外れたID",d.removed.length],["値が変わったID",d.changed.length]]),
      note("追加：" +(d.added.join("、")||"なし")+" ／ 除外：" +(d.removed.join("、")||"なし")),
      note("更新：" +(d.changed.join("、")||"なし"))
    );
    const t=node("div","pt-cloud-compare-grid");
    d.metrics.forEach(m=>{
      const item=node("div","pt-cloud-compare-item");
      item.append(el("span",m.key,"pt-cloud-compare-label"),
        el("span",fmt(m.old)+" → "+fmt(m.now)+(m.delta===null?"":" （"+(m.delta>0?"+":"")+fmt(m.delta)+"）")));
      t.appendChild(item);
    });
    out[0].append(t);
    const csv=el("button","差分をCSV出力","btn");csv.type="button";csv.addEventListener("click",()=>exportDiff(scope,d));
    out[0].append(csv);
    return out;
  }
  function syncPanel(){
    const report=payload?.reports?.bryan;
    if(!report)return [note(payload?.errors?.bryan||"同期データを取得できませんでした。","pt-cloud-error")];
    return [note("解析日時："+(report.generated_utc?new Date(report.generated_utc).toLocaleString("ja-JP"):"不明")),
      note("保存先："+(report.source_repo||"—")),report.note?note(report.note):null,
      metrics([["内部技数",report.moves_count],["Requirements ID",report.unique_ids],
        ["未解明ID",report.unlabeled_ids],["分岐候補",report.rows_with_candidate_edges]]),
      el("h3","ブライアン解析の前回との差分"),...comparePanel("bryan")];
  }
  function crossPanel(){
    const r=payload?.reports?.cross;
    if(!r)return [note(payload?.errors?.cross||"横断解析を取得できませんでした。","pt-cloud-error")];
    const scope=r.scope_counts_for_unlabeled||{};
    return [note("構造解析結果のみ。技の効果・キャラクター同定は実機未検証です。"),
      metrics([["解析キャラクター",r.characters_found],["Requirementsレコード",r.requirements_records_parsed_total],
        ["Requirements ID",r.requirements_unique_ids_global],["全キャラ共通ID",r.ids_in_all_analyzed_characters],
        ["単一キャラ限定ID",r.ids_in_exactly_one_character],["未解明・照合済ID",r.bryan_unlabeled_found_in_overview]]),
      note("未解明IDの分布：全42キャラ "+fmt(scope.all_42)+" ／ 4～41キャラ "+fmt(scope.four_to_41)+
        " ／ 2～3キャラ "+fmt(scope.two_or_three)+" ／ 1キャラ "+fmt(scope.one_character)),
      note("最新同期："+(r.generated_utc?new Date(r.generated_utc).toLocaleString("ja-JP"):"不明")),
      el("h3","横断解析の前回との差分"),...comparePanel("cross")];
  }
  function applyData(){
    const bryan=sourceRows("bryan").length,cross=sourceRows("cross").length;
    markPanel("sync",syncPanel,payload?.reports?.bryan?"更新済み":"取得失敗");
    markPanel("priority",()=>listPanel("bryan"),payload?.reports?.bryan?bryan+"件":"取得失敗");
    markPanel("cross",crossPanel,payload?.reports?.cross?fmt(payload.reports.cross.characters_found)+"キャラ":"取得失敗");
    markPanel("crossPriority",()=>listPanel("cross"),payload?.reports?.cross?cross+"件":"取得失敗");
  }
  function csvCell(v){
    const raw=v===null||v===undefined?"":String(v);
    const safe=/^[=+\-@\t\r]/.test(raw)?"'"+raw:raw;
    return '"'+safe.replace(/"/g,'""')+'"';
  }
  function downloadCsv(filename,lines){
    const csv="\ufeff"+lines.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=el("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportRows(scope){
    const cols=FIELDS[scope],head=[...cols.map(x=>x[1]),"調査状況","調査メモ",
      "資料上の出現候補","照合できたMOTBINインデックス","検証状態"];
    const rows=filtered(scope).map(row=>{
      const id=rowId(scope,row),rev=getReview(scope,id);
      const proof=linkInfo(id),matches=matchesFor(id);
      return [...cols.map(x=>row[x[0]]),STATUS[rev.status]||STATUS.unreviewed,rev.note,
        proof?"ブライアン構造サンプルあり":"未収録",matches.map(m=>m.motbin_move_index).join(" "),
        "実機未検証"];
    });
    downloadCsv("project-t-"+scope+"-research.csv",[head,...rows]);
  }
  function exportDiff(scope,d){
    downloadCsv("project-t-"+scope+"-diff.csv",[
      ["比較項目","前回","今回","増減"],
      ...d.metrics.map(m=>[m.key,m.old,m.now,m.delta]),
      ["追加ID","",d.added.join(" "),""],["除外ID",d.removed.join(" "),"",""],
      ["変更ID","",d.changed.join(" "),""]]);
  }

  function buildLinkEvidence(reqId){
    const section=node("section","pt-cloud-evidence");
    section.append(el("h4","キャラクター × 内部技の照合根拠"));
    const proof=linkInfo(reqId);
    if(!proof){
      section.append(note(payload?.linkage?
        "このIDは現在のブライアン条件資料の例示にありません。他キャラクターとの対応は未確定です。":
        "構造上の紐付けレポートは未配備です。現時点では関連技を推定できません。"));
      return section;
    }
    section.append(el("p","ブライアン資料の構造上の候補（実機未検証）","pt-cloud-evidence-status"));
    section.append(note("Requirements ID "+reqId+"／ブライアンの条件解析CSV。"
      +" 例示された技インデックス："+proof.example_move_indexes.length+"件"
      +"（候補総数 "+fmt(proof.candidate_move_count_reported)+"件とは異なります）。"));
    const samples=node("div","pt-cloud-index-list");
    samples.append(el("strong","技インデックスのサンプル"));
    samples.append(el("code",(proof.example_move_indexes||[]).join("、")||"なし"));
    section.append(samples);
    if((proof.parameter_samples||[]).length){
      const params=node("details","pt-cloud-params"),summary=el("summary","条件パラメータの例（意味は未検証）");
      params.append(summary);
      const list=node("ul");
      (proof.parameter_samples||[]).forEach(p=>list.append(el("li","["+p.values.join(", ")+"] × "+p.count)));
      params.append(list);section.append(params);
    }
    const matched=matchesFor(reqId);
    if(!matched.length){
      section.append(note("サンプルの技インデックスと、現在のブライアン技名資料58件との重複はありません。技名を自動で割り当てません。","pt-cloud-evidence-warning"));
    }else{
      section.append(note("技インデックスが一致した資料 "+matched.length+"件。以下はMOTBIN構造上の候補であり、技の効果やRequirementsの意味は確定していません。"));
      const grid=node("div","pt-cloud-links");
      for(const m of matched){
        const item=node("article","pt-cloud-link-item");
        item.append(el("strong","MOTBIN技インデックス "+m.motbin_move_index));
        item.append(el("div","内部move_id："+(m.motbin_move_id===null?"不明":String(m.motbin_move_id)),"pt-cloud-small"));
        const primary=(m.command_list_entries||[]).filter(e=>e.kind==="move"||e.kind==="key_move");
        if(!primary.length){
          item.append(note("通常技名の情報なし（練習・アシスト用資料など）"));
        }else{
          for(const entry of primary.slice(0,4)){
            const line=node("div","pt-cloud-link-name");
            line.append(el("span",entry.name_ja||"技名未登録"),el("code",entry.command_plain||"コマンドなし"));
            item.append(line);
          }
        }
        item.append(note(m.animation_reference_verified?
          "アニメーション参照：データ上の照合済み（実機再現は未確認）":
          "アニメーション参照：未確定","pt-cloud-small"));
        const site=checklistCandidates(m);
        if(site.length){
          item.append(note("技チェックシートの技名＋コマンドが一致する候補："+
            site.map(v=>"#"+v.k+" "+v.name).join("、")+
            "。一致しても内部IDとチェックシートkの対応確定ではありません。","pt-cloud-small"));
        }else{
          item.append(note("技チェックシートkとの直接対応：未確認（完全一致なし、または元データ未読込）","pt-cloud-small"));
        }
        grid.append(item);
      }
      section.append(grid);
    }
    section.append(note("根拠：condition_graph_review.csv の example_move_indexes と bryan_master_moves.json の motbin_move_index を照合。ラベルは技コマンド資料由来。海外の参考ラベルだけでは確定しません。","pt-cloud-source"));
    return section;
  }

  function openDetail(scope,row){
    if(dialog)dialog.remove();
    const id=rowId(scope,row),rev=getReview(scope,id),backdrop=node("div","pt-cloud-overlay");
    const card=node("section","pt-cloud-dialog");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");
    card.setAttribute("aria-label","ID "+id+" の詳細");
    const top=node("div","pt-cloud-dialog-head"),close=el("button","閉じる ×","btn");
    close.type="button";close.addEventListener("click",()=>hideDetail());
    top.append(el("h3","Requirements ID "+id),close);
    const desc=note(scope==="cross"?"全キャラクター構造解析の候補（キャラクター同定は未検証）":
      "ブライアンの未解明Requirements候補（技名の紐付けは構造的な推定）");
    const fields=node("dl","pt-cloud-detail-fields");
    FIELDS[scope].forEach(([k,label])=>fields.append(el("dt",label),el("dd",fmt(row[k]))));
    const statusLabel=node("label","pt-cloud-edit-field");statusLabel.append(el("span","調査状況"));
    const sel=el("select");options(sel,Object.keys(STATUS).map(k=>[k,STATUS[k]]),rev.status);
    statusLabel.append(sel);
    const noteLabel=node("label","pt-cloud-edit-field");noteLabel.append(el("span","調査メモ（最大1200文字）"));
    const ta=el("textarea");ta.value=rev.note||"";ta.maxLength=1200;ta.rows=5;
    noteLabel.append(ta);
    const record=note(rev.updated_at?"最終更新："+new Date(rev.updated_at).toLocaleString("ja-JP"):"未記録");
    const feedback=el("p","","pt-cloud-dialog-feedback");feedback.setAttribute("role","status");
    const save=el("button","調査状況を保存","btn primary");save.type="button";
    if(payload?.compat_mode){save.disabled=true;feedback.textContent="サーバー更新後に保存できます。";}
    save.addEventListener("click",async()=>{
      save.disabled=true;feedback.textContent="保存中…";
      try{
        const res=await fetch(API+"/api/v1/admin/cloud-analysis/review",{
          method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-CSRF-Token":csrfProvider?.()||""},
          body:JSON.stringify({scope,req_id:id,status:sel.value,note:ta.value})
        });
        const data=await res.json().catch(()=>({}));
        if(!res.ok)throw Error(typeof data.detail==="string"?data.detail:"HTTP "+res.status);
        reviews[reviewKey(scope,id)]=data;feedback.textContent="保存しました（管理者間で共有）。";
        const section=scope==="bryan"?"priority":"crossPriority";
        const result=panels[section].body.querySelector(".pt-cloud-results");
        if(result)renderRowsInto(scope,result);
      }catch(err){feedback.textContent="保存に失敗しました："+err.message;}
      finally{save.disabled=false;}
    });
    card.append(top,desc,fields,buildLinkEvidence(id),statusLabel,noteLabel,record,feedback,save);
    backdrop.append(card);dialog=backdrop;
    backdrop.addEventListener("click",e=>{if(e.target===backdrop)hideDetail();});
    document.body.append(backdrop);close.focus();
  }
  function hideDetail(){if(dialog){dialog.remove();dialog=null;}}
  function onEscape(ev){if(ev.key==="Escape"&&dialog){hideDetail();ev.preventDefault();}}
  async function refresh(force){
    if(!root)return;
    if(pending)return pending;
    if(!force&&payload&&Date.now()-lastFetch<90000){applyData();return;}
    reloadButton.disabled=true;setMessage("クラウド解析を読み込み中…");
    pending=(async()=>{
      try{
        const res=await fetch(API+"/api/v1/admin/cloud-analysis/workspace",{
          method:"GET",credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
        let data=await res.json().catch(()=>({}));
        if(res.status===404){
          // While the backend release is propagating, keep the prior read-only view usable.
          const endpoints=[["bryan","/api/v1/admin/cloud-analysis"],
            ["cross","/api/v1/admin/cloud-analysis/all-characters"]];
          const legacy=await Promise.all(endpoints.map(async([scope,path])=>{
            try{
              const answer=await fetch(API+path,{credentials:"include",cache:"no-store"});
              if(!answer.ok)throw Error("HTTP "+answer.status);
              return [scope,await answer.json(),null];
            }catch(err){return [scope,null,"取得できませんでした："+err.message];}
          }));
          data={reports:{},errors:{},reviews:[],history:{},compat_mode:true};
          legacy.forEach(([scope,report,error])=>{if(report)data.reports[scope]=report;else data.errors[scope]=error;});
        }else if(!res.ok)throw Error(typeof data.detail==="string"?data.detail:"HTTP "+res.status);
        payload=data;linkById=new Map();
        for(const link of data.linkage?.requirements||[])linkById.set(Number(link.requirement_id),link);
        reviews={};(data.reviews||[]).forEach(v=>{reviews[reviewKey(v.scope,v.req_id)]=v;});
        lastFetch=Date.now();applyData();
        const present=Object.keys(data.reports||{}).length;
        setMessage(data.compat_mode?"サーバー更新待ちです。解析の閲覧・検索は利用できますが、調査記録と差分履歴はまだ利用できません。":
          present===2?"読み込み完了。未検証候補は確定情報ではありません。":
          present?"一部の解析レポートが取得できませんでした。":"解析レポートを取得できませんでした。",
          data.compat_mode?"warn":present===2?"":present?"warn":"err");
      }catch(e){setMessage("クラウド解析を取得できませんでした："+e.message,"err");}
      finally{reloadButton.disabled=false;pending=null;}
    })();
    return pending;
  }
  function mount(target,context){
    document.removeEventListener("keydown",onEscape);
    root=target;csrfProvider=context?.csrf||(()=> "");characterProvider=context?.characters||(()=>[]);
    state=loadPrefs();panels={};payload=null;reviews={};linkById=new Map();
    visibleLimit={bryan:50,cross:50};lastFetch=0;pending=null;
    const head=node("div","card pt-cloud-header");
    head.append(el("h2","クラウド解析"),note("調査IDの検索・詳細・記録・差分を管理します。未検証結果は確定情報ではありません。"));
    const controls=node("div","pt-cloud-controls");
    const expand=el("button","すべて開く","btn"),collapse=el("button","すべて閉じる","btn");
    reloadButton=el("button","再読み込み","btn primary");
    [expand,collapse,reloadButton].forEach(btn=>btn.type="button");
    expand.addEventListener("click",()=>openAll(true));
    collapse.addEventListener("click",()=>openAll(false));
    reloadButton.addEventListener("click",()=>refresh(true));
    controls.append(expand,collapse,reloadButton);
    head.append(controls);
    message=el("div","未読み込み","banner");message.dataset.cloudStatus="1";message.setAttribute("role","status");
    const body=node("div","pt-cloud-sections");body.dataset.cloudBody="1";
    PANELS.forEach(([id,title,hint])=>body.append(createPanel(id,title,hint)));
    target.replaceChildren(head,message,body);
    document.addEventListener("keydown",onEscape);
  }
  window.PTAdminCloudAnalysis=Object.freeze({mount,refresh});
})();
