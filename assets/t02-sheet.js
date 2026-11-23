/* PROJECT T T02 test overlay: replaces ONLY the 技チェックシート view UI. Everything else is the cloned production page.
 * Isolated: no network, no storage writes, no real move data (CSP connect-src 'none'). */
'use strict';
(()=>{
const $=id=>document.getElementById(id);
const mobile=true;
const COLUMN=[['command','コマンド'],['attack','攻撃判定'],['startup','発生(持続)'],['damage','ダメージ'],['guard','ガード状況'],['hit','ヒット状況'],['counter','カウンター状況'],['wall','壁やられ'],['gimmick','ギミック'],['tbreak','投げ抜け'],['chip','削りダメージ'],['homing','ホーミング性能'],['tracking','追尾方向'],['jump','ジャンプステータス'],['crouch','しゃがみステータス'],['heat','ヒートタイマー消費フレーム'],['recovery','全体硬直']];
const state={query:'',showCommand:false,showAnswer:false,bookmark:false,prog:'all',userCols:null,cardBm:false,cardCk:false};
function mk(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function btn(txt,cb,cl){const b=mk('button',cl||'',txt);b.type='button';b.addEventListener('click',cb);return b;}
function info(title,p){const w=mk('div','warning-panel');w.append(mk('h2','',title),mk('p','',p));return w;}
function setToggle(b,f){b.setAttribute('aria-pressed',String(f));}
function addControl(host,label,key,onChange){const b=btn(label,()=>{state[key]=!state[key];setToggle(b,state[key]);onChange?.();},'cmdtgl');setToggle(b,!!state[key]);host.append(b);return b;}
// production drawers: .sheet.show (char etc.), #mn.on (MENU)
function closeProdDrawers(){document.querySelectorAll('.sheet.show [data-close]').forEach(b=>b.click());const mn=$('mn');if(mn&&mn.classList.contains('on'))mn.querySelector('.mn-close')?.click();}
/* ===== T02 (SP only): filter model, display-priority contract, sheet top reorganisation ===== */
const PRIMARY=[['startup','発生'],['guard','ガード'],['hit','ヒット']];
const DETAIL_GROUPS=[['基本・フレーム',['command','startup','guard','hit']],['数値・判定',['attack','damage','counter','chip','recovery']],['状態・特殊属性',['wall','gimmick','tbreak','homing','tracking','jump','crouch','heat']]];
/* Display-settings priority contract (T02): when a user display set exists (state.userCols !== null) it alone decides which
 * move fields are shown; the T02 default layout is used ONLY when no user set exists and never overwrites a user set.
 * Real persistence / restore of the user set is NOT connected in this isolated build (HOLD). */
function colVisible(k){return state.userCols?state.userCols.has(k):true;}
const FILTER_SECTIONS=[
 {key:'startup',label:'発生フレーム',type:'multi',opts:[['le10','10F以下'],['11-14','11〜14F'],['15-19','15〜19F'],['ge20','20F以上']]},
 {key:'guard',label:'ガード時',type:'multi',opts:[['plus','有利（＋）'],['even','五分（±0）'],['m1-9','不利 −1〜−9F'],['m10','不利 −10F以下']]},
 {key:'hit',label:'ヒット時',type:'multi',opts:[['plus','有利（＋）'],['even','五分（±0）'],['minus','不利（−）'],['launch','浮き'],['down','ダウン']]},
 {key:'dir',label:'入力方向',type:'multi',dense:1,opts:[['n','☆'],['6','→'],['3','↘'],['2','↓'],['1','↙'],['4','←'],['7','↖'],['8','↑'],['9','↗'],['66','→→'],['666','→→→'],['6n23','→☆↓↘']]},
 {key:'stance',label:'状況・構え',type:'multi',dense:1,opts:[['stand','立ち途中'],['crouch','しゃがみ中'],['side','横移動中'],['back','背向け中'],['other','その他'],['rocket','ロケットスタンス中'],['astro','アストロノーツ中'],['throw','投げ'],['sidethrow','側面・背後投げ']]},
 {key:'heat',label:'ヒート・レイジ',type:'multi',dense:1,opts:[['hd','ヒート発動技'],['hn','ヒート中の通常技'],['hdash','ヒートダッシュ技'],['hb','ヒートバースト'],['hs','ヒート専用技'],['hsm','ヒートスマッシュ'],['ra','レイジアーツ']]},
 {key:'info',label:'技の情報',type:'multi',dense:1,opts:[['hit_judge','攻撃判定'],['pc','パワークラッシュ'],['hs','ヒート専用技'],['hsm','ヒートスマッシュ'],['ra','レイジアーツ'],['hd','ヒート発動技'],['hb','ヒートバースト'],['hdash','ヒートダッシュ'],['tornado','トルネード'],['screw','強きりもみ'],['weak','衰弱'],['follow','追撃可能やられ'],['buff','強化状態'],['get','取得'],['use','消費'],['wallg','壁ギミック発動'],['floorg','床ギミック発動'],['hitcombo','ヒット時コンボ始動'],['chcombo','カウンター時コンボ始動'],['hitfu','ヒット時追撃可能'],['chfu','カウンター時追撃可能'],['wallS','壁やられ(強)'],['wallM','壁やられ(中)'],['homing','ホーミング'],['delay','ディレイ可'],['wallstun','壁よろけ'],['prone','空ヒット時うつ伏せ'],['trackL','左追尾効果'],['trackR','右追尾効果'],['nobreak','ヒット時投げ抜け不可'],['recov','リカバリアブルダメージ削除']]},
 {key:'sort',label:'並べ替え',type:'single',def:'default',opts:[['default','標準順'],['startup','発生が早い順'],['guard','ガード有利順'],['hit','ヒット有利順'],['damage','ダメージ順']]}
];
function emptyFilters(){const f={};for(const s of FILTER_SECTIONS)f[s.key]=s.type==='multi'?new Set():s.def;return f;}
function cloneFilters(src){const f={};for(const s of FILTER_SECTIONS)f[s.key]=s.type==='multi'?new Set(src[s.key]):src[s.key];return f;}
/* Apply model (single): EXPLICIT. Edits go to `draft`; only 適用 copies draft -> `applied`. Closing by ×/overlay/Esc/back discards draft.
 * Lifetime: in-memory only; kept across re-render, route change and character change; cleared by reload. Never stored. */
let applied=emptyFilters(),draft=emptyFilters(),filterOpen=false,filterHist=false,suppressPop=false,filterTrigger=null,chipHost=null;
function filterItems(f){const out=[];for(const s of FILTER_SECTIONS){if(s.type==='multi'){for(const [v,l] of s.opts)if(f[s.key].has(v))out.push({sec:s.key,val:v,label:s.label.replace(/フレーム|時$/g,'')+' '+l,full:s.label+' '+l});}else if(f[s.key]!==s.def){const o=s.opts.find(x=>x[0]===f[s.key]);out.push({sec:s.key,val:f[s.key],label:'並べ替え '+o[1],full:'並べ替え '+o[1]});}}return out;}
function removeFilter(it){if(it.sec==='sort')applied.sort='default';else applied[it.sec].delete(it.val);}
function renderChips(){
 const host=chipHost;const items=filterItems(applied);const fb=$('spFilterButton');
 if(fb){const n=items.length;fb.dataset.count=String(n);const bd=fb.querySelector('.badge');if(bd){bd.textContent=String(n);bd.hidden=n===0;}fb.setAttribute('aria-label',n?('絞り込み・並べ替えを開く（適用中 '+n+' 件）'):'絞り込み・並べ替えを開く');}
 const note=document.getElementById('spFilterNote');
 if(note)note.hidden=true;
 if(!host)return;host.replaceChildren();host.hidden=items.length===0;
 if(!items.length)return;
 const list=mk('ul','flt-chiplist');list.setAttribute('aria-label','適用中の絞り込み条件');
 for(const it of items){const li=mk('li','');const b=mk('button','flt-chip');b.type='button';b.dataset.sec=it.sec;b.dataset.val=it.val;b.setAttribute('aria-label',it.full+' の条件を解除');b.append(mk('span','t',it.label),mk('span','x','×'));b.lastChild.setAttribute('aria-hidden','true');
  b.addEventListener('click',()=>{const lis=[...host.querySelectorAll('.flt-chip')];const i=lis.indexOf(b);removeFilter(it);renderChips();const rest=host.querySelectorAll('.flt-chip');if(rest.length)(rest[Math.min(i,rest.length-1)]).focus();else $('spFilterButton')?.focus();});li.append(b);list.append(li);}
 const all=mk('li','');const ab=btn('すべて解除',()=>{applied=emptyFilters();renderChips();$('spFilterButton')?.focus();},'flt-clear-all');ab.id='fltClearAll';all.append(ab);list.append(all);
 host.append(list);
 if(typeof listHost!=='undefined'&&listHost&&typeof renderMoves==='function'){shownN=PAGE;renderMoves();}
}
function syncFilterInputs(){const body=$('filterBody');if(!body)return;for(const inp of body.querySelectorAll('input')){const k=inp.dataset.sec,v=inp.value;inp.checked=inp.type==='radio'?draft[k]===v:draft[k].has(v);}updateApplyLabel();}
function updateApplyLabel(){const n=filterItems(draft).length;const b=$('filterApply');if(b)b.textContent=n?('適用（'+n+'件）'):'適用';const c=$('filterReset');if(c)c.disabled=n===0;}
function buildFilterPanel(){
 const body=$('filterBody');if(!body||body.dataset.built)return;body.dataset.built='1';
 const jn=mk('nav','flt-jump');jn.setAttribute('aria-label','項目へ移動');for(const s of FILTER_SECTIONS){const jb=btn(s.label.replace(/フレーム|時$/g,''),()=>{const t=$('fltsec-'+s.key);body.scrollTo({top:t.offsetTop-jn.offsetHeight-4,behavior:'auto'});},'flt-jb');jn.append(jb);}body.append(jn);
 for(const s of FILTER_SECTIONS){const fs=mk('fieldset','flt-sec');fs.dataset.sec=s.key;fs.id='fltsec-'+s.key;if(s.dense)fs.dataset.dense='1';fs.append(mk('legend','',s.label));const row=mk('div','flt-opts');
  for(const [v,l] of s.opts){const lab=mk('label','flt-opt');const inp=document.createElement('input');inp.type=s.type==='multi'?'checkbox':'radio';inp.name='flt-'+s.key;inp.value=v;inp.dataset.sec=s.key;inp.className='flt-in';
   inp.addEventListener('change',()=>{if(s.type==='multi'){inp.checked?draft[s.key].add(v):draft[s.key].delete(v);}else draft[s.key]=v;updateApplyLabel();});lab.append(inp,mk('span','flt-lb',l));row.append(lab);}
  fs.append(row);body.append(fs);}
 $('filterReset').addEventListener('click',()=>{draft=emptyFilters();syncFilterInputs();});
 $('filterApply').addEventListener('click',()=>{applied=cloneFilters(draft);renderChips();closeFilter(true);});
 $('filterClose').addEventListener('click',()=>closeFilter(true));
 $('filterCancel').addEventListener('click',()=>closeFilter(true));
 $('filterOverlay').addEventListener('click',()=>closeFilter(true));
}
const BG_SEL=['#mnTab','header.top','#viewSheet'];
function setBackgroundInert(on){for(const sel of BG_SEL){const n=document.querySelector(sel);if(n)n.inert=on;}}
function openFilter(){
 if(!mobile||filterOpen)return;buildFilterPanel();closeProdDrawers();
 filterTrigger=document.activeElement&&document.activeElement!==document.body?document.activeElement:$('spFilterButton');
 draft=cloneFilters(applied);syncFilterInputs();
 const pan=$('filterPanel'),back=$('filterOverlay');back.hidden=false;pan.inert=false;pan.classList.add('open');pan.setAttribute('aria-hidden','false');setBackgroundInert(true);filterOpen=true;
 $('spFilterButton')?.setAttribute('aria-expanded','true');
 try{history.pushState({ptFilter:1},'',location.href);filterHist=true;}catch{filterHist=false;}
 pan.querySelector('.flt-head button')?.focus();
}
function closeFilter(restoreFocus,fromPop){
 const pan=$('filterPanel'),back=$('filterOverlay');if(!pan||!filterOpen)return;
 filterOpen=false;pan.classList.remove('open');pan.setAttribute('aria-hidden','true');pan.inert=true;back.hidden=true;setBackgroundInert(false);
 draft=cloneFilters(applied);
 $('spFilterButton')?.setAttribute('aria-expanded','false');
 if(filterHist&&!fromPop){filterHist=false;suppressPop=true;try{history.back();}catch{suppressPop=false;}}else if(fromPop)filterHist=false;
 if(restoreFocus){const t=filterTrigger&&document.contains(filterTrigger)?filterTrigger:$('spFilterButton');t?.focus();}
 filterTrigger=null;
}
function trapTab(e){if(!filterOpen||e.key!=='Tab')return;const pan=$('filterPanel');const f=[...pan.querySelectorAll('button:not([disabled]),input')].filter(x=>!x.hidden&&x.offsetParent!==null||x===document.activeElement);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}else if(!pan.contains(document.activeElement)){e.preventDefault();first.focus();}}
function svgIcon(d){const ns='http://www.w3.org/2000/svg';const s=document.createElementNS(ns,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width','18');s.setAttribute('height','18');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke','currentColor');p.setAttribute('stroke-width','2');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');s.append(p);return s;}
function fallbackCard(){
 const card=mk('article','card move-card');card.dataset.status='STATIC_SKELETON_NO_MOVE_DATA';
 const top=mk('div','mc-top');
 const hd=mk('button','head');hd.type='button';hd.setAttribute('aria-expanded','false');hd.setAttribute('aria-controls','demoCardDetail');
 const nm=mk('span','nm');const txt=mk('div','txt');txt.append(mk('span','nt','技データ未接続'));nm.append(txt,mk('span','cmdtxt','COMMAND / NOT LOADED'));
 const arrow=mk('span','arrow','▼');arrow.setAttribute('aria-hidden','true');hd.append(nm,arrow);top.append(hd);
 const acts=mk('div','mc-acts');
 const bm=mk('button','mc-act mc-bm');bm.type='button';bm.id='demoBm';bm.setAttribute('aria-pressed',String(state.cardBm));bm.setAttribute('aria-label','ブックマーク（UI確認のみ・保存されません）');bm.append(mk('span','g','☆'));bm.firstChild.setAttribute('aria-hidden','true');
 const ck=mk('button','mc-act mc-ck');ck.type='button';ck.id='demoCk';ck.setAttribute('aria-pressed',String(state.cardCk));ck.setAttribute('aria-label','チェック（UI確認のみ・保存されません）');ck.append(mk('span','g','✓'));ck.firstChild.setAttribute('aria-hidden','true');
 bm.addEventListener('click',()=>{state.cardBm=!state.cardBm;bm.setAttribute('aria-pressed',String(state.cardBm));bm.firstChild.textContent=state.cardBm?'★':'☆';});
 ck.addEventListener('click',()=>{state.cardCk=!state.cardCk;ck.setAttribute('aria-pressed',String(state.cardCk));});
 bm.firstChild.textContent=state.cardBm?'★':'☆';
 acts.append(bm,ck);top.append(acts);card.append(top);
 const stats=mk('div','sp-stats');stats.setAttribute('aria-label','主要フレーム（未接続）');for(const [k,label] of PRIMARY){if(!colVisible(k))continue;const it=mk('span','sp-stat');it.dataset.col=k;it.append(mk('small','',label),mk('b','','--'));stats.append(it);}
 if(!stats.children.length)stats.hidden=true;
 card.append(stats);
 const detail=mk('div','body card-detail');detail.id='demoCardDetail';detail.hidden=true;
 const dummy=mk('p','dummy-tag','ダミー枠：実際の技・フレーム・カウンター・ダメージはありません');detail.append(dummy);
 for(const [title,keys] of DETAIL_GROUPS){const ks=keys.filter(colVisible);if(!ks.length)continue;const group=mk('div','grp');group.append(mk('h4','',title));const grid=mk('div','grid');for(const k of ks){const label=COLUMN.find(x=>x[0]===k)[1];const cell=mk('div','cell');cell.dataset.col=k;cell.append(mk('span','lab',label),mk('span','val','--'));grid.append(cell);}group.append(grid);detail.append(group);}
 const extra=mk('div','grp');extra.append(mk('h4','','動画・メモ・進捗'));const eg=mk('div','grid');
 for(const label of ['動画（未接続）','メモ（未接続・保存なし）','進捗 0/0（未接続）']){const c=mk('div','cell');c.append(mk('span','lab',label),mk('span','val','--'));eg.append(c);}
 extra.append(eg);detail.append(extra);
 card.append(detail);
 hd.addEventListener('click',()=>{const isOpen=!card.classList.contains('open');card.classList.toggle('open',isOpen);detail.hidden=!isOpen;hd.setAttribute('aria-expanded',String(isOpen));});
 return card;
}

/* ===== T02 real-data layer (test): moves come from the production sheet's own list (#list, hidden) + c/<id>.json ===== */
const PAGE=100000;let listHost=null,statusEl=null,MOVES=[],curChar='',shownN=PAGE,loadedChar='',loadTimer=0,linkReady=null;const RAW={};
const mi=()=>window.PT_T02_MOVEINFO;
function num1(x){const m=/-?\d+(?:\.\d+)?/.exec(String(x==null?'':x).replace(/[＋+]/g,'+').replace(/[−－ー]/g,'-'));return m?parseFloat(m[0]):null;}
function sgn(x){const t=String(x==null?'':x).replace(/[＋]/g,'+').replace(/[−－ー]/g,'-');const m=/([+-]?)\s*(\d+)/.exec(t);if(!m)return null;return (m[1]==='-'?-1:1)*parseInt(m[2],10);}
const INFO_MAP={hit_judge:'*atk',pc:'pc',hs:'ho',hsm:'hs',ra:'ra',hd:'he',hb:'hb',hdash:'hd',tornado:'tn',screw:'kr',weak:'wk',follow:'fu',buff:'ss',get:'gn',use:'gu',wallg:'gw',floorg:'gf',hitcombo:'hc',chcombo:'cc',hitfu:'hf',chfu:'cf',wallS:'ws',wallM:'wm',homing:'hm',delay:'dl',wallstun:'wy',prone:'au',trackL:'tkl',trackR:'tkr',nobreak:'hn',recov:'rd'};
const HEAT_MAP={hd:'he',hdash:'hd',hb:'hb',hs:'ho',hsm:'hs',ra:'ra'};
function dirOk(cmd,d){const c=String(cmd||'').replace(/^[(（][^)）]*[)）]/,'');const k=c.replace(/[^0-9nN].*$/,'');if(d==='n')return /^n/i.test(c);if(d==='6n23')return /^6n23/i.test(c);if(d==='666')return /^666/.test(c);if(d==='66')return /^66(?!6)/.test(c);return new RegExp('^'+d+'(?![0-9]*n)').test(k||c)&&!( (d==='6')&&/^66/.test(c))&&!(/^[1-9]n/i.test(c)&&c[0]===d&&c.length>1&&/^[1-9]n23/i.test(c));}
function stanceOk(m,s){const c=m.cmd,t=(m.a.attack||'');switch(s){case 'stand':return /立ち途中/.test(c);case 'crouch':return /しゃがみ中/.test(c);case 'side':return /横移動中|横歩き中|左横移動|右横移動/.test(c);case 'back':return /背向け中/.test(c);case 'rocket':return /ロケットスタンス/.test(c);case 'astro':return /アストロノーツ/.test(c);case 'throw':return /投げ/.test(t)&&!/側面|背後/.test(c+t);case 'sidethrow':return /側面|背後/.test(c+t);case 'other':return /[^\s]中/.test(c)&&!/立ち途中|しゃがみ中|横移動中|背向け中|ロケットスタンス|アストロノーツ|ヒート中/.test(c);}return false;}
function passFilters(m){const f=applied;
 if(f.startup.size){const v=num1(m.a.startup);const ok=v!=null&&((f.startup.has('le10')&&v<=10)||(f.startup.has('11-14')&&v>=11&&v<=14)||(f.startup.has('15-19')&&v>=15&&v<=19)||(f.startup.has('ge20')&&v>=20));if(!ok)return false;}
 if(f.guard.size){const v=sgn(m.a.guard);const ok=v!=null&&((f.guard.has('plus')&&v>0)||(f.guard.has('even')&&v===0)||(f.guard.has('m1-9')&&v<0&&v>=-9)||(f.guard.has('m10')&&v<=-10));if(!ok)return false;}
 if(f.hit.size){const t=String(m.a.hit||'');const v=sgn(t);const ok=(f.hit.has('plus')&&v!=null&&v>0&&!/浮|ダウン/.test(t))||(f.hit.has('even')&&v===0)||(f.hit.has('minus')&&v!=null&&v<0)||(f.hit.has('launch')&&/浮/.test(t))||(f.hit.has('down')&&/ダウン/.test(t));if(!ok)return false;}
 if(f.dir.size&&![...f.dir].some(d=>dirOk(m.cmd,d)))return false;
 if(f.stance.size&&![...f.stance].some(s=>stanceOk(m,s)))return false;
 if(f.heat.size&&![...f.heat].some(h=>m.tags.has(HEAT_MAP[h])||(h==='hn'&&/ヒート中/.test(m.cmd)&&!['ho','hs','he','hb','hd','ra'].some(x=>m.tags.has(x)))))return false;
 if(f.info.size&&![...f.info].every(k=>INFO_MAP[k]==='*atk'?!!m.atk:m.tags.has(INFO_MAP[k])))return false;
 return true;}
function pcard(i){return document.querySelector('#viewSheet #list > article.card[data-i="'+i+'"]');}
function pst(i){const c=pcard(i);if(!c)return{done:false,rv:false,cnt:''};const n=c.querySelector('.cnt');return{done:c.classList.contains('done'),rv:c.classList.contains('rv'),cnt:n?n.textContent:'',memo:!!(c.querySelector('.mbadge')&&!c.querySelector('.mbadge').hidden)};}
function matchQuery(m,q){if(!q)return true;const h=(m.name+' '+m.y+' '+m.cmd+' '+m.cmdText).toLowerCase();return q.split(/\s+/).every(w=>h.includes(w));}
function sortMoves(a){const k=applied.sort;if(k==='default')return a;const key={startup:m=>{const v=num1(m.a.startup);return v==null?1e9:v;},guard:m=>{const v=sgn(m.a.guard);return v==null?1e9:-v;},hit:m=>{const v=sgn(m.a.hit);return v==null?1e9:-v;},damage:m=>{const v=num1(m.a.damage);return v==null?1e9:-v;}}[k];return a.slice().sort((x,y)=>key(x)-key(y)||x.i-y.i);}
function firstLine(x){const t=String(x==null?'':x).split('\n')[0].trim();return t||'--';}
function cardFor(m){
 const card=mk('article','card move-card');card.dataset.i=String(m.i);
 const top=mk('div','mc-top');
 const hd=mk('button','head');hd.type='button';hd.setAttribute('aria-expanded','false');
 const nm=mk('span','nm');const txt=mk('div','txt');txt.append(mk('span','nt',m.name));nm.append(txt);
 if(m.cmdNode){const c=m.cmdNode.cloneNode(true);c.className='cmdtxt';c.removeAttribute('aria-hidden');nm.append(c);}else nm.append(mk('span','cmdtxt',m.cmd));
 const arrow=mk('span','arrow','▼');arrow.setAttribute('aria-hidden','true');hd.append(nm,arrow);top.append(hd);
 const cntEl=mk('span','t02-cnt');hd.append(cntEl);const mbadge=mk('span','t02-mbadge','メモ');mbadge.hidden=true;hd.append(mbadge);let opened=false;let syncCells=()=>{};
 const acts=mk('div','mc-acts');
 const bm=mk('button','mc-act mc-bm');bm.type='button';bm.setAttribute('aria-pressed','false');bm.setAttribute('aria-label',m.name+'：ブックマーク');bm.append(mk('span','g','☆'));
 const ck=mk('button','mc-act mc-ck');ck.type='button';ck.setAttribute('aria-pressed','false');ck.setAttribute('aria-label',m.name+'：この技をすべてチェック／外す');ck.append(mk('span','g','✓'));
 const sync=()=>{const p=pst(m.i);bm.setAttribute('aria-pressed',String(p.rv));bm.firstChild.textContent=p.rv?'★':'☆';ck.setAttribute('aria-pressed',String(p.done));card.classList.toggle('t02-done',p.done);cntEl.textContent=p.cnt;mbadge.hidden=!p.memo;};
 const withProd=fn=>{const c=pcard(m.i);if(!c)return;fn(c);setTimeout(()=>{sync();syncCells();},30);};
 bm.addEventListener('click',()=>withProd(c=>{const b=c.querySelector('.rvbtn');if(b)b.click();}));
 ck.addEventListener('click',()=>withProd(c=>{const was=c.classList.contains('open');if(!was){const h=c.querySelector('.head');if(h)h.click();}const b=c.querySelector('.rowact button');if(b)b.click();if(!was&&!opened&&c.classList.contains('open')){const h=c.querySelector('.head');if(h)h.click();}}));
 acts.append(bm,ck);top.append(acts);card.append(top);
 const stats=mk('div','sp-stats');for(const [k,label] of PRIMARY){if(!colVisible(k))continue;const it=mk('span','sp-stat');it.dataset.col=k;it.append(mk('small','',label),mk('b','',firstLine(m.a[k])));stats.append(it);}
 if(!stats.children.length)stats.hidden=true;card.append(stats);
 const detail=mk('div','body card-detail');detail.hidden=true;detail.id='t02d-'+m.i;hd.setAttribute('aria-controls',detail.id);
 for(const [title,keys] of DETAIL_GROUPS){const ks=keys.filter(colVisible);if(!ks.length)continue;const group=mk('div','grp');group.append(mk('h4','',title));const grid=mk('div','grid');for(const k of ks){const label=COLUMN.find(x=>x[0]===k)[1];const cell=mk('div','cell');cell.dataset.col=k;cell.append(mk('span','lab',label),mk('span','val',(m.a[k]!=null&&String(m.a[k]).trim()!=='')?String(m.a[k]):'--'));cell.append(mk('span','t02-box'));cell.setAttribute('role','checkbox');cell.tabIndex=0;cell.setAttribute('aria-checked','false');cell.setAttribute('aria-label',m.name+' '+label);const act=()=>withProd(c=>{const pc=c.querySelector('.cell[data-col="'+k+'"]');if(pc&&pc.getAttribute('aria-disabled')!=='true')pc.click();});cell.addEventListener('click',act);cell.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();act();}});grid.append(cell);}group.append(grid);detail.append(group);}
 if(m.tagLabels.length){const g=mk('div','grp');g.append(mk('h4','','技の情報'));const w=mk('div','tgs');for(const t of m.tagLabels)w.append(mk('span','tg2',t));g.append(w);detail.append(g);}
 const extra=mk('div','grp');extra.append(mk('h4','','メモ'));const ta=mk('textarea','t02-memo');ta.rows=2;ta.maxLength=1000;ta.placeholder='メモ（自由入力）';ta.setAttribute('aria-label',m.name+' のメモ');
 ta.addEventListener('input',()=>{const c=pcard(m.i);const pt=c&&c.querySelector('textarea');if(pt){pt.value=ta.value;pt.dispatchEvent(new Event('input',{bubbles:true}));}setTimeout(sync,30);});ta.addEventListener('change',()=>{const c=pcard(m.i);const pt=c&&c.querySelector('textarea');if(pt)pt.dispatchEvent(new Event('change',{bubbles:true}));});
 extra.append(ta);
 syncCells=()=>{const c=pcard(m.i);if(!c)return;for(const cell of detail.querySelectorAll('.cell[data-col]')){const pc=c.querySelector('.cell[data-col="'+cell.dataset.col+'"]');if(!pc){cell.removeAttribute('role');continue;}cell.setAttribute('aria-checked',pc.getAttribute('aria-checked')||'false');if(pc.getAttribute('aria-disabled')==='true'){cell.setAttribute('aria-disabled','true');cell.tabIndex=-1;cell.classList.add('na');}}const pt=c.querySelector('textarea');if(pt&&document.activeElement!==ta)ta.value=pt.value;};
 detail.append(extra);card.append(detail);
 hd.addEventListener('click',()=>{const o=!card.classList.contains('open');card.classList.toggle('open',o);detail.hidden=!o;hd.setAttribute('aria-expanded',String(o));const c=pcard(m.i);if(c){const isOpen=c.classList.contains('open');if(o&&!isOpen){c.querySelector('.head').click();opened=true;}else if(!o&&isOpen&&opened){c.querySelector('.head').click();opened=false;}}setTimeout(()=>{sync();syncCells();},30);});
 sync();card._t02sync=()=>{sync();syncCells();};
 return {card,nm};}
