/* PROJECT T admin cloud analysis panel. Requires server-side admin authentication in admin.js. */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var root = null, panels = {}, openState = { sync: false, priority: true, cross: false, crossPriority: false };
  var requestId = 0, reloadButton = null, status = null;

  function el(tag, value, cls) {
    var node = document.createElement(tag);
    if (value !== undefined && value !== null) node.textContent = String(value);
    if (cls) node.className = cls;
    return node;
  }
  function fmt(value) {
    return value === null || value === undefined || value === "" ? "—" :
      Number.isFinite(Number(value)) ? Number(value).toLocaleString("ja-JP") : String(value);
  }
  function metric(label, value) {
    var item = el("div", null, "pt-cloud-metric");
    item.append(el("span", label, "pt-cloud-metric-label"), el("strong", fmt(value), "pt-cloud-metric-value"));
    return item;
  }
  function metrics(items) {
    var grid = el("div", null, "pt-cloud-metrics");
    items.forEach(function (item) { grid.appendChild(metric(item[0], item[1])); });
    return grid;
  }
  function textLine(message, cls) { return el("p", message, cls || "pt-cloud-note"); }
  function table(headers, rows) {
    if (!rows.length) return el("p", "現在、表示できる調査候補はありません。", "pt-cloud-empty");
    var frame = el("div", null, "tw pt-cloud-table-wrap");
    var tab = el("table", null, "pt-mobile-table pt-cloud-table");
    var head = el("thead"), trh = el("tr"), body = el("tbody");
    headers.forEach(function (name) { trh.appendChild(el("th", name)); });
    head.appendChild(trh);
    rows.forEach(function (values) {
      var tr = el("tr");
      values.forEach(function (value, i) {
        var td = el("td", value === undefined || value === null ? "—" : value);
        td.dataset.label = headers[i];
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    tab.append(head, body); frame.appendChild(tab);
    return frame;
  }
  function buildPanel(id, label, hint) {
    var details = el("details", null, "pt-cloud-section");
    details.dataset.cloudPanel = id;
    details.open = !!openState[id];
    var summary = el("summary", null, "pt-cloud-summary");
    var left = el("span", null, "pt-cloud-summary-main");
    left.append(el("strong", label, "pt-cloud-summary-title"), el("span", hint, "pt-cloud-summary-hint"));
    var right = el("span", null, "pt-cloud-summary-right");
    var count = el("span", "", "pt-cloud-count");
    count.hidden = true;
    right.append(count, el("span", "", "pt-cloud-chevron"));
    summary.append(left, right);
    var content = el("div", null, "pt-cloud-content");
    details.append(summary, content);
    details.addEventListener("toggle", function () { openState[id] = details.open; });
    panels[id] = { details: details, content: content, count: count };
    return details;
  }
  function setOpenAll(open) {
    Object.keys(panels).forEach(function (id) {
      openState[id] = open;
      panels[id].details.open = open;
    });
  }
  function updatePanel(id, children, countText) {
    var p = panels[id];
    if (!p) return;
    p.content.replaceChildren.apply(p.content, children);
    p.count.textContent = countText || "";
    p.count.hidden = !countText;
  }
  function showLoading() {
    Object.keys(panels).forEach(function (id) {
      updatePanel(id, [textLine("読み込み中…", "pt-cloud-loading")], "");
    });
  }
  async function getJson(path) {
    var res = await fetch(API + path, {
      method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" }
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      if (res.status === 401) throw new Error("ログインが必要です。管理者ページを再読み込みしてください。");
      if (res.status === 403) throw new Error("管理者権限がありません。");
      throw new Error(typeof data.detail === "string" ? data.detail : "APIエラー " + res.status);
    }
    return data;
  }
  async function loadBryan(seq) {
    try {
      var data = await getJson("/api/v1/admin/cloud-analysis");
      if (seq !== requestId) return false;
      var generated = data.generated_utc ? new Date(data.generated_utc).toLocaleString("ja-JP") : "不明";
      updatePanel("sync", [
        el("p", "解析日時：" + generated),
        el("p", "保存先：" + (data.source_repo || "—")),
        data.note ? textLine(data.note) : null,
        metrics([
          ["内部技数", data.moves_count],
          ["Requirements ID", data.unique_ids],
          ["未解明ID", data.unlabeled_ids],
          ["分岐候補", data.rows_with_candidate_edges]
        ])
      ].filter(Boolean), "更新済み");
      var priority = Array.isArray(data.top_unknown_ids) ? data.top_unknown_ids : [];
      updatePanel("priority", [
        textLine("ブライアン解析で見つかった未解明IDの優先調査候補です。推定結果は確定情報ではありません。"),
        table(["ID", "元データ出現数", "関連技候補", "優先度"], priority.map(function (entry) {
          return [entry.id, entry.raw_occurrences, entry.candidate_moves, entry.priority_score];
        }))
      ], priority.length + "件");
      return true;
    } catch (err) {
      if (seq !== requestId) return false;
      updatePanel("sync", [textLine("同期状況を取得できませんでした：" + err.message, "pt-cloud-error")], "取得失敗");
      updatePanel("priority", [textLine("優先調査IDを取得できませんでした：" + err.message, "pt-cloud-error")], "取得失敗");
      return false;
    }
  }
  async function loadCross(seq) {
    try {
      var data = await getJson("/api/v1/admin/cloud-analysis/all-characters");
      if (seq !== requestId) return false;
      var count = data.characters_found;
      var scope = data.scope_counts_for_unlabeled || {};
      var updated = data.generated_utc ? new Date(data.generated_utc).toLocaleString("ja-JP") : "不明";
      updatePanel("cross", [
        textLine("構造解析結果のみ。技の効果・条件・キャラクター同定は実機未検証です。"),
        metrics([
          ["解析キャラクター", count],
          ["Requirements レコード", data.requirements_records_parsed_total],
          ["Requirements ID", data.requirements_unique_ids_global],
          ["全キャラ共通 ID", data.ids_in_all_analyzed_characters],
          ["単一キャラ限定 ID", data.ids_in_exactly_one_character],
          ["未解明・照合済み ID", data.bryan_unlabeled_found_in_overview]
        ]),
        textLine("未解明ID分布：全解析キャラ " + fmt(scope.all_42) +
          " ／ 4～41キャラ " + fmt(scope.four_to_41) +
          " ／ 2～3キャラ " + fmt(scope.two_or_three) +
          " ／ 1キャラ " + fmt(scope.one_character)),
        textLine("最新同期：" + updated)
      ], count == null ? "集計" : fmt(count) + "キャラ");
      var priority = Array.isArray(data.top_priority_ids) ? data.top_priority_ids.slice(0, 20) : [];
      updatePanel("crossPriority", [
        textLine("複数キャラクターにまたがる未解明Requirementsの調査候補です。優先順位は推定値です。"),
        table(["ID", "対象キャラ数", "出現レコード数", "パラメータ種類", "調査スコア"],
          priority.map(function (entry) {
            return [entry.req_id, entry.characters_present, entry.records_all_characters,
              entry.parameter_variants, entry.investigation_score_heuristic];
          }))
      ], priority.length + "件");
      return true;
    } catch (err) {
      if (seq !== requestId) return false;
      updatePanel("cross", [textLine("全キャラクター横断解析を取得できませんでした：" + err.message, "pt-cloud-error")], "取得失敗");
      updatePanel("crossPriority", [textLine("横断調査候補を取得できませんでした：" + err.message, "pt-cloud-error")], "取得失敗");
      return false;
    }
  }
  async function refresh() {
    if (!root) return;
    var seq = ++requestId;
    reloadButton.disabled = true;
    status.textContent = "クラウド解析結果を読み込んでいます…";
    status.className = "banner";
    showLoading();
    var results = await Promise.all([loadBryan(seq), loadCross(seq)]);
    if (seq !== requestId) return;
    reloadButton.disabled = false;
    if (results.every(Boolean)) {
      status.textContent = "読み込み完了。未検証の候補は確定情報ではありません。";
    } else if (results.some(Boolean)) {
      status.textContent = "一部の解析結果を取得できませんでした。ほかの結果は表示できます。";
      status.className = "banner warn";
    } else {
      status.textContent = "解析結果を取得できませんでした。再読み込みしてください。";
      status.className = "banner err";
    }
  }
  function mount(node) {
    root = node; panels = {}; requestId++;
    var head = el("div", null, "card pt-cloud-header");
    var heading = el("h2", "クラウド解析");
    var desc = textLine("解析項目をタップして開閉できます。技表の確定データは変更しません。");
    var controls = el("div", null, "pt-cloud-controls");
    var expand = el("button", "すべて開く", "btn");
    var collapse = el("button", "すべて閉じる", "btn");
    reloadButton = el("button", "再読み込み", "btn primary");
    [expand, collapse, reloadButton].forEach(function (b) { b.type = "button"; });
    expand.addEventListener("click", function () { setOpenAll(true); });
    collapse.addEventListener("click", function () { setOpenAll(false); });
    reloadButton.addEventListener("click", refresh);
    controls.append(expand, collapse, reloadButton);
    head.append(heading, desc, controls);
    status = el("div", "未読み込み", "banner");
    status.dataset.cloudStatus = "1";
    var body = el("div", null, "pt-cloud-sections");
    body.dataset.cloudBody = "1";
    body.append(
      buildPanel("sync", "同期状況", "解析日時・保存先・基本指標"),
      buildPanel("priority", "優先調査ID", "ブライアンの未解明ID候補"),
      buildPanel("cross", "全キャラクター横断解析", "キャラクター横断の構造解析・集計"),
      buildPanel("crossPriority", "横断解析の優先調査ID", "未解明Requirements調査候補")
    );
    node.replaceChildren(head, status, body);
  }
  window.PTAdminCloudAnalysis = Object.freeze({ mount: mount, refresh: refresh });
})();
