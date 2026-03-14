/* ============================================================
   cases.js - 营销案例页面逻辑
   ============================================================ */

let allCases = [];
let filteredCases = [];

function initCases() {
  allCases = DB.getCases();
  filteredCases = [...allCases];
  renderCases();
}

/* ---------- 筛选 ---------- */
function applyCaseFilter() {
  const search   = document.getElementById('caseSearch').value.trim().toLowerCase();
  const type     = document.getElementById('caseTypeFilter').value;
  const industry = document.getElementById('industryFilter').value;

  filteredCases = allCases.filter(c => {
    if (search   && !c.title.toLowerCase().includes(search) && !c.desc.toLowerCase().includes(search)) return false;
    if (type     && c.type     !== type)     return false;
    if (industry && c.industry !== industry) return false;
    return true;
  });
  renderCases();
}

function resetCaseFilter() {
  document.getElementById('caseSearch').value = '';
  document.getElementById('caseTypeFilter').value = '';
  document.getElementById('industryFilter').value = '';
  filteredCases = [...allCases];
  renderCases();
}

/* ---------- 渲染 ---------- */
function renderCases() {
  const grid = document.getElementById('casesGrid');
  const countEl = document.getElementById('caseCount');
  if (!grid) return;

  countEl && (countEl.textContent = filteredCases.length);

  if (filteredCases.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📂</div>
      <h3>暂无符合条件的案例</h3>
      <p>尝试调整筛选条件</p>
    </div>`;
    return;
  }

  grid.innerHTML = filteredCases.map(c => `
    <div class="case-full-card" onclick="openCaseModal(${c.id})">
      <div class="case-full-cover" style="background:${c.gradient || 'linear-gradient(135deg,#667eea,#764ba2)'}">
        ${c.hot ? '<div class="case-badge">🔥 热门</div>' : ''}
        <div class="case-full-cover-inner">
          <div class="case-full-icon">${c.emoji || '📋'}</div>
          <div class="case-type-label">${c.industry}</div>
        </div>
      </div>
      <div class="case-full-body">
        <div class="case-full-title">${c.title}</div>
        <div class="case-full-desc">${c.desc}</div>
        <div class="case-full-meta">
          <span class="meta-tag">📌 ${c.type}</span>
          <span class="meta-tag">🏭 ${c.industry}</span>
        </div>
        <div class="case-full-results">
          <div class="result-item">
            <div class="result-num">${c.exposure}</div>
            <div class="result-label">曝光量</div>
          </div>
          <div class="result-item">
            <div class="result-num">${c.interaction}</div>
            <div class="result-label">互动量</div>
          </div>
          <div class="result-item">
            <div class="result-num" style="font-size:11px">${c.conversion}</div>
            <div class="result-label">转化效果</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ---------- 案例详情弹窗 ---------- */
function openCaseModal(id) {
  const c = allCases.find(x => x.id === id);
  if (!c) return;

  document.getElementById('modalCaseTitle').textContent = c.title;
  document.getElementById('modalCaseBody').innerHTML = `
    <div style="background:${c.gradient || 'linear-gradient(135deg,#667eea,#764ba2)'}; height:140px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:20px;">
      <div style="text-align:center; color:white;">
        <div style="font-size:48px">${c.emoji || '📋'}</div>
        <div style="font-size:14px; font-weight:600; margin-top:6px">${c.industry}</div>
      </div>
    </div>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
      <span class="meta-tag">📌 ${c.type}</span>
      <span class="meta-tag">🏭 ${c.industry}</span>
      ${c.hot ? '<span class="meta-tag" style="color:#ff4757; border-color:rgba(255,71,87,0.3)">🔥 热门案例</span>' : ''}
    </div>
    <p style="color:var(--text-sub); font-size:14px; line-height:1.8; margin-bottom:20px">${c.desc}</p>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px; background:rgba(255,255,255,0.04); border-radius:12px; padding:18px;">
      <div style="text-align:center">
        <div style="font-size:20px; font-weight:800; color:#ffa502">${c.exposure}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:4px">总曝光量</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:20px; font-weight:800; color:#ffa502">${c.interaction}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:4px">总互动量</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:15px; font-weight:800; color:#43e97b">${c.conversion}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:4px">转化效果</div>
      </div>
    </div>
    <div style="margin-top:20px; padding:16px; background:rgba(255,71,87,0.06); border:1px solid rgba(255,71,87,0.15); border-radius:10px; font-size:13px; color:var(--text-sub)">
      💡 想了解更多案例详情或希望为您的品牌定制同类方案？欢迎 <a href="index.html#contact" style="color:var(--primary)">联系我们</a>
    </div>
  `;
  document.getElementById('caseModal').classList.add('active');
}

function closeCaseModal() {
  document.getElementById('caseModal').classList.remove('active');
}

// 点击遮罩关闭
document.addEventListener('DOMContentLoaded', () => {
  initCases();
  const modal = document.getElementById('caseModal');
  modal && modal.addEventListener('click', e => { if (e.target === modal) closeCaseModal(); });

  // 搜索框 Enter 键
  const si = document.getElementById('caseSearch');
  si && si.addEventListener('keydown', e => { if (e.key === 'Enter') applyCaseFilter(); });
});
