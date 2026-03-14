/* ============================================================
   admin.js - 后台管理系统完整逻辑
   ============================================================ */

let adminBloggers   = [];
let adminCases      = [];
let adminSuppliers  = [];
let adminInquiries  = [];
let editingBloggerId  = null;
let editingCaseId     = null;
let editingSupplier   = null;

/* ============================================================
   初始化
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  adminBloggers  = DB.getBloggers();
  adminCases     = DB.getCases();
  adminSuppliers = DB.getSuppliers();
  adminInquiries = DB.getInquiries();

  renderDashboard();
  renderAdminBloggers();
  renderAdminCases();
  renderAdminSuppliers();
  renderAdminInquiries();

  // 点击遮罩关闭弹窗
  ['bloggerModal','caseAdminModal','supplierAdminModal'].forEach(id => {
    const el = document.getElementById(id);
    el && el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
  });
});

/* ============================================================
   侧边栏切换
   ============================================================ */
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));

  const sec = document.getElementById(`section-${name}`);
  if (sec) sec.style.display = '';

  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${name}'`)) {
      item.classList.add('active');
    }
  });
}

/* ============================================================
   仪表盘
   ============================================================ */
function renderDashboard() {
  const pending = adminInquiries.filter(i => i.status === 'pending').length;

  setText('stat-bloggers',  adminBloggers.length);
  setText('stat-cases',     adminCases.length);
  setText('stat-suppliers', adminSuppliers.length);
  setText('stat-inquiries', pending);

  // 分类分布条形图
  const catMap = {};
  adminBloggers.forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + 1; });
  const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  const max = sorted[0]?.[1] || 1;

  const chart = document.getElementById('categoryChart');
  if (!chart) return;
  chart.innerHTML = sorted.map(([cat, count]) => `
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="width:90px; font-size:13px; color:var(--text-sub); text-align:right; flex-shrink:0">${cat}</div>
      <div style="flex:1; background:rgba(255,255,255,0.05); border-radius:50px; height:10px; overflow:hidden;">
        <div style="height:100%; width:${(count/max*100).toFixed(1)}%; background:linear-gradient(90deg,#ff4757,#ffa502); border-radius:50px; transition:width 0.8s ease;"></div>
      </div>
      <div style="width:30px; font-size:13px; font-weight:700; color:var(--primary)">${count}</div>
    </div>
  `).join('');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ============================================================
   博主管理
   ============================================================ */
