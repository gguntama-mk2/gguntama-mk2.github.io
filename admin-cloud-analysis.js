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
  async function loadAllCharacters(body) {
    var section = el("div", null, "card");
    section.appendChild(el("h2", "全42キャラクター横断解析"));
    var status = el("p", "横断解析データを取得しています…", "muted");
    section.appendChild(status);
    body.appendChild(section);
    try {
      var r = await fetch(API + "/api/v1/admin/cloud-analysis/all-characters", {
        method: "GET", credentials: "include", cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "APIエラー " + r.status);
      status.textContent = "構造解析結果のみ。技の効果・条件・キャラクター同定は実機未検証です。";
      var metrics = el("div");
      metrics.style.display = "flex";
      metrics.style.flexWrap = "wrap";
      metrics.style.gap = "10px";
      metrics.append(
        metric("解析キャラクター", data.characters_found),
        metric("Requirements レコード", data.requirements_records_parsed_total),
        metric("Requirements ID", data.requirements_unique_ids_global),
        metric("全キャラ共通 ID", data.ids_in_all_analyzed_characters),
        metric("単一キャラ限定 ID", data.ids_in_exactly_one_character),
        metric("未解明・照合済み ID", data.bryan_unlabeled_found_in_overview)
      );
      section.appendChild(metrics);
      var scope = data.scope_counts_for_unlabeled || {};
      var summary = el("p", "未解明ID分布：全42キャラ " + (scope.all_42 ?? "—") +
        " / 4～41キャラ " + (scope.four_to_41 ?? "—") +
        " / 2～3キャラ " + (scope.two_or_three ?? "—") +
        " / 1キャラ " + (scope.one_character ?? "—"), "muted");
      section.appendChild(summary);
      var updated = data.generated_utc ? new Date(data.generated_utc).toLocaleString("ja-JP") : "不明";
      section.appendChild(el("p", "最新同期: " + updated, "muted"));
      section.appendChild(el("h3", "未解明 Requirements 調査候補（推定優先順位）"));
      var wrap = el("div", null, "tw");
      var table = el("table");
      var th = el("tr");
      ["ID", "対象キャラ数", "出現レコード数", "パラメータ種類", "調査スコア"].forEach(function (v) {
        th.appendChild(el("th", v));
      });
      var head = el("thead"); head.appendChild(th);
      var tbody = el("tbody");
      (Array.isArray(data.top_priority_ids) ? data.top_priority_ids : []).slice(0, 20).forEach(function (entry) {
        var tr = el("tr");
        ["req_id", "characters_present", "records_all_characters",
          "parameter_variants", "investigation_score_heuristic"].forEach(function (key) {
          tr.appendChild(el("td", entry[key] == null ? "—" : entry[key]));
        });
        tbody.appendChild(tr);
      });
      table.append(head, tbody);
      wrap.appendChild(table);
      section.appendChild(wrap);
    } catch (err) {
      status.textContent = "全キャラクター解析を取得できませんでした: " + err.message +
        "（既存のブライアン解析表示には影響しません）";
      status.setAttribute("role", "status");
    }
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
      await loadAllCharacters(body);
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
