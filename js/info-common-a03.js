window.PT_NP_CSS=`
:host{display:block;color:var(--text);font-family:inherit}*{box-sizing:border-box}button,a{font:inherit}a{color:inherit;text-decoration:none}
.np{max-width:1100px;margin:0 auto 48px}.np h2,.np h3,.np p,.np ol,.np ul{margin:0;padding:0}.np :focus-visible{outline:2px solid var(--ok);outline-offset:2px}
.pt-hero{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:18px;padding:clamp(22px,4vw,46px);background:linear-gradient(135deg,var(--panel),color-mix(in srgb,var(--accent) 8%,var(--panel)));box-shadow:0 18px 48px rgba(0,0,0,.22)}
.pt-kicker{display:inline-flex;align-items:center;gap:7px;margin:0 6px 10px 0;padding:5px 10px;border:1px solid var(--accent);border-radius:99px;background:var(--accent-soft);font-size:.74rem;font-weight:800;letter-spacing:.08em;color:var(--text)}
.pt-kicker.on{background:var(--accent);color:var(--on)}
.pt-hero h2{margin:0 0 10px;font-size:clamp(1.5rem,4vw,2.4rem);line-height:1.22;letter-spacing:.03em}
.pt-hero p{margin:0;max-width:760px;color:var(--sub)}
.pt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);font-weight:800;text-decoration:none;cursor:pointer}
.pt-btn:hover{border-color:var(--accent);background:var(--accent-soft)}
.pt-btn.primary{border-color:var(--accent);background:var(--accent);color:var(--on)}
.pt-btn[aria-disabled="true"],.pt-btn:disabled{opacity:.48;cursor:not-allowed}.pt-btn[aria-disabled="true"]{pointer-events:none}
.pt-note{margin-top:14px;padding:10px 12px;border-left:3px solid var(--warn);border-radius:0 8px 8px 0;background:color-mix(in srgb,var(--warn) 9%,transparent);font-size:.82rem;color:var(--sub)}
.pt-note b{color:var(--text)}
.pt-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
.pt-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:18px;min-width:0}
.pt-card h3{margin:0 0 6px;font-size:1rem}.pt-card p{margin:0;color:var(--sub);font-size:.86rem}
.pt-stat{font-size:1.45rem;font-weight:900;color:var(--accent);line-height:1.15;margin:3px 0 7px}
.pt-sec{margin-top:24px;border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:clamp(16px,3vw,26px)}
.pt-sec>h2,.pt-sec>h3{margin:0 0 8px}.pt-sec>p{margin:0 0 14px;color:var(--sub)}
.pt-list{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:8px}
.pt-list li{position:relative;padding:10px 12px 10px 30px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:.86rem;line-height:1.7}
.pt-list li::before{content:"";position:absolute;left:12px;top:1.05em;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.pt-steps{counter-reset:ptstep;display:grid;gap:10px;margin:14px 0 0;padding:0;list-style:none}
.pt-steps>li{counter-increment:ptstep;display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start;padding:12px;border:1px solid var(--line);border-radius:11px;background:color-mix(in srgb,var(--bg) 28%,var(--panel))}
.pt-steps>li::before{content:counter(ptstep);display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--accent);color:var(--on);font-weight:900}
.pt-steps b{display:block;margin-bottom:2px}.pt-steps span,.pt-steps p{color:var(--sub);font-size:.84rem;margin:0}
.pt-linkgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
.pt-linkcard{display:block;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg);color:var(--text)}
.pt-linkcard b{display:block}.pt-linkcard span{display:block;margin-top:3px;color:var(--sub);font-size:.8rem}
.pt-toc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:18px}
.pt-toc a{padding:10px;border:1px solid var(--line);border-radius:10px;color:var(--text);background:var(--panel);text-align:center;font-size:.8rem;font-weight:800}
.pt-toc a:hover{border-color:var(--accent);background:var(--accent-soft)}
.pt-guide{scroll-margin-top:100px}
.pt-guide details{border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-top:10px;overflow:hidden}
.pt-guide summary{cursor:pointer;padding:14px 16px;font-weight:900;list-style:none}.pt-guide summary::-webkit-details-marker{display:none}
.pt-guide summary::after{content:"＋";float:right;color:var(--accent)}.pt-guide details[open] summary::after{content:"－"}
.pt-detail{padding:0 16px 16px;border-top:1px solid var(--line)}
.pt-detail .pt-steps{margin-top:14px}
.pt-check{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.pt-check div{padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--bg);font-size:.82rem}
.pt-check div::before{content:"✓";margin-right:.55em;color:var(--ok);font-weight:900}
.pt-price{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 12px}
.pt-price .pt-card{position:relative}
.pt-yen{font-size:2.2rem;font-weight:950;letter-spacing:-.04em}.pt-yen small{font-size:.75rem;color:var(--sub);font-weight:700;letter-spacing:0}
.pt-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden;table-layout:auto}
.pt-table th,.pt-table td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--line);font-size:.84rem}.pt-table th{background:var(--head)}.pt-table tr:last-child td{border-bottom:0}.pt-table td:last-child{font-weight:800}
.pt-badge{display:inline-block;padding:2px 7px;border:1px solid var(--line);border-radius:99px;font-size:.68rem;font-weight:800;color:var(--sub)}
@media(max-width:900px){.pt-grid,.pt-price{grid-template-columns:1fr 1fr}.pt-toc{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.pt-grid,.pt-price,.pt-linkgrid,.pt-check{grid-template-columns:1fr}.pt-toc{grid-template-columns:1fr 1fr}.pt-hero{border-radius:14px}.pt-table th,.pt-table td{padding:10px 8px;font-size:.78rem}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;window.PT_NP_BIND=function(root){root.addEventListener("click",function(e){const t=e.target;const off=t&&t.closest&&t.closest('a[aria-disabled="true"]');if(off){e.preventDefault();return;}
const go=t&&t.closest&&t.closest("[data-pt-go]");if(go){e.preventDefault();if(window.setPage)window.setPage(go.getAttribute("data-pt-go"));return;}
const a=t&&t.closest&&t.closest('a[href^="#ptg-"]');if(a){e.preventDefault();const el=root.getElementById(a.getAttribute("href").slice(1));if(el)el.scrollIntoView({behavior:(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)?"auto":"smooth",block:"start"});}});};