function setStatus(pill,text){if(!statusEl)return;const p=statusEl.querySelector('.pill'),s=statusEl.querySelector('.st');if(p)p.textContent=pill;if(s)s.textContent=text;}
function renderMoves(){
 const list=listHost;if(!list)return;list.replaceChildren();
 if(!MOVES.length){const fb=fallbackCard();list.append(fb);setStatus('データ未接続','技データを読み込めません（件数は表示しません）');
  const q=state.query.trim();if(q){fb.hidden=true;list.append(info('検索結果なし','技データを接続していないため検索は実行できません。'));}return;}
 const q=state.query.trim().toLowerCase();
 const items=sortMoves(MOVES.filter(m=>{if(state.prog!=='all'||state.bookmark){const p=pst(m.i);if(state.prog==='done'&&!p.done)return false;if(state.prog==='todo'&&p.done)return false;if(state.bookmark&&!p.rv)return false;}return matchQuery(m,q)&&passFilters(m);}));
 setStatus('実データ','全 '+MOVES.length+' 技'+(items.length!==MOVES.length?' ／ 該当 '+items.length+' 技':'')+'。チェック・ブックマーク・メモはこの端末に保存されます');
 if(!items.length){list.append(info('条件に合う技がありません。','検索語や絞り込みを変えてください。'));return;}
 const vis=items.slice(0,shownN),made=[];
 for(const m of vis){const r=cardFor(m);list.append(r.card);made.push([m,r.nm]);}
 if(items.length>vis.length){const more=btn('さらに表示（残り '+(items.length-vis.length)+' 技）',()=>{shownN+=PAGE;renderMoves();},'more');more.id='t02More';list.append(more);}
 fitAll();linkCards(made);}
