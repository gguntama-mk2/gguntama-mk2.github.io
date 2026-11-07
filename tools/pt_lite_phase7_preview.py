#!/usr/bin/env python3
"""Build test-only PROJECT T HTTPS preview shim; never modify main or the real Pages source."""
from pathlib import Path
import json
base=Path("test-litev1")
assets=base/"assets"/"js"
assets.mkdir(exist_ok=True,parents=True)
guard=r'''/* PROJECT T staging proxy safety: no production login/API operations. */
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
'''
(assets/"pt-preview-guard.js").write_text(guard,"utf-8")
report={"mode":"test-only","proxy":"raw.githack.com","preview_branch":"project-t-preview-20261107","html":{},"real_auth_disabled":True,"api_calls_mocked":True}
for device in ("pc","sp"):
 p=base/(device+".html")
 html=p.read_text("utf-8")
 # Some third-party proxies wrongly return HTTP 501 for empty JS placeholders.
 # These scripts have no behavior, so omit them from the preview HTML entirely.
 for empty in (base/"assets"/"js").glob(device+"_*.js"):
  if empty.stat().st_size==0:
   html=html.replace('<script src="assets/js/'+empty.name+'"></script>','')
 tag='<script src="assets/js/pt-preview-guard.js"></script>'
 if tag not in html:
  if "<head>" not in html:raise ValueError("Missing html head "+device)
  html=html.replace("<head>","<head>\n<meta name=\"robots\" content=\"noindex,nofollow,noarchive\">\n"+tag,1)
  p.write_text(html,"utf-8")
 report["html"][device]={"bytes":p.stat().st_size,"guard":True}
(base/"assets"/"data"/"phase7-preview-build.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
