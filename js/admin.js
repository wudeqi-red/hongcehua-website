/* ============================================================
   admin.js - 后台管理系统完整逻辑（CloudBase 版）
   ============================================================ */

let adminBloggers   = [];
let adminCases      = [];
let adminSuppliers  = [];
let adminInquiries  = [];
let editingBloggerId  = null;
let editingCaseId     = null;
let editingSupplier   = null;
let editingAccountId  = null;

/* ============================================================
   初始化（异步加载云端数据）
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // 显示当前用户信息
  const user = getCurrentUser();
  if (user) {
    const el = document.getElementById('navUserName');
    if (el) el.textContent = user.username;
    // 非超级管理员隐藏子账号管理入口
    if (user.role !== 'admin') {
      const sidebarAccounts = document.getElementById('sidebar-accounts');
      if (sidebarAccounts) sidebarAccounts.style.display = 'none';
    }
  }

  showLoadingOverlay(true);
  try {
    await initCloud();
    // 并行加载所有数据
    const [b, c, s, i] = await Promise.all([
      dbGetAll(BLOGGERS_COL),
      dbGetAll(CASES_COL),
      dbGetAll(SUPPLIERS_COL),
      dbGetAll(INQUIRIES_COL),
    ]);

    // 如果云端没有数据，自动初始化默认数据
    if (b.length === 0) {
      await initDefaultData();
      adminBloggers  = await dbGetAll(BLOGGERS_COL);
      adminCases     = await dbGetAll(CASES_COL);
      adminSuppliers = await dbGetAll(SUPPLIERS_COL);
      adminInquiries = await dbGetAll(INQUIRIES_COL);
    } else {
      adminBloggers  = b;
      adminCases     = c;
      adminSuppliers = s;
      adminInquiries = i;
    }
  } catch(e) {
    console.error('云端数据加载失败，降级使用本地数据', e);
    adminBloggers  = DB.getBloggers();
    adminCases     = DB.getCases();
    adminSuppliers = DB.getSuppliers();
    adminInquiries = DB.getInquiries();
  }
  showLoadingOverlay(false);

  renderDashboard();
  renderAdminBloggers();
  renderAdminCases();
  renderAdminSuppliers();
  renderAdminInquiries();

  ['bloggerModal','caseAdminModal','supplierAdminModal','accountModal'].forEach(id => {
    const el = document.getElementById(id);
    el && el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
  });
});

/* 云端默认数据初始化（首次使用） */
async function initDefaultData() {
  const defaultBloggers  = DB.getBloggers();
  const defaultCases     = DB.getCases();
  const defaultSuppliers = DB.getSuppliers();
  const defaultInquiries = DB.getInquiries();

  await Promise.all([
    ...defaultBloggers.map(d  => dbAdd(BLOGGERS_COL,  d)),
    ...defaultCases.map(d     => dbAdd(CASES_COL,     d)),
    ...defaultSuppliers.map(d => dbAdd(SUPPLIERS_COL, d)),
    ...defaultInquiries.map(d => dbAdd(INQUIRIES_COL, d)),
  ]);
}

