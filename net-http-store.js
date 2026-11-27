/* PNINT07: isolated HTTP transport with session freshness check and opt-in epoch binding.
   No token or draft is saved in browser storage. No automatic retries after writes. */
(function(g){'use strict';
 function make(token,onAccessLost,identity,onConfirmed,hostGetAuth,apiBase){
   // A real host must supply a server-confirmed session checker. The legacy
   // /__demo/session default is retained ONLY for older isolated test pages.
   if(hostGetAuth!==undefined && typeof hostGetAuth!=='function')
     throw new Error('PNINT24_HOST_AUTH_CALLBACK_INVALID');
   var p=(apiBase||'')+'/api/net/';identity=identity||null;
   function lose(err){if(onAccessLost && (err.status===401||err.status===403))onAccessLost(err);}
   async function parseResponse(response){var data=await response.json().catch(function(){return {};});
     if(!response.ok){var detail=data.detail;var e=new Error(data.message||(detail&&detail.message)||(typeof detail==='string'?detail:'HTTP '+response.status));
       e.status=response.status;e.code=data.code||(detail&&detail.code);lose(e);throw e;}return data;}
   async function request(path,method,body){
     method=method||'GET';var isWrite=method==='POST',headers={};
     if(isWrite){
       // Checking before each mutation is UX protection; the router also checks
       // the sent principal + epoch, so an epoch change between reads and writes fails.
       try {var session=typeof hostGetAuth==='function'
           ? await hostGetAuth()
           : await parseResponse(await fetch('/__demo/session',{method:'GET',credentials:'include',cache:'no-store'}));
         if(!identity || !session || session.principal!==identity.principal ||
           session.permission_epoch!==identity.epoch || typeof session.csrf!=='string' || !session.csrf ||
           !Array.isArray(session.roles) || !session.roles.includes('net_edit')){
           var stale=new Error('PERMISSION_EPOCH_CHANGED');stale.status=403;stale.code='PERMISSION_EPOCH_CHANGED';lose(stale);throw stale;
         }
       }catch(err){if(err.status===401||err.status===403)lose(err);throw err;}
       headers['Content-Type']='application/json';headers['X-CSRF-Token']=session.csrf;
       headers['X-PNINT-Principal']=identity.principal;headers['X-PNINT-Permission-Epoch']=String(identity.epoch);
     }
     var response;
     try{response=await fetch(path,{method:method,headers:headers,credentials:'include',cache:'no-store',
       body:body===undefined?undefined:JSON.stringify(body)});}
     catch(err){if(isWrite)err.unknown=true;throw err;}
     if (isWrite && response.status >= 500) {
       const error = new Error('保存結果が不明です。操作結果を確認してください。');
       error.unknown = true;
       throw error;
     }
     return parseResponse(response);
   }
   async function confirmedDraft(id,kind,b){
     // Transport acknowledgement alone is not a proof of editor read-back. Caller must GET.
     const r=await request(p+encodeURIComponent(id)+'/'+kind,'POST',b);
     if(r && r.status==='applied' && /^op-[a-f0-9]{32}$/.test(String(r.operation_id||'')) &&
        Number.isSafeInteger(r.revision) && r.revision>=1 && typeof onConfirmed==='function'){
       try{onConfirmed({kind:kind,char:id,revision:r.revision,operation_id:r.operation_id,
         principal:identity&&identity.principal,permission_epoch:identity&&identity.epoch});}
       catch(e){/* UI callback cannot turn accepted write into unknown */}
     }
     return r;
   }
   return {list:function(){return request(p+'chars');},get:function(id){return request(p+encodeURIComponent(id));},
     saveDraft:function(id,b){return confirmedDraft(id,'saveDraft',b);},
     restore:function(id,b){return confirmedDraft(id,'restore',b);},
     publish:function(id,b){return request(p+encodeURIComponent(id)+'/publish','POST',b);},
     reset:function(id,b){return request(p+encodeURIComponent(id)+'/reset','POST',b);},
     attest:function(id,b){return request(p+encodeURIComponent(id)+'/attest','POST',b);},
     // PNINT14: read-only confirmation of an uncertain write. A transport success
     // is NOT an applied receipt. Refuse to notify the host without exact binding.
     op:async function(id,opid,expectedKind){
       const r=await request(p+encodeURIComponent(id)+'/ops/'+encodeURIComponent(opid));
       if(r && r.status==='applied' && expectedKind){
         const matching=(expectedKind==='saveDraft'||expectedKind==='restore') &&
           r.operation_id===opid && r.kind===expectedKind && r.char_id===id &&
           r.principal===(identity&&identity.principal) &&
           r.permission_epoch===(identity&&identity.epoch) &&
           Number.isSafeInteger(r.revision) && r.revision>=1;
         if(!matching){const e=new Error('OP_RECEIPT_BINDING_MISMATCH');e.status=409;
           e.code='OP_RECEIPT_BINDING_MISMATCH';throw e;}
         if(typeof onConfirmed==='function'){
           try{onConfirmed({kind:expectedKind,char:id,revision:r.revision,
             operation_id:opid,via:'op_receipt',principal:identity.principal,
             permission_epoch:identity.epoch});}
           catch(e){/* GET-only host notification cannot invalidate an accepted receipt */}
         }
       }
       return r;
     }};
 }
 // Host-based integration MUST NOT silently use the demo fallback.
 function makeHostStore(token,onAccessLost,identity,onConfirmed,hostGetAuth,apiBase){
   if(typeof hostGetAuth!=='function')throw new Error('PNINT25_HOST_AUTH_REQUIRED');
   return make(token,onAccessLost,identity,onConfirmed,hostGetAuth,apiBase);
 }
 g.PTNetHTTPStore={makeStore:make,makeHostStore};
})(window);
