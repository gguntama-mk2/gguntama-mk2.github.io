/* PROJECT T authenticated administrator move-video registration.
   All authorization, CSRF, file validation and publication gates are server-side. */
(function(){
  "use strict";
  const API=location.hostname==="www.project-t-god.com"?"https://api.project-t-god.com":"";
  const make=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
  const CHAR_RE=/^[a-z0-9][a-z0-9-]{0,47}$/;
  let host, csrf, characters=[], character, move, file, hit, notice, listing, uploadButton;
  function message(s,state){notice.textContent=s;notice.dataset.state=state||"neutral";}
  async function request(path,init={}){
    const headers={...(init.headers||{})};
    if(init.method==="POST")headers["X-CSRF-Token"]=csrf();
    const result=await fetch(API+path,{credentials:"include",...init,headers});
    const body=await result.json().catch(()=>({}));
    if(!result.ok)throw Error(typeof body.detail==="string"?body.detail:"HTTP "+result.status);
    return body;
  }
  function setCharacters(list){
    characters=Array.isArray(list)?list.filter(c=>c&&CHAR_RE.test(c.id)&&Array.isArray(c.moves)):[];
    if(!character)return;
    const prev=character.value;character.replaceChildren();
    for(const c of characters){const option=make("option",c.name+"（"+(c.en||c.id)+"）");option.value=c.id;character.appendChild(option);}
    if(characters.some(c=>c.id===prev))character.value=prev;
    else if(characters.some(c=>c.id==="bryan"))character.value="bryan";
    setMoves();
  }
  function setMoves(){
    move.replaceChildren();
    const c=characters.find(x=>x.id===character.value);if(!c)return;
    c.moves.forEach((entry,index)=>{
      const k=Number.isSafeInteger(entry.k)?entry.k:index;
      const option=make("option",String(k)+" · "+entry.name);
      option.value=String(k);option.dataset.moveName=entry.name;move.appendChild(option);
    });
    if(c.id==="bryan"&&Array.from(move.options).some(x=>x.value==="2"))move.value="2";
  }
  async function refresh(){
    const data=await request("/api/v1/admin/move-media");
    listing.replaceChildren();
    if(!data.entries||!data.entries.length){listing.appendChild(make("p","登録済みの動画はありません。"));return;}
    const table=make("table"),h=make("tr");
    for(const col of ["キャラクター","技名 / k","状態","確認","操作"])h.appendChild(make("th",col));
    table.appendChild(h);
    for(const item of data.entries){
      const row=make("tr");
      row.appendChild(make("td",item.character_id));
      row.appendChild(make("td",item.move_name+" / "+item.site_k));
      row.appendChild(make("td",item.status==="published"?"公開中":"下書き"));
      const linkCell=make("td");
      if(item.status==="published"){
        const link=make("a","動画を確認");link.href=API+item.media.video;link.target="_blank";link.rel="noopener noreferrer";
        linkCell.appendChild(link);
      }else linkCell.textContent="公開前";
      row.appendChild(linkCell);
      const action=make("td"),btn=make("button",item.status==="published"?"非公開にする":"公開する");
      btn.type="button";btn.className="btn";
      btn.addEventListener("click",async()=>{
        const method=item.status==="published"?"unpublish":"publish";
        if(!confirm(item.move_name+"の動画を"+(method==="publish"?"公開":"非公開")+"にしますか？"))return;
        btn.disabled=true;
        try{
          await request("/api/v1/admin/move-media/"+encodeURIComponent(item.character_id)+"/"+item.site_k+"/"+method,{method:"POST"});
          message("公開状態を更新しました。","ok");await refresh();
        }catch(e){message(e.message,"error");btn.disabled=false;}
      });
      action.appendChild(btn);row.appendChild(action);table.appendChild(row);
    }
    listing.appendChild(table);
  }
  async function submit(ev){
    ev.preventDefault();
    const selected=move.selectedOptions[0], video=file.files&&file.files[0],char=character.value;
    if(!selected||!CHAR_RE.test(char)||!video){message("キャラクター・技・動画を選択してください。","error");return;}
    if(video.size>32*1024*1024||!/\.(mp4|mov|webm)$/i.test(video.name)){message("32MB以下のMP4/MOV/WebMを選択してください。","error");return;}
    const seconds=Number(hit.value);
    if(!Number.isFinite(seconds)||seconds<0||seconds>30){message("サムネイル位置は0〜30秒です。","error");return;}
    const form=new FormData();
    form.set("character_id",char);form.set("site_k",move.value);
    form.set("move_name",selected.dataset.moveName);form.set("hit_second",String(seconds));
    form.set("video",video,video.name);
    uploadButton.disabled=true;message("動画を720pへ変換して下書き保存しています…");
    try{
      const result=await request("/api/v1/admin/move-media/upload",{method:"POST",body:form});
      message(result.move_name+"を下書きに登録しました。一覧の「公開する」を押すと公開されます。","ok");
      file.value="";await refresh();
    }catch(e){message("登録できませんでした："+e.message,"error");}
    finally{uploadButton.disabled=false;}
  }
  function field(label,ctrl){
    const item=make("label");item.className="pt-mm-field";item.appendChild(make("strong",label));item.appendChild(ctrl);return item;
  }
  function mount(target,context){
    host=target;csrf=context.csrf;host.replaceChildren();
    const panel=make("section");panel.className="card";
    panel.appendChild(make("h2","技動画の登録"));
    panel.appendChild(make("p","技を選んで動画を登録します。720pに変換してサムネイルを作成し、下書きとして保存します。公開は別操作です。"));
    const form=make("form");form.className="pt-mm-form";
    character=make("select");character.required=true;character.addEventListener("change",setMoves);
    move=make("select");move.required=true;
    file=make("input");file.type="file";file.accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm";file.required=true;
    hit=make("input");hit.type="number";hit.min="0";hit.max="30";hit.step="0.01";hit.value="0.95";hit.required=true;
    form.append(field("キャラクター",character),field("技",move),field("MP4 / MOV / WebM",file),field("サムネイル時刻（秒）",hit));
    uploadButton=make("button","アップロードして下書き保存");uploadButton.type="submit";uploadButton.className="btn primary";
    form.appendChild(uploadButton);form.addEventListener("submit",submit);
    notice=make("p","動画を選択してください。");notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
    panel.append(form,notice);host.appendChild(panel);
    const second=make("section");second.className="card";second.appendChild(make("h2","登録済み動画"));
    const reload=make("button","一覧を更新");reload.type="button";reload.className="btn";reload.addEventListener("click",()=>refresh().catch(e=>message(e.message,"error")));
    second.appendChild(reload);listing=make("div");listing.className="tw";second.appendChild(listing);host.appendChild(second);
    setCharacters(context.characters?context.characters():[]);
    refresh().catch(e=>message("一覧を取得できませんでした："+e.message,"error"));
  }
  window.PTAdminMoveMedia=Object.freeze({mount,updateCharacters:setCharacters});
})();