function cmdRows(n){const rg=document.createRange(),tops=new Set();for(const ch of n.childNodes){rg.selectNode(ch);for(const r of rg.getClientRects())if(r.width>0&&r.height>0)tops.add(Math.round(r.top/10));}return tops.size;}
function cmdOver(n,box){const rg=document.createRange();let mx=0;for(const ch of n.childNodes){rg.selectNode(ch);for(const r of rg.getClientRects())mx=Math.max(mx,r.right);}return mx>box.right+1;}
function fitCmd(card){const n=card.querySelector('.cmdtxt');if(!n)return;n.style.removeProperty('--t02cs');const box=card.querySelector('.nm').getBoundingClientRect();if(!box.width)return;
 for(const sc of [1,.9,.8,.7,.6]){n.style.setProperty('--t02cs',String(sc));if(cmdRows(n)<=2&&!cmdOver(n,box))return;}}
function fitAll(){if(!listHost)return;listHost.querySelectorAll('.move-card').forEach(fitCmd);}
window.addEventListener('resize',()=>{clearTimeout(fitAll._t);fitAll._t=setTimeout(fitAll,150);});
function linkCards(made){const C=window.PT_T02_COMBO;if(!C)return;const ch=curChar;
 (linkReady||(linkReady=C.ready())).then(ok=>{if(!ok||ch!==curChar)return;const lk=C.linkerFor(ch);if(!lk)return;
  for(const [m,nm] of made){if(!nm.isConnected)continue;nm.tabIndex=0;nm.setAttribute('role','button');C.decorate(nm,nm,ch,m.name,m.cmd,true,lk).then(r=>{if(!r){nm.removeAttribute('role');nm.removeAttribute('tabindex');}});}});}
