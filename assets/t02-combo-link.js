/* T02 combo-link prototype R6 (TEST ONLY): number-jump (A list button removed by request), uses the production combo module (CB), no fixed numbers.
 *  - match  : CB.ids(char,cmd)  -> same starterKey/punishableOf rule as the 確定反撃表 link (CB.matcher / CB.setMove)
 *  - jump   : setPage('combo') + CB.jumpTo(id)            (production jumpTo used by the 動画つきコンボ bar)
 * "No." is computed from the list at the moment the bubble opens (it depends on the list order / sort), never stored.
 * Scope: every move (all active combos). Test patches: CB.ids/CB.linker/CB.jumpTo export, PT_LAZY_PRELOAD. */
(function(){'use strict';
let bubble=null,owner=null,pre=null;
/* The combo module ships an embedded (older) data revision and adopts the live data (combos-live.json) a moment after it loads.
 * Numbers/matches are only trusted after that adoption (CB.live().rev>0); after 6 s the embedded data is used as a fallback. */
function ready(){if(pre)return pre;
 if(!window.PT_LAZY_PRELOAD&&!(window.CB&&CB.ids))return Promise.resolve(false);
 const load=(window.CB&&CB.ids)?Promise.resolve():window.PT_LAZY_PRELOAD('combo');
 pre=load.then(()=>new Promise(ok=>{let n=0;const iv=setInterval(()=>{n++;let live=0;try{live=CB.live().rev;}catch(e){}if(live>0||n>60){clearInterval(iv);ok(!!(window.CB&&CB.ids));}},100);}),()=>false);return pre;}
function close(ret){if(!bubble)return;bubble.remove();const o=owner;bubble=null;owner=null;if(o){o.setAttribute('aria-expanded','false');if(ret)o.focus();}}
function go(){if(typeof window.setPage==='function'){window.setPage('combo');try{window.scrollTo(0,0);}catch(e){}}}
function note(t){const n=document.getElementById('t02JumpNote')||document.getElementById('t02JumpNotePc');if(n){n.hidden=false;n.textContent=t;}}
function jump(char,cmd,it){close(false);const d={mode:'jump',char,cmd,id:String(it.id),no:it.no,video:it.video};window.PT_T02_LAST_JUMP=d;document.dispatchEvent(new CustomEvent('t02:combo-jump',{detail:d}));
 go();let t=0;const iv=setInterval(()=>{t++;let ok=false;try{ok=window.CB&&CB.jumpTo(String(it.id));}catch(e){}if(ok||t>30)clearInterval(iv);},60);}
function mkb(cls,txt,label,fn){const x=document.createElement('button');x.type='button';x.className=cls;x.textContent=txt;if(label)x.setAttribute('aria-label',label);x.addEventListener('click',e=>{e.stopPropagation();fn();});return x;}
function open(trigger,char,cmd,items,floating){close(false);
 const b=document.createElement('div');b.className='t02-cbub';b.setAttribute('role','dialog');b.setAttribute('aria-label','この技が始動のコンボ');
 const t=document.createElement('p');t.className='t02-cbub-t';t.textContent='この技が始動のコンボ（'+items.length+'件）';b.append(t);
 const w=document.createElement('div');w.className='t02-cbub-l';
 for(const it of items){const x=mkb('t02-cbub-n','No.'+it.no+(it.video?' 🎬':''),'コンボ No.'+it.no+(it.video?'（動画つき）':'')+' へジャンプ',()=>jump(char,cmd,it));x.dataset.no=String(it.no);x.dataset.id=String(it.id);w.append(x);}
 b.append(w);b.addEventListener('click',e=>e.stopPropagation());
 if(floating){b.classList.add('t02-cbub-float');let host=document.getElementById('t02Pop');if(!host){host=document.createElement('div');host.id='t02Pop';document.body.append(host);}
  b.style.visibility='hidden';host.append(b);
  const z=(trigger.closest('.t02-combo-hit')||trigger).getBoundingClientRect(),cw=document.documentElement.clientWidth,bw=b.offsetWidth;
  b.style.left=Math.max(8,Math.min(z.left+scrollX,scrollX+cw-bw-8))+'px';b.style.top=(z.bottom+scrollY+8)+'px';b.style.visibility='';}else trigger.parentElement.append(b);
 bubble=b;owner=trigger;trigger.setAttribute('aria-expanded','true');
 const first=b.querySelector('button');if(first)first.focus({preventScroll:true});try{b.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}}
/* linkerFor(char): CB.linker(char,true) = every active (non-archived) combo whose 「コンボ名・始動技」 matches the move command (same starterKey rule as 確定反撃表). Rebuilt on every call, so numbers always follow the current list. */
function linkerFor(char){try{return window.CB&&CB.linker?CB.linker(char,true):null;}catch(e){return null;}}
/* decorate(zone,trigger,char,name,cmd,floating,lk): glow + click-to-open when the move has matching combos. lk = optional prebuilt linker (for long lists). */
async function decorate(zone,trigger,char,name,cmd,floating,lk){
 if(!lk){if(!(await ready()))return false;lk=linkerFor(char);}
 if(!lk)return false;const items=lk(cmd).sort((a,b)=>a.no-b.no);if(!items.length)return false;
 zone.classList.add('t02-combo-hit');zone.dataset.comboLinks=items.map(x=>x.no).join(',');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-label',name+'：この技が始動のコンボ（'+items.length+'件）を表示');
 const toggle=e=>{if(e.target.closest&&e.target.closest('.rvbtn, .mc-act'))return;e.stopPropagation();
  if(bubble&&owner===trigger){close(false);return;}
  const l2=linkerFor(char),fresh=l2?l2(cmd).sort((a,b)=>a.no-b.no):[];open(trigger,char,cmd,fresh.length?fresh:items,floating);};
 zone.addEventListener('click',toggle);trigger.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===trigger&&trigger.tagName!=='BUTTON'){e.preventDefault();toggle(e);}});
 return items;}
document.addEventListener('click',e=>{const zone=owner&&(owner.closest('.t02-combo-hit')||owner);if(bubble&&!bubble.contains(e.target)&&!(zone&&zone.contains(e.target)))close(false);},true);
window.addEventListener('resize',()=>close(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&bubble){e.stopPropagation();close(true);}},true);
window.PT_T02_COMBO={ready,linkerFor,decorate,open,close,jump,isOpen:()=>!!bubble,ownerOf:()=>owner};
})();
