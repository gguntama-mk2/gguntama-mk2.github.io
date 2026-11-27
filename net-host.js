/* Current admin tab, gated by the host NET session endpoint. */
(function(g){'use strict';
  let root,me,apiBase="",enabled=false,active=false,pending=false,identity=null;
  function allowed(){return enabled;}
  async function session(){
    const r=await fetch(apiBase+'/api/net/session',{credentials:'include',cache:'no-store'});
    if(!r.ok){const e=new Error('管理者権限または隔離環境を確認できません');e.status=r.status;throw e;}
    const s=await r.json();
    if(s.principal!==me.project_t_id || !Number.isSafeInteger(s.permission_epoch) || !s.roles?.includes('net_edit')){
      const e=new Error('管理者情報が変更されました');e.status=403;throw e;
    }
    return s;
  }
  function message(text){const p=document.createElement('p');p.textContent=text;root.replaceChildren(p);}
  function lock(){if(active){PTAdminPunish.suspendAuth('管理者権限を再確認してください',null);PTAdminPunish.unmount(true);}active=false;identity=null;message('管理者権限を再確認してください。別のタブから戻ると再確認します。');}
  async function enable(el, user, api) {
    root=el; me=user; apiBase=api;
    if (user.is_admin !== true) return;
    try {
      await session();
      enabled=true;
      document.querySelector('[data-tab="net"]').hidden=false;
    } catch (_) {
      // Disabled hosts and expired sessions leave the existing tabs available.
    }
  }
  async function open(){if(!allowed()||pending)return;pending=true;
    if(active){try{const s=await session();if(!identity||s.principal!==identity.principal||s.permission_epoch!==identity.epoch)lock();}catch(e){lock();}finally{pending=false;}return;}
    message('管理者権限を確認しています…');
    try{const s=await session();const id={principal:s.principal,epoch:s.permission_epoch};
      root.replaceChildren();const banner=document.createElement('p');banner.textContent='変更は管理者用の下書きに保存されます。公開は保留中です。';root.append(banner);
      const reload=document.createElement('button');reload.type='button';reload.textContent='保存版を再読み込み';root.append(reload);
      const editor=document.createElement('div');root.append(editor);
      reload.addEventListener('click',()=>{if(!PTAdminPunish.refreshCurrent())banner.textContent='未保存編集または確認中の操作があります。自動破棄しません。';});
      identity=id;active=true;await PTAdminPunish.mount(editor,PTNetHTTPStore.makeHostStore(s.csrf,lock,id,null,session,apiBase),id,session);
    }catch(e){lock();}finally{pending=false;}}
  window.addEventListener('beforeunload',e=>{if(active){const s=PTAdminPunish.status();if(s.dirty||s.conflict||s.locked||s.syncPending||s.busy){e.preventDefault();e.returnValue='';}}});
  g.PTCurrentNet={enable,allowed,open};
})(window);
