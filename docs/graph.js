(() => {
const $=id=>document.getElementById(id), canvas=$("knowledgeGraph");
if(!canvas)return;
const ctx=canvas.getContext("2d"),wrap=$("graphCanvasWrap");
const S={nodes:[],edges:[],map:new Map(),adj:new Map(),selected:null,hover:null,query:"",type:"all",related:false,w:0,h:0,dpr:1,scale:1,ox:0,oy:0,drag:null,pan:null};
const C={account:"#e0c18b",repository:"#b8d9d0",technology:"#7fb7d1",hardware:"#d4a5d8",language:"#e1a66f",theme:"#9bc18d"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const rad=n=>n.type==="account"?14:n.type==="theme"?11:n.type==="repository"?7:5+Math.min(3,Math.log2((n.repoCount||1)+1));
const url=n=>n.repo&&/^temesotejam\/[A-Za-z0-9_.-]+$/.test(n.repo)?"https://github.com/"+n.repo:"";
async function init(){
 try{
  const r=await fetch("./data/graph.json",{cache:"no-store"});if(!r.ok)throw Error("graph.json "+r.status);
  const g=await r.json();S.nodes=g.nodes||[];S.edges=(g.edges||[]).filter(e=>e.type!=="owns");S.map=new Map(S.nodes.map(n=>[n.id,n]));S.adj=new Map(S.nodes.map(n=>[n.id,[]]));
  S.edges.forEach(e=>{S.adj.get(e.source)?.push({id:e.target,edge:e});S.adj.get(e.target)?.push({id:e.source,edge:e});});
  $("graphStats").innerHTML=[["REPOSITORIES",g.stats.repository_count],["NODES",g.stats.node_count],["CONNECTIONS",g.stats.edge_count],["RELATED PAIRS",g.stats.related_repository_pairs]].map(x=>'<div class="graph-stat"><small>'+x[0]+'</small><strong>'+Number(x[1]||0).toLocaleString("ja-JP")+'</strong></div>').join("");
  position();events();resize();$("graphStatus").textContent=S.nodes.length+" NODES · "+S.edges.length+" EDGES";$("graphLoading").hidden=true;draw();
  const first=S.nodes.find(n=>n.type==="theme")||S.nodes.find(n=>n.type==="repository");if(first)select(first.id);
 }catch(e){$("graphStatus").textContent="LOAD ERROR";$("graphLoading").textContent="グラフを読み込めませんでした: "+e.message;$("graphLoading").classList.add("is-error");}
}
function position(){
 const themes=S.nodes.filter(n=>n.type==="theme"),repos=S.nodes.filter(n=>n.type==="repository"),features=S.nodes.filter(n=>["technology","hardware","language"].includes(n.type)),ta=new Map();
 themes.forEach((n,i)=>{const a=2*Math.PI*i/Math.max(1,themes.length)-Math.PI/2;ta.set(n.id,a);n.x=Math.cos(a)*180;n.y=Math.sin(a)*180;});
 repos.forEach(n=>{const t=(S.adj.get(n.id)||[]).map(x=>S.map.get(x.id)).filter(x=>x?.type==="theme"),a=t.length?Math.atan2(t.reduce((s,x)=>s+Math.sin(ta.get(x.id)),0),t.reduce((s,x)=>s+Math.cos(ta.get(x.id)),0))+(hash(n.id)%100/100-.5)*.5:hash(n.id)/4294967295*6.28,r=320+hash(n.id)%100;n.x=Math.cos(a)*r;n.y=Math.sin(a)*r;});
 features.forEach(n=>{const rs=(S.adj.get(n.id)||[]).map(x=>S.map.get(x.id)).filter(x=>x?.type==="repository");if(rs.length){n.x=rs.reduce((s,x)=>s+x.x,0)/rs.length;n.y=rs.reduce((s,x)=>s+x.y,0)/rs.length;const d=Math.hypot(n.x,n.y)||1;n.x+=n.x/d*85;n.y+=n.y/d*85;}else{const a=hash(n.id)/4294967295*6.28;n.x=Math.cos(a)*500;n.y=Math.sin(a)*500;}});
 const a=S.nodes.find(n=>n.type==="account");if(a){a.x=0;a.y=0;}
}
function resize(){const r=wrap.getBoundingClientRect();S.w=Math.max(300,r.width);S.h=Math.max(440,r.height);S.dpr=Math.min(2,devicePixelRatio||1);canvas.width=S.w*S.dpr;canvas.height=S.h*S.dpr;canvas.style.width=S.w+"px";canvas.style.height=S.h+"px";ctx.setTransform(S.dpr,0,0,S.dpr,0,0);fit();}
function visible(n){return S.type==="all"||n.type===S.type||n.type==="account"||(S.type!=="repository"&&n.type==="repository");}
function match(n){return !S.query||[n.label,n.repo,n.description,n.purpose,n.language].filter(Boolean).join(" ").toLowerCase().includes(S.query);}
function scr(x,y){return{x:S.w/2+(x+S.ox)*S.scale,y:S.h/2+(y+S.oy)*S.scale};}
function wrd(x,y){return{x:(x-S.w/2)/S.scale-S.ox,y:(y-S.h/2)/S.scale-S.oy};}
function fit(){if(!S.nodes.length)return;const xs=S.nodes.map(n=>n.x),ys=S.nodes.map(n=>n.y),dx=Math.max(...xs)-Math.min(...xs),dy=Math.max(...ys)-Math.min(...ys);S.scale=Math.max(.22,Math.min(1.25,(S.w-100)/(dx+1),(S.h-100)/(dy+1)));S.ox=-(Math.max(...xs)+Math.min(...xs))/2;S.oy=-(Math.max(...ys)+Math.min(...ys))/2;draw();}
function draw(){
 if(!S.w||!S.h)return;ctx.clearRect(0,0,S.w,S.h);ctx.fillStyle="#111a22";ctx.fillRect(0,0,S.w,S.h);
 const focus=S.selected?new Set([S.selected,...(S.adj.get(S.selected)||[]).map(x=>x.id)]):null,found=new Set(S.query?S.nodes.filter(match).map(n=>n.id):[]);
 for(const e of S.edges){if(S.related&&e.type!=="related_to")continue;const a=S.map.get(e.source),b=S.map.get(e.target);if(!a||!b||!visible(a)||!visible(b))continue;const p=scr(a.x,a.y),q=scr(b.x,b.y),hi=!focus||(focus.has(a.id)&&focus.has(b.id));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=e.type==="related_to"?(hi?"rgba(216,189,141,.48)":"rgba(216,189,141,.08)"):(hi?"rgba(155,181,190,.20)":"rgba(155,181,190,.025)");ctx.lineWidth=e.type==="related_to"?1.1:.65;ctx.stroke();}
 for(const n of S.nodes){if(!visible(n))continue;const p=scr(n.x,n.y),sel=n.id===S.selected,hov=n.id===S.hover,alpha=(!focus||focus.has(n.id))&&(!S.query||found.has(n.id))?1:.15;ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(p.x,p.y,rad(n)*Math.max(.7,S.scale)+(sel?4:hov?2:0),0,Math.PI*2);ctx.fillStyle=C[n.type]||"#aaa";ctx.fill();if(sel||hov||n.type==="theme"){ctx.strokeStyle="#f3f5ef";ctx.lineWidth=sel?1.5:1;ctx.stroke();}
 const show=sel||hov||n.type==="theme"||n.type==="account"||(n.type==="repository"&&S.scale>.7)||(n.degree>=5&&S.scale>.8);if(show&&S.scale>.3){ctx.font=(sel?"600 ":"")+((n.type==="theme")?11:9)+"px 'Noto Sans JP',sans-serif";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillStyle=sel?"#f4f5ef":"#c3d0d3";ctx.fillText(n.label.length>28?n.label.slice(0,26)+"…":n.label,p.x,p.y+rad(n)+4);}ctx.globalAlpha=1;}
 if(S.query&&!found.size){ctx.fillStyle="#9aabb5";ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText("一致するノードがありません",S.w/2,S.h/2);}
}
function hit(x,y){let best=null,dist=Infinity;for(const n of S.nodes){if(!visible(n))continue;const p=scr(n.x,n.y),d=Math.hypot(p.x-x,p.y-y);if(d<rad(n)*S.scale+9&&d<dist){best=n;dist=d;}}return best;}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function events(){
 $("graphSearch").addEventListener("input",e=>{S.query=e.target.value.toLowerCase().trim();draw();});
 $("graphSearchClear").addEventListener("click",()=>{$("graphSearch").value="";S.query="";draw();});
 $("graphTypeFilter").addEventListener("change",e=>{S.type=e.target.value;draw();});
 $("graphRelatedOnly").addEventListener("change",e=>{S.related=e.target.checked;draw();});
 $("graphFit").addEventListener("click",fit);$("graphReset").addEventListener("click",()=>{S.selected=null;draw();empty();});
 canvas.addEventListener("pointerdown",e=>{const p=point(e),n=hit(p.x,p.y);canvas.setPointerCapture(e.pointerId);if(n){S.selected=n.id;S.drag=n.id;select(n.id);}else S.pan={x:p.x,y:p.y,ox:S.ox,oy:S.oy};draw();});
 canvas.addEventListener("pointermove",e=>{const p=point(e);if(S.drag){const n=S.map.get(S.drag),w=wrd(p.x,p.y);n.x=w.x;n.y=w.y;draw();return;}if(S.pan){S.ox=S.pan.ox+(p.x-S.pan.x)/S.scale;S.oy=S.pan.oy+(p.y-S.pan.y)/S.scale;draw();return;}const n=hit(p.x,p.y),id=n?.id||null;if(id!==S.hover){S.hover=id;canvas.style.cursor=n?"pointer":"grab";draw();}});
 canvas.addEventListener("pointerup",()=>{S.drag=null;S.pan=null;});canvas.addEventListener("pointercancel",()=>{S.drag=null;S.pan=null;});
 canvas.addEventListener("wheel",e=>{e.preventDefault();const p=point(e),before=wrd(p.x,p.y);S.scale=Math.max(.2,Math.min(2.5,S.scale*Math.exp(-e.deltaY*.001)));const after=wrd(p.x,p.y);S.ox+=after.x-before.x;S.oy+=after.y-before.y;draw();},{passive:false});
 canvas.addEventListener("dblclick",fit);
 $("graphDetail").addEventListener("click",e=>{const b=e.target.closest("[data-graph-node]");if(b)select(b.dataset.graphNode);});
 if(typeof ResizeObserver!=="undefined")new ResizeObserver(resize).observe(wrap);else window.addEventListener("resize",resize);
}
function select(id){
 const n=S.map.get(id);if(!n)return;S.selected=id;draw();
 const rel={related_to:"関連リポジトリ",uses:"使用技術",uses_hardware:"使用ハードウェア",written_in:"使用言語",belongs_to:"所属テーマ"};
 const links=(S.adj.get(id)||[]).map(x=>({n:S.map.get(x.id),e:x.edge})).filter(x=>x.n).sort((a,b)=>(a.e.type==="related_to"?0:1)-(b.e.type==="related_to"?0:1)||b.n.degree-a.n.degree);
 const chips=links.slice(0,30).map(x=>'<button class="graph-neighbor" type="button" data-graph-node="'+esc(x.n.id)+'"><span>'+esc(rel[x.e.type]||"接続")+'</span><strong>'+esc(x.n.label)+'</strong></button>').join("");
 const link=n.type==="repository"&&url(n)?'<a class="button-link" href="'+url(n)+'" target="_blank" rel="noreferrer">GitHubで開く ↗</a>':"";
 const description=n.purpose||n.description||"このノードに追加説明はありません。";
 $("graphDetail").innerHTML='<div class="graph-detail-head"><span class="panel-kicker">'+esc(n.type.toUpperCase())+'</span><h3>'+esc(n.label)+'</h3><p>'+esc(description)+'</p></div>'+
  '<div class="graph-detail-meta"><span>'+esc(n.type)+'</span><span>'+links.length+' connections</span>'+(n.confidence?'<span>confidence: '+esc(n.confidence)+'</span>':"")+'</div>'+
  (link?'<div class="detail-actions">'+link+'</div>':"")+
  '<div class="graph-detail-section"><h4>CONNECTED NODES</h4><div class="graph-neighbors">'+(chips||'<p class="empty-note">接続先がありません。</p>')+'</div></div>';
}
function empty(){$("graphDetail").innerHTML='<div class="detail-empty"><span>◎</span><h3>ノードを選択</h3><p>ネットワーク上のリポジトリや技術を選択すると、つながりを表示します。</p></div>';}
function initResize(){const r=wrap.getBoundingClientRect();S.w=Math.max(300,r.width);S.h=Math.max(440,r.height);S.dpr=Math.min(2,devicePixelRatio||1);canvas.width=S.w*S.dpr;canvas.height=S.h*S.dpr;canvas.style.width=S.w+"px";canvas.style.height=S.h+"px";ctx.setTransform(S.dpr,0,0,S.dpr,0,0);fit();}
function resize(){initResize();}
init();
})();