function renderAdminBloggers() {
  const tbody = document.getElementById('adminBloggerTable');
  if (!tbody) return;

  const kw = (document.getElementById('adminBloggerSearch')?.value || '').trim().toLowerCase();
  const data = kw
    ? adminBloggers.filter(b => b.name.toLowerCase().includes(kw) || b.category.includes(kw) || b.region.includes(kw))
    : adminBloggers;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:32px">暂无数据</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => `
    <tr>
      <td>
        <span class="table-avatar" style="background:${avatarColor(b.name)}">${b.name.charAt(0)}</span>
        ${b.name}
      </td>
      <td>${platformIcon(b.platform)} ${b.platform}</td>
      <td>${b.category}</td>
      <td style="color:var(--primary); font-weight:600">${b.fans}</td>
      <td>${b.likes}</td>
      <td>📍 ${b.region}</td>
      <td><span class="status-badge ${b.status === 'active' ? 'status-active' : 'status-pending'}">${b.status === 'active' ? '合作中' : '待确认'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="editBlogger(${b.id})">编辑</button>
          <button class="btn-delete" onclick="deleteBlogger(${b.id})">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openBloggerModal(id = null) {
  editingBloggerId = id;
  const title = document.getElementById('bloggerModalTitle');

  if (id) {
    const b = adminBloggers.find(x => x.id === id);
    if (!b) return;
    title.textContent = '编辑博主';
    setVal('b_name',     b.name);
    setVal('b_platform', b.platform);
    setVal('b_category', b.category);
    setVal('b_region',   b.region);
    setVal('b_fans',     b.fans);
    setVal('b_likes',    b.likes);
    setVal('b_link',     b.link);
    setVal('b_tags',     b.tags.join(','));
  } else {
    title.textContent = '添加博主';
    clearVals(['b_name','b_fans','b_likes','b_link','b_tags']);
  }
  document.getElementById('bloggerModal').classList.add('active');
}

function editBlogger(id) { openBloggerModal(id); }

function closeBloggerModal() {
  document.getElementById('bloggerModal').classList.remove('active');
  editingBloggerId = null;
}

function saveBlogger() {
  const name = getVal('b_name').trim();
  if (!name) { showToast('请填写博主昵称', false); return; }

  const fans     = getVal('b_fans').trim() || '0';
  const fansNum  = parseFansNum(fans);
  const tagsRaw  = getVal('b_tags').trim();
  const tags     = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

  if (editingBloggerId) {
    const idx = adminBloggers.findIndex(x => x.id === editingBloggerId);
    if (idx !== -1) {
      adminBloggers[idx] = {
        ...adminBloggers[idx],
        name, fans, fansNum, tags,
        platform: getVal('b_platform'),
        category: getVal('b_category'),
        region:   getVal('b_region'),
        likes:    getVal('b_likes').trim() || '0',
        link:     getVal('b_link').trim() || '#',
      };
    }
  } else {
    adminBloggers.unshift({
      id: DB.nextId(adminBloggers),
      name, fans, fansNum, tags,
      platform: getVal('b_platform'),
      category: getVal('b_category'),
      region:   getVal('b_region'),
      likes:    getVal('b_likes').trim() || '0',
      link:     getVal('b_link').trim() || '#',
      status: 'active',
    });
  }

  DB.saveBloggers(adminBloggers);
  renderAdminBloggers();
  renderDashboard();
  closeBloggerModal();
  showToast(editingBloggerId ? '博主信息已更新！' : '博主添加成功！');
}

function deleteBlogger(id) {
  if (!confirm('确认删除该博主？')) return;
  adminBloggers = adminBloggers.filter(b => b.id !== id);
  DB.saveBloggers(adminBloggers);
  renderAdminBloggers();
  renderDashboard();
  showToast('已删除');
}

function parseFansNum(str) {
  const s = str.replace(/\s/g, '');
  if (s.endsWith('w') || s.endsWith('W')) return parseFloat(s) * 10000;
  if (s.endsWith('万')) return parseFloat(s) * 10000;
  return parseInt(s) || 0;
}

/* ============================================================
   案例管理
   ============================================================ */
function renderAdminCases() {
  const tbody = document.getElementById('adminCaseTable');
  if (!tbody) return;

  if (adminCases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px">暂无案例</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCases.map(c => `
    <tr>
      <td>
        <span style="font-size:18px; margin-right:8px">${c.emoji || '📋'}</span>
        <span style="font-weight:600">${c.title}</span>
      </td>
      <td>${c.type}</td>
      <td>${c.industry}</td>
      <td style="color:var(--accent); font-weight:600">${c.exposure}</td>
      <td>${c.interaction}</td>
      <td><span class="status-badge status-active">已发布</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="editCase(${c.id})">编辑</button>
          <button class="btn-delete" onclick="deleteCase(${c.id})">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCaseModal() {
  editingCaseId = null;
  clearVals(['c_title','c_desc','c_exposure','c_interaction','c_conversion']);
  document.getElementById('caseAdminModal').classList.add('active');
}

function editCase(id) {
  const c = adminCases.find(x => x.id === id);
  if (!c) return;
  editingCaseId = id;
  setVal('c_title',      c.title);
  setVal('c_type',       c.type);
  setVal('c_industry',   c.industry);
  setVal('c_desc',       c.desc);
  setVal('c_exposure',   c.exposure);
  setVal('c_interaction',c.interaction);
  setVal('c_conversion', c.conversion);
  document.getElementById('caseAdminModal').classList.add('active');
}

function closeCaseAdminModal() {
  document.getElementById('caseAdminModal').classList.remove('active');
  editingCaseId = null;
}

function saveCase() {
  const title = getVal('c_title').trim();
  if (!title) { showToast('请填写案例标题', false); return; }

  const gradients = [
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    'linear-gradient(135deg,#f6d365,#fda085)',
    'linear-gradient(135deg,#5f27cd,#a29bfe)',
  ];
  const emojis = { '餐饮美食':'🍽️','美容美业':'💆','休闲娱乐':'🎪','零售购物':'🛍️','亲子教育':'👶','健康健身':'🏋️' };

  if (editingCaseId) {
    const idx = adminCases.findIndex(x => x.id === editingCaseId);
    if (idx !== -1) {
      adminCases[idx] = {
        ...adminCases[idx],
        title,
        type:        getVal('c_type'),
        industry:    getVal('c_industry'),
        desc:        getVal('c_desc'),
        exposure:    getVal('c_exposure') || '—',
        interaction: getVal('c_interaction') || '—',
        conversion:  getVal('c_conversion') || '—',
      };
    }
  } else {
    const industry = getVal('c_industry');
    adminCases.unshift({
      id:          DB.nextId(adminCases),
      title,
      type:        getVal('c_type'),
      industry,
      desc:        getVal('c_desc'),
      exposure:    getVal('c_exposure') || '—',
      interaction: getVal('c_interaction') || '—',
      conversion:  getVal('c_conversion') || '—',
      emoji:       emojis[industry] || '📋',
      gradient:    gradients[Math.floor(Math.random() * gradients.length)],
      hot:         false,
    });
  }

  DB.saveCases(adminCases);
  renderAdminCases();
  renderDashboard();
  closeCaseAdminModal();
  showToast(editingCaseId ? '案例已更新！' : '案例添加成功！');
}

function deleteCase(id) {
  if (!confirm('确认删除该案例？')) return;
  adminCases = adminCases.filter(c => c.id !== id);
  DB.saveCases(adminCases);
  renderAdminCases();
  renderDashboard();
  showToast('已删除');
}

/* ============================================================
   供应商管理
   ============================================================ */
function renderAdminSuppliers() {
  const tbody = document.getElementById('adminSupplierTable');
  if (!tbody) return;

  if (adminSuppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px">暂无供应商</td></tr>`;
    return;
  }

  tbody.innerHTML = adminSuppliers.map(s => `
    <tr>
      <td>
        <span style="font-size:18px; margin-right:8px">${s.emoji || '🏢'}</span>
        <span style="font-weight:600">${s.name}</span>
      </td>
      <td>${s.type}</td>
      <td style="color:var(--accent)">⭐ ${s.rating}</td>
      <td>${s.cooperations} 次</td>
      <td><span class="status-badge ${s.status === 'active' ? 'status-active' : 'status-pending'}">${s.status === 'active' ? '合作中' : '待确认'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="editSupplier(${s.id})">编辑</button>
          <button class="btn-delete" onclick="deleteSupplier(${s.id})">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openSupplierModal() {
  editingSupplier = null;
  clearVals(['s_name','s_desc','s_contact','s_phone','s_tags']);
  document.getElementById('supplierAdminModal').classList.add('active');
}

function editSupplier(id) {
  const s = adminSuppliers.find(x => x.id === id);
  if (!s) return;
  editingSupplier = id;
  setVal('s_name',    s.name);
  setVal('s_type',    s.type);
  setVal('s_desc',    s.desc);
  setVal('s_contact', s.contact);
  setVal('s_phone',   s.phone);
  setVal('s_tags',    s.tags.join(','));
  document.getElementById('supplierAdminModal').classList.add('active');
}

function closeSupplierAdminModal() {
  document.getElementById('supplierAdminModal').classList.remove('active');
  editingSupplier = null;
}

function saveSupplier() {
  const name = getVal('s_name').trim();
  if (!name) { showToast('请填写供应商名称', false); return; }

  const tagsRaw = getVal('s_tags').trim();
  const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

  if (editingSupplier) {
    const idx = adminSuppliers.findIndex(x => x.id === editingSupplier);
    if (idx !== -1) {
      adminSuppliers[idx] = {
        ...adminSuppliers[idx],
        name, tags,
        type:    getVal('s_type'),
        desc:    getVal('s_desc'),
        contact: getVal('s_contact'),
        phone:   getVal('s_phone'),
      };
    }
  } else {
    adminSuppliers.unshift({
      id:           DB.nextId(adminSuppliers),
      name, tags,
      type:         getVal('s_type'),
      desc:         getVal('s_desc'),
      contact:      getVal('s_contact'),
      phone:        getVal('s_phone'),
      rating:       4.5,
      cooperations: 0,
      status:       'active',
      emoji:        '🏢',
    });
  }

  DB.saveSuppliers(adminSuppliers);
  renderAdminSuppliers();
  renderDashboard();
  closeSupplierAdminModal();
  showToast(editingSupplier ? '供应商已更新！' : '供应商添加成功！');
}

function deleteSupplier(id) {
  if (!confirm('确认删除该供应商？')) return;
  adminSuppliers = adminSuppliers.filter(s => s.id !== id);
  DB.saveSuppliers(adminSuppliers);
  renderAdminSuppliers();
  renderDashboard();
  showToast('已删除');
}

/* ============================================================
   询盘管理
   ============================================================ */
function renderAdminInquiries() {
  const tbody = document.getElementById('adminInquiryTable');
  if (!tbody) return;

  if (adminInquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px">暂无询盘记录</td></tr>`;
    return;
  }

  tbody.innerHTML = adminInquiries.map(i => `
    <tr>
      <td style="font-weight:600">${i.name}</td>
      <td style="color:var(--text-sub)">${i.phone}</td>
      <td>${i.brand}</td>
      <td>${i.service}</td>
      <td>
        <span class="status-badge ${i.status === 'pending' ? 'status-pending' : 'status-active'}">
          ${i.status === 'pending' ? '待跟进' : '已处理'}
        </span>
      </td>
      <td style="color:var(--text-muted); font-size:12px">${i.time}</td>
      <td>
        <div class="table-actions">
          ${i.status === 'pending'
            ? `<button class="btn-edit" onclick="markInquiryDone(${i.id})">标记处理</button>`
            : `<span style="color:var(--text-muted); font-size:12px">已完成</span>`
          }
          <button class="btn-delete" onclick="deleteInquiry(${i.id})">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function markInquiryDone(id) {
  const idx = adminInquiries.findIndex(i => i.id === id);
  if (idx !== -1) adminInquiries[idx].status = 'done';
  DB.saveInquiries(adminInquiries);
  renderAdminInquiries();
  renderDashboard();
  showToast('已标记为处理完成');
}

function deleteInquiry(id) {
  if (!confirm('确认删除该询盘记录？')) return;
  adminInquiries = adminInquiries.filter(i => i.id !== id);
  DB.saveInquiries(adminInquiries);
  renderAdminInquiries();
  renderDashboard();
  showToast('已删除');
}

/* ============================================================
   账号设置
   ============================================================ */
function saveSettings() {
  const oldPass     = getVal('set_old_pass');
  const newUser     = getVal('set_new_user').trim();
  const newPass     = getVal('set_new_pass');
  const confirmPass = getVal('set_confirm_pass');
  const errEl       = document.getElementById('settingsError');

  const cred = getAdminCredentials();

  // 验证当前密码
  if (oldPass !== cred.pass) {
    showSettingsError('当前密码不正确，请重新输入');
    return;
  }

  // 如果填了新密码，验证格式和一致性
  if (newPass) {
    if (newPass.length < 6) {
      showSettingsError('新密码至少需要6位');
      return;
    }
    if (newPass !== confirmPass) {
      showSettingsError('两次输入的新密码不一致');
      return;
    }
  }

  // 保存
  const finalUser = newUser || cred.user;
  const finalPass = newPass || cred.pass;
  saveAdminCredentials(finalUser, finalPass);

  // 清空输入
  ['set_old_pass','set_new_user','set_new_pass','set_confirm_pass'].forEach(id => setVal(id, ''));
  errEl && (errEl.style.display = 'none');
  showToast('账号密码已更新！下次登录请使用新密码');
}

function showSettingsError(msg) {
  const el = document.getElementById('settingsError');
  if (!el) return;
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

/* ============================================================
   工具函数
   ============================================================ */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

function clearVals(ids) {
  ids.forEach(id => setVal(id, ''));
}
