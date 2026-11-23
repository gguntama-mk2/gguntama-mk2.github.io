/* 技チェックシート → コンボ集リンク（PC版）。
 * 技のコマンドが、コンボ集の「コンボ名・始動技」と一致するとき、技名のセルを黄色の枠で光らせ、
 * 押すと吹き出しにコンボ番号を表示し、番号を押すとそのコンボへ飛ぶ。
 * 一致の判定と番号は、コンボ集モジュール（CB）の starterKey / punishableOf と同じルールで、開いた時点の一覧から計算する（固定の番号は持たない）。
 * 対象：全キャラ・全技（アーカイブでない全コンボ。カウンターヒット限定コンボも含む）。 */
(function(){'use strict';
var CSS=".cblink-hit{outline:1px solid #ffd21fa8;outline-offset:1px;border-radius:8px;box-shadow:0 0 6px 0 #ffd21f5e,inset 0 0 4px #ffd21f26;animation:cblinkglow 2.4s ease-in-out infinite}\n@keyframes cblinkglow{50%{box-shadow:0 0 9px 1px #ffd21f83,inset 0 0 6px #ffd21f38}}\n@media (prefers-reduced-motion:reduce){.cblink-hit{animation:none}}\n.cblink-hit .nt[data-combo-links]{cursor:pointer;text-decoration:underline dotted #ffd21f;text-underline-offset:3px}\n.cblink-hit .nt[data-combo-links]:focus-visible{outline:3px solid #fff;outline-offset:2px}\n.cblink-bub{position:absolute;z-index:9999;width:max-content;max-width:min(420px,calc(100vw - 16px));background:#16181d;border:1.5px solid #ffd21f;border-radius:12px;padding:10px 12px;box-shadow:0 6px 22px #000c;color:#fff}\n.cblink-bub::before{content:\"\";position:absolute;left:22px;top:-8px;width:12px;height:12px;background:#16181d;border-left:1.5px solid #ffd21f;border-top:1.5px solid #ffd21f;transform:rotate(45deg)}\n.cblink-bub-t{margin:0 0 8px;font-size:12px;color:#ffd21f}\n.cblink-bub-l{display:flex;flex-wrap:wrap;gap:6px}\n.cblink-bub-n{min-width:44px;min-height:36px;padding:0 12px;border:1px solid #ffd21f;border-radius:8px;background:#2a2410;color:#fff;font-size:14px;font-weight:700;cursor:pointer}\n.cblink-bub-n:hover{background:#4a3f12}.cblink-bub-n:focus-visible{outline:3px solid #fff;outline-offset:2px}\n";
var st=document.createElement('style');st.id='cblink-css';st.textContent=CSS;document.head.appendChild(st);
var bubble=null,owner=null,pre=null;
/* コンボ集モジュールは埋め込みの古いデータを持ち、開いた直後にライブデータへ切り替わる。切替後（CB.live().rev>0）に判定する。最大6秒で埋め込みデータにフォールバック。 */
function ready(){if(pre)return pre;
 if(!window.PT_LAZY_PRELOAD&&!(window.CB&&CB.ids))return Promise.resolve(false);
 var load=(window.CB&&CB.ids)?Promise.resolve():window.PT_LAZY_PRELOAD('combo');
 pre=load.then(function(){return new Promise(function(ok){var n=0,iv=setInterval(function(){n++;var live=0;try{live=CB.live().rev;}catch(e){}if(live>0||n>60){clearInterval(iv);ok(!!(window.CB&&CB.ids));}},100);});},function(){return false;});return pre;}
function linker(char){if(!window.CB||!CB.linker)return null;try{return CB.linker(char,true);}catch(e){return null;}}
function find(char,cmd,lk){try{return (lk||linker(char))(cmd).sort(function(a,b){return a.no-b.no;});}catch(e){return[];}}
function close(ret){if(!bubble)return;bubble.remove();var o=owner;bubble=null;owner=null;if(o){o.setAttribute('aria-expanded','false');if(ret)o.focus();}}
function go(){if(typeof window.setPage==='function'){window.setPage('combo');try{window.scrollTo(0,0);}catch(e){}}}
function jump(it){close(false);go();var t=0,iv=setInterval(function(){t++;var ok=false;try{ok=window.CB&&CB.jumpTo(String(it.id));}catch(e){}if(ok||t>30)clearInterval(iv);},60);}
function open(trigger,items){close(false);
 var b=document.createElement('div');b.className='cblink-bub';b.setAttribute('role','dialog');b.setAttribute('aria-label','この技が始動のコンボ');
 var t=document.createElement('p');t.className='cblink-bub-t';t.textContent='この技が始動のコンボ（'+items.length+'件）';b.appendChild(t);
 var w=document.createElement('div');w.className='cblink-bub-l';
 items.forEach(function(it){var x=document.createElement('button');x.type='button';x.className='cblink-bub-n';x.dataset.no=String(it.no);x.dataset.id=String(it.id);x.textContent='No.'+it.no+(it.video?' 🎬':'');x.setAttribute('aria-label','コンボ No.'+it.no+(it.video?'（動画つき）':'')+' へジャンプ');x.addEventListener('click',function(e){e.stopPropagation();jump(it);});w.appendChild(x);});
 b.appendChild(w);b.addEventListener('click',function(e){e.stopPropagation();});
 var host=document.getElementById('cblink-pop');if(!host){host=document.createElement('div');host.id='cblink-pop';document.body.appendChild(host);}
 b.style.visibility='hidden';host.appendChild(b);
 var z=(trigger.closest('.cblink-hit')||trigger).getBoundingClientRect(),cw=document.documentElement.clientWidth,bw=b.offsetWidth;
 b.style.left=Math.max(8,Math.min(z.left+scrollX,scrollX+cw-bw-8))+'px';b.style.top=(z.bottom+scrollY+8)+'px';b.style.visibility='';
 bubble=b;owner=trigger;trigger.setAttribute('aria-expanded','true');
 var first=b.querySelector('button');if(first)first.focus({preventScroll:true});}
function decorate(zone,trigger,char,name,cmd,lk){
 var items=find(char,cmd,lk);if(!items.length)return false;
 {
  zone.classList.add('cblink-hit');zone.dataset.comboLinks=items.map(function(x){return x.no;}).join(',');
  trigger.tabIndex=0;trigger.setAttribute('role','button');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-label',name+'：この技が始動のコンボ（'+items.length+'件）を表示');trigger.dataset.comboLinks=zone.dataset.comboLinks;
  var toggle=function(e){if(e.target.closest&&e.target.closest('.rvbtn'))return;e.stopPropagation();
   if(bubble&&owner===trigger){close(false);return;}
   var fresh=find(char,cmd);open(trigger,fresh.length?fresh:items);};
  zone.addEventListener('click',toggle);
  trigger.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target===trigger){e.preventDefault();toggle(e);}});
  return true;}}
