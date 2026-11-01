const state = {
  repos: [], filtered: [], totalPublic: 0, profilesGeneratedAt: null,
  report: "", selectedId: null, compareIds: new Set(), tab: "overview",
  query: "", language: "all", confidence: "all", maturity: "all"
};
const $ = id => document.getElementById(id);
const els = {
  updatedAt:$("updatedAt"), metricTotal:$("metricTotal"), metricAnalyzed:$("metricAnalyzed"),
  metricRemaining:$("metricRemaining"), metricDate:$("metricDate"), search:$("searchInput"),
  language:$("languageFilter"), confidence:$("confidenceFilter"), maturity:$("maturityFilter"),
  repoList:$("repoList"), detail:$("detailPanel"), resultCount:$("resultCount"),
  recent:$("recentRepos"), signals:$("signalGrid"), languageBars:$("languageBars"),
  report:$("reportContent"), reportDate:$("reportDate"), compareDock:$("compareDock"),
  compareCount:$("compareCount"), compareSelected:$("compareSelected"),
  compareButton:$("compareButton"), compareSection:$("compareSection"),
  compareTable:$("compareTable")
};
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const arr = value => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const dateText = value => value ? new Date(value).toLocaleDateString("ja-JP") : "—";
const dateTime = value => value ? new Date(value).toLocaleString("ja-JP") : "—";
const shortName = full => String(full || "").split("/").pop();
const validGitHubUrl = value => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname === "github.com" && u.pathname.startsWith("/temesotejam/");
  } catch { return false; }
};
function blobUrl(repo, filePath) {
  if (!validGitHubUrl(repo.url) || !repo.availablePaths.includes(filePath)) return "";
  return repo.url + "/blob/" + encodeURIComponent(repo.defaultBranch) + "/" +
    filePath.split("/").map(encodeURIComponent).join("/");
}
function normalizeRepo(fullName, entry, metadata) {
  const p = entry.profile || {};
  return {
    id: fullName, fullName, name: shortName(fullName),
    url: validGitHubUrl(entry.url) ? entry.url : "https://github.com/" + fullName,
    defaultBranch: entry.default_branch || "main",
    pushedAt: entry.pushed_at || (metadata || {}).pushed_at || null,
    archived: Boolean(entry.archived || (metadata || {}).archived),
    language: (metadata || {}).language || "",
    description: (metadata || {}).description || "",
    analyzedAt: entry.analyzed_at || null,
    availablePaths: arr(entry.available_paths),
    profile: {
      purpose:String(p.purpose || ""), architecture:String(p.architecture || ""),
      technologies:arr(p.technologies), algorithms:arr(p.algorithms),
      hardware:arr(p.hardware), interfaces:arr(p.interfaces),
      constraints:arr(p.constraints), evidence:arr(p.evidence),
      reusable:Array.isArray(p.reusable_components) ? p.reusable_components.filter(x=>x&&typeof x==="object").map(x=>({
        name:String(x.name||""), purpose:String(x.purpose||""), evidence:arr(x.evidence)
      })).filter(x=>x.name) : [],
      maturity:String(p.maturity || "不明"),
      confidence:["high","medium","low"].includes(p.confidence) ? p.confidence : "low"
    }
  };
}
async function fetchData(url, type) {
  const response = await fetch(url, {cache:"no-store"});
  if (!response.ok) throw new Error("読み込み失敗: " + url + " (" + response.status + ")");
  return type === "json" ? response.json() : response.text();
}
async function boot() {
  try {
    const values = await Promise.all([
      fetchData("./data/profiles.json","json"),
      fetchData("./data/repository-index.json","json"),
      fetchData("./reports/latest.md","text")
    ]);
    const profilesJson=values[0], indexJson=values[1];
    state.report=values[2];
    state.totalPublic=Number(indexJson.repository_count || 0);
    state.profilesGeneratedAt=profilesJson.generated_at || null;
    const meta=new Map((indexJson.repositories || []).map(r=>[r.full_name,r]));
    state.repos=Object.entries(profilesJson.profiles || {}).map(([name,e])=>normalizeRepo(name,e,meta.get(name)))
      .sort((a,b)=>new Date(b.pushedAt||0)-new Date(a.pushedAt||0));
    state.selectedId=state.repos[0] ? state.repos[0].id : null;
    populateFilters();
    bindEvents();
    renderAll();
    renderReport(state.report);
    els.updatedAt.textContent="UPDATED " + dateTime(state.profilesGeneratedAt);
  } catch(error) {
    console.error(error);
    els.updatedAt.textContent="DATA LOAD ERROR";
    els.repoList.innerHTML='<div class="empty-note">データを読み込めませんでした。GitHub Actionsの実行とPagesの公開状態を確認してください。<br>'+esc(error.message)+'</div>';
    els.detail.innerHTML='<div class="detail-empty"><h3>データを読み込めません</h3><p>公開データの配置を確認してください。</p></div>';
  }
}
function populateFilters() {
  const languages=[...new Set(state.repos.map(r=>r.language).filter(Boolean))].sort();
  const maturities=[...new Set(state.repos.map(r=>r.profile.maturity).filter(Boolean))].sort();
  els.language.innerHTML='<option value="all">すべて</option>'+languages.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
  els.maturity.innerHTML='<option value="all">すべて</option>'+maturities.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
}
function bindEvents() {
  els.search.addEventListener("input",()=>{state.query=els.search.value.trim().toLowerCase();applyFilters();});
  els.language.addEventListener("change",()=>{state.language=els.language.value;applyFilters();});
  els.confidence.addEventListener("change",()=>{state.confidence=els.confidence.value;applyFilters();});
  els.maturity.addEventListener("change",()=>{state.maturity=els.maturity.value;applyFilters();});
  $("resetFilters").addEventListener("click",()=>{
    state.query="";state.language="all";state.confidence="all";state.maturity="all";
    els.search.value="";els.language.value="all";els.confidence.value="all";els.maturity.value="all";applyFilters();
  });
  document.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>openTab(button.dataset.tab)));
  document.querySelectorAll("[data-open-tab]").forEach(button=>button.addEventListener("click",()=>openTab(button.dataset.openTab)));
  els.repoList.addEventListener("click",event=>{
    const select=event.target.closest("[data-select-repo]");
    if(select){state.selectedId=select.dataset.selectRepo;renderRepoList();renderDetail();return;}
  });
  els.repoList.addEventListener("change",event=>{
    const check=event.target.closest("[data-compare-repo]");
    if(check) toggleCompare(check.dataset.compareRepo,check.checked);
  });
  els.recent.addEventListener("click",event=>{
    const card=event.target.closest("[data-recent-repo]");
    if(card){state.selectedId=card.dataset.recentRepo;openTab("repositories");renderRepoList();renderDetail();}
  });
  els.compareButton.addEventListener("click",renderComparison);
  $("clearCompare").addEventListener("click",()=>{state.compareIds.clear();renderRepoList();renderCompareDock();els.compareSection.hidden=true;});
  $("closeCompare").addEventListener("click",()=>{els.compareSection.hidden=true;});
}
function openTab(name) {
  state.tab=name;
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("is-active",x.dataset.tab===name));
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.toggle("is-visible",x.id==="panel-"+name));
  if(name==="repositories"){renderRepoList();renderDetail();}
  if(name==="components")renderAssets();
  if(name==="report")renderReport(state.report);
}
function applyFilters() {
  state.filtered=state.repos.filter(repo=>{
    if(state.language!=="all"&&repo.language!==state.language)return false;
    if(state.confidence!=="all"&&repo.profile.confidence!==state.confidence)return false;
    if(state.maturity!=="all"&&repo.profile.maturity!==state.maturity)return false;
    if(!state.query)return true;
    const p=repo.profile;
    const text=[repo.fullName,repo.language,repo.description,p.purpose,p.architecture,p.maturity,
      ...p.technologies,...p.algorithms,...p.hardware,...p.interfaces,...p.constraints,...p.evidence,
      ...p.reusable.flatMap(x=>[x.name,x.purpose,...x.evidence])].join(" ").toLowerCase();
    return text.includes(state.query);
  });
  if(state.selectedId&&!state.filtered.some(x=>x.id===state.selectedId))state.selectedId=state.filtered[0]?.id||null;
  renderRepoList();renderDetail();renderAssets();renderCompareDock();
  $("tabRepoCount").textContent=String(state.filtered.length);
  els.resultCount.textContent=state.filtered.length+" RESULTS";
}
function renderAll() {
  const analyzed=state.repos.length, remaining=Math.max(0,state.totalPublic-analyzed);
  $("metricTotal").textContent=String(state.totalPublic);
  $("metricAnalyzed").textContent=String(analyzed);
  $("metricRemaining").textContent=String(remaining);
  const reportDate=(state.report.match(/^#\s+GitHub AI Researcher\s+—\s+(\d{4}-\d{2}-\d{2})/m)||[])[1]||"—";
  $("metricDate").textContent=reportDate;
  const percent=state.totalPublic?Math.round(analyzed/state.totalPublic*100):0;
  $("coveragePercent").textContent=percent+"%";
  $("coverageBar").style.width=percent+"%";
  $("coverageAnalyzed").textContent=analyzed+" 件を分析";
  $("coverageRemaining").textContent=remaining+" 件が未分析";
  renderLanguageBars();renderRecent();renderSignals();
  applyFilters();renderCompareDock();
  $("reportDate").textContent=reportDate;
}
function renderLanguageBars() {
  const counts={};
  state.repos.forEach(r=>{const k=r.language||"Unknown";counts[k]=(counts[k]||0)+1;});
  const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const max=rows[0]?.[1]||1;
  els.languageBars.innerHTML=rows.length?rows.map(([name,n])=>
    '<div class="bar-row"><span class="bar-name">'+esc(name)+'</span><span class="bar-track"><i style="width:'+Math.round(n/max*100)+'%"></i></span><span class="bar-value">'+n+'</span></div>'
  ).join(""):'<p class="empty-note">言語データがありません。</p>';
}
function renderRecent() {
  const recent=state.repos.slice(0,4);
  els.recent.innerHTML=recent.length?recent.map(r=>
    '<article class="recent-card" data-recent-repo="'+esc(r.id)+'"><small>'+esc(r.language||"UNKNOWN")+' · '+esc(dateText(r.pushedAt))+'</small><h3>'+esc(r.name)+'</h3><p>'+esc(r.profile.purpose.slice(0,105))+'</p></article>'
  ).join(""):'<p class="empty-note">分析済みリポジトリはまだありません。</p>';
}
function renderSignals() {
  const map=new Map();
  state.repos.forEach(repo=>repo.profile.technologies.forEach(tag=>{
    if(!map.has(tag))map.set(tag,new Set());
    map.get(tag).add(repo.fullName);
  }));
  const shared=[...map.entries()].filter(x=>x[1].size>1).sort((a,b)=>b[1].size-a[1].size).slice(0,6);
  els.signals.innerHTML=shared.length?shared.map(([name,repos])=>
    '<article class="signal-card"><strong>'+esc(name)+'</strong><span>'+repos.size+' repositories · 同じ技術タグを確認</span></article>'
  ).join(""):'<p class="empty-note">複数リポジトリに共通する技術タグはまだありません。</p>';
}

function renderRepoList(){
  if(!state.filtered.length){els.repoList.innerHTML='<div class="empty-note">条件に一致するリポジトリがありません。</div>';return;}
  els.repoList.innerHTML=state.filtered.map(r=>{
    const p=r.profile, active=state.selectedId===r.id, checked=state.compareIds.has(r.id);
    const tags=p.technologies.slice(0,5).map(t=>'<span class="tag">'+esc(t)+'</span>').join("");
    return '<article class="repo-card'+(active?' is-selected':'')+'"><div class="repo-card-head">'+
      '<button class="repo-name-button" data-select-repo="'+esc(r.id)+'" type="button">'+esc(r.name)+'</button>'+
      '<span class="confidence confidence-'+p.confidence+'">'+esc(p.confidence.toUpperCase())+'</span></div>'+
      '<p class="repo-purpose">'+esc(p.purpose||"目的情報なし")+'</p><div class="repo-meta">'+
      '<span class="small-pill">'+esc(r.language||"Unknown")+'</span><span class="small-pill">'+esc(p.maturity)+'</span>'+
      (r.archived?'<span class="small-pill">ARCHIVED</span>':"")+'</div><div class="tag-list">'+(tags||'<span class="tag">技術情報なし</span>')+'</div>'+
      '<div class="repo-card-actions"><label><input type="checkbox" data-compare-repo="'+esc(r.id)+'" '+(checked?'checked':"")+
      (!checked&&state.compareIds.size>=3?' disabled':"")+'> 比較に追加</label>'+
      '<button class="text-button" data-select-repo="'+esc(r.id)+'" type="button">'+(active?'選択中':'詳細を見る →')+'</button></div></article>';
  }).join("");
}
function tagsSection(title,items){
  return items.length?'<section class="detail-section"><h4>'+esc(title)+'</h4><div class="tag-list">'+items.map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div></section>':"";
}
function renderDetail(){
  const r=state.filtered.find(x=>x.id===state.selectedId)||state.repos.find(x=>x.id===state.selectedId);
  if(!r){els.detail.innerHTML='<div class="detail-empty"><span>↖</span><h3>リポジトリを選択</h3><p>一覧から選ぶと詳細が表示されます。</p></div>';return;}
  const p=r.profile, paths=new Set(r.availablePaths);
  const evidence=[...new Set([...p.evidence,...p.reusable.flatMap(c=>c.evidence)])].filter(x=>paths.has(x)).slice(0,12);
  const links=evidence.map(x=>{const u=blobUrl(r,x);return u?'<a class="evidence-link" href="'+esc(u)+'" target="_blank" rel="noreferrer">'+esc(x)+' ↗</a>':"";}).join("")||"<p>根拠ファイルは記録されていません。</p>";
  const comps=p.reusable.map(c=>'<li><strong>'+esc(c.name)+'</strong> — '+esc(c.purpose)+
    c.evidence.filter(x=>paths.has(x)).map(x=>{const u=blobUrl(r,x);return u?'<a class="evidence-link" href="'+esc(u)+'" target="_blank" rel="noreferrer">'+esc(x)+'</a>':"";}).join("")+'</li>').join("")||"<li>抽出された再利用候補はありません。</li>";
  els.detail.innerHTML='<div class="panel-heading"><div><span class="panel-kicker">REPOSITORY PROFILE</span><h3 class="detail-title">'+esc(r.fullName)+'</h3></div>'+
    '<span class="confidence confidence-'+p.confidence+'">'+p.confidence.toUpperCase()+'</span></div><p class="detail-purpose">'+esc(p.purpose)+'</p>'+
    '<div class="repo-meta"><span class="small-pill">'+esc(r.language||"Unknown")+'</span><span class="small-pill">'+esc(p.maturity)+'</span><span class="small-pill">更新 '+dateText(r.pushedAt)+'</span></div>'+
    (p.architecture?'<section class="detail-section"><h4>ARCHITECTURE</h4><p>'+esc(p.architecture)+'</p></section>':"")+
    tagsSection("TECHNOLOGIES",p.technologies)+tagsSection("ALGORITHMS",p.algorithms)+tagsSection("HARDWARE",p.hardware)+tagsSection("INTERFACES",p.interfaces)+
    '<section class="detail-section"><h4>REUSABLE COMPONENTS</h4><ul>'+comps+'</ul></section>'+
    (p.constraints.length?'<section class="detail-section"><h4>CONSTRAINTS / UNKNOWN</h4><ul>'+p.constraints.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></section>':"")+
    '<section class="detail-section"><h4>EVIDENCE FILES</h4>'+links+'</section><div class="detail-actions">'+
    '<a class="button-link" href="'+esc(r.url)+'" target="_blank" rel="noreferrer">Repository ↗</a>'+
    '<button class="button-link" id="detailCompare" type="button">'+(state.compareIds.has(r.id)?"比較から外す":"比較に追加 +")+'</button></div>';
  $("detailCompare").addEventListener("click",()=>toggleCompare(r.id,!state.compareIds.has(r.id)));
}
function toggleCompare(id,add){
  if(add&&state.compareIds.size<3)state.compareIds.add(id);
  if(!add)state.compareIds.delete(id);
  renderRepoList();renderDetail();renderCompareDock();
}
function renderCompareDock(){
  const chosen=[...state.compareIds].map(id=>state.repos.find(r=>r.id===id)).filter(Boolean);
  els.compareDock.hidden=!chosen.length;els.compareCount.textContent=chosen.length;
  els.compareSelected.innerHTML=chosen.map(r=>'<span class="compare-chip">'+esc(r.name)+'</span>').join("");
  els.compareButton.disabled=chosen.length<2;
  if(state.tab==="repositories")renderRepoList();
}
function renderComparison(){
  const chosen=[...state.compareIds].map(id=>state.repos.find(r=>r.id===id)).filter(Boolean);
  if(chosen.length<2)return;
  const fields=[
    ["目的",r=>r.profile.purpose],["構成",r=>r.profile.architecture],["技術",r=>r.profile.technologies.join(" / ")],
    ["アルゴリズム",r=>r.profile.algorithms.join(" / ")],["ハードウェア",r=>r.profile.hardware.join(" / ")],
    ["インターフェース",r=>r.profile.interfaces.join(" / ")],
    ["再利用候補",r=>r.profile.reusable.map(c=>c.name+": "+c.purpose).join(" / ")],
    ["制約・未確認",r=>r.profile.constraints.join(" / ")],["確信度",r=>r.profile.confidence]
  ];
  els.compareTable.innerHTML='<table class="compare-table"><thead><tr><th>比較項目</th>'+chosen.map(r=>'<th>'+esc(r.name)+'</th>').join("")+
    '</tr></thead><tbody>'+fields.map(([label,get])=>'<tr><th>'+esc(label)+'</th>'+chosen.map(r=>'<td>'+esc(get(r)||"—")+'</td>').join("")+'</tr>').join("")+
    '</tbody></table>';
  els.compareSection.hidden=false;els.compareSection.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderAssets(){
  const comps=[],tech=new Map();
  state.filtered.forEach(r=>{
    r.profile.reusable.forEach(c=>comps.push({name:c.name,purpose:c.purpose,repo:r}));
    r.profile.technologies.forEach(t=>{if(!tech.has(t))tech.set(t,new Map());tech.get(t).set(r.id,r);});
  });
  const grouped=new Map();
  comps.forEach(c=>{if(!grouped.has(c.name))grouped.set(c.name,{name:c.name,purpose:c.purpose,sources:[]});grouped.get(c.name).sources.push(c.repo);});
  const assets=[...grouped.values()].sort((a,b)=>b.sources.length-a.sources.length);
  const shared=[...tech.entries()].filter(x=>x[1].size>1).sort((a,b)=>b[1].size-a[1].size);
  $("assetSummary").innerHTML='<div class="asset-stat"><strong>'+assets.length+'</strong><span>コンポーネント名</span></div>'+
    '<div class="asset-stat"><strong>'+comps.length+'</strong><span>再利用候補の記録数</span></div>'+
    '<div class="asset-stat"><strong>'+shared.length+'</strong><span>共有技術タグ</span></div>';
  $("componentCount").textContent=assets.length+" ASSETS";
  $("componentGrid").innerHTML=assets.length?assets.map(c=>'<article class="component-card"><h3>'+esc(c.name)+'</h3><p>'+esc(c.purpose||"用途の説明なし")+
    '</p><div class="component-sources">'+c.sources.map(r=>'<a href="'+esc(r.url)+'" target="_blank" rel="noreferrer">'+esc(r.name)+'</a>').join("")+
    '</div></article>').join(""):'<div class="empty-note">再利用候補がありません。</div>';
  $("sharedTechList").innerHTML=shared.length?shared.map(([name,rs])=>'<div class="shared-tech"><strong>'+esc(name)+'</strong><span>'+rs.size+' repositories</span></div>').join(""):'<div class="empty-note">共有技術タグはありません。</div>';
}
function renderReport(markdown){
  els.report.innerHTML=markdownToHtml(markdown);
}
function inlineMd(text){
  let s=esc(text);
  s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,(_m,label,url)=>
    '<a href="'+url+'" target="_blank" rel="noreferrer">'+label+'</a>');
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/\*([^*]+)\*/g,"<em>$1</em>");
  return s;
}
function markdownToHtml(markdown){
  const lines=String(markdown||"").replace(/\r\n/g,"\n").split("\n"),out=[];
  let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(!line.trim()){i++;continue;}
    if(/^---+$/.test(line.trim())){out.push("<hr>");i++;continue;}
    if(line.startsWith("```")){
      const code=[];i++;
      while(i<lines.length&&!lines[i].startsWith("```")){code.push(lines[i]);i++;}
      i++;out.push("<pre><code>"+esc(code.join("\n"))+"</code></pre>");continue;
    }
    const h=line.match(/^(#{1,6})\s+(.*)$/);
    if(h){const n=h[1].length;out.push("<h"+n+">"+inlineMd(h[2])+"</h"+n+">");i++;continue;}
    if(line.startsWith("> ")){
      const q=[];while(i<lines.length&&lines[i].startsWith("> ")){q.push(inlineMd(lines[i].slice(2)));i++;}
      out.push("<blockquote>"+q.join("<br>")+"</blockquote>");continue;
    }
    if(line.includes("|")&&i+1<lines.length&&/^\s*\|?[-\s:|]+\|?\s*$/.test(lines[i+1])){
      const rows=[line];i+=2;
      while(i<lines.length&&lines[i].includes("|")&&lines[i].trim()){rows.push(lines[i]);i++;}
      const cells=rows.map(row=>row.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(x=>x.trim()));
      out.push("<table><thead><tr>"+cells[0].map(x=>"<th>"+inlineMd(x)+"</th>").join("")+"</tr></thead><tbody>"+
        cells.slice(1).map(row=>"<tr>"+row.map(x=>"<td>"+inlineMd(x)+"</td>").join("")+"</tr>").join("")+"</tbody></table>");
      continue;
    }
    if(/^\s*[-*]\s+/.test(line)||/^\s*\d+\.\s+/.test(line)){
      const ordered=/^\s*\d+\.\s+/.test(line),items=[];
      const re=ordered?/^\s*\d+\.\s+/:/^\s*[-*]\s+/;
      while(i<lines.length&&re.test(lines[i])){items.push("<li>"+inlineMd(lines[i].replace(re,""))+"</li>");i++;}
      out.push((ordered?"<ol>":"<ul>")+items.join("")+(ordered?"</ol>":"</ul>"));continue;
    }
    const p=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,6})\s+/.test(lines[i])&&!lines[i].startsWith("> ")&&!lines[i].startsWith("```")&&!/^\s*[-*]\s+/.test(lines[i])&&!/^\s*\d+\.\s+/.test(lines[i])&&!/^---+$/.test(lines[i].trim())){
      p.push(lines[i]);i++;
    }
    out.push("<p>"+inlineMd(p.join(" "))+"</p>");
  }
  return out.join("\n");
}
boot();
