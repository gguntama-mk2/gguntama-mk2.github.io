/* PROJECT T master-data adapter — TEST BRANCH ONLY
 *
 * Phase 1-6 compatibility layer:
 * - stable character/rank/stage IDs without removing existing display strings
 * - master API lookup/cache
 * - VS row augmentation
 * - future-facing move-table renderer
 *
 * This file is intentionally not referenced by production pc.html/sp.html yet.
 */
(function (global) {
  "use strict";

  function norm(s) {
    return String(s == null ? "" : s).trim().replace(/_/g, " ").replace(/\s+/g, " ").toUpperCase();
  }

  function apiBase() {
    var q = new URLSearchParams(location.search).get("api");
    if (q) return q.replace(/\/$/, "");
    if (location.hostname === "www.project-t-god.com") return "https://api.project-t-god.com";
    return "http://127.0.0.1:8001";
  }

  var state = {
    api: apiBase(),
    loaded: false,
    characters: [],
    ranks: [],
    stages: [],
    charByName: Object.create(null),
    charByWavu: Object.create(null),
    rankByName: Object.create(null),
    rankByWavu: Object.create(null),
    stageByWavu: Object.create(null)
  };

  async function get(path) {
    var r = await fetch(state.api + path, { credentials: "include" });
    var data = null;
    try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error((data && data.detail) || ("HTTP " + r.status));
    return data;
  }

  async function load() {
    var all = await Promise.all([
      get("/api/v1/master/characters"),
      get("/api/v1/master/ranks"),
      get("/api/v1/master/stages")
    ]);
    state.characters = all[0].characters || [];
    state.ranks = all[1].ranks || [];
    state.stages = all[2].stages || [];
    state.charByName = Object.create(null);
    state.charByWavu = Object.create(null);
    state.rankByName = Object.create(null);
    state.rankByWavu = Object.create(null);
    state.stageByWavu = Object.create(null);

    state.characters.forEach(function (c) {
      [c.display_name, c.name_ja, c.name_en].filter(Boolean).forEach(function (v) { state.charByName[norm(v)] = c; });
      if (c.wavu_id != null) state.charByWavu[String(c.wavu_id)] = c;
    });
    state.ranks.forEach(function (r) {
      [r.name_ja, r.name_en].filter(Boolean).forEach(function (v) { state.rankByName[norm(v)] = r; });
      if (r.wavu_id != null) state.rankByWavu[String(r.wavu_id)] = r;
    });
    state.stages.forEach(function (s) {
      if (s.wavu_id != null) state.stageByWavu[String(s.wavu_id)] = s;
    });
    state.loaded = true;
    return state;
  }

  function characterId(value, wavuId) {
    var row = wavuId != null ? state.charByWavu[String(wavuId)] : null;
    row = row || state.charByName[norm(value)];
    return row ? row.id : null;
  }

  function rankId(value, wavuId) {
    var row = wavuId != null ? state.rankByWavu[String(wavuId)] : null;
    row = row || state.rankByName[norm(value)];
    return row ? row.id : null;
  }

  function resolveVsRow(row) {
    var out = Object.assign({}, row);
    var w = Object.assign({}, row.wavu || {});
    out.player_character_id = row.player_character_id || characterId(row.player_character, row.player_character_wavu_id);
    out.opponent_character_id = row.opponent_character_id || characterId(row.opponent_character, row.opponent_character_wavu_id);
    out.player_rank_id = row.player_rank_id || rankId(row.player_rank, row.player_rank_wavu_id);
    out.opponent_rank_id = row.opponent_rank_id || rankId(row.opponent_rank, row.opponent_rank_wavu_id);
    if (!w.stage_stable_id && w.stage_id != null) {
      var s = state.stageByWavu[String(w.stage_id)];
      w.stage_stable_id = s ? s.id : ("wavu-stage-" + String(w.stage_id));
    }
    out.wavu = w;
    return out;
  }

  function cell(text) {
    var td = document.createElement("td");
    td.textContent = text == null ? "—" : String(text);
    return td;
  }

  async function renderMoves(characterIdValue, target, language) {
    language = language || "ja";
    var data = await get("/api/v1/master/characters/" + encodeURIComponent(characterIdValue) + "/moves?language=" + encodeURIComponent(language));
    target.replaceChildren();

    var info = document.createElement("div");
    info.className = "pt-master-move-meta";
    info.textContent = "stable ID: " + characterIdValue + " / parsed: " + data.parsed_move_count + " / checksheet: " + data.checksheet_move_count + " / status: " + data.status;
    target.appendChild(info);

    if (!data.moves.length) {
      var empty = document.createElement("p");
      empty.textContent = "実技データは未投入です。tkdata / .mvl / .motbin / Localization の検証済み抽出後、この同じAPI形式へ投入します。";
      target.appendChild(empty);
      return data;
    }

    var table = document.createElement("table");
    table.className = "pt-master-move-table";
    var head = document.createElement("tr");
    ["ID", "技名", "コマンド", "発生", "硬直", "ダメージ", "判定", "分類"].forEach(function (v) {
      var th = document.createElement("th"); th.textContent = v; head.appendChild(th);
    });
    var thead = document.createElement("thead"); thead.appendChild(head); table.appendChild(thead);
    var tbody = document.createElement("tbody");
    data.moves.forEach(function (m) {
      var tr = document.createElement("tr");
      [m.id, m.name, m.command, m.startup, m.recovery, m.damage, m.hit_level, m.category].forEach(function (v) { tr.appendChild(cell(v)); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    target.appendChild(table);
    return data;
  }

  global.PTMaster = {
    state: state,
    load: load,
    characterId: characterId,
    rankId: rankId,
    resolveVsRow: resolveVsRow,
    renderMoves: renderMoves,
    setApi: function (base) { state.api = String(base || "").replace(/\/$/, ""); state.loaded = false; }
  };
})(window);
