/* ============================================================
   suppliers.js - 供应商资源页面逻辑
   ============================================================ */

let allSuppliers = [];
let currentType = '';

function initSuppliers() {
  allSuppliers = DB.getSuppliers();
  renderSuppliers('');
}

function filterSupplier(btn, type) {
  currentType = type;
  document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSuppliers(type);
}

function renderSuppliers(type) {
  const grid = document.getElementById('suppliersGrid');
  if (!grid) return;

  const data = type ? allSuppliers.filter(s => s.type === type) : allSuppliers;

  if (data.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🏢</div>
      <h3>该分类暂无供应商</h3>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(s => `
    <div class="supplier-card">
      <div class="supplier-header">
        <div class="supplier-logo" style="background:${avatarColor(s.name)}">${s.emoji || s.name.charAt(0)}</div>
        <div>
          <div class="supplier-name">${s.name}</div>
          <div class="supplier-type">${s.type}</div>
        </div>
      </div>
      <div class="supplier-desc">${s.desc}</div>
      <div class="supplier-tags">
        ${s.tags.map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="supplier-footer">
        <div class="supplier-rating">
          <span class="stars">${renderStars(s.rating)}</span>
          <span>${s.rating}</span>
          <span style="color:var(--text-muted)">· 合作${s.cooperations}次</span>
        </div>
        <button class="supplier-contact" onclick="contactSupplier('${s.name}','${s.contact}','${s.phone}')">立即联系</button>
      </div>
    </div>
  `).join('');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  s += '☆'.repeat(5 - full - (half ? 1 : 0));
  return s;
}

function contactSupplier(name, contact, phone) {
  alert(`联系供应商：${name}\n联系人：${contact}\n电话：${phone}\n\n您也可以通过首页「联系我们」表单获取详细对接方式。`);
}

document.addEventListener('DOMContentLoaded', initSuppliers);