function charOf(tr){var e=tr.querySelector('.pt-ic[data-c]');return e?e.dataset.c:'';}
var busy=false,again=false;
function scan(){
 if(busy){again=true;return;}
 var rows=[].filter.call(document.querySelectorAll('tbody tr[data-cmd]'),function(tr){return !tr.dataset.cblink&&tr.querySelector('td.name .nm .nt');});
 if(!rows.length)return;rows.forEach(function(tr){tr.dataset.cblink='1';});busy=true;
 ready().then(function(ok){if(!ok)return;var lks={};
  rows.forEach(function(tr){if(!tr.isConnected)return;var ch=charOf(tr);if(!ch)return;var lk=lks[ch]||(lks[ch]=linker(ch));if(!lk)return;
   var nm=tr.querySelector('td.name .nm'),nt=nm.querySelector('.nt');decorate(nm,nt,ch,nt.textContent.trim(),tr.dataset.cmd||'',lk);});
 }).then(function(){busy=false;if(again){again=false;scan();}});}
document.addEventListener('click',function(e){var zone=owner&&(owner.closest('.cblink-hit')||owner);if(bubble&&!bubble.contains(e.target)&&!(zone&&zone.contains(e.target)))close(false);},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&bubble){e.stopPropagation();close(true);}},true);
window.addEventListener('resize',function(){close(false);});
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
scan();
})();