function prodCards(){return [...document.querySelectorAll('#viewSheet #list > article.card')];}
let loadedSig='';
function liveMoves(id){try{const c=(typeof CHARACTERS!=='undefined')&&CHARACTERS.find(x=>x.id===id);if(c&&Array.isArray(c.moves)&&c.moves.length&&c.moves[0].a)return c.moves;}catch(e){}return null;}
async function loadFromProduction(force){
 const cards=prodCards();const ic=cards[0]&&cards[0].querySelector('.pt-ic[data-c]');const id=ic?ic.dataset.c:'';
 if(!id){if(!listHost.firstChild){MOVES=[];renderMoves();}return;}
 /* 本番と同じ「管理者の上書きを反映済みの技データ」をそのまま使う。取れないときだけ元ファイルを読む */
 let raw=liveMoves(id);
 if(!raw){raw=RAW[id];if(raw===undefined){try{const r=await fetch('c/'+encodeURIComponent(id)+'.json');raw=r.ok?await r.json():null;}catch(e){raw=null;}RAW[id]=raw;}}
 if(!raw||!mi()){MOVES=[];loadedChar='';curChar='';loadedSig='';renderMoves();return;}
 const sig=id+'|'+raw.length+'|'+cards.length+'|'+JSON.stringify(raw).length;
 if(!force&&sig===loadedSig&&MOVES.length)return;
 const byK=new Map();raw.forEach((o,idx)=>byK.set(String(o&&o.k!=null?o.k:idx),o));
 const used=new Set();const norm=t=>String(t||'').replace(/\s+/g,'');
 MOVES=cards.map(c=>{const i=c.dataset.i;const cname=(c.querySelector('.nt')||{}).textContent||'';let o=byK.get(String(i));
  /* 名前が食い違うときは、同じ名前の未使用の技を探す（取り違え防止） */
  if(!o||norm(o.name)!==norm(cname)){const alt=raw.find(x=>x&&!used.has(x)&&norm(x.name)===norm(cname));if(alt)o=alt;}
  if(o)used.add(o);o=o||{};const a=o.a||{};const info=mi()(o);const cn=c.querySelector('.cmdtxt');
  return {i:+i,name:(c.querySelector('.nt')||{}).textContent||o.name||'',y:o.y||'',a,cmd:String(a.command||''),cmdNode:cn,cmdText:(cn&&cn.textContent)||'',atk:info.atk,tags:new Set(info.tags.map(t=>t.id)),tagLabels:info.tags.map(t=>t.text||t.label)};});
 const sameChar=id===loadedChar;curChar=id;loadedChar=id;loadedSig=sig;if(!sameChar)shownN=PAGE;linkReady=null;renderMoves();}
