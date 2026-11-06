/* PROJECT T lazy feature modules. Test branch only. */
(function(){
  "use strict";
  const modules={"combo":"06","glossary":"07","punish":"08","stage":"09","gallery":"12","login":"14","vs":"15","privacy":"16","price":"16","download":"16","guide":"16"};
  const apis={combo:"CB",glossary:"GL",punish:"PN",stage:"SG",gallery:"GA",login:"LG",vs:"VS",privacy:"PR",price:"PC",download:"DL",guide:"GD"};
  const prefix="assets/js/pc_";
  const states=new Map();
  function loadOne(code) {
    if(states.has(code)) return states.get(code);
    const p=new Promise((resolve,reject)=>{
      const node=document.createElement("script");
      node.src=prefix+code+".js";
      node.onload=()=>resolve();
      node.onerror=()=>reject(new Error("feature module could not load: "+node.src));
      document.head.appendChild(node);
    }).catch(err=>{states.delete(code);throw err;});
    states.set(code,p);
    return p;
  }
  const loaded=new Set();
  let generation=0;
  function ensure(page){
    const code=modules[page];
    if(!code)return;
    const attempt=++generation;
    const prefetch=page==="punish" && window.PT_CHAR_DATA && typeof CHARACTERS!=="undefined"
      ? Promise.all(CHARACTERS.map(c=>window.PT_CHAR_DATA.load(c)))
      : Promise.resolve();
    prefetch.then(()=>loadOne(code)).then(()=>{loaded.add(code); if(document.documentElement.dataset.page===page){const api=window[apis[page]];if(api&&typeof api.show==="function")api.show();} }).catch(err=>{
      console.error("[PROJECT T] feature load failed",page,err);
      if(document.documentElement.dataset.page!==page)return;
      const targets={combo:"cbHost",glossary:"glHost",punish:"pnHost",stage:"sgHost",gallery:"gaHost",login:"lgHost",vs:"vsHost",privacy:"prHost",price:"pcHost",download:"dlHost",guide:"gdHost"};
      const host=document.getElementById(targets[page]);
      if(host && !host.shadowRoot)host.textContent="ページの読み込みに失敗しました。別のページへ移動してから再試行してください。";
    });
  }
  const root=document.documentElement;
  new MutationObserver(()=>ensure(root.dataset.page||"home")).observe(root,{attributes:true,attributeFilter:["data-page"]});
  window.addEventListener("hashchange",()=>ensure(root.dataset.page||location.hash.slice(1)));
  window.PT_ROUTE_ASSETS={loaded:()=>Array.from(loaded),routes:()=>Object.keys(modules)};
  ensure(root.dataset.page||location.hash.slice(1)||"home");
})();
