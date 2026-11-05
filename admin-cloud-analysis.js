/* PROJECT T admin cloud analysis panel. Requires /api/v1/me admin check in admin.js. */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var root = null;
  function el(tag, text, cls) {
    var x = document.createElement(tag);
    if (text !== undefined && text !== null) x.textContent = String(text);
    if (cls) x.className = cls;
    return x;
  }
  function metric(label, value) {
    var x = el("div", null, "card");
    x.style.minWidth = "155px";
    x.style.flex = "1 1 160px";
    x.append(el("div", label, "muted"), el("div", value == null ? "—" : Number(value).toLocaleString("ja-JP")));
    x.lastChild.style.fontSize = "26px";
    x.lastChild.style.fontWeight = "700";
    return x;
  }
  async function refresh() {
    if (!root) return;
    var status = root.querySelector("[data-cloud-status]");
    var body = root.querySelector("[data-cloud-body]");
    status.textContent = "GitHubの解析レポートを取得しています…";
    body.replaceChildren();
    try {
      var r = await fetch(API + "/api/v1/admin/cloud-analysis", {
        method: "GET", credentials: "include", cache: "no-store", headers: { "Accept": "application/json" }
      });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        if (r.status === 401) throw new Error("ログインが必要です。管理者ページを再読み込みしてください。");
        if (r.status === 403) throw new Error("管理者権限がありません。");
        throw new Error(typeof data.detail === "string" ? data.detail : "APIエラー " + r.status);
      }
      status.textContent = "クラウド解析結果を読み込みました。未検証候補は確定情報ではありません。";
      var info = el("div", null, "card");
      var generated = data.generated_utc ? new Date(data.generated_utc).toLocaleString("ja-JP") : "不明";
      info.append(el("h2", "同期状況"), el("p", "解析日時: " + generated), el("p", "保存先: " + (data.source_repo || "—")), el("p", data.note || ""));
      var cards = el("div");
      cards.style.display = "flex";
      cards.style.flexWrap = "wrap";
      cards.style.gap = "10px";
      cards.append(
        metric("内部技数", data.moves_count),
        metric("Requirements ID", data.unique_ids),
        metric("未解明ID", data.unlabeled_ids),
        metric("分岐候補", data.rows_with_candidate_edges)
      );
      var section = el("div", null, "card");
      section.appendChild(el("h2", "優先調査ID"));
      var wrap = el("div", null, "tw");
      var table = el("table");
      var thead = el("thead"), trh = el("tr");
      ["ID", "元データ出現数", "関連技候補", "優先度"].forEach(function (x) { trh.appendChild(el("th", x)); });
      thead.appendChild(trh);
      var tbody = el("tbody");
      (data.top_unknown_ids || []).forEach(function (entry) {
        var tr = el("tr");
        [entry.id, entry.raw_occurrences, entry.candidate_moves, entry.priority_score].forEach(function (v) {
          tr.appendChild(el("td", v));
        });
        tbody.appendChild(tr);
      });
      table.append(thead, tbody);
      wrap.appendChild(table);
      section.appendChild(wrap);
      body.append(cards, info, section);
    } catch (err) {
      status.textContent = "取得できませんでした: " + err.message;
      status.setAttribute("role", "alert");
    }
  }
  function mount(node) {
    root = node;
    var heading = el("h2", "クラウド解析");
    var desc = el("p", "GitHubの非公開解析結果を表示します。技表の確定データは変更しません。", "muted");
    var button = el("button", "再読み込み", "btn primary");
    button.type = "button";
    button.addEventListener("click", refresh);
    var head = el("div", null, "card");
    head.append(heading, desc, button);
    var status = el("div", "未読み込み", "banner");
    status.dataset.cloudStatus = "1";
    var body = el("div");
    body.dataset.cloudBody = "1";
    node.replaceChildren(head, status, body);
  }
  window.PTAdminCloudAnalysis = { mount: mount, refresh: refresh };
})();