let resyncT=0;function resyncAll(){clearTimeout(resyncT);resyncT=setTimeout(()=>{if(!listHost||!listHost.isConnected)return;if(state.prog!=='all'||state.bookmark){renderMoves();return;}listHost.querySelectorAll('.move-card').forEach(c=>c._t02sync&&c._t02sync());},500);}
function watchProduction(){document.addEventListener('click',resyncAll,true);const pl=document.querySelector('#viewSheet #list');if(!pl)return;
 new MutationObserver(()=>{clearTimeout(loadTimer);loadTimer=setTimeout(()=>loadFromProduction(false),200);}).observe(pl,{childList:true});}
function buildSheet(v){
 /* order: 1) character (header #charBtn)  2) search row  3) applied-condition chips  4) status / progress  5) move list */
 const tools=mk('div','tools');const search=mk('input','search');search.type='search';search.id='t02Search';search.placeholder='技名・コマンドを検索';search.setAttribute('aria-label','技名・コマンドを検索');search.inputMode='search';search.value=state.query;
 const searchRow=mk('div','sp-searchrow');searchRow.append(search);
 const filterBtn=btn('',()=>openFilter(),'sp-iconbtn sp-filter-btn');filterBtn.id='spFilterButton';filterBtn.setAttribute('aria-controls','filterPanel');filterBtn.setAttribute('aria-expanded','false');filterBtn.setAttribute('aria-haspopup','dialog');filterBtn.setAttribute('aria-label','絞り込み・並べ替えを開く');
 const fi=mk('span','ic');fi.append(svgIcon('M4 5h16l-6 7.5V19l-4-2v-4.5z'));const bd=mk('span','badge','0');bd.hidden=true;bd.setAttribute('aria-hidden','true');fi.append(bd);filterBtn.append(fi,mk('span','lb','絞り込み'));searchRow.append(filterBtn);
 const settingsBtn=btn('',()=>{const open=settingsPanel.hidden;settingsPanel.hidden=!open;settingsBtn.setAttribute('aria-expanded',String(open));},'sp-iconbtn sp-settings-btn');settingsBtn.id='spSettingsButton';settingsBtn.setAttribute('aria-controls','spSettingsPanel');settingsBtn.setAttribute('aria-expanded','false');settingsBtn.setAttribute('aria-label','表示設定・その他の操作');
 const si=mk('span','ic');si.append(svgIcon('M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6'));settingsBtn.append(si,mk('span','lb','表示設定'));searchRow.append(settingsBtn);tools.append(searchRow);
 const settingsPanel=mk('section','sp-settings-panel');settingsPanel.id='spSettingsPanel';settingsPanel.hidden=true;settingsPanel.setAttribute('aria-label','表示設定');
 const g1=mk('div','sp-set-grp');g1.append(mk('h3','','表示の切り替え'));const toggles=mk('div','tgls');addControl(toggles,'コマンド表示','showCommand',()=>{});addControl(toggles,'答えを表示','showAnswer',()=>{});addControl(toggles,'ブックマークのみ','bookmark',()=>{shownN=PAGE;renderMoves();});g1.append(toggles);
 const g2=mk('div','sp-set-grp');g2.append(mk('h3','','データ操作'));const ops=mk('div','tgls');const opMsg=mk('p','sp-settings-note','');opMsg.id='spOpMsg';opMsg.setAttribute('role','status');
 for(const [label,id,pid] of [['このキャラをリセット','spReset','resetBtn'],['書き出し・読み込み','spIo','openIO']]){const b=btn(label,()=>{const t=$(pid);if(t){t.click();opMsg.textContent='';setTimeout(()=>renderMoves(),400);}else opMsg.textContent='この操作は使えません。';},'cmdtgl sp-op');b.id=id;ops.append(b);}
 g2.append(ops,opMsg);
 settingsPanel.append(g1,g2,mk('p','sp-settings-note','チェック・ブックマーク・メモは、本番と同じ保存先（この端末のブラウザ）に保存されます。'));tools.append(settingsPanel);
 chipHost=mk('div','flt-chips');chipHost.id='filterChips';chipHost.hidden=true;tools.append(chipHost);
 
 const st=mk('div','sp-status');st.setAttribute('role','status');st.append(mk('span','pill','データ未接続'),mk('span','st','技データを読み込めません'));tools.append(st);
 // Progress filter (all / todo / done) is SEPARATE from attribute filters (発生・ガード・ヒット・特殊状態).
 const prow=mk('div','sp-progress');prow.append(mk('span','plabel','進捗'));
 const seg=mk('div','seg');seg.id='t02Seg';seg.setAttribute('role','group');seg.setAttribute('aria-label','進捗の表示（属性の絞り込みとは別）');
 for(const [name,label] of [['all','すべて'],['todo','未完了'],['done','完了']]){const b=btn(label,()=>{for(const x of seg.querySelectorAll('button'))x.setAttribute('aria-pressed',String(x===b));state.prog=name;shownN=PAGE;renderMoves();},'');b.dataset.f=name;b.setAttribute('aria-pressed',String(name==='all'));seg.append(b);}
 prow.append(seg);tools.append(prow);v.append(tools);
 const fnote=mk('p','sp-filter-note','絞り込み条件を保持しています。技データ未接続のため、一覧への適用結果は表示されません。');fnote.id='spFilterNote';fnote.hidden=true;v.append(fnote);
 const list=mk('div','list card-list');list.id='t02List';v.append(list);listHost=list;statusEl=st;
 search.addEventListener('input',()=>{state.query=search.value;renderMoves();});
 loadFromProduction();watchProduction();
 renderChips();
}

function mount(){
 const host=$('viewSheet');if(!host||$('t02Sheet'))return;
 const root=mk('div','');root.id='t02Sheet';host.append(root);buildSheet(root);buildFilterPanel();
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeFilter(true);}else trapTab(e);});
 window.addEventListener('popstate',()=>{if(suppressPop){suppressPop=false;return;}if(filterOpen)closeFilter(true,true);});
 window.addEventListener('hashchange',()=>{if(filterOpen)closeFilter(false);});
 const watch=new MutationObserver(()=>{if(filterOpen&&(document.querySelector('.sheet.show')||($('mn')&&$('mn').classList.contains('on'))))closeFilter(false);});
 document.querySelectorAll('.sheet').forEach(s=>watch.observe(s,{attributes:true,attributeFilter:['class']}));if($('mn'))watch.observe($('mn'),{attributes:true,attributeFilter:['class']});
}
window.PT_T02_TEST={setUserCols(a){state.userCols=a?new Set(a):null;const r=$('t02Sheet');r.replaceChildren();buildSheet(r);},getApplied(){return filterItems(applied).map(x=>x.full);}};/* verification seam only; not for production port */
mount();
})();