function showLoadingOverlay(show) {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,15,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:16px;';
    el.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(255,71,87,0.3);border-top-color:#ff4757;border-radius:50%;animation:spin 0.8s linear infinite;"></div><div style="color:#aaa;font-size:14px;">正在加载数据...</div>';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

/* ============================================================
   侧边栏切换
   ============================================================ */
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));

  const sec = document.getElementById(`section-${name}`);
  if (sec) sec.style.display = '';

  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${name}'`)) {
      item.classList.add('active');
    }
  });

  // 子账号页面进入时刷新列表
  if (name === 'accounts') renderAccountList();
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
          <button class="btn-edit" onclick="editBlogger('${b._id}')">编辑</button>
          <button class="btn-delete" onclick="deleteBlogger('${b._id}')">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openBloggerModal(id = null) {
  editingBloggerId = id;
  const title = document.getElementById('bloggerModalTitle');

  if (id) {
    const b = adminBloggers.find(x => x._id === id);
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

async function saveBlogger() {
  const name = getVal('b_name').trim();
  if (!name) { showToast('请填写博主昵称', false); return; }

  const fans    = getVal('b_fans').trim() || '0';
  const fansNum = parseFansNum(fans);
  const tagsRaw = getVal('b_tags').trim();
  const tags    = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

  const data = {
    name, fans, fansNum, tags,
    platform: getVal('b_platform'),
    category: getVal('b_category'),
    region:   getVal('b_region'),
    likes:    getVal('b_likes').trim() || '0',
    link:     getVal('b_link').trim() || '#',
  };

  try {
    if (editingBloggerId) {
      await dbUpdate(BLOGGERS_COL, editingBloggerId, data);
      const idx = adminBloggers.findIndex(x => x._id === editingBloggerId);
      if (idx !== -1) adminBloggers[idx] = { ...adminBloggers[idx], ...data };
    } else {
      const newId = await dbAdd(BLOGGERS_COL, { ...data, status: 'active' });
      adminBloggers.unshift({ _id: newId, ...data, status: 'active' });
    }
    renderAdminBloggers();
    renderDashboard();
    closeBloggerModal();
    showToast(editingBloggerId ? '博主信息已更新！' : '博主添加成功！');
  } catch(e) {
    showToast('保存失败，请检查网络', false);
  }
}

async function deleteBlogger(id) {
  if (!confirm('确认删除该博主？')) return;
  try {
    await dbRemove(BLOGGERS_COL, id);
    adminBloggers = adminBloggers.filter(b => b._id !== id);
    renderAdminBloggers();
    renderDashboard();
    showToast('已删除');
  } catch(e) { showToast('删除失败', false); }
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
          <button class="btn-edit" onclick="editCase('${c._id}')">编辑</button>
          <button class="btn-delete" onclick="deleteCase('${c._id}')">删除</button>
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
  const c = adminCases.find(x => x._id === id);
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

async function saveCase() {
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

  const data = {
    title,
    type:        getVal('c_type'),
    industry:    getVal('c_industry'),
    desc:        getVal('c_desc'),
    exposure:    getVal('c_exposure') || '—',
    interaction: getVal('c_interaction') || '—',
    conversion:  getVal('c_conversion') || '—',
  };

  try {
    if (editingCaseId) {
      await dbUpdate(CASES_COL, editingCaseId, data);
      const idx = adminCases.findIndex(x => x._id === editingCaseId);
      if (idx !== -1) adminCases[idx] = { ...adminCases[idx], ...data };
    } else {
      const industry = data.industry;
      const full = {
        ...data,
        emoji:    emojis[industry] || '📋',
        gradient: gradients[Math.floor(Math.random() * gradients.length)],
        hot:      false,
      };
      const newId = await dbAdd(CASES_COL, full);
      adminCases.unshift({ _id: newId, ...full });
    }
    renderAdminCases();
    renderDashboard();
    closeCaseAdminModal();
    showToast(editingCaseId ? '案例已更新！' : '案例添加成功！');
  } catch(e) { showToast('保存失败', false); }
}

async function deleteCase(id) {
  if (!confirm('确认删除该案例？')) return;
  try {
    await dbRemove(CASES_COL, id);
    adminCases = adminCases.filter(c => c._id !== id);
    renderAdminCases();
    renderDashboard();
    showToast('已删除');
  } catch(e) { showToast('删除失败', false); }
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
          <button class="btn-edit" onclick="editSupplier('${s._id}')">编辑</button>
          <button class="btn-delete" onclick="deleteSupplier('${s._id}')">删除</button>
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
  const s = adminSuppliers.find(x => x._id === id);
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

async function saveSupplier() {
  const name = getVal('s_name').trim();
  if (!name) { showToast('请填写供应商名称', false); return; }

  const tagsRaw = getVal('s_tags').trim();
  const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

  const data = {
    name, tags,
    type:    getVal('s_type'),
    desc:    getVal('s_desc'),
    contact: getVal('s_contact'),
    phone:   getVal('s_phone'),
  };

  try {
    if (editingSupplier) {
      await dbUpdate(SUPPLIERS_COL, editingSupplier, data);
      const idx = adminSuppliers.findIndex(x => x._id === editingSupplier);
      if (idx !== -1) adminSuppliers[idx] = { ...adminSuppliers[idx], ...data };
    } else {
      const full = { ...data, rating: 4.5, cooperations: 0, status: 'active', emoji: '🏢' };
      const newId = await dbAdd(SUPPLIERS_COL, full);
      adminSuppliers.unshift({ _id: newId, ...full });
    }
    renderAdminSuppliers();
    renderDashboard();
    closeSupplierAdminModal();
    showToast(editingSupplier ? '供应商已更新！' : '供应商添加成功！');
  } catch(e) { showToast('保存失败', false); }
}

async function deleteSupplier(id) {
  if (!confirm('确认删除该供应商？')) return;
  try {
    await dbRemove(SUPPLIERS_COL, id);
    adminSuppliers = adminSuppliers.filter(s => s._id !== id);
    renderAdminSuppliers();
    renderDashboard();
    showToast('已删除');
  } catch(e) { showToast('删除失败', false); }
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
            ? `<button class="btn-edit" onclick="markInquiryDone('${i._id}')">标记处理</button>`
            : `<span style="color:var(--text-muted); font-size:12px">已完成</span>`
          }
          <button class="btn-delete" onclick="deleteInquiry('${i._id}')">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function markInquiryDone(id) {
  try {
    await dbUpdate(INQUIRIES_COL, id, { status: 'done' });
    const idx = adminInquiries.findIndex(i => i._id === id);
    if (idx !== -1) adminInquiries[idx].status = 'done';
    renderAdminInquiries();
    renderDashboard();
    showToast('已标记为处理完成');
  } catch(e) { showToast('操作失败', false); }
}

async function deleteInquiry(id) {
  if (!confirm('确认删除该询盘记录？')) return;
  try {
    await dbRemove(INQUIRIES_COL, id);
    adminInquiries = adminInquiries.filter(i => i._id !== id);
    renderAdminInquiries();
    renderDashboard();
    showToast('已删除');
  } catch(e) { showToast('删除失败', false); }
}

/* ============================================================
   子账号管理
   ============================================================ */
async function renderAccountList() {
  const tbody = document.getElementById('accountTable');
  const countEl = document.getElementById('accountCount');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px">加载中...</td></tr>`;

  try {
    const users = await getAllUsers();
    const currentUser = getCurrentUser();
    if (countEl) countEl.textContent = `共 ${users.length} 个账号`;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px">暂无账号</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#ff4757,#ff6b81);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${u.username.charAt(0).toUpperCase()}</div>
            <span style="font-weight:600">${u.username}</span>
            ${u._id === currentUser?._id ? '<span style="font-size:11px;color:var(--primary);background:rgba(255,71,87,0.1);padding:2px 8px;border-radius:20px;margin-left:4px;">当前</span>' : ''}
          </div>
        </td>
        <td>
          <span class="status-badge ${u.role === 'admin' ? 'status-active' : 'status-pending'}">
            ${u.role === 'admin' ? '超级管理员' : '普通管理员'}
          </span>
        </td>
        <td style="color:var(--text-muted);font-size:12px">${u.createdAt ? u.createdAt.slice(0,10) : '—'}</td>
        <td>
          <div class="table-actions">
            ${u._id !== currentUser?._id
              ? `<button class="btn-delete" onclick="deleteAccount('${u._id}','${u.username}')">删除</button>`
              : `<span style="color:var(--text-muted);font-size:12px">—</span>`
            }
          </div>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ff6b81;padding:32px">加载失败，请检查网络</td></tr>`;
  }
}

function openAccountModal() {
  editingAccountId = null;
  clearVals(['acc_username','acc_password']);
  document.getElementById('accError').style.display = 'none';
  document.getElementById('accountModalTitle').textContent = '新建账号';
  document.getElementById('accountModal').classList.add('active');
}

function closeAccountModal() {
  document.getElementById('accountModal').classList.remove('active');
}

async function saveAccount() {
  const username = getVal('acc_username').trim();
  const password = getVal('acc_password');
  const role     = getVal('acc_role');
  const errEl    = document.getElementById('accError');

  if (!username) { showAccError('请输入账号名'); return; }
  if (!password || password.length < 6) { showAccError('密码至少需要6位'); return; }

  try {
    await createUser(username, password, role);
    closeAccountModal();
    showToast('账号创建成功！');
    renderAccountList();
  } catch(e) {
    showAccError(e.message || '创建失败，请重试');
  }
}

function showAccError(msg) {
  const el = document.getElementById('accError');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

async function deleteAccount(id, username) {
  if (!confirm(`确认删除账号「${username}」？此操作不可恢复。`)) return;
  try {
    await deleteUser(id);
    showToast('账号已删除');
    renderAccountList();
  } catch(e) { showToast('删除失败', false); }
}

/* ============================================================
   账号设置（修改自己的密码）
   ============================================================ */
async function saveSettings() {
  const oldPass     = getVal('set_old_pass');
  const newUser     = getVal('set_new_user').trim();
  const newPass     = getVal('set_new_pass');
  const confirmPass = getVal('set_confirm_pass');

  const currentUser = getCurrentUser();
  if (!currentUser) { adminLogout(); return; }

  // 先从云端验证当前密码
  try {
    const user = await verifyLogin(currentUser.username, oldPass);
    if (!user) { showSettingsError('当前密码不正确'); return; }

    if (newPass) {
      if (newPass.length < 6) { showSettingsError('新密码至少需要6位'); return; }
      if (newPass !== confirmPass) { showSettingsError('两次输入的新密码不一致'); return; }
    }

    if (newUser && newUser !== currentUser.username) {
      await changeUsername(currentUser._id, newUser);
    }
    if (newPass) {
      await changePassword(currentUser._id, newPass);
    }

    // 更新 session
    const updated = { ...currentUser };
    if (newUser) updated.username = newUser;
    sessionStorage.setItem('hc_logged_user', JSON.stringify(updated));

    clearVals(['set_old_pass','set_new_user','set_new_pass','set_confirm_pass']);
    document.getElementById('settingsError').style.display = 'none';
    showToast('账号信息已更新！');
  } catch(e) {
    showSettingsError('保存失败，请检查网络');
  }
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

function togglePassAdmin(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

function avatarColor(name) {
  const colors = ['#ff4757','#ff6b81','#ffa502','#eccc68','#2ed573','#1e90ff','#5352ed','#a29bfe'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function platformIcon(p) {
  const m = {'小红书':'📕','抖音':'🎵','微博':'🐦','B站':'📺','微信':'💬','视频号':'🎬'};
  return m[p] || '📱';
}

function showToast(msg, success = true) {
  let t = document.getElementById('adminToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'adminToast';
    t.style.cssText = 'position:fixed;bottom:32px;right:32px;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;transition:all 0.3s;opacity:0;transform:translateY(10px)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = success ? 'linear-gradient(135deg,#2ed573,#1abc9c)' : 'linear-gradient(135deg,#ff4757,#ff6b81)';
  t.style.color = 'white';
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; }, 3000);
}
