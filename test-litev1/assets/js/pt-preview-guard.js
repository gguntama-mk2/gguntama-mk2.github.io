/* PROJECT T staging proxy safety: no production login/API operations. */
(function(){
 "use strict";
 window.__PROJECT_T_PREVIEW = true;
 const apiRE=/(?:^|\/)api\/v1\//i;
 const originalFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
   const url=typeof input==="string"?input:input&&input.url||"";
   if(apiRE.test(url)){
     return Promise.resolve(new Response(JSON.stringify({error:"preview_disabled",message:"This preview has no account backend."}),{
       status:401,headers:{"Content-Type":"application/json"}
     }));
   }
   return originalFetch(input,init);
 };
 // OAuth / account controls must never be activated on a third-party preview origin.
 window.addEventListener("click",function(event){
   const host=document.getElementById("lgHost");
   if(host && event.composedPath().includes(host)){
     event.preventDefault();event.stopImmediatePropagation();
     const notice=document.getElementById("ptPreviewNotice");
     if(notice)notice.textContent="テスト用：アカウント連携・ログイン・削除は無効です。";
   }
 },true);
 window.addEventListener("submit",function(event){
   const host=document.getElementById("lgHost");
   if(host && event.composedPath().includes(host)) {
     event.preventDefault();event.stopImmediatePropagation();
   }
 },true);
 function showBanner(){
   if(document.getElementById("ptPreviewNotice"))return;
   const notice=document.createElement("div");
   notice.id="ptPreviewNotice";
   notice.setAttribute("role","status");
   notice.textContent="PROJECT T テスト版｜実アカウントでログインしないでください。保存データは本番と共有されません。";
   Object.assign(notice.style,{
     position:"fixed",bottom:"12px",left:"12px",zIndex:"2147483500",
     background:"#172238",color:"#fff",padding:"8px 12px",
     border:"1px solid #9bb3ff",borderRadius:"8px",fontSize:"12px",
     fontFamily:"sans-serif",maxWidth:"min(90vw,560px)",boxShadow:"0 2px 14px #0008",
     lineHeight:"1.5"
   });
   document.body.appendChild(notice);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showBanner,{once:true});
 else showBanner();
})();
