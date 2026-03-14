/* ============================================================
   bloggers.js - 博主库页面逻辑
   ============================================================ */

let allBloggers = [];
let filteredBloggers = [];
let currentPage = 1;
const PAGE_SIZE = 12;

function init() {
  allBloggers = DB.getBloggers();
  filteredBloggers = [...allBloggers];
  renderBloggers();
}

/* ---------- 筛选 ---------- */
function applyFilter() {
  const search   = document.getElementById('searchInput').value.trim().toLowerCase();
  const platform = document.getElementById('platformFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const fansLvl  = document.getElementById('fansFilter').value;
  const region   = document.getElementById('regionFilter').value;

  filteredBloggers = allBloggers.filter(b => {
    if (search   && !b.name.toLowerCase().includes(search) && !b.tags.join().toLowerCase().includes(search)) return false;
    if (platform && b.platform !== platform) return false;
    if (category && b.category !== category) return false;
    if (region   && b.region   !== region)   return false;
    if (fansLvl) {
      const n = b.fansNum;
      if (fansLvl === 'nano'  && n >= 10000)    return false;
      if (fansLvl === 'micro' && (n < 10000  || n >= 100000))  return false;
      if (fansLvl === 'mid'   && (n < 100000 || n >= 1000000)) return false;
      if (fansLvl === 'macro' && n < 1000000) return false;
    }
    return true;
  });

  currentPage = 1;
  renderBloggers();
}

function resetFilter() {
  document.getElementById('searchInput').value = '';
  document.getElementById('platformFilter').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('fansFilter').value = '';
  document.getElementById('regionFilter').value = '';
  filteredBloggers = [...allBloggers];
  currentPage = 1;
  renderBloggers();
}

function setSortOrder(type) {
  document.querySelectorAll('.pagination ~ div .page-btn, #sortBtns .page-btn').forEach(b => b.classList.remove('active'));
  if (type === 'fans') {
    filteredBloggers.sort((a, b) => b.fansNum - a.fansNum);
  } else if (type === 'likes') {
    filteredBloggers.sort((a, b) => parseFloat(b.likes) - parseFloat(a.likes));
  } else {
    filteredBloggers.sort((a, b) => b.fansNum - a.fansNum);
  }
  currentPage = 1;
  renderBloggers();
}

/* ---------- 渲染 ---------- */
function renderBloggers() {
  const grid = document.getElementById('bloggersGrid');
  const countEl = document.getElementById('resultCount');
  if (!grid) return;

  countEl && (countEl.textContent = filteredBloggers.length);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredBloggers.slice(start, start + PAGE_SIZE);

  if (pageData.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>暂无符合条件的博主</h3>
      <p>尝试调整筛选条件</p>
    </div>`;
    renderPagination();
    return;
  }

  grid.innerHTML = pageData.map(b => `
    <div class="blogger-card">
      <div class="blogger-header">
        <div class="blogger-avatar" style="background:${avatarColor(b.name)}">${b.name.charAt(0)}</div>
        <div>
          <div class="blogger-name">${b.name}</div>
          <div class="blogger-platform">${platformIcon(b.platform)} ${b.platform} · ${b.category}</div>
        </div>
      </div>
      <div class="blogger-stats">
        <div class="bs-item">
          <div class="bs-num">${b.fans}</div>
          <div class="bs-label">粉丝量</div>
        </div>
        <div class="bs-item">
          <div class="bs-num">${b.likes}</div>
          <div class="bs-label">赞藏量</div>
        </div>
        <div class="bs-item">
          <div class="bs-num" style="font-size:13px;color:var(--accent)">${fansLevelLabel(b.fansNum)}</div>
          <div class="bs-label">量级</div>
        </div>
      </div>
      <div class="blogger-tags">
        ${b.tags.map(t => `<span>#${t}</span>`).join('')}
      </div>
      <div class="blogger-footer">
        <div class="blogger-region">📍 ${b.region}</div>
        <a href="${b.link}" class="blogger-link" target="_blank" onclick="event.stopPropagation()">查看主页</a>
      </div>
    </div>
  `).join('');

  renderPagination();
}

function renderPagination() {
  const pg = document.getElementById('pagination');
  if (!pg) return;
  const total = Math.ceil(filteredBloggers.length / PAGE_SIZE);
  if (total <= 1) { pg.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage-1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - currentPage) <= 2) {
      html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 3) {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    }
  }
  if (currentPage < total) html += `<button class="page-btn" onclick="goPage(${currentPage+1})">›</button>`;
  pg.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderBloggers();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

// 搜索框实时过滤
document.addEventListener('DOMContentLoaded', () => {
  init();
  const si = document.getElementById('searchInput');
  si && si.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });
});
