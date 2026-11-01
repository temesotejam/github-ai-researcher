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
