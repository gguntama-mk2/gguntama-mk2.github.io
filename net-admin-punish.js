/* PN06 試作：管理者ページ「確定反撃表」> 自キャラ確反表(NET)の編集（隔離・実API接続なし）。
   ・タブを開く(mount)まで通信・読込なし。DOMは textContent / createElement のみ。
   ・組み込み(NET原本)は不変。保存するのは原本との差(上書き)だけ。k<0（技表外）は保持・取り外しのみ、新規追加は不可。
   ・発生Fだけでは「確認済み」にしない。原本にある行＝既存、原本に無い技＝管理者確認が付くまで下書きのみ（公開不可）。 */
(function () {
  "use strict";
  var C = window.PTCore, MIN_F = C.MIN_F, MAX_F = C.MAX_F, STD = C.STD, SHOW = 6;
  var store = null, S = { chars: [], cur: null, edit: [], stance: "stand", dirty: false, viewEpoch: 0, readSeq: 0, editEpoch: 0, busy: false, locked: null, pick: null, charQuery: "", conflict: null, syncPending: null };
  var clone = C.clone, root, ui = {}, activeIdentity = null, heldDraft = null, keyListener = null, saveKeyListener = null, verifyIdentity = null, transferStage = null;
  var savedBaseline = [], undoStack = [], redoStack = [], MAX_UNDO = 40, onSelected=null;
  function identityEq(a,b) { return !!a && !!b && a.principal === b.principal && a.epoch === b.epoch; }
  function clearUndo(base) { undoStack=[];redoStack=[];savedBaseline=clone(base||[]); }
  function syncDirty() { setDirty(C.canon(C.order(S.edit))!==C.canon(C.order(savedBaseline))); }
  function pushUndo(before) { if(C.canon(before)===C.canon(S.edit)) return false; undoStack.push(clone(before));if(undoStack.length>MAX_UNDO)undoStack.shift();redoStack=[];return true; }
  function applyHistory(undo) {
    if(!S.cur || S.cur.blocked || frozen())return note("編集停止中は取り消し・やり直しできません", "err");
    var source=undo?undoStack:redoStack,target=undo?redoStack:undoStack;
    if(!source.length)return;
    target.push(clone(S.edit));if(target.length>MAX_UNDO)target.shift();S.edit=clone(source.pop());
    S.editEpoch++;transferStage=null;S.pick=null;if(S.conflict)S.conflict.reviewed=false;
    syncDirty();ui.pv.replaceChildren();render();note(undo?"直前の編集を取り消しました（未保存）":"編集をやり直しました（未保存）");
  }
  function clearEditorState() { transferStage=null; ++S.viewEpoch;++S.readSeq;++S.editEpoch;S.cur=null;S.edit=[];S.dirty=false;S.busy=false;S.locked=null;S.pick=null;S.conflict=null;S.syncPending=null;clearUndo([]);if(root)root.replaceChildren();store=null; }
  // No persisted browser storage: keep a private, short-lived snapshot on permission loss only.
  // Never reveal it to a different principal, or re-apply it without a fresh server read.
  function suspendAuth(reason,seen) {
    if(!heldDraft && S.cur && S.dirty && activeIdentity && (!seen || seen.principal===activeIdentity.principal)) {
      heldDraft={identity:clone(activeIdentity),char:S.cur.id,revision:S.cur.revision,base_hash:S.cur.base_hash,
        slots:clone(S.edit),undo:clone(undoStack),redo:clone(redoStack),baseline:clone(savedBaseline),stance:S.stance,
        uncertain:S.locked?{operation_id:S.locked.op,kind:S.locked.kind}:null};
    }
    if(seen && activeIdentity && seen.principal && seen.principal!==activeIdentity.principal)heldDraft=null;
    if(root&&keyListener)root.removeEventListener("keydown",keyListener);keyListener=null;if(root&&saveKeyListener)root.removeEventListener("keydown",saveKeyListener);saveKeyListener=null;
    clearEditorState();S.chars=[];activeIdentity=null;
  }
  function discardHeld() { heldDraft=null;transferStage=null; }
  function recoveryOffer() {
    if(!heldDraft || !activeIdentity)return;
    if(heldDraft.identity.principal!==activeIdentity.principal){heldDraft=null;return;}
    var b=h("button",{type:"button","data-act":"restore-held",text:"権限変更前の未保存編集を確認して復旧",onclick:restoreHeld});
    ui.recovery.appendChild(h("p",{class:"pn-warn","data-held":"1",text:heldDraft.uncertain?"未保存編集と結果不明の操作IDを隔離メモリ内に保全中。旧権限の受領確認が必要なため編集は復旧できません。自動再送は禁止です。":"未保存編集を一時保全中。同じ利用者で再認証済みです。元データと保存版を再取得してから、手動で復旧できます。自動保存は行いません。"}));
    ui.recovery.appendChild(b);
    ui.recovery.appendChild(h("button",{type:"button","data-act":"discard-held",text:"保全内容を破棄",onclick:function(){heldDraft=null;render();}}));
  }
  function restoreHeld() {
    var held=heldDraft,identity=activeIdentity;
    if(!held||!identity||held.identity.principal!==identity.principal||S.busy||S.locked||S.syncPending)return;
    if(held.uncertain)return note("旧権限の結果未確認操作があります。適用有無を管理者が別途確認するまで編集を復旧しません。再送禁止。", "err");
    var ve=S.viewEpoch,ee=S.editEpoch;
    S.busy=true;render();note("保全した編集の元データ・保存版を確認中…");
    store.get(held.char).then(function(g){
      if(!heldDraft||heldDraft!==held||!identityEq(activeIdentity,identity)||S.viewEpoch!==ve||S.editEpoch!==ee)return;
      if(g.edit_blocked||g.base_hash!==held.base_hash){note("元データが変わったか編集停止中です。保全編集は復旧せず保持します。", "err");return;}
      if(!S.cur||S.cur.id!==held.char){note("同じキャラを選択してから復旧してください。保全内容は保持します。", "err");return;}
      if(S.dirty||S.conflict||S.syncPending||S.locked){note("編集中・競合中は復旧できません。内容は保持します。", "err");return;}
      // Rebuild from the fresh response and keep a conflict if another admin saved meanwhile.
      var remote=C.applyOverrides(g.builtin,g.draft?g.draft.ovr:(g.published?g.published.ovr:[]));
      S.cur=fromResponse(g,held.char);S.edit=clone(held.slots);S.stance=held.stance;
      savedBaseline=clone(g.revision === held.revision ? remote : held.baseline);undoStack=clone(held.undo);redoStack=clone(held.redo);
      syncDirty();S.editEpoch++;heldDraft=null;
      if(g.revision!==held.revision){S.conflict={server:g,reviewed:false};setDirty(true);note("別の管理者による更新を検出。編集を復旧しましたが競合確認が必要です。自動保存しません。", "err");}
      else note("保全された未保存編集を復旧しました。内容を確認してから手動保存してください。");
    },function(e){if(S.viewEpoch===ve)note("再取得失敗のため復旧しませんでした："+e.message,"err");})
    .finally(function(){if(S.viewEpoch===ve){S.busy=false;render();}});
  }
  function h(tag, a) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null || v === false) return; if (k === "text") e.textContent = v; else if (k === "class") e.className = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v); }); for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); } return e; }
  function note(t, kind) { ui.note.textContent = t || ""; ui.note.dataset.kind = kind || ""; }
  function setDirty(v) { S.dirty = v; paintStatus(); }
  function frozen() { return S.busy || !!S.locked || !!S.syncPending; }
  // 編集はすべてここを通す：書込み中・結果不明中・キャラ未選択は拒否。編集世代を進め、取得中の読み込みを無効にする
  function edit(fn) { if (!S.cur || S.cur.blocked) return false; if (frozen()) { note(S.locked ? "前の操作の結果が不明です。「結果を確認」を押してください" : "処理中のため編集できません", "err"); return false; }
    var before=clone(S.edit);fn();if(!pushUndo(before))return true;
    S.editEpoch++;transferStage=null;if(S.conflict) S.conflict.reviewed=false;syncDirty();ui.pv.replaceChildren();render();return true; }
  function slotOf(id) { return S.edit.find(function (s) { return s.slot_id === id; }); }
  function builtinOf(id) { return S.cur.builtin.find(function (s) { return s.slot_id === id; }); }
  function movesOf(c) { return c.char.moves; }
  function mvInfo(m) {
    if (m.raw) return (m.k < 0 ? "【技表外の行】" : "") + m.raw[3] + "（" + m.raw[2] + "）";
    var move = S.cur.char.moves.find(function (item) { return item.k === m.k; });
    return move ? move.name + "（" + move.command + "・発生" + move.startup + "）" : "不明な技 " + m.k;
  }
  function isBuiltinMove(sid, m) { var b = builtinOf(sid); return !!(b && m.raw !== undefined && b.moves.some(function (x) { return x.k === m.k && C.canon(x.raw) === C.canon(m.raw); })); }
  function framesFor(st) { var set = {}; STD.forEach(function (f) { set[f] = 1; }); S.edit.forEach(function (s) { if (C.stateOf(s.slot_id) === st) set[C.frameOf(s.slot_id)] = 1; }); return Object.keys(set).map(Number).sort(function (a, b) { return a - b; }); }
  function validation() { var c = S.cur; return c ? C.validateSlots(S.edit, movesOf(c), c.builtin) : { errors: [], unverified: [] }; }
  // PNINT05: contextual, read-only validation. Authoritative validation remains in pnint/net_store.py.
  function slotMessages(id, report) {
    return { errors: report.errors.filter(function(msg){ return msg.indexOf(id) >= 0; }),
      unverified: report.unverified.filter(function(item){ return item.slot === id; }) };
  }
  function addFrameMessage(value) {
    if (value === "") return "枠番号を入力してください（" + MIN_F + "〜" + MAX_F + "F）";
    var n = Number(value);
    if (!Number.isSafeInteger(n) || n < MIN_F || n > MAX_F) return MIN_F + "〜" + MAX_F + " の整数を入力してください";
    if (slotOf(S.stance + ":" + n)) return "-" + n + "F の枠はすでにあります";
    return "";
  }
  // PNINT08: explicit file transfer only. No localStorage, cookies, OAuth data, or silent writes.
  // SHA256 is a corruption marker, NOT a signature or authorization proof.
  var TRANSFER_FORMAT = "PROJECT_T_NET_EDIT", TRANSFER_BYTES = 512*1024;
  function transferKeys(o,keys) { return !!o && !Array.isArray(o) && typeof o==="object" &&
    Object.keys(o).length===keys.length && Object.keys(o).every(function(k){return keys.indexOf(k)>=0;}); }
  function transferFail(msg){transferStage=null;note("バックアップ読込拒否："+msg,"err");render();}
  function exportDraft(){
    var c=S.cur;
    if(!c||c.blocked||!activeIdentity||!S.dirty||S.busy)return note("未保存編集がある管理者のみエクスポートできます","err");
    var item={format:TRANSFER_FORMAT,version:1,principal:activeIdentity.principal,permission_epoch:activeIdentity.epoch,
      char:c.id,revision:c.revision,base_hash:c.base_hash,saved_fp:C.fp(conflictFingerprint(c)),
      stance:S.stance,slots:clone(S.edit),slots_fp:C.fp(C.order(S.edit))};
    var payload=JSON.stringify(item,null,2)+"\n";
    if(new TextEncoder().encode(payload).length>TRANSFER_BYTES)return note("ファイルサイズ制限を超えています","err");
    var url=URL.createObjectURL(new Blob([payload],{type:"application/json"})),a=document.createElement("a");
    a.href=url;a.download="PNINT08_NET_EDIT.json";document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    note("編集ファイルを明示エクスポートしました（トークン・Cookieなし）。保存済みではありません。外部共有しないでください。");
  }
  async function checkTransferIdentity(expected){
    if(!activeIdentity||!identityEq(activeIdentity,expected)||!verifyIdentity)return false;
    var ok=await verifyIdentity();
    return !!ok && identityEq(activeIdentity,expected);
  }
  function remoteTransferSnapshot(g){return C.fp(conflictFingerprint(g));}
  async function importFile(file){
    transferStage=null;
    if(!file||!S.cur||!activeIdentity||S.cur.blocked||S.busy||S.locked||S.syncPending||S.conflict||S.dirty)
      return transferFail("編集中・競合中・権限停止中はインポートできません。現在の編集を保全してください");
    if(file.size===0||file.size>TRANSFER_BYTES)return transferFail("空ファイルまたは512KiB超のファイルです");
    var c=S.cur,ve=S.viewEpoch,ee=S.editEpoch,identity=clone(activeIdentity),entry=null;
    S.busy=true;render();
    try{
      var raw=await file.text();if(new TextEncoder().encode(raw).length>TRANSFER_BYTES)throw Error("サイズ超過");
      entry=JSON.parse(raw);
      if(!transferKeys(entry,["format","version","principal","permission_epoch","char","revision","base_hash","saved_fp","stance","slots","slots_fp"])||
         entry.format!==TRANSFER_FORMAT||entry.version!==1||typeof entry.principal!=="string"||
         !Number.isSafeInteger(entry.permission_epoch)||typeof entry.char!=="string"||
         !Number.isSafeInteger(entry.revision)||entry.revision<0||
         typeof entry.base_hash!=="string"||!/^[0-9a-f]{64}$/.test(entry.saved_fp)||
         !/^[0-9a-f]{64}$/.test(entry.slots_fp)||!["stand","crouch"].includes(entry.stance))throw Error("ファイル形式・項目に不正があります");
      if(entry.principal!==identity.principal||entry.permission_epoch!==identity.epoch)throw Error("同一主体・権限世代ではありません");
      if(entry.char!==c.id)throw Error("キャラが異なります。ファイルのキャラを選んでください");
      if(!Array.isArray(entry.slots)||entry.slots.length>110||!C.jsonData(entry.slots))throw Error("枠配列が不正です");
      var validationResult=C.validateSlots(entry.slots,c.char.moves,c.builtin);
      if(validationResult.errors.length)throw Error("編集データ不正："+validationResult.errors[0]);
      if(C.fp(C.order(entry.slots))!==entry.slots_fp)throw Error("編集内容指紋が一致しません");
      if(!await checkTransferIdentity(identity))throw Error("認証または権限世代が変更されました");
      var g=await store.get(c.id);
      if(S.cur!==c||S.viewEpoch!==ve||S.editEpoch!==ee||!identityEq(activeIdentity,identity))throw Error("読込中に画面・主体が変わりました");
      if(g.edit_blocked||g.base_hash!==entry.base_hash||g.base_hash!==c.base_hash)throw Error("元データ変更・編集停止：適用を拒否します");
      if(g.revision!==entry.revision||remoteTransferSnapshot(g)!==entry.saved_fp)throw Error("保存版または内容が変更されました（409相当）。自動上書きはしません");
      if(S.dirty||S.conflict||S.locked||S.syncPending)throw Error("編集中の状態が変化しました");
      transferStage={entry:entry,identity:identity,view:ve,edit:ee,server_fp:remoteTransferSnapshot(g)};
      note("ファイルを確認しました。枠の差分を確認後、明示的に手元編集へ適用してください。保存・公開は行いません");
    }catch(e){transferStage=null;note("バックアップ読込拒否："+e.message,"err");}
    finally{if(S.cur===c&&S.viewEpoch===ve){S.busy=false;render();}}
  }
  async function applyImport(){
    var st=transferStage,c=S.cur;if(!st||!c||S.busy||S.dirty||S.locked||S.conflict||S.syncPending)return;
    if(S.viewEpoch!==st.view||S.editEpoch!==st.edit||!identityEq(activeIdentity,st.identity))return transferFail("画面や権限が変わりました");
    S.busy=true;render();
    try{
      if(!await checkTransferIdentity(st.identity))throw Error("認証または権限世代が変更されました");
      var g=await store.get(st.entry.char);
      if(transferStage!==st||S.cur!==c||S.viewEpoch!==st.view||S.editEpoch!==st.edit)throw Error("再照合中に状態が変化しました");
      if(g.edit_blocked||g.base_hash!==st.entry.base_hash||g.revision!==st.entry.revision||
        remoteTransferSnapshot(g)!==st.server_fp||st.server_fp!==st.entry.saved_fp)throw Error("保存版・原本が再照合で変わりました。適用しません");
      var v=C.validateSlots(st.entry.slots,g.char.moves,g.builtin);
      if(v.errors.length||C.fp(C.order(st.entry.slots))!==st.entry.slots_fp)throw Error("編集内容検証に失敗しました");
      var remote=C.applyOverrides(g.builtin,g.draft?g.draft.ovr:(g.published?g.published.ovr:[]));
      S.cur=fromResponse(g,c.id);clearUndo(remote);S.edit=clone(st.entry.slots);S.stance=st.entry.stance;S.editEpoch++;
      transferStage=null;S.pick=null;syncDirty();ui.pv.replaceChildren();
      note("バックアップを手元の未保存編集として復元しました。保存・公開はしていません。内容を確認してください");
    }catch(e){transferStage=null;note("バックアップ適用拒否："+e.message+"。サーバーデータも手元編集も変更していません","err");}
    finally{if(S.viewEpoch===st.view){S.busy=false;render();}}
  }
  function drawTransfer(){
    if(!ui.transfer)return;ui.transfer.replaceChildren();
    if(!S.cur||!activeIdentity||S.cur.blocked)return;
    var area=h("section",{class:"pn-transfer","aria-label":"未保存編集の明示的なファイル保全"});
    area.appendChild(h("h4",{text:"未保存編集のファイル保全（手動・ローカル）"}));
    area.appendChild(h("p",{class:"pn-hint",text:"ファイルは認証情報を含みませんが、編集内容と主体IDを含みます。機密ファイルとして取り扱ってください。読み込んでもサーバー保存されません。"}));
    area.appendChild(h("button",{type:"button","data-act":"export-edit",disabled:!S.dirty||S.busy,text:"未保存編集をJSONとして保存",onclick:exportDraft}));
    var input=h("input",{type:"file",accept:".json,application/json","aria-label":"未保存編集JSONを読み込む","data-act":"import-file",disabled:S.busy||S.dirty||!!S.conflict||!!S.locked||!!S.syncPending,
      onchange:function(e){var file=e.target.files&&e.target.files[0];if(file)importFile(file);}});
    area.appendChild(h("label",null,"バックアップを選択：",input));
    if(transferStage){var st=transferStage;area.appendChild(h("p",{class:"pn-warn","data-import-staged":"1",text:"照合済み："+st.entry.char+"／保存版"+st.entry.revision+"／差分"+C.diff(S.edit,st.entry.slots).length+"枠。適用しても自動保存しません。"}));
      area.appendChild(h("button",{type:"button","data-act":"apply-import",disabled:S.busy,text:"再照合して手元編集へ適用（保存しない）",onclick:applyImport}));
      area.appendChild(h("button",{type:"button","data-act":"cancel-import",text:"読み込みを取消",onclick:function(){transferStage=null;render();}}));}
    ui.transfer.appendChild(area);
  }
  // ---- Character filtering changes only the list DOM. Neither selection nor the draft is mutated.
  function normalized(x) { return String(x == null ? "" : x).normalize("NFKC").toLowerCase().trim(); }
  function drawCharList() {
    if (!ui.list) return;
    var q = normalized(S.charQuery), found = S.chars.filter(function(c){return !q || normalized(c.name + " " + c.id).includes(q);});
    ui.list.replaceChildren();
    found.forEach(function(c){ ui.list.appendChild(h("button", { type:"button", "data-char":c.id, class:"pn-ch", "aria-current": S.cur && S.cur.id === c.id ? "true" : "false", text:c.name, onclick:function(){openChar(c.id);} })); });
    ui.charCount.textContent = found.length + " / " + S.chars.length + "キャラ";
    if (!found.length) ui.list.appendChild(h("span", {class:"pn-hint", text:"一致するキャラがありません"}));
  }
  function loadList() { return store.list().then(function(l){S.chars=l;drawCharList();},function(e){S.chars=[];drawCharList();note(e && e.status===401 ? "認証されていません。ログインし直してください" : e && e.status===403 ? "この画面を使う権限がありません" : "一覧を読み込めませんでした","err");}); }
  function openChar(id, msg, force) {
    if (S.busy) return note("処理中のため、キャラを切り替えられません", "err"); if (S.locked || S.syncPending) return note("前の操作の結果照合が完了していません。先に照合してください", "err");
    if (!force && S.dirty && !window.confirm("保存していない変更があります。破棄して移動しますか？")) return;
    var previousId = S.cur && S.cur.id, previousStance = S.stance;
    transferStage=null;var ve = ++S.viewEpoch, rs = ++S.readSeq, ee = S.editEpoch; S.pick = null; ui.pv.replaceChildren(); ui.pv.dataset.owner = ""; note("読み込み中…");
    store.get(id).then(function (r) {
      if (ve !== S.viewEpoch || rs !== S.readSeq) return;                                   // 古い応答は捨てる（別キャラ・同キャラ再取得・書込み開始）
      if (ee !== S.editEpoch) { note("読み込み中に編集されたため、読み込みを中止しました。もう一度選び直してください", "err"); return; }
      var src = r.draft || r.published; S.cur = { blocked: !!r.edit_blocked, effective: r.effective, effective_base: r.effective_base, has_net: r.has_net, policy: r.policy, id: id, char: r.char, builtin: r.builtin, base_hash: r.base_hash, revision: r.revision, draft: r.draft, published: r.published, history: r.history };
      S.edit = r.edit_blocked ? [] : C.applyOverrides(r.builtin, src ? src.ovr : []);
      S.stance = previousId === id ? previousStance : "stand"; S.conflict = null; S.syncPending = null; clearUndo(S.edit);setDirty(false); ui.confirm.hidden = true; drawCharList();
      var v = validation(); note(msg || (v.errors.length ? "保存されている設定に不正な項目があります（捨てずに表示しています。直すまで保存できません）" : ""), v.errors.length && !msg ? "err" : ""); render();
      if(onSelected)try{onSelected({char:id,revision:r.revision});}catch(_e){}
    }, function (e) { if (ve === S.viewEpoch && rs === S.readSeq) note("読み込めませんでした：" + e.message, "err"); });
  }
  // ---- Kuro01: 表示だけの改善（保存・認証・競合保護の動作は変えない）
  function paintStatus() {
    if (!ui.dirty) return; var c = S.cur, st = "", tx = "";
    if (!c) { st = ""; tx = ""; }
    else if (S.locked) { st = "unknown"; tx = "結果未確認（再送せず照会が必要）"; }
    else if (S.conflict) { st = "conflict"; tx = "競合あり（編集内容は保全中）"; }
    else if (S.busy || S.syncPending) { st = "busy"; tx = "保存・照合中…"; }
    else if (S.dirty) { st = "dirty"; tx = "未保存の変更あり"; }
    else if (c.revision > 0) { st = "saved"; tx = "下書き保存済み（版 " + c.revision + "）"; }
    else { st = "base"; tx = "原本のまま（保存した下書きなし）"; }
    ui.dirty.textContent = tx; ui.dirty.dataset.state = st;
  }
  function stanceCount(st) { return S.edit.filter(function (s) { return C.stateOf(s.slot_id) === st && s.mode === "manual" && s.moves.length; }).length; }
  // ---- 画面
  function render() {
    var c = S.cur; ui.title.textContent = c ? c.char.name : "キャラを選んでください"; ui.main.replaceChildren(); ui.recovery.replaceChildren(); if (!c) {drawTransfer();return;} drawRecovery();recoveryOffer();drawTransfer(); if (c.blocked) { ui.main.appendChild(h("p", { class: "pn-warn", "data-edit-blocked": "1", text: "【編集停止】元データが未検証のため、編集・プレビュー・公開は停止しています。公開の解除と履歴・差分の確認はできます。" })); ui.errs.replaceChildren(); if (c.effective && (c.effective.suspended || c.effective.stopped)) ui.errs.appendChild(h("li", { class: "pn-hold", "data-suspended": "1", text: "【停止中】元データが未検証のため、表示は検証済みの旧版、無ければ表示停止です" })); syncBar(); return; }
    ui.main.classList.toggle("pn-filled-only", !!S.filledOnly); var tabs = h("div", { class: "pn-st pn-seg", role: "group", "aria-label": "立ち・しゃがみの切り替え" }); [["stand", "立ち"], ["crouch", "しゃがみ"]].forEach(function (p) { var n = stanceCount(p[0]); tabs.appendChild(h("button", { type: "button", "data-stance": p[0], "aria-pressed": String(S.stance === p[0]), onclick: function () { S.stance = p[0]; render(); } }, p[1] + (n ? "（" + n + "枠）" : ""))); }); ui.main.appendChild(tabs);
    if (!c.char.moves.length) ui.main.appendChild(h("p", { class: "pn-warn", "data-act": "no-moves", text: "このキャラは技表が未登録のため、技を選べません。技表が登録されると編集できます。" }));
    var nf = h("input", { type: "number", min: String(MIN_F), max: String(MAX_F), step: "1", "aria-label": "追加する確反枠（-N F の N）", placeholder: "例 22", "data-act": "frame-input" });
    var frameIssue = h("span", { class: "pn-inline-input", "data-act": "frame-issue", role: "status" });
    nf.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var b = nf.parentNode && nf.parentNode.querySelector('[data-act="addframe"]'); if (b && !b.disabled) b.click(); } });
    nf.addEventListener("input", function () { var msg = addFrameMessage(nf.value); frameIssue.textContent = msg; nf.setAttribute("aria-invalid", msg ? "true" : "false"); });
    ui.main.appendChild(h("div", { class: "pn-addframe" }, "確反枠を追加：-", nf, "F ", h("button", { type: "button", "data-act": "addframe", disabled: frozen(), text: "＋枠を追加", onclick: function () { var issue = addFrameMessage(nf.value); if (issue) { frameIssue.textContent = issue; nf.setAttribute("aria-invalid", "true"); return note(issue, "err"); } var n = Number(nf.value), id = S.stance + ":" + n; edit(function () { S.edit = C.order(S.edit.concat([{ slot_id: id, mode: "manual", custom: STD.indexOf(n) < 0, moves: [] }])); }); } }), frameIssue));
    var pageValidation = validation();
    ui.main.appendChild(h("p", { class: "pn-validation-summary", "data-act": "validation-summary", role: "status", text: "入力エラー：" + pageValidation.errors.length + "件 ／ 未確認の技：" + pageValidation.unverified.length + "件" }));
    var jump = h("div", { class: "pn-jump", role: "group", "aria-label": "枠へ移動" });
    jump.appendChild(h("label", { class: "pn-filter" }, h("input", { type: "checkbox", "data-act": "filled-only", checked: !!S.filledOnly, onchange: function (e) { S.filledOnly = e.target.checked; render(); } }), " 技を登録した枠だけ表示"));
    framesFor(S.stance).forEach(function (f) { var sid = S.stance + ":" + f, sl = slotOf(sid), n = sl && sl.mode === "manual" ? sl.moves.length : 0; if (S.filledOnly && !n) return;
      jump.appendChild(h("button", { type: "button", "data-jump": sid, class: n ? "pn-has" : "", text: "-" + f + "F" + (n ? "（" + n + "）" : ""), onclick: function () { var r = ui.main.querySelector('[data-slot="' + sid + '"]'); if (r) r.scrollIntoView({ block: "start" }); } })); });
    ui.main.appendChild(jump);
    framesFor(S.stance).forEach(function (f) {
      var id = S.stance + ":" + f, s = slotOf(id) || { mode: "auto", moves: [] }, b = builtinOf(id), row = h("section", { class: "pn-row", "data-slot": id, "data-empty": s.mode === "manual" && s.moves.length ? "0" : "1" });
      var sel = h("select", { "aria-label": "-" + f + "F の設定方法", disabled: frozen(), onchange: function (e) { var v = e.target.value; var cur = slotOf(id); if (cur && cur.mode === "manual" && cur.moves.length && v !== "manual" && !window.confirm("この枠の登録済みの技 " + cur.moves.length + " 件を外します（「組み込みに戻す」で元に戻せます）。よろしいですか？")) { render(); return; } edit(function () { var t = slotOf(id); if (!t) { t = { slot_id: id, mode: "auto", moves: [] }; S.edit = C.order(S.edit.concat([t])); } t.mode = v; if (v !== "manual") t.moves = []; }); } }, h("option", { value: "auto", text: "自動", selected: s.mode === "auto" }), h("option", { value: "manual", text: "手動", selected: s.mode === "manual" }), h("option", { value: "hidden", text: "表示なし", selected: s.mode === "hidden" }));
      var head = h("h3", null, "-" + f + "F ", sel, b ? h("small", { text: STD.indexOf(f) < 0 ? " 既存の標準外枠" : " 既存" }) : h("small", { text: " 新規" }));
      if (!b) head.appendChild(h("button", { type: "button", "data-act": "delslot", disabled: frozen(), text: "枠を削除", onclick: function () { if (window.confirm("-" + f + "F の枠を削除します。")) edit(function () { S.edit = S.edit.filter(function (x) { return x.slot_id !== id; }); }); } }));
      if (b && C.canon(slotOf(id) || { slot_id: id, mode: "auto", moves: [] }) !== C.canon(b)) head.appendChild(h("button", { type: "button", "data-act": "revert", disabled: frozen(), text: "組み込みに戻す", onclick: function () { edit(function () { S.edit = C.order(S.edit.filter(function (x) { return x.slot_id !== id; }).concat([clone(b)])); }); } }));
      row.appendChild(head);
      if (s.mode === "manual") {
        var ol = h("ol", { class: "pn-mv" }); s.moves.forEach(function (m, i) {
          var li = h("li", { "data-k": String(m.k) }, mvInfo(m) + " ");
          var bm = isBuiltinMove(id, m); li.appendChild(h("small", { class: bm ? "pn-ok" : m.att ? "pn-att" : "pn-un", text: bm ? "［既存］" : m.att ? "［管理者確認済み］" : "［未確認：下書きのみ］" }));
          if (!bm) li.appendChild(h("label", null, h("input", { type: "checkbox", "data-act": "attest", checked: !!m.att, disabled: frozen(), onchange: function (e) { var on = e.target.checked; var cc = S.cur, ve = S.viewEpoch, sid = id, kk = m.k; var go = function () { if (S.cur !== cc || S.viewEpoch !== ve) return; var sl = slotOf(sid); var t = sl && sl.moves.find(function (x) { return x.k === kk && x.raw === undefined; }); if (!t) { note("確認の完了前に技が外された（または枠が変わった）ため、確認は反映しません", "err"); render(); return; } if (!edit(function () { if (on) t.att = true; else delete t.att; })) render(); }; if (on && store.attest) { e.target.disabled = true; store.attest(cc.id, { slot_id: sid, k: kk, base_hash: cc.base_hash }).then(go, function (er) { if (S.cur === cc && S.viewEpoch === ve) { note(er.message, "err"); render(); } }); } else go(); } }), "この枠で確定反撃になることを確認した"));
          li.appendChild(h("button", { type: "button", "aria-label": "上へ", "data-act": "up", disabled: frozen() || i === 0, text: "↑", onclick: function () { edit(function () { var a = slotOf(id).moves; var t = a[i]; a[i] = a[i - 1]; a[i - 1] = t; }); } }));
          li.appendChild(h("button", { type: "button", "aria-label": "下へ", "data-act": "down", disabled: frozen() || i === s.moves.length - 1, text: "↓", onclick: function () { edit(function () { var a = slotOf(id).moves; var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }); } }));
          var ordinal = h("select", { "aria-label":"表示順 " + m.k, "data-act":"order", disabled:frozen() || s.moves.length < 2,
            onchange:function(e){ var target=Number(e.target.value)-1; if (target===i) return;
              edit(function(){var arr=slotOf(id).moves, moving=arr.splice(i,1)[0];arr.splice(target,0,moving);}); } });
          s.moves.forEach(function(_,j){ ordinal.appendChild(h("option", {value:String(j+1),selected:j===i,text:String(j+1)+"番"})); });
          li.appendChild(h("label", {class:"pn-ordinal"}, "表示順 ", ordinal));
          li.appendChild(h("button", {type:"button", "data-act":"replace", disabled:frozen(),
            text:"差し替え", onclick:function(){ picker(id, f, i); }}));
          li.appendChild(h("button", { type: "button", "aria-label": "外す", "data-act": "rm", disabled: frozen(), text: "外す", onclick: function () { edit(function () {
            var slot = slotOf(id);
            slot.moves.splice(i, 1);
            if (slot.moves.length) return;
            if (builtinOf(id)) slot.mode = "hidden";
            else S.edit = S.edit.filter(function (item) { return item.slot_id !== id; });
          }); } })); ol.appendChild(li);
        }); row.appendChild(ol);
        row.appendChild(h("button", { type: "button", class: "pn-add", "data-act": "add", disabled: frozen(), text: "＋技を追加", onclick: function () { picker(id, f); } }));
      } else row.appendChild(h("p", { class: "pn-hint", text: s.mode === "auto" ? "現行の自動結果を表示します（技の登録なし）" : "この枠は表示しません" }));
      var issues = slotMessages(id, pageValidation);
      if (issues.errors.length || issues.unverified.length) {
        var localIssues = h("ul", { class: "pn-inline-errors", "data-act": "slot-errors" });
        issues.errors.forEach(function(msg) { localIssues.appendChild(h("li", { class: "pn-input-error", text: msg })); });
        if (issues.unverified.length) localIssues.appendChild(h("li", { class: "pn-input-warning", text: "未確認の技が" + issues.unverified.length + "件：下書き保存は可能ですが公開できません" }));
        row.appendChild(localIssues);
      }
      if (issues.errors.length) { row.setAttribute("data-invalid", "true"); sel.setAttribute("aria-invalid", "true"); }
      ui.main.appendChild(row);
    });
    var v = pageValidation; ui.errs.replaceChildren(); C.publishHolds(S.edit, c.builtin, c.policy).forEach(function (x) { ui.errs.appendChild(h("li", { class: "pn-hold", "data-hold": x.code, text: "【保留】" + C.HOLD_TEXT[x.code] })); }); if (c.effective && (c.effective.suspended || c.effective.stopped)) ui.errs.appendChild(h("li", { class: "pn-hold", "data-suspended": "1", text: "【停止中】公開済みの設定は、保留解除の承認が失効したため停止し、検証済みの旧版の表示に戻しています。旧版が確認できない場合は表示を停止します（設定自体は消えていません）" })); if (!c.has_net) ui.errs.appendChild(h("li", { class: "pn-hint", "data-netless": "1", text: "このキャラはNET原本がありません。現行の表示は、手動の枠を入れるまで維持されます" })); v.errors.forEach(function (e) { ui.errs.appendChild(h("li", { text: e })); }); if (v.unverified.length) ui.errs.appendChild(h("li", { class: "pn-warn", text: "未確認の技が " + v.unverified.length + " 件あります（下書きには保存できますが、確認するまで公開できません）" }));
    syncBar();
  }
  function syncBar() { var v = validation();ui.bar.querySelectorAll("button").forEach(function (b) { b.disabled = frozen() && b !== ui.confirm; }); ui.save.disabled = !!v.errors.length || frozen() || !!S.conflict || !S.cur; if (S.cur && S.cur.blocked) ui.bar.querySelectorAll("button").forEach(function (b) { if (["下書き保存", "プレビュー", "公開"].indexOf(b.textContent) >= 0) b.disabled = true; }); if (S.locked) ui.confirm.disabled = S.busy; ui.confirm.hidden = !S.locked;if(ui.undo)ui.undo.disabled=!undoStack.length||frozen()||!S.cur||!!S.cur.blocked;if(ui.redo)ui.redo.disabled=!redoStack.length||frozen()||!S.cur||!!S.cur.blocked; paintStatus(); }
  // PNINT06: keyboard operation only changes the selection highlight; Enter is the explicit add action.
  function picker(slot, f, replacement) {
    var c = S.cur; if (frozen() || !c || !slotOf(slot)) return;
    var opener = document.activeElement, tok = { id: c.id, ve: S.viewEpoch, slot: slot }; S.pick = tok;
    var dlg = h("div", { class:"pn-dlg", role:"dialog", "aria-modal":"true", "aria-label":"技を選ぶ" }),
      q=h("input", {type:"search", placeholder:"技名・コマンド・発生・技IDで検索", "aria-label":"技検索（上下キーで選択、Enterで登録、Escで閉じる）", "aria-controls":"pn-picker-options", "data-act":"picker-query"}),
      resultCount=h("p",{class:"pn-hint",role:"status"}),list=h("ul",{id:"pn-picker-options", "data-act":"picker-results"}),
      orderSelect=h("select", {"data-act":"picker-sort","aria-label":"候補の並び",onchange:draw},h("option",{value:"source",text:"技表順"}),h("option",{value:"startup",text:"発生の早い順"}),h("option",{value:"name",text:"技名順"})),
      hideChosen=h("input",{type:"checkbox","data-act":"hide-chosen",onchange:draw}), fastOnly=h("input",{type:"checkbox","data-act":"fast-only",onchange:draw}), active=0, buttons=[];
    function valid() { return S.pick === tok && S.cur === c && tok.ve === S.viewEpoch && dlg.isConnected && !frozen(); }
    function returnFocus() { var row = ui.main.querySelector('[data-slot="'+slot+'"]'); var next = row && (replacement === undefined ? row.querySelector('[data-act="add"]') : row.querySelectorAll('[data-act="replace"]')[replacement]); if (next && !next.disabled) next.focus(); else if (opener && opener.isConnected) opener.focus(); else ui.charSearch.focus(); }
    function closePicker() { if (S.pick === tok) S.pick=null; dlg.remove(); returnFocus(); }
    function startF(m) { var a=/^\s*(\d+)\s*F/i.exec(m.startup||""); return a?Number(a[1]):Number.MAX_SAFE_INTEGER; }
    function mark(shouldScroll) { if (!buttons.length) { q.removeAttribute("aria-activedescendant"); return; }
      active=Math.max(0,Math.min(active,buttons.length-1)); buttons.forEach(function(btn,i){btn.parentNode.setAttribute("data-active",i===active?"true":"false");});
      q.setAttribute("aria-activedescendant",buttons[active].parentNode.id);
      if(shouldScroll) buttons[active].scrollIntoView({block:"nearest"}); }
    function draw() { list.replaceChildren();buttons=[];active=0;
      var chosen = {}, sl=slotOf(slot); (sl ? sl.moves : []).forEach(function(m){chosen[m.k]=1;});
      var t=normalized(q.value), all=movesOf(c).filter(function(m){return m.k>=0 && (!hideChosen.checked || !chosen[m.k]) && (!fastOnly.checked || startF(m)<=f) && (!t || normalized(m.name+" "+m.command+" "+m.startup+" "+m.k).includes(t));});
      if(orderSelect.value==="startup") all.sort(function(a,b){return startF(a)-startF(b)||a.k-b.k;});
      if(orderSelect.value==="name") all.sort(function(a,b){return String(a.name).localeCompare(String(b.name),"ja")||a.k-b.k;});
      resultCount.textContent=all.length+"件の候補（最大80件表示）";
      all.slice(0,80).forEach(function(m,i){var n=/^\s*(\d+)\s*F/.exec(m.startup||""),over=n && +n[1]>f,dup=chosen[m.k];
        var li=h("li",{id:"pn-picker-option-"+i,"data-active":"false"}),btn=h("button",{type:"button","data-k":String(m.k),disabled:!!dup,text:m.name+"（"+m.command+"・発生"+m.startup+"）"+(dup?" 登録済み":"")+(over?" ⚠発生がこの枠より遅い":""),onclick:function(){
          if(!valid() || dup) return; var current=slotOf(slot);
          if(!current || current.mode!=="manual" || current.moves.some(function(x){return x.k===m.k;})) return;
          if(replacement === undefined && current.moves.length>=C.MAX_MOVES) return note("技が多すぎます（"+C.MAX_MOVES+"件まで）","err");
          if(edit(function(){
            if (replacement === undefined) current.moves.push({k:m.k});
            else current.moves.splice(replacement, 1, {k:m.k});
          }))closePicker();
        }});li.appendChild(btn);list.appendChild(li);buttons.push(btn);});
      if(all.length>80) list.appendChild(h("li",{class:"pn-hint",text:"他 "+(all.length-80)+" 件：検索で絞り込んでください"}));
      if(!all.length) list.appendChild(h("li",{class:"pn-hint",text:"候補がありません。検索条件を変更してください"}));mark(false); }
    q.addEventListener("input",draw);
    dlg.addEventListener("keydown",function(e){
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closePicker();return;}
      if(e.key==="ArrowDown"||e.key==="ArrowUp"||e.key==="Home"||e.key==="End"){
        if(e.target===q || (e.target.closest && e.target.closest('[data-act="picker-results"]'))){
          e.preventDefault();if(e.key==="Home")active=0;else if(e.key==="End")active=buttons.length-1;
          else active+=e.key==="ArrowDown"?1:-1;mark(true);q.focus(); }
      }else if(e.key==="Enter" && e.target===q){
        // Leave IME confirmation to the browser. Some IME key events use keyCode 229.
        if(e.isComposing || e.keyCode===229)return;
        e.preventDefault();if(buttons[active]&&!buttons[active].disabled)buttons[active].click();
      }
    });
    dlg.appendChild(h("h4",{text:"-"+f+"F "+(replacement === undefined ? "に使う技を選ぶ" : "の差し替え先を選ぶ")}));dlg.appendChild(q);
    dlg.appendChild(h("div",{class:"pn-picker-tools"},h("label",null,"並び：",orderSelect),h("label",null,hideChosen," 登録済みの技を隠す"),h("label",null,fastOnly," -"+f+"F 以内に出せる技だけ")));
    dlg.appendChild(resultCount);dlg.appendChild(list);dlg.appendChild(h("button",{type:"button",text:"閉じる",onclick:closePicker}));ui.main.appendChild(dlg);draw();q.focus();
  }
  // ---- PNINT04: authoritative post-write re-fetch. No blind adoption of response revisions.
  function fromResponse(r,id) {
    var src=r.draft || r.published;
    return {blocked:!!r.edit_blocked,effective:r.effective,effective_base:r.effective_base,
      has_net:r.has_net,policy:r.policy,id:id,char:r.char,builtin:r.builtin,base_hash:r.base_hash,
      revision:r.revision,draft:r.draft,published:r.published,history:r.history};
  }
  function drawRecovery() {
    if (!S.cur || !ui.recovery) return;
    if (S.syncPending) {
      ui.recovery.appendChild(h("p",{class:"pn-warn",text:"保存は受理されましたが、最新版の再読込を確認できていません。編集内容は保持しています。保存を繰り返さず再照合してください。"}));
      ui.recovery.appendChild(h("button",{type:"button","data-act":"resync",disabled:S.busy,text:"保存結果を再照合（読取りのみ）",onclick:retrySync}));
    }
    if (S.conflict) {
      var f=S.conflict, safe=!!f.server && f.server.base_hash===S.cur.base_hash && !f.server.edit_blocked;
      ui.recovery.appendChild(h("p",{class:"pn-warn","data-conflict":"1",text:"【保存競合】手元の編集は保持しています。サーバー版 " + (f.server?f.server.revision:"未取得") + " / 編集元 " + S.cur.revision + "。自動再送・自動上書きは行いません。"}));
      if (f.server) {
        var remote=f.server.draft ? C.applyOverrides(f.server.builtin,f.server.draft.ovr) : f.server.builtin;
        var differences = C.diff(remote,S.edit);
        ui.recovery.appendChild(h("p",{class:"pn-hint",text:"サーバー版との差分：" + differences.length + " 枠。" +(safe?"変更した枠を確認し、チェックを付けてから下書きを作り直してください。":"原本が変化、または編集停止中です。版番号の採用は禁止します。")}));
        var details = h("details", { class: "pn-conflict-details", "data-act": "conflict-details", open: true });
        details.appendChild(h("summary",{text:"競合した枠の詳細（"+differences.length+"件）"}));
        if (!differences.length) details.appendChild(h("p",{text:"技の並びは一致しています。版・履歴などの更新が競合しています。"}));
        differences.forEach(function(d){
          details.appendChild(h("div",{class:"pn-conflict-line", "data-diff-slot":d.slot},
            h("strong",{text:d.slot}), h("p",{text:"サーバー版："+d.before}),h("p",{text:"手元の編集："+d.after})));
        });
        ui.recovery.appendChild(details);
        ui.recovery.appendChild(h("label",{class:"pn-review-label"},h("input",{type:"checkbox","data-act":"review-conflict",checked:!!f.reviewed,disabled:!safe||S.busy,onchange:function(e){if(S.conflict!==f)return;f.reviewed=!!e.target.checked;render();}}),"差分を確認した（同じ枠を編集した場合は手元の内容を選ぶ）"));
      }
      ui.recovery.appendChild(h("button",{type:"button","data-act":"inspect",disabled:S.busy,text:"サーバーの最新状態を照合（読取りのみ）",onclick:inspectConflict}));
      ui.recovery.appendChild(h("button",{type:"button","data-act":"accept",disabled:S.busy || !safe || !f.reviewed,text:"競合を確認して下書きを作り直す",onclick:acceptConflict}));
    }
    if (S.conflict || S.syncPending || S.locked) {
      ui.recovery.appendChild(h("button",{type:"button","data-act":"backup",text:"手元の編集JSONを表示",onclick:function(){
        var payload=JSON.stringify({char:S.cur.id,revision:S.cur.revision,base_hash:S.cur.base_hash,slots:S.edit},null,2);
        var text=h("textarea",{readonly:true,"aria-label":"手元の未保存編集JSON",rows:"8",class:"pn-backup"});text.value=payload;
        ui.recovery.appendChild(text);text.focus();text.select();
      }}));
    }
  }
  function inspectConflict(){
    var c=S.cur, f=S.conflict, ve=S.viewEpoch;if(!c||!f||S.busy||S.locked)return;
    S.busy=true;render();
    store.get(c.id).then(function(g){if(S.cur!==c||S.viewEpoch!==ve||S.conflict!==f)return;
      f.server=g;f.reviewed=false;note("サーバー最新版を確認しました。手元の編集は変更していません。差分を確認してください。","err");},
      function(e){if(S.cur===c&&S.conflict===f)note("サーバー版を確認できません："+e.message,"err");})
      .finally(function(){if(S.cur===c&&S.viewEpoch===ve){S.busy=false;render();}});
  }
  // PNINT06: never adopt a previously reviewed version without a fresh read-only comparison.
  // The local draft is kept intact even if the server changes or the read fails.
  function conflictFingerprint(g){return C.canon({revision:g.revision,base_hash:g.base_hash,edit_blocked:!!g.edit_blocked,
    draft:g.draft?{rev:g.draft.rev,ovr:g.draft.ovr}:null,published:g.published?{rev:g.published.rev,ovr:g.published.ovr}:null});}
  function acceptConflict(){
    var f=S.conflict,c=S.cur;if(!f||!f.server||!c||S.busy||S.locked||S.syncPending)return;
    var g=f.server;
    if(g.base_hash!==c.base_hash||g.edit_blocked)return note("元データが変化または停止しているため版を採用できません","err");
    if(!f.reviewed)return note("各枠の差分を確認し、確認チェックを付けてください","err");
    var count=C.diff(g.draft?C.applyOverrides(g.builtin,g.draft.ovr):g.builtin,S.edit).length;
    if(!window.confirm("サーバー版"+g.revision+"との差分"+count+"枠を確認しましたか？ 双方の変更を照合し、同じ枠の変更には手元の内容を選びます。まだ保存しません。"))return;
    var fp=conflictFingerprint(g),ee=S.editEpoch,ve=S.viewEpoch;
    S.busy=true;render();note("最新版が確認した内容と同じか再照合中…");
    store.get(c.id).then(function(latest){
      if(S.cur!==c||S.viewEpoch!==ve||S.conflict!==f)return;
      if(ee!==S.editEpoch){f.reviewed=false;note("照合中に編集が変わったため、確認を取り消しました。","err");return;}
      if(latest.base_hash!==c.base_hash||latest.edit_blocked || conflictFingerprint(latest)!==fp){
        f.server=latest;f.reviewed=false;
        note("確認後にサーバー版が変わりました。差分を再確認してください。手元編集は保持しています。","err");return;
      }
      var remote = C.applyOverrides(latest.builtin, latest.draft ? latest.draft.ovr : []);
      var byId = function (slots) { return new Map(slots.map(function (slot) { return [slot.slot_id, slot]; })); };
      var baseline = byId(savedBaseline), local = byId(S.edit), merged = byId(remote);
      new Set([...baseline.keys(), ...local.keys()]).forEach(function (id) {
        if (C.canon(baseline.get(id)) === C.canon(local.get(id))) return;
        if (local.has(id)) merged.set(id, local.get(id));
        else merged.delete(id);
      });
      S.edit=C.order(Array.from(merged.values()));
      clearUndo(remote);
      pushUndo(remote);
      c.revision=latest.revision;c.draft=latest.draft;c.history=latest.history;S.conflict=null;syncDirty();
      note("版"+latest.revision+"を基に下書きを作り直しました。保存する前に内容を確認してください。","err");
    },function(e){if(S.cur===c&&S.viewEpoch===ve){f.reviewed=false;note("最新状態を確認できません："+e.message+"。競合状態と編集を保持しました。","err");}})
    .finally(function(){if(S.cur===c&&S.viewEpoch===ve){S.busy=false;render();}});
  }
  function hydrateSaved(c,rev,label,ve,expectedSlots) {
    if (S.cur!==c||S.viewEpoch!==ve)return;
    S.busy=true;S.syncPending={rev:rev,label:label,expected:expectedSlots || null};render();
    store.get(c.id).then(function(g){
      if(S.cur!==c||S.viewEpoch!==ve)return;
      if(g.revision!==rev || !g.draft || g.draft.rev!==rev || g.base_hash!==c.base_hash || g.edit_blocked){
        S.syncPending=null;S.conflict={server:g};setDirty(true);
        note("保存後にサーバー版との不一致を検知しました。手元の編集は保全しました。","err");return;
      }
      var remoteSlots=C.applyOverrides(g.builtin,g.draft.ovr);
      if (expectedSlots && C.canon(C.order(remoteSlots))!==C.canon(C.order(expectedSlots))) {
        S.syncPending=null;S.conflict={server:g};setDirty(true);
        note("サーバーの保存内容が送信した編集と一致しません。手元の編集を保全しました。","err");return;
      }
      var st=S.stance, keepSearch=S.charQuery;
      S.cur=fromResponse(g,c.id);S.edit=remoteSlots;clearUndo(S.edit);
      S.stance=st;S.charQuery=keepSearch;S.conflict=null;S.syncPending=null;S.pick=null;ui.pv.replaceChildren();setDirty(false);
      drawCharList();note(label+"をサーバーの最新保存版（版"+rev+"）と照合しました。");
    },function(e){
      if(S.cur===c&&S.viewEpoch===ve){note("保存は応答しましたが再読込に失敗："+e.message+"。編集は保持し、再照合が必要です。","err");}
    }).finally(function(){if(S.viewEpoch===ve){S.busy=false;render();}});
  }
  function retrySync(){var c=S.cur,p=S.syncPending;if(!c||!p||S.busy||S.locked)return;hydrateSaved(c,p.rev,p.label,S.viewEpoch,p.expected);}
  function run(label,kind,extra,restoreExpected){
    var c=S.cur;if(!c)return;
    if(S.locked||S.syncPending)return note("結果未確認の操作があります。先に確認してください。","err");
    if(S.conflict)return note("保存競合を確認してから再保存してください。","err");
    if(S.busy)return;
    var ve=S.viewEpoch,op=C.opId(),body=Object.assign({operation_id:op,expected_revision:c.revision,base_hash:c.base_hash},extra);
    ++S.readSeq;S.busy=true;render();note(label+"中…");
    store[kind](c.id,body).then(function(r){
      if(S.cur!==c||S.viewEpoch!==ve)return;
      hydrateSaved(c,r.revision,label,ve,kind==="saveDraft"?extra.slots:(restoreExpected||null));
    },function(e){
      if(S.cur!==c||S.viewEpoch!==ve)return;
      S.busy=false;
      if(e&&e.unknown){S.locked={op:op,kind:kind,label:label,char:c.id,expected:kind==="saveDraft"?clone(extra.slots):restoreExpected?clone(restoreExpected):null};note(label+"の結果が不明です。再送せず操作IDで照会してください。","err");}
      else if(e&&e.status===409){S.conflict={server:null};note("409競合：未保存の編集内容を保全しました。最新版を照合してください。","err");inspectConflict();}
      else note((e&&e.message)||"保存を確認できませんでした","err");
      render();
    });
  }
  function doConfirm(){
    var lk=S.locked,c=S.cur,ve=S.viewEpoch;if(!lk||S.busy||!c)return;
    S.busy=true;render();
    store.op(lk.char,lk.op,lk.kind).then(function(r){
      if(S.cur!==c||S.viewEpoch!==ve||S.locked!==lk)return;
      if(r.status==="applied"){S.locked=null;hydrateSaved(c,r.revision,lk.label,ve,lk.expected);}
      else if(r.status==="rejected"){S.locked=null;note(lk.label+"は拒否されていました。編集を保持しました。","err");}
      else note("結果不明です。再送は行いません。時間をおいて再確認してください。","err");
    },function(e){if(S.cur===c&&S.viewEpoch===ve)note("結果照合に失敗："+e.message,"err");})
    .finally(function(){if(S.cur===c&&S.viewEpoch===ve&&S.locked){S.busy=false;render();}
      else if(S.cur===c&&S.viewEpoch===ve&&!S.syncPending){S.busy=false;render();}});
  }
  function doSave(){if(S.cur&&S.cur.blocked)return note("元データが未検証のため保存できません","err");run("下書き保存","saveDraft",{slots:clone(S.edit)});}
  function doPublish() { var c = S.cur; if (!c) return; if (frozen() || S.conflict) return note("未確認の書込みまたは競合があるため操作できません", "err"); if (c.blocked) return note("元データが未検証のため公開できません", "err"); if (S.dirty) return note("先に下書きを保存してください", "err"); if (!c.draft) return note("公開する下書きがありません", "err"); var v = validation(); if (v.errors.length) return note("エラーがあるため公開できません", "err"); if (v.unverified.length) return note("未確認の技が " + v.unverified.length + " 件あるため公開できません（各技の確認を付けて保存し直してください）", "err"); var hd = C.publishHolds(S.edit, c.builtin, c.policy); if (hd.length) return note(C.HOLD_TEXT[hd[0].code], "err");
    var d = C.diff(C.applyOverrides(c.builtin, c.published ? c.published.ovr : []), S.edit); if (!window.confirm("公開します。変更 " + d.length + " 枠。よろしいですか？")) return;
    var dr = c.draft.rev, ph = C.fp(c.draft.ovr); run("公開", "publish", { draft_revision: dr, payload_hash: ph }, function (r, cc) { cc.published = { rev: r.revision, ovr: clone(cc.draft.ovr) }; note("公開しました（版" + r.revision + "）"); }); }
  function doReset() { var c = S.cur; if (!c || frozen() || S.conflict || !c.published) return note("解除する公開版がありません", "err"); if (!window.confirm("公開中の上書きを解除して組み込みの表示に戻します（組み込みデータの削除ではありません。履歴は残ります）。")) return; run("解除", "reset", {}, function (r, cc) { cc.published = null; note("公開を解除しました（版" + r.revision + "）"); }); }
  function owner(t) { var c = S.cur; ui.pv.replaceChildren(h("h4", { text: t })); ui.pv.dataset.owner = c.id + ":" + S.viewEpoch; }
  // R04-I05: 差分の基準を画面表示と一致させる。停止中は「現在の表示(原本)」と「停止中の保存済み公開版」を別々に示す。
  function doDiff() { var c = S.cur; if (!c) return; var sus = !!(c.effective && (c.effective.suspended || c.effective.stopped || c.effective.source === "fallback_verified_legacy")), stp = !!(c.effective && c.effective.stopped); owner(sus ? (stp ? "差分（停止中：表示停止・データ未確認）" : "差分（停止中：現在の表示は検証済み旧版です）") : "現在の表示（公開中／無ければ組み込み）との差分");
    function block(label, ovr, key) { ui.pv.appendChild(h("h5", { text: label, "data-diff-base": key })); if (key === "stored" && stp) return ui.pv.appendChild(h("p", { class: "pn-warn", "data-stopped-stored": "1", text: "検証済みの基準がないため、保存済みの版との比較も停止しています" })); if (key === "display" && sus) { if (!c.effective_base) return ui.pv.appendChild(h("p", { class: "pn-warn", "data-stopped": "1", text: "検証済みの旧版が確認できないため、表示も差分も停止しています" })); } var d = C.diff(key === "display" && sus ? c.effective_base : C.applyOverrides(c.builtin, ovr), S.edit); if (!d.length) ui.pv.appendChild(h("p", { text: "差分はありません" })); d.forEach(function (x) { ui.pv.appendChild(h("p", { text: x.slot + "：" + x.before + " → " + x.after })); }); }
    if (sus) { block("① 現在の表示（検証済み旧版）との差分", [], "display"); block("② 停止中の保存済み公開版との差分（参考・現在は表示されていません）", c.published ? c.published.ovr : [], "stored"); }
    else block("現在の表示との差分", c.published && (c.published.status || "active") === "active" ? c.published.ovr : [], "display"); }
  function doPreview() { var c = S.cur; if (!c) return; if (c.blocked) return note("元データが未検証のためプレビューできません", "err"); owner("プレビュー（下書き・公開前）：" + (S.stance === "stand" ? "立ち" : "しゃがみ")); framesFor(S.stance).forEach(function (f) { var s = slotOf(S.stance + ":" + f); if (!s) return; var t = s.mode === "hidden" ? "（表示なし）" : s.mode === "auto" ? "（現行の自動結果）" : s.moves.slice(0, SHOW).map(function (m) { return mvInfo(m); }).join(" / ") + (s.moves.length > SHOW ? "　…他" + (s.moves.length - SHOW) + "件" : ""); ui.pv.appendChild(h("p", { "data-pv": S.stance + ":" + f, text: "-" + f + "F：" + t })); }); }
  // R02: 書込み後の履歴再取得。最新の取得だけを採用し(古い応答は破棄)、取得中に履歴を開いた場合は完了を待ってから描く。
  function refreshHistory(c) { var q = (c.histSeq = (c.histSeq || 0) + 1); c.histBusy = true; c.histP = store.get(c.id).then(function (g) { if (S.cur === c && c.histSeq === q) { c.history = g.history; c.effective = g.effective; c.effective_base = g.effective_base; c.published = g.published; c.blocked = !!g.edit_blocked; if (c.blocked) { c.base_hash = g.base_hash; c.revision = g.revision; } render(); syncBar(); var v0 = validation(); if (c.effective && (c.effective.suspended || c.effective.stopped)) { /* 停止表示は render 後の検証一覧に反映 */ } } }, function () {}).then(function () { if (c.histSeq === q) c.histBusy = false; }); return c.histP; }
  function doHistory() { var c=S.cur; if(!c)return; owner("履歴");var tok=ui.pv.dataset.owner;
    var draw=function(){if(S.cur!==c||ui.pv.dataset.owner!==tok)return;
      if(c.histBusy){ui.pv.replaceChildren(h("h4",{text:"履歴"}),h("p",{class:"pn-hint",text:"履歴を更新中…"}));return c.histP.then(draw);}
      ui.pv.replaceChildren(h("h4",{text:"履歴"}));drawHistory(c,tok);};draw(); }
  // Compare immutable historical slot overrides with the *freshly read* persisted current version.
  // Neither the local draft, revision, selected stance nor conflict state is changed.
  function describeHistorySlot(s,c){
    if(!s)return "枠なし";
    var caption={auto:"自動",hidden:"表示なし",manual:"手動"}[s.mode]||String(s.mode);
    var m=(s.moves||[]).map(function(x,i){
      var mv=c.char.moves.find(function(y){return y.k===x.k;});
      return (i+1)+"番 k="+x.k+(mv?" "+mv.name+" / "+mv.command:"")+" / "+(x.att?"確認済み":"未確認")+(x.raw!==undefined?" / raw="+C.canon(x.raw):"");});
    return caption+(s.custom?"（標準外枠）":"")+(m.length?" ｜ "+m.join(" ｜ "):"");
  }
  function compareHistory(c,x,tok){
    if(S.cur!==c||ui.pv.dataset.owner!==tok)return;
    var ee=S.editEpoch,ve=S.viewEpoch,snapshot=clone(S.edit),localDirty=S.dirty;
    var panel=h("section",{class:"pn-history-compare","data-act":"history-comparison","data-history-version":String(x.v)});
    panel.appendChild(h("h5",{text:"版"+x.v+" と現在保存版の枠別比較"}));
    panel.appendChild(h("p",{class:"pn-hint",text:"最新版を読み取り中。比較は読取り専用で、編集と保存済み版は変更しません。"}));
    var previous=ui.pv.querySelector('[data-act="history-comparison"]');if(previous)previous.remove();ui.pv.appendChild(panel);
    store.get(c.id).then(function(g){
      if(S.cur!==c||S.viewEpoch!==ve||ui.pv.dataset.owner!==tok||!panel.isConnected)return;
      panel.replaceChildren(h("h5",{text:"版"+x.v+" と現在保存版の枠別比較"}));
      if(S.editEpoch!==ee||g.base_hash!==c.base_hash || g.edit_blocked){
        panel.appendChild(h("p",{class:"pn-warn",text:"編集状態・元データが変わったか、編集停止中です。比較を中止しました。"}));return;}
      var history=(g.history||[]).find(function(i){return i.v===x.v;});
      if(!history||C.canon(history.slots)!==C.canon(x.slots)){
        panel.appendChild(h("p",{class:"pn-warn",text:"履歴版が最新版と一致しないため、比較を中止しました。"}));return;}
      var old=C.applyOverrides(g.builtin,clone(history.slots)),current=C.applyOverrides(g.builtin,clone(g.draft?g.draft.ovr:(g.published?g.published.ovr:[])));
      var oldMap={},newMap={},localMap={};old.forEach(function(z){oldMap[z.slot_id]=z;});current.forEach(function(z){newMap[z.slot_id]=z;});snapshot.forEach(function(z){localMap[z.slot_id]=z;});
      var ids=Array.from(new Set(Object.keys(oldMap).concat(Object.keys(newMap)).concat(localDirty?Object.keys(localMap):[]))).sort(function(a,b){
        var sa=a.split(":"),sb=b.split(":"),va=sa[0]==="stand"?0:1,vb=sb[0]==="stand"?0:1;
        return va-vb || (+sa[1])-(+sb[1]);});
      var changed=ids.filter(function(id){return C.canon(oldMap[id]||null)!==C.canon(newMap[id]||null) || (localDirty && C.canon(newMap[id]||null)!==C.canon(localMap[id]||null));});
      panel.appendChild(h("p",{class:"pn-hint",text:"履歴版"+x.v+" / サーバー最新保存版"+g.revision+" / 差分"+changed.length+"枠"+(localDirty?"。手元の未保存編集も併記":"。未保存編集なし")+"。自動マージ・保存なし。"}));
      var stanceFilter=h("select",{"aria-label":"履歴比較の立ち・しゃがみ", "data-act":"history-stance"},
        h("option",{value:"all",text:"立ち・しゃがみ全部"}),h("option",{value:"stand",text:"立ちのみ"}),h("option",{value:"crouch",text:"しゃがみのみ"}));
      var slotFilter=h("input",{type:"search",placeholder:"枠番号で絞り込み（例 10）", "aria-label":"履歴比較の枠検索", "data-act":"history-slot-filter"});
      var filteredCount=h("span",{"data-act":"history-filter-count",role:"status",class:"pn-hint"});
      var rows=h("div",{"data-act":"history-filtered-rows"});
      var toolbar=h("div",{class:"pn-history-filters"},stanceFilter,slotFilter,filteredCount);
      panel.appendChild(toolbar);panel.appendChild(rows);
      function drawRows(){
        rows.replaceChildren();var q=normalized(slotFilter.value), st=stanceFilter.value;
        var matched=changed.filter(function(id){return (st==="all"||id.indexOf(st+":")===0) && (!q||normalized(id).includes(q)||id.split(":")[1].includes(q));});
        filteredCount.textContent=" 表示"+matched.length+" / 差分"+changed.length+"枠";
        if(!matched.length)rows.appendChild(h("p",{class:"pn-hint",text:changed.length?"該当する差分はありません":"枠の設定・技順に差分はありません"}));
        matched.forEach(function(id){var row=h("div",{class:"pn-history-row","data-history-slot":id},h("strong",{text:id}));
          row.appendChild(h("p",{text:"履歴版"+x.v+"："+describeHistorySlot(oldMap[id],c)}));
          row.appendChild(h("p",{text:"サーバー最新版"+g.revision+"："+describeHistorySlot(newMap[id],c)}));
          if(localDirty)row.appendChild(h("p",{text:"手元の編集："+describeHistorySlot(localMap[id],c)}));rows.appendChild(row);});
      }
      stanceFilter.addEventListener("change",drawRows);slotFilter.addEventListener("input",drawRows);drawRows();
    },function(e){if(S.cur===c&&S.viewEpoch===ve&&panel.isConnected){panel.replaceChildren(h("p",{class:"pn-warn",text:"履歴比較の再取得に失敗しました："+e.message+"。編集は保持しています。"}));}});
  }
  function drawHistory(c,tok){c.history.forEach(function(x){
    var acts={saveDraft:"下書き",publish:"公開",reset:"解除",restore:"復元"},isSnapshot=Array.isArray(x.slots)&&x.act!=="reset";
    ui.pv.appendChild(h("p",{"data-history-row":String(x.v)},"版"+x.v+" "+(acts[x.act]||x.act)+"　",
      isSnapshot?h("button",{type:"button","data-act":"history-compare",text:"現在版と枠別比較",onclick:function(){if(S.cur===c&&ui.pv.dataset.owner===tok)compareHistory(c,x,tok);}}):null,
      isSnapshot && x.slots.length?h("button",{type:"button","data-act":"restore",text:"下書きに取り込む",onclick:function(){
        if(S.cur!==c||ui.pv.dataset.owner!==tok||frozen())return note("この履歴は古くなっています。開き直してください","err");
        if(S.dirty&&!window.confirm("保存していない変更は失われます。"))return;
        run("履歴の下書き復元","restore",{from_version:x.v},C.applyOverrides(c.builtin,clone(x.slots)));}}):null));
  });}
  function mount(el, st, identity, verifySession, selectedCallback) {
    onSelected=typeof selectedCallback==="function"?selectedCallback:null;
    verifyIdentity=typeof verifySession==="function"?verifySession:null;transferStage=null;
    activeIdentity=identity&&identity.principal&&Number.isSafeInteger(identity.epoch)?clone(identity):null;
    if(heldDraft && (!activeIdentity||heldDraft.identity.principal!==activeIdentity.principal))heldDraft=null;
    ++S.viewEpoch; ++S.readSeq; ++S.editEpoch; S.cur = null; S.edit = []; S.dirty = false; S.busy = false; S.locked = null; S.pick = null;S.conflict=null;S.syncPending=null;S.charQuery="";S.stance="stand";clearUndo([]);
    store = st; root = el; ui.list = h("div", { class: "pn-list" });
    ui.charSearch=h("input",{type:"search","aria-label":"キャラを検索",placeholder:"キャラ名 / ID で検索","data-act":"char-search",oninput:function(e){S.charQuery=e.target.value;drawCharList();},onkeydown:function(e){if(e.key==="Enter"){e.preventDefault();var f=ui.list.querySelector("[data-char]");if(f)f.click();}}});
    ui.charCount=h("span",{class:"pn-hint",role:"status"});ui.transfer=h("div",{class:"pn-transfer-container"});ui.recovery=h("div",{class:"pn-recovery",role:"region","aria-label":"編集内容の復旧と競合確認"});
    ui.title = h("h2"); ui.dirty = h("span", { class: "pn-dirty", role: "status", "aria-live": "polite" }); ui.note = h("p", { role: "status", class: "pn-note" }); ui.main = h("div"); ui.errs = h("ul", { class: "pn-errs" }); ui.pv = h("div", { class: "pn-pv" });
    ui.undo=h("button",{type:"button","data-act":"undo",disabled:true,text:"元に戻す",onclick:function(){applyHistory(true);}});
    ui.redo=h("button",{type:"button","data-act":"redo",disabled:true,text:"やり直す",onclick:function(){applyHistory(false);}});
    ui.save = h("button", { type: "button", text: "下書き保存", onclick: doSave }); ui.confirm = h("button", { type: "button", text: "結果を確認", hidden: true, onclick: doConfirm });
    ui.bar = h("div", { class: "pn-bar" }, ui.undo,ui.redo,ui.save, h("button", { type: "button", text: "プレビュー", onclick: doPreview }), h("button", { type: "button", text: "差分確認", onclick: doDiff }), h("button", { type: "button", text: "履歴", onclick: doHistory }), ui.confirm, ui.dirty);
    el.replaceChildren(h("div", { class: "pn-wrap" },h("div",{class:"pn-char-toolbar"},ui.charSearch,ui.charCount),ui.list,
      h("div", { class: "pn-body" }, ui.title, ui.note, ui.transfer, ui.recovery, ui.bar, ui.errs, ui.main, ui.pv)));
    if(keyListener)root.removeEventListener("keydown",keyListener);if(saveKeyListener)root.removeEventListener("keydown",saveKeyListener);
    keyListener=function(e){if(!(e.ctrlKey||e.metaKey)||e.altKey||S.pick)return;
      var target=e.target,tag=(target&&target.tagName||"").toLowerCase();if(["input","textarea","select"].includes(tag)||target&&target.isContentEditable)return;
      var k=e.key.toLowerCase();if(k==="z"||k==="y"){e.preventDefault();applyHistory(k==="z"&&!e.shiftKey);}};
    saveKeyListener=function(e){if(!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||e.key.toLowerCase()!=="s"||S.pick)return;e.preventDefault();if(S.cur&&ui.save&&!ui.save.disabled)doSave();};
    root.addEventListener("keydown",saveKeyListener);
    root.addEventListener("keydown",keyListener);return loadList();
  }
  function unmount(preserveHeld) {
    if(root && keyListener)root.removeEventListener("keydown",keyListener);keyListener=null;if(root&&saveKeyListener)root.removeEventListener("keydown",saveKeyListener);saveKeyListener=null;
    if(!preserveHeld) heldDraft=null;onSelected=null;transferStage=null;verifyIdentity=null;clearEditorState();activeIdentity=null;S.chars=[];S.charQuery="";
  }
  function status() { return { char:S.cur ? S.cur.id:null,stance:S.stance,dirty:!!S.dirty,busy:!!S.busy,locked:!!S.locked,
      conflict:!!S.conflict,syncPending:!!S.syncPending,blocked:!!(S.cur && S.cur.blocked),revision:S.cur?S.cur.revision:null }; }
  function refreshCurrent() { if (S.cur && !S.dirty && !S.busy && !S.locked && !S.conflict && !S.syncPending) return openChar(S.cur.id, "最新の保存状態を取得しました", true); return false; }
  window.PTAdminPunish = { mount: mount, unmount: unmount, suspendAuth:suspendAuth, discardHeld:discardHeld, status: status, refreshCurrent: refreshCurrent, _S: S };
})();
