
/*PTLOGINJS-START*/
(function () {
  const host = document.getElementById("lgHost");
  if (!host) return;
  if (!host.attachShadow) { host.textContent = "このブラウザではログインページを表示できません。"; return; }
  const root = host.attachShadow({ mode: "open" });
  /* サービスのアイコン：お客様（持ち主）から受け取った画像をそのまま小さくして埋め込み。PT は PROJECT T 用の自作アイコン（Dela Gothic One の P・T） */
  const ICON = { discord: "assets/media/d8604e6d9fe44f1718e5.png", google: "assets/media/fac1d8c1830f43cea5e7.png", youtube: "assets/media/169172c8b6896d98587e.png", pt: "assets/media/6bb65df10133812ba720.svg" };
  const CSS = `
:host{display:block;color:var(--text);font-family:inherit}*{box-sizing:border-box}[hidden]{display:none!important}button,input{font:inherit;color:inherit}button:focus-visible,a:focus-visible{outline:2px solid var(--ok);outline-offset:2px}
.wrap{max-width:1100px;margin:0 auto}.grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(18rem,.75fr);gap:12px}.card{margin:0 0 12px;border:2px solid var(--pop-edge,var(--line));border-radius:22px;background:var(--panel);box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5));overflow:hidden}.hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 15px;border-bottom:1px solid var(--line)}.hd h2{margin:0;font-size:.95rem}.bd{padding:14px 15px}.eyebrow{color:var(--sub);font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero{font-size:1.05rem;font-weight:800;margin:2px 0 5px}.sub{color:var(--sub);font-size:.8rem;line-height:1.75;margin:0}.status{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border:1px solid var(--line);border-radius:99px;color:var(--sub);font-size:.72rem;font-weight:800}.status.ok{border-color:var(--ok);color:var(--ok);background:color-mix(in srgb,var(--ok) 8%,transparent)}.dot{width:7px;height:7px;border-radius:50%;background:currentColor}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:7px 14px;border:2px solid var(--pop-edge,var(--line));border-radius:999px;background:var(--panel);color:var(--text);font-weight:800;font-size:.78rem;text-decoration:none;cursor:pointer;box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5));transition:transform .2s ease,box-shadow .2s ease,border-color .15s}.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5));border-color:var(--accent)}.btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 var(--pop-shadow,rgba(0,0,0,.5))}.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on)}.btn.danger{border-color:var(--danger);color:var(--danger)}.btn:disabled{opacity:.42;cursor:not-allowed}.providers{display:grid;gap:8px}.provider{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid var(--line);border-radius:14px;background:var(--panel2,var(--bg))}.ico{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--line);border-radius:12px;background:var(--panel);font-size:.72rem;font-weight:900;letter-spacing:.04em}.provider b{display:block;font-size:.85rem}.provider small{display:block;color:var(--sub);font-size:.7rem;line-height:1.5;overflow-wrap:anywhere}.pact{display:flex;gap:6px;align-items:center}.mini{min-height:31px;padding:5px 10px;font-size:.7rem}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fact{padding:9px 11px;border:1px solid var(--line);border-radius:14px;background:var(--panel2,var(--bg));min-width:0}.fact .k{display:block;color:var(--sub);font-size:.67rem;font-weight:700}.fact .v{display:block;margin-top:2px;font-size:.8rem;font-weight:800;overflow-wrap:anywhere}.notice{padding:10px 12px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;background:var(--accent-soft);font-size:.75rem;line-height:1.7}.notice b{color:var(--text)}.list{margin:0;padding-left:1.25rem;color:var(--sub);font-size:.77rem;line-height:1.8}.list b{color:var(--text)}.links{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.links a{color:var(--accent);font-size:.73rem;font-weight:700;text-underline-offset:3px}.error{color:var(--danger);font-size:.75rem;line-height:1.7}.error.info{color:var(--sub)}.loading{color:var(--sub);font-size:.8rem}.config{margin-top:10px;padding:9px 11px;border:1px dashed var(--line);border-radius:10px;color:var(--sub);font-size:.7rem;line-height:1.6;overflow-wrap:anywhere}
@media(max-width:760px){.grid{grid-template-columns:1fr}.hd{flex-wrap:wrap}.hd .status{margin-left:auto;white-space:nowrap}.provider{grid-template-columns:42px minmax(0,1fr)}.pact{grid-column:1/-1;justify-content:flex-end}.facts{grid-template-columns:1fr}.btn{min-height:42px}}
.hd .brand{display:flex;align-items:center;gap:11px;min-width:0}.ptmark{width:42px;height:42px;flex:none;border-radius:10px;border:1px solid var(--line);display:block}.bi{width:22px;height:22px;object-fit:contain;flex:none;display:block;margin-right:9px}.bi.yt{width:30px;height:21px;margin-right:8px}.mini .bi{width:18px;height:18px;margin-right:6px}.mini .bi.yt{width:24px;height:17px}.ico img{width:28px;height:28px;object-fit:contain;display:block}.ico img.yt{width:32px;height:22px}
.delbox .dellab{display:block;margin-top:10px}.delbox input{width:100%;margin:6px 0 10px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--panel2,rgba(0,0,0,.25));color:inherit}.delrow{display:flex;gap:8px;flex-wrap:wrap}.tidrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}.tidrow input{flex:1 1 13rem;min-width:0;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--panel2,rgba(0,0,0,.25));color:inherit;letter-spacing:.04em}.tidlab{display:block;margin-top:12px;font-size:.75rem;font-weight:700}.tidhint{margin:10px 0 0}.tidbox{margin-top:12px}.btn:disabled{opacity:.45;cursor:not-allowed}
@media(prefers-reduced-motion:reduce){.btn{transition:none!important;transform:none!important}}
`;
  root.innerHTML = `<style>${CSS}</style><div class="wrap">
    <div class="grid">
      <div>
        <section class="card">
          <div class="hd"><div class="brand"><img class="ptmark" id="lg-ptmark" alt="PROJECT T" width="42" height="42"><div><div class="eyebrow">PROJECT T ACCOUNT</div><h2>ログイン / アカウント連携</h2></div></div><span class="status" id="lg-status"><i class="dot"></i><span>確認中</span></span></div>
          <div class="bd">
            <div class="hero" id="lg-title">PROJECT Tへログイン</div>
            <p class="sub" id="lg-desc">DiscordまたはGoogleを使ってPROJECT Tアカウントを作成・ログインできます。ログイン後、YouTubeなどを同じPROJECT T IDへ追加で連携できます。</p>
            <div class="actions" id="lg-login-actions">
              <a class="btn primary" id="login-discord" href="#"><img class="bi" data-ic="discord" alt="">Discordでログイン</a>
              <a class="btn primary" id="login-google" href="#"><img class="bi" data-ic="google" alt="">Googleでログイン</a>
            </div>
            <div class="actions" id="lg-session-actions" hidden><button class="btn danger" id="lg-logout">ログアウト</button><button class="btn" id="lg-delete-open" type="button">アカウントとデータを削除</button></div><div class="notice delbox" id="lg-del-box" hidden style="margin-top:12px"><b>PROJECT Tのアカウントと、保存されているデータをすべて削除します。</b><br>削除されるもの：Discord・Google・YouTubeの連携情報、対戦履歴とメモ、登録したTEKKEN IDと照合に使った公開対戦データ、接続した録画アプリ（Recorder）の登録、フィードバック。YouTubeに投稿済みの動画は削除されません。この操作は取り消せません。<label class="dellab" for="lg-del-input">続けるには、下の欄に「削除」と入力してください。</label><input id="lg-del-input" type="text" autocomplete="off" aria-label="確認のため、削除と入力"><div class="delrow"><button class="btn" id="lg-del-cancel" type="button">キャンセル</button><button class="btn danger" id="lg-del-go" type="button" disabled>完全に削除する</button></div></div><div class="facts" id="lg-user-facts" hidden style="margin-top:12px">
              <div class="fact"><span class="k">PROJECT T ID</span><span class="v" id="lg-project-id">—</span></div>
              <div class="fact"><span class="k">表示名</span><span class="v" id="lg-display-name">—</span></div>
              <div class="fact"><span class="k">ログイン状態</span><span class="v" id="lg-session">—</span></div>
              <div class="fact"><span class="k">メール</span><span class="v" id="lg-email">—</span></div>
              <div class="fact"><span class="k">Recorder</span><span class="v" id="lg-devices">—</span></div>
            </div>
          </div>
        </section>
        <section class="card">
          <div class="hd"><h2>連携サービス</h2><span class="status" id="link-count"><i class="dot"></i><span>0 connected</span></span></div>
          <div class="bd"><div class="providers">
            <div class="provider"><div class="ico"><img data-ic="discord" alt=""></div><div><b>Discord</b><small id="discord-info">未連携</small></div><div class="pact"><a class="btn mini" id="discord-connect" href="#"><img class="bi" data-ic="discord" alt="">連携</a><button class="btn mini danger" id="discord-disconnect" hidden>解除</button></div></div>
            <div class="provider"><div class="ico"><img data-ic="google" alt=""></div><div><b>Google</b><small id="google-info">未連携</small></div><div class="pact"><a class="btn mini" id="google-connect" href="#"><img class="bi" data-ic="google" alt="">連携</a><button class="btn mini danger" id="google-disconnect" hidden>解除</button></div></div>
            <div class="provider"><div class="ico"><img class="yt" data-ic="youtube" alt=""></div><div><b>YouTube</b><small id="youtube-info">未連携</small></div><div class="pact"><a class="btn mini" id="youtube-connect" href="#"><img class="bi yt" data-ic="youtube" alt="">YouTubeを連携</a><button class="btn mini danger" id="youtube-disconnect" hidden>解除</button></div></div>
          </div></div>
        </section>
        <section class="card" id="lg-tid-card" hidden>
          <div class="hd"><h2>TEKKEN ID（対戦データの照合）</h2><span class="status" id="lg-tid-status"><i class="dot"></i><span>未登録</span></span></div>
          <div class="bd">
            <p class="sub">TEKKEN IDを登録すると、公開されているランクマッチの対戦データと、PROJECT Tの対戦履歴を照合します。キャラクター名・段位・勝敗・対戦相手の名前の読み取りミスが、自動で直ります。登録は任意で、登録しなくてもPROJECT Tは使えます。</p>
            <div class="facts" id="lg-tid-facts" hidden style="margin-top:12px">
              <div class="fact"><span class="k">登録中のTEKKEN ID</span><span class="v" id="lg-tid-id">—</span></div>
              <div class="fact"><span class="k">状態</span><span class="v" id="lg-tid-state">—</span></div>
              <div class="fact"><span class="k">照合できた試合</span><span class="v" id="lg-tid-matched">—</span></div>
              <div class="fact"><span class="k">照合を待っている試合</span><span class="v" id="lg-tid-pending">—</span></div>
            </div>
            <p class="sub tidhint" id="lg-tid-hint" hidden></p>
            <div id="lg-tid-formbox" hidden>
              <label class="tidlab" for="lg-tid-input">TEKKEN ID（ゲーム内のプロフィールに表示される、英数字のIDです）</label>
              <div class="tidrow"><input id="lg-tid-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="48" placeholder="例：AbCd1234EfGh"><button class="btn primary" id="lg-tid-save" type="button">登録する</button><button class="btn" id="lg-tid-cancel" type="button" hidden>キャンセル</button></div>
              <p class="sub tidhint">ふつうは12文字です。大文字・小文字は、ゲームの表示どおりに入力してください（空白やハイフンは自動で取り除きます）。</p>
            </div>
            <div class="actions" id="lg-tid-actions" hidden><button class="btn" id="lg-tid-edit" type="button">IDを変更する</button><button class="btn danger" id="lg-tid-remove" type="button">登録を解除する</button></div>
            <div class="notice tidbox" id="lg-tid-rm-box" hidden><b>TEKKEN IDの登録を解除します。</b><br>登録したIDと、照合に使った結果・公開対戦データが、PROJECT Tから削除されます。PROJECT Tの対戦履歴そのものは消えません（読み取った値のままになります）。<div class="delrow" style="margin-top:10px"><button class="btn" id="lg-tid-rm-cancel" type="button">キャンセル</button><button class="btn danger" id="lg-tid-rm-go" type="button">解除する</button></div></div>
            <p class="error info tidhint" id="lg-tid-msg" hidden></p>
            <div class="notice tidbox"><b>照合の対象は、ランクマッチです。</b><br>クイックマッチやグループマッチは、公開データに記録がないため対象外です。PROJECT Tは、あなたのIDを外部へ送りません（公開されている最新の対戦データを取得して、PROJECT T側で照合します）。くわしくは<a href="#privacy" data-local-go="privacy" style="color:var(--accent)">プライバシーポリシー</a>をご覧ください。</div>
          </div>
        </section>
      </div>
      <aside>
        <section class="card"><div class="hd"><h2>連携の仕組み</h2></div><div class="bd"><div class="notice"><b>外部サービスのパスワードはPROJECT Tへ入力しません。</b><br>Discord / Google / YouTubeの公式OAuth認証画面で許可した範囲だけを連携します。</div><ul class="list"><li>PROJECT T内部IDを中心に各サービスを紐付けます。</li><li>メールアドレスが同じという理由だけでアカウントを自動統合しません。</li><li>YouTubeの動画投稿権限は、Googleログインとは分けて必要時に追加します。</li><li>不要になった連携はこのページから解除できる設計です。</li></ul><div class="links"><a href="#privacy" data-local-go="privacy">プライバシーポリシー</a><a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Googleの第三者アクセス管理</a></div></div></section>
        <section class="card"><div class="hd"><h2>ログイン機能について</h2></div><div class="bd"><p class="sub">ログインの処理は、PROJECT Tの認証サーバーで安全に行います。このページ（HTML）には、パスワードやシークレットは保存されません。</p><div class="config" id="lg-api-config"></div><p class="error" id="lg-error" hidden></p></div></section>
      </aside>
    </div>
  </div>`;

  const $ = id => root.getElementById(id);
  root.querySelectorAll("img[data-ic]").forEach(i=>{i.src=ICON[i.dataset.ic]});root.getElementById("lg-ptmark").src=ICON.pt;
  const siteLoginUrl = location.href.split('#')[0] + '#login';
  // ログイン状態が分かったら、VS ページなどに知らせる（自分の対戦履歴を読み込み直すため）
  function authChanged(){try{window.dispatchEvent(new Event('projectt:auth-changed'))}catch(_){}}
  function apiBase(){
    const explicit = typeof window.PROJECT_T_AUTH_API_BASE === 'string' ? window.PROJECT_T_AUTH_API_BASE.trim() : '';
    if (explicit) return explicit.replace(/\/$/,'');
    try { const saved = localStorage.getItem('project-t-auth-api-base'); if(saved) return saved.replace(/\/$/,''); } catch(_){}
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') return 'http://localhost:8000';
    return '';
  }
  function authUrl(path, mode){
    const base=apiBase(); if(!base) return '#';
    const u=new URL(base+path); if(mode) u.searchParams.set('mode',mode); u.searchParams.set('return_to',siteLoginUrl); return u.toString();
  }
  function setError(msg,info){const el=$('lg-error');el.hidden=!msg;el.classList.toggle('info',!!info);el.textContent=msg||''}
  function linkState(prefix, data, signedIn){
    const connected=!!data;
    $(prefix+'-connect').hidden=connected || !signedIn;
    $(prefix+'-disconnect').hidden=!connected || !signedIn;
    if(prefix==='discord') $('discord-info').textContent=connected ? (data.username || data.display_name || '接続済み') : '未連携';
    if(prefix==='google') $('google-info').textContent=connected ? (data.email || data.username || '接続済み') : '未連携';
  }
  async function post(path){
    const base=apiBase(); if(!base) return;
    const me=window.__PROJECT_T_ME||{};
    const res=await fetch(base+path,{method:'POST',credentials:'include',headers:{'X-CSRF-Token':me.csrf_token||''}});
    if(!res.ok){throw new Error((await res.text()).slice(0,300)||('HTTP '+res.status));}
    await refresh();
  }
  function linkErrorFromUrl(){
    try{
      const q=new URLSearchParams(location.search); const code=q.get('pt_error'); if(!code) return '';
      const name={discord:'Discord',google:'Google',youtube:'YouTube'}[q.get('pt_provider')]||'外部サービス';
      q.delete('pt_error'); q.delete('pt_provider'); const rest=q.toString();
      history.replaceState(null,'',location.pathname+(rest?('?'+rest):'')+location.hash);
      if(code==='already_linked') return name+'のアカウントは、すでに別のPROJECT Tアカウントに連携されています。いまログインしているアカウントには連携できません。そのアカウントで入りたいときは、いったんログアウトして、'+name+'でログインしてください。';
      if(code==='different_account') return 'いまのアカウントには、すでに別の'+name+'アカウントが連携されています。先に、いまの連携を解除してください。';
      return '連携できませんでした（'+code+'）。';
    }catch(_){return ''}
  }

  /* ---- TEKKEN ID（公開対戦データとの照合）。古いサーバー（API が無い）では、このカードは出さない ---- */
  const tid = { state: null, editing: false };
  function tidNormalize(v){ const t=String(v||'').normalize('NFKC').replace(/[\s\-_]/g,''); return /^[A-Za-z0-9]{6,32}$/.test(t) ? t : null; }
  function tidMsg(msg, info){ const e=$('lg-tid-msg'); e.hidden=!msg; e.classList.toggle('info',!!info); e.textContent=msg||''; }
  function tidFetch(path, method, body){
    const base=apiBase(); const me=window.__PROJECT_T_ME||{};
    const o={method,credentials:'include',headers:{'Accept':'application/json'}};
    if(method!=='GET') o.headers['X-CSRF-Token']=me.csrf_token||'';
    if(body){ o.headers['Content-Type']='application/json'; o.body=JSON.stringify(body); }
    return fetch(base+path,o);
  }
  function tidWhy(res){
    if(res.status===401) return 'ログインの有効期限が切れました。もう一度ログインしてください。';
    if(res.status===403) return '操作を確認できませんでした。ページを開き直してから、もう一度お試しください。';
    if(res.status===400) return 'TEKKEN IDの形式が正しくありません。英数字6〜32文字で入力してください。';
    return 'サーバーのエラーです（HTTP '+res.status+'）。しばらくしてから、もう一度お試しください。';
  }
  function tidRender(){
    const s=tid.state, card=$('lg-tid-card');
    if(!s){ card.hidden=true; return; }
    card.hidden=false;
    const reg=!!s.registered, active=reg && s.status==='active', m=s.matches||{};
    let label='未登録', ok=false;
    if(reg && s.wavu_enabled===false) label='停止中';
    else if(active){ label='対戦データ確認済み'; ok=true; }
    else if(reg) label='確認待ち';
    $('lg-tid-status').classList.toggle('ok',ok); $('lg-tid-status').querySelector('span').textContent=label;
    $('lg-tid-facts').hidden=!reg;
    $('lg-tid-id').textContent=reg ? (s.tekken_id||'—') : '—';
    $('lg-tid-state').textContent=label;
    $('lg-tid-matched').textContent=String(m.matched||0)+' 試合';
    $('lg-tid-pending').textContent=String(m.pending||0)+' 試合';
    const hint=$('lg-tid-hint'); let h='';
    if(reg && s.wavu_enabled===false) h='照合の機能は、いまサーバー側で停止しています。登録したIDはそのまま保管され、再開すると使われます。';
    else if(active) h='公開対戦データで、このIDの試合を確認できました。ランクマッチの記録は、自動で照合されます。';
    else if(reg) h='まだ、公開対戦データにこのIDの試合が見つかっていません。ランクマッチを1試合遊ぶと、数分〜十数分ほどで確認できます。いつまでも「確認待ち」のときは、IDが合っているか（大文字・小文字も）を確かめてください。';
    if(reg && s.service && s.service.last_error && s.wavu_enabled!==false) h+=(h?'　':'')+'（対戦データの取得が一時的にできていません。しばらくすると自動で再開します。）';
    hint.hidden=!h; hint.textContent=h;
    const showForm=!reg || tid.editing;
    $('lg-tid-formbox').hidden=!showForm;
    $('lg-tid-save').textContent=reg ? '変更を保存する' : '登録する';
    $('lg-tid-cancel').hidden=!reg;
    $('lg-tid-actions').hidden=!reg || tid.editing || !$('lg-tid-rm-box').hidden;
  }
  async function tidLoad(){
    tid.editing=false; $('lg-tid-rm-box').hidden=true; tidMsg('');
    try{
      const res=await tidFetch('/api/v1/me/tekken-id','GET');
      const j=res.ok ? await res.json() : null;
      tid.state=(j && typeof j==='object' && 'registered' in j) ? j : null;
    }catch(_){ tid.state=null; }
    tidRender();
  }
  async function tidSave(){
    const id=tidNormalize($('lg-tid-input').value);
    if(!id){ tidMsg('TEKKEN IDは、英数字6〜32文字で入力してください（ふつうは12文字です。空白やハイフンは自動で取り除きます）。'); return; }
    const was=tid.state&&tid.state.registered;
    $('lg-tid-save').disabled=true; tidMsg('');
    try{
      const res=await tidFetch('/api/v1/me/tekken-id','POST',{tekken_id:id});
      if(!res.ok){ tidMsg('登録できませんでした：'+tidWhy(res)); return; }
      tid.state=await res.json(); tid.editing=false; $('lg-tid-input').value='';
      tidRender(); tidMsg(was ? 'TEKKEN IDを変更しました。前のIDで照合した結果は、削除されました。' : 'TEKKEN IDを登録しました。ランクマッチを遊ぶと、公開対戦データと照合されます。', true);
    }catch(e){ tidMsg('登録できませんでした：サーバーに接続できません。'); }
    finally{ $('lg-tid-save').disabled=false; }
  }
  async function tidRemove(){
    $('lg-tid-rm-go').disabled=true; tidMsg('');
    try{
      const res=await tidFetch('/api/v1/me/tekken-id/delete','POST');
      if(!res.ok){ tidMsg('解除できませんでした：'+tidWhy(res)); return; }
      tid.state=await res.json(); tid.editing=false; $('lg-tid-rm-box').hidden=true;
      tidRender(); tidMsg('TEKKEN IDの登録を解除し、照合のデータを削除しました。', true);
    }catch(e){ tidMsg('解除できませんでした：サーバーに接続できません。'); }
    finally{ $('lg-tid-rm-go').disabled=false; }
  }
  $('lg-tid-save').addEventListener('click',tidSave);
  $('lg-tid-input').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); tidSave(); } });
  $('lg-tid-edit').addEventListener('click',()=>{ tid.editing=true; tidMsg(''); $('lg-tid-input').value=(tid.state&&tid.state.tekken_id)||''; tidRender(); $('lg-tid-input').focus(); });
  $('lg-tid-cancel').addEventListener('click',()=>{ tid.editing=false; $('lg-tid-input').value=''; tidMsg(''); tidRender(); });
  $('lg-tid-remove').addEventListener('click',()=>{ tidMsg(''); $('lg-tid-rm-box').hidden=false; tidRender(); });
  $('lg-tid-rm-cancel').addEventListener('click',()=>{ $('lg-tid-rm-box').hidden=true; tidRender(); });
  $('lg-tid-rm-go').addEventListener('click',tidRemove);
  async function refresh(){
    const base=apiBase(); const linkErr=linkErrorFromUrl();
    const dev=(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
    $('lg-api-config').hidden=!(base&&dev); $('lg-api-config').textContent=(base&&dev)?('開発用の接続先: '+base):'';
    if(!base) try{console.info('[PROJECT T] 認証APIが未設定です。window.PROJECT_T_AUTH_API_BASE（HTMLの先頭付近）にHTTPSのAPI URLを設定すると、ログインが有効になります。')}catch(_){}
    $('login-discord').href=authUrl('/auth/discord/start','login');
    $('login-google').href=authUrl('/auth/google/start','login');
    $('discord-connect').href=authUrl('/auth/discord/start','link');
    $('google-connect').href=authUrl('/auth/google/start','link');
    $('youtube-connect').href=authUrl('/auth/youtube/start','link');
    ['login-discord','login-google','discord-connect','google-connect','youtube-connect'].forEach(id=>{$(id).style.pointerEvents=base?'':'none';$(id).style.opacity=base?'':'0.45'});
    if(!base){ $('lg-status').querySelector('span').textContent='準備中'; $('youtube-info').textContent='ログイン機能の公開後に連携できます'; setError('ログイン機能は現在準備中です。公開され次第、このページからDiscord・Googleでログインできるようになります。',true); return; }
    try{
      setError(''); const res=await fetch(base+'/api/v1/me',{credentials:'include',headers:{'Accept':'application/json'}});
      if(res.status===401){
        window.__PROJECT_T_ME=null; authChanged(); $('lg-status').classList.remove('ok'); $('lg-status').querySelector('span').textContent='未ログイン'; $('lg-title').textContent='PROJECT Tへログイン'; $('lg-login-actions').hidden=false; $('lg-session-actions').hidden=true; $('lg-user-facts').hidden=true; $('lg-del-box').hidden=true; tid.state=null; tid.editing=false; tidRender();
        if(linkErr) setError(linkErr);
        linkState('discord',null,false);linkState('google',null,false);$('youtube-connect').hidden=true;$('youtube-disconnect').hidden=true;$('youtube-info').textContent='PROJECT Tログイン後に連携できます';$('link-count').querySelector('span').textContent='0 connected';return;
      }
      if(!res.ok) throw new Error('認証API: HTTP '+res.status);
      if(linkErr) setError(linkErr);
      const me=await res.json(); window.__PROJECT_T_ME=me; authChanged(); const links=me.links||{};
      $('lg-status').classList.add('ok'); $('lg-status').querySelector('span').textContent='ログイン中'; $('lg-title').textContent=(me.display_name||'PROJECT T User')+' としてログイン中'; $('lg-login-actions').hidden=true; $('lg-session-actions').hidden=false; $('lg-user-facts').hidden=false;
      $('lg-project-id').textContent=me.project_t_id||'—'; $('lg-display-name').textContent=me.display_name||'—'; $('lg-session').textContent='Active'; $('lg-email').textContent=me.primary_email||'未設定'; $('lg-devices').textContent=String(me.device_count||0)+' device(s)';
      linkState('discord',links.discord,true); linkState('google',links.google,true);
      const yt=links.youtube||null; $('youtube-info').textContent=yt ? ((yt.channel_title||'YouTube')+(yt.channel_id?' / '+yt.channel_id:'')) : '未連携'; $('youtube-connect').hidden=!!yt; $('youtube-disconnect').hidden=!yt;
      tidLoad();
      const n=[links.discord,links.google,links.youtube].filter(Boolean).length; $('link-count').classList.toggle('ok',n>0); $('link-count').querySelector('span').textContent=n+' connected';
    }catch(e){setError(dev?('ログイン状態を取得できません: '+e.message+'（認証サーバーを起動しているか確認してください）'):'認証サーバーに接続できません。しばらくしてから、もう一度お試しください。');$('lg-status').querySelector('span').textContent='接続できません';}
  }
  $('lg-logout').addEventListener('click',()=>post('/api/v1/logout').catch(e=>setError(e.message)));
  const delBox=$('lg-del-box'),delIn=$('lg-del-input'),delGo=$('lg-del-go');
  $('lg-delete-open').addEventListener('click',()=>{delBox.hidden=false;delIn.value='';delGo.disabled=true;delIn.focus()});
  $('lg-del-cancel').addEventListener('click',()=>{delBox.hidden=true;delIn.value=''});
  delIn.addEventListener('input',()=>{delGo.disabled=delIn.value.trim()!=='削除'});
  delGo.addEventListener('click',async()=>{
    const base=apiBase(); if(!base) return;
    delGo.disabled=true;
    try{
      const me=window.__PROJECT_T_ME||{};
      const res=await fetch(base+'/api/v1/account/delete',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-CSRF-Token':me.csrf_token||''},body:JSON.stringify({confirm:'DELETE'})});
      if(!res.ok){throw new Error((await res.text()).slice(0,300)||('HTTP '+res.status));}
      delBox.hidden=true;delIn.value='';window.__PROJECT_T_ME=null;await refresh();
      setError('PROJECT Tのアカウントと、保存されていたデータを削除しました。',true);
    }catch(e){setError('削除できませんでした：'+e.message);delGo.disabled=false}
  });
  $('discord-disconnect').addEventListener('click',()=>post('/api/v1/account/discord/disconnect').catch(e=>setError(e.message)));
  $('google-disconnect').addEventListener('click',()=>post('/api/v1/account/google/disconnect').catch(e=>setError(e.message)));
  $('youtube-disconnect').addEventListener('click',()=>post('/api/v1/account/youtube/disconnect').catch(e=>setError(e.message)));
  root.addEventListener('click',e=>{const a=e.target.closest('[data-local-go]');if(a&&window.setPage){e.preventDefault();window.setPage(a.dataset.localGo)}});
  window.LG={show:refresh,hide:()=>{},refresh};
})();
/*PTLOGINJS-END*/
