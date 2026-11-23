/* 技チェックシート → コンボ集リンク（PC版）。
 * 技のコマンドが、コンボ集の「コンボ名・始動技」と一致するとき、技名のセルを黄色の枠で光らせ、
 * 押すと吹き出しにコンボ番号を表示し、番号を押すとそのコンボへ飛ぶ。
 * 一致の判定と番号は、コンボ集モジュール（CB）の starterKey / punishableOf と同じルールで、開いた時点の一覧から計算する（固定の番号は持たない）。
 * 現在の対象：アーマーキング「ブラックスマッシュ」(6n23RP) のみ（PROTO）。他の技へ広げるときは PROTO を一覧に置き換える。 */
(function(){'use strict';
var PROTO={char:'armorking',name:'ブラックスマッシュ',cmd:'6n23RP'};
var CSS=".cblink-hit{outline:2px solid #ffd21f;outline-offset:1px;border-radius:8px;box-shadow:0 0 0 1px #ffd21f66,0 0 12px 2px #ffd21fcc,inset 0 0 8px #ffd21f55;animation:cblinkglow 2.4s ease-in-out infinite}\n@keyframes cblinkglow{50%{box-shadow:0 0 0 1px #ffd21f99,0 0 18px 4px #ffd21f,inset 0 0 12px #ffd21f88}}\n@media (prefers-reduced-motion:reduce){.cblink-hit{animation:none}}\n.cblink-hit .nt[data-combo-links]{cursor:pointer;text-decoration:underline dotted #ffd21f;text-underline-offset:3px}\n.cblink-hit .nt[data-combo-links]:focus-visible{outline:3px solid #fff;outline-offset:2px}\n.cblink-bub{position:absolute;z-index:9999;width:max-content;max-width:min(420px,calc(100vw - 16px));background:#16181d;border:1.5px solid #ffd21f;border-radius:12px;padding:10px 12px;box-shadow:0 6px 22px #000c;color:#fff}\n.cblink-bub::before{content:\"\";position:absolute;left:22px;top:-8px;width:12px;height:12px;background:#16181d;border-left:1.5px solid #ffd21f;border-top:1.5px solid #ffd21f;transform:rotate(45deg)}\n.cblink-bub-t{margin:0 0 8px;font-size:12px;color:#ffd21f}\n.cblink-bub-l{display:flex;flex-wrap:wrap;gap:6px}\n.cblink-bub-n{min-width:44px;min-height:36px;padding:0 12px;border:1px solid #ffd21f;border-radius:8px;background:#2a2410;color:#fff;font-size:14px;font-weight:700;cursor:pointer}\n.cblink-bub-n:hover{background:#4a3f12}.cblink-bub-n:focus-visible{outline:3px solid #fff;outline-offset:2px}\n";
var st=document.createElement('style');st.id='cblink-css';st.textContent=CSS;document.head.appendChild(st);
var bubble=null,owner=null,pre=null;
/* コンボ集モジュールは埋め込みの古いデータを持ち、開いた直後にライブデータへ切り替わる。切替後（CB.live().rev>0）に判定する。最大6秒で埋め込みデータにフォールバック。 */
function ready(){if(pre)return pre;
 if(!window.PT_LAZY_PRELOAD&&!(window.CB&&CB.ids))return Promise.resolve(false);
 var load=(window.CB&&CB.ids)?Promise.resolve():window.PT_LAZY_PRELOAD('combo');
 pre=load.then(function(){return new Promise(function(ok){var n=0,iv=setInterval(function(){n++;var live=0;try{live=CB.live().rev;}catch(e){}if(live>0||n>60){clearInterval(iv);ok(!!(window.CB&&CB.ids));}},100);});},function(){return false;});return pre;}
function find(char,cmd){if(!window.CB||!CB.ids)return[];try{return CB.ids(char,cmd).slice().sort(function(a,b){return a.no-b.no;});}catch(e){return[];}}
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
function decorate(zone,trigger,char,name,cmd){
 if(char!==PROTO.char||name!==PROTO.name||String(cmd).toLowerCase()!==PROTO.cmd.toLowerCase())return Promise.resolve(false);
 return ready().then(function(ok){if(!ok)return false;var items=find(char,PROTO.cmd);if(!items.length)return false;
  zone.classList.add('cblink-hit');zone.dataset.comboLinks=items.map(function(x){return x.no;}).join(',');
  trigger.tabIndex=0;trigger.setAttribute('role','button');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-label',name+'：この技が始動のコンボ（'+items.length+'件）を表示');trigger.dataset.comboLinks=zone.dataset.comboLinks;
  var toggle=function(e){if(e.target.closest&&e.target.closest('.rvbtn'))return;e.stopPropagation();
   if(bubble&&owner===trigger){close(false);return;}
   var fresh=find(char,PROTO.cmd);open(trigger,fresh.length?fresh:items);};
  zone.addEventListener('click',toggle);
  trigger.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target===trigger){e.preventDefault();toggle(e);}});
  return true;});}
function charOf(tr){var e=tr.querySelector('.pt-ic[data-c]');return e?e.dataset.c:'';}
function scanRow(tr){
 if(tr.dataset.cblink)return;var nm=tr.querySelector('td.name .nm'),nt=nm&&nm.querySelector('.nt');if(!nt)return;tr.dataset.cblink='1';
 if(nt.textContent.trim()!==PROTO.name)return;
 decorate(nm,nt,charOf(tr),PROTO.name,tr.dataset.cmd||'');}
function scan(){document.querySelectorAll('tbody tr[data-cmd]').forEach(scanRow);}
document.addEventListener('click',function(e){var zone=owner&&(owner.closest('.cblink-hit')||owner);if(bubble&&!bubble.contains(e.target)&&!(zone&&zone.contains(e.target)))close(false);},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&bubble){e.stopPropagation();close(true);}},true);
window.addEventListener('resize',function(){close(false);});
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
scan();
})();
