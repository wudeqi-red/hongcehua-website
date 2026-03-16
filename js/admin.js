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
  // 首页配置进入时加载配置
  if (name === 'homepage') loadHomepageConfig();
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

  const kw       = (document.getElementById('adminBloggerSearch')?.value || '').trim().toLowerCase();
  const platform = document.getElementById('filterPlatform')?.value || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const region   = document.getElementById('filterRegion')?.value || '';

  let data = adminBloggers;
  if (kw)       data = data.filter(b => b.name.toLowerCase().includes(kw) || b.category.includes(kw) || b.region.includes(kw));
  if (platform) data = data.filter(b => b.platform === platform);
  if (category) data = data.filter(b => b.category === category);
  if (region)   data = data.filter(b => b.region === region);

  const countEl = document.getElementById('bloggerCountLabel');
  if (countEl) countEl.textContent = `共 ${data.length} 条`;

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

function resetBloggerFilters() {
  const ids = ['adminBloggerSearch','filterPlatform','filterCategory','filterRegion'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderAdminBloggers();
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
    setVal('b_wechat',   b.wechat || '');
    setVal('b_tags',     b.tags.join(','));
  } else {
    title.textContent = '添加博主';
    clearVals(['b_name','b_fans','b_likes','b_link','b_wechat','b_tags']);
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
    wechat:   getVal('b_wechat').trim() || '',
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
   Excel 批量导入博主
   ============================================================ */

/** 下载导入模板 */
function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();
  const header = [['博主昵称*', '平台*', '分类*', '地区', '粉丝量', '月均点赞', '主页链接', '微信号', '标签(逗号分隔)']];
  const example = [['美食达人小王', '小红书', '餐饮美食', '上海', '50w', '3w', 'https://...', 'wechat_id_123', '美食,探店,上海']];
  const ws = XLSX.utils.aoa_to_sheet([...header, ...example]);
  ws['!cols'] = [20,10,10,8,10,10,25,18,20].map(w => ({wch: w}));
  XLSX.utils.book_append_sheet(wb, ws, '博主导入模板');
  XLSX.writeFile(wb, '博主导入模板.xlsx');
}

/** 解析并导入 Excel */
async function importExcel(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      const dataRows = rows.slice(1).filter(r => r[0] && String(r[0]).trim());
      if (dataRows.length === 0) { showToast('Excel 中没有数据', false); return; }

      if (!confirm(`检测到 ${dataRows.length} 条博主数据，确认导入？`)) return;

      showLoadingOverlay(true);
      let successCount = 0;
      let failCount = 0;

      for (const row of dataRows) {
        const name     = String(row[0] || '').trim();
        const platform = String(row[1] || '小红书').trim();
        const category = String(row[2] || '餐饮美食').trim();
        const region   = String(row[3] || '全国').trim();
        const fans     = String(row[4] || '0').trim();
        const likes    = String(row[5] || '0').trim();
        const link     = String(row[6] || '#').trim();
        const wechat   = String(row[7] || '').trim();
        const tagsRaw  = String(row[8] || '').trim();
        const tags     = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

        if (!name) continue;

        try {
          const data = {
            name, platform, category, region, fans, likes, link, wechat, tags,
            fansNum: parseFansNum(fans),
            status: 'active',
          };
          const newId = await dbAdd(BLOGGERS_COL, data);
          adminBloggers.unshift({ _id: newId, ...data });
          successCount++;
        } catch(err) {
          failCount++;
          console.warn('导入行失败:', row, err);
        }
      }

      showLoadingOverlay(false);
      renderAdminBloggers();
      renderDashboard();

      if (failCount === 0) {
        showToast(`成功导入 ${successCount} 位博主！`);
      } else {
        showToast(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`, false);
      }
    } catch(err) {
      showLoadingOverlay(false);
      showToast('Excel 解析失败，请使用模板格式', false);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

/** 导出博主数据为 Excel（含微信号，仅后台） */
function exportBloggersExcel() {
  // 按当前筛选结果导出
  const kw       = (document.getElementById('adminBloggerSearch')?.value || '').trim().toLowerCase();
  const platform = document.getElementById('filterPlatform')?.value || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const region   = document.getElementById('filterRegion')?.value || '';

  let data = adminBloggers;
  if (kw)       data = data.filter(b => b.name.toLowerCase().includes(kw) || b.category.includes(kw) || b.region.includes(kw));
  if (platform) data = data.filter(b => b.platform === platform);
  if (category) data = data.filter(b => b.category === category);
  if (region)   data = data.filter(b => b.region === region);

  if (data.length === 0) { showToast('没有可导出的数据', false); return; }

  const header = [['博主昵称', '平台', '领域', '地区', '粉丝量', '赞藏量', '主页链接', '微信号', '标签', '状态']];
  const rows = data.map(b => [
    b.name, b.platform, b.category, b.region,
    b.fans, b.likes, b.link || '',
    b.wechat || '',
    (b.tags || []).join(','),
    b.status === 'active' ? '合作中' : '待确认',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws['!cols'] = [20,10,10,8,10,10,30,18,20,8].map(w => ({wch: w}));
  XLSX.utils.book_append_sheet(wb, ws, '博主数据');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `博主数据_${dateStr}.xlsx`);
  showToast(`已导出 ${data.length} 条博主数据`);
}

/* ============================================================
   案例图片上传（CloudBase 云存储）
   ============================================================ */
let _caseImgFile = null;  // 当前选择的图片文件
let _caseImgUrl  = '';    // 已上传的图片URL

function previewCaseImg(input) {
  const file = input.files[0];
  if (!file) return;
  _caseImgFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('caseImgPreview').src = e.target.result;
    document.getElementById('caseImgPreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeCaseImg() {
  _caseImgFile = null;
  _caseImgUrl  = '';
  document.getElementById('c_image').value = '';
  document.getElementById('caseImgPreviewWrap').style.display = 'none';
  document.getElementById('caseImgPreview').src = '';
}

async function uploadCaseImg() {
  if (!_caseImgFile) return _caseImgUrl || '';
  try {
    await initCloud();
    const ext  = _caseImgFile.name.split('.').pop();
    const path = `cases/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const res  = await _app.uploadFile({ cloudPath: path, filePath: _caseImgFile });
    // 获取下载URL
    const urlRes = await _app.getTempFileURL({ fileList: [res.fileID] });
    return urlRes.fileList[0]?.tempFileURL || '';
  } catch(e) {
    console.error('图片上传失败', e);
    return '';
  }
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
  // 显示已有封面图
  _caseImgFile = null;
  _caseImgUrl  = c.coverUrl || '';
  if (_caseImgUrl) {
    document.getElementById('caseImgPreview').src = _caseImgUrl;
    document.getElementById('caseImgPreviewWrap').style.display = 'block';
  } else {
    document.getElementById('caseImgPreviewWrap').style.display = 'none';
  }
  document.getElementById('caseAdminModal').classList.add('active');
}

function closeCaseAdminModal() {
  document.getElementById('caseAdminModal').classList.remove('active');
  editingCaseId = null;
  removeCaseImg();
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

  // 上传图片（如果有）
  const saveBtnEl = document.querySelector('#caseAdminModal .btn-save');
  if (saveBtnEl) { saveBtnEl.disabled = true; saveBtnEl.textContent = '保存中...'; }

  let coverUrl = _caseImgUrl;
  if (_caseImgFile) {
    showToast('图片上传中...', true);
    coverUrl = await uploadCaseImg();
  }

  const data = {
    title,
    type:        getVal('c_type'),
    industry:    getVal('c_industry'),
    desc:        getVal('c_desc'),
    exposure:    getVal('c_exposure') || '—',
    interaction: getVal('c_interaction') || '—',
    conversion:  getVal('c_conversion') || '—',
    coverUrl:    coverUrl || '',
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
  } catch(e) {
    showToast('保存失败', false);
  } finally {
    if (saveBtnEl) { saveBtnEl.disabled = false; saveBtnEl.textContent = '保存'; }
  }
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

/* ============================================================
   首页配置模块
   ============================================================ */

// 存储各图片的文件对象和已上传URL
const _hpImgFiles = { hero: null, about1: null, about2: null, process: null, contact: null };
const _hpImgUrls  = { hero: '',   about1: '',   about2: '',   process: '',   contact: '' };

/** 进入首页配置时加载已有配置 */
async function loadHomepageConfig() {
  showLoadingOverlay(true);
  try {
    const cfg = await getHomepageConfig();
    if (cfg) {
      // Hero
      setVal('hp_hero_url',     cfg.hero?.bgUrl    || '');
      setVal('hp_hero_title',   cfg.hero?.title    || '');
      setVal('hp_hero_sub',     cfg.hero?.sub      || '');
      setVal('hp_hero_eyebrow', cfg.hero?.eyebrow  || '');
      if (cfg.hero?.bgUrl) {
        document.getElementById('hp_hero_current').textContent = '已使用自定义图片';
      }
      _hpImgUrls.hero    = cfg.hero?.bgUrl    || '';
      _hpImgUrls.about1  = cfg.about?.img1Url || '';
      _hpImgUrls.about2  = cfg.about?.img2Url || '';
      _hpImgUrls.process = cfg.process?.bgUrl || '';
      _hpImgUrls.contact = cfg.contact?.bgUrl || '';

      // 数据条
      const stats = cfg.stats || [];
      ['1','2','3','4'].forEach((n, i) => {
        setVal(`hp_stat${n}_num`,    stats[i]?.num    || '');
        setVal(`hp_stat${n}_suffix`, stats[i]?.suffix || '');
        setVal(`hp_stat${n}_label`,  stats[i]?.label  || '');
      });

      // 关于我们
      setVal('hp_about_label', cfg.about?.label || '');
      setVal('hp_about_title', cfg.about?.title || '');
      setVal('hp_about_desc',  cfg.about?.desc  || '');
      setVal('hp_about_rate',  cfg.about?.rate  || '');
      if (cfg.about?.img1Url) { showHpImgPreview('about1', cfg.about.img1Url); }
      if (cfg.about?.img2Url) { showHpImgPreview('about2', cfg.about.img2Url); }

      // 合作流程
      setVal('hp_process_url',   cfg.process?.bgUrl || '');
      setVal('hp_process_title', cfg.process?.title || '');
      if (cfg.process?.bgUrl) { showHpImgPreview('process', cfg.process.bgUrl); }

      // 联系我们
      setVal('hp_contact_url',    cfg.contact?.bgUrl  || '');
      setVal('hp_contact_phone',  cfg.contact?.phone  || '');
      setVal('hp_contact_wechat', cfg.contact?.wechat || '');
      if (cfg.contact?.bgUrl) { showHpImgPreview('contact', cfg.contact.bgUrl); }
    }
  } catch(e) {
    console.error('加载首页配置失败', e);
  }
  showLoadingOverlay(false);
}

/** 预览上传的图片 */
function previewHpImg(input, slot) {
  const file = input.files[0];
  if (!file) return;
  _hpImgFiles[slot] = file;

  const reader = new FileReader();
  reader.onload = (e) => showHpImgPreview(slot, e.target.result);
  reader.readAsDataURL(file);
}

function showHpImgPreview(slot, src) {
  const previewMap = {
    hero:    ['heroImgPreview',     'heroImgPreviewWrap'],
    about1:  ['aboutImg1Preview',   'aboutImg1PreviewWrap'],
    about2:  ['aboutImg2Preview',   'aboutImg2PreviewWrap'],
    process: ['processImgPreview',  'processImgPreviewWrap'],
    contact: ['contactImgPreview',  'contactImgPreviewWrap'],
  };
  const [imgId, wrapId] = previewMap[slot] || [];
  if (!imgId) return;
  const img  = document.getElementById(imgId);
  const wrap = document.getElementById(wrapId);
  if (img)  img.src = src;
  if (wrap) wrap.style.display = 'block';
}

function removeHpImg(slot) {
  _hpImgFiles[slot] = null;
  _hpImgUrls[slot]  = '';
  const previewMap = {
    hero:    ['heroImgPreview',     'heroImgPreviewWrap',    'hp_hero_img'],
    about1:  ['aboutImg1Preview',   'aboutImg1PreviewWrap',  'hp_about1_img'],
    about2:  ['aboutImg2Preview',   'aboutImg2PreviewWrap',  'hp_about2_img'],
    process: ['processImgPreview',  'processImgPreviewWrap', 'hp_process_img'],
    contact: ['contactImgPreview',  'contactImgPreviewWrap', 'hp_contact_img'],
  };
  const [imgId, wrapId, inputId] = previewMap[slot] || [];
  if (imgId)   { const el = document.getElementById(imgId);   if (el) el.src = ''; }
  if (wrapId)  { const el = document.getElementById(wrapId);  if (el) el.style.display = 'none'; }
  if (inputId) { const el = document.getElementById(inputId); if (el) el.value = ''; }
  if (slot === 'hero') {
    const cur = document.getElementById('hp_hero_current');
    if (cur) cur.textContent = '默认 Unsplash 图片';
  }
}

/** 上传单张图片，返回 URL */
async function _uploadHpSlot(slot) {
  if (_hpImgFiles[slot]) {
    const url = await uploadHpImage(_hpImgFiles[slot], slot);
    _hpImgUrls[slot] = url;
    _hpImgFiles[slot] = null;
    return url;
  }
  // 如果填了URL字段，优先用URL字段
  const urlFieldMap = { hero: 'hp_hero_url', process: 'hp_process_url', contact: 'hp_contact_url' };
  if (urlFieldMap[slot]) {
    const urlVal = getVal(urlFieldMap[slot]).trim();
    if (urlVal) return urlVal;
  }
  return _hpImgUrls[slot] || '';
}

/** 保存首页配置 */
async function saveHomepageConfig() {
  const saveBtns = document.querySelectorAll('#section-homepage .btn-add');
  saveBtns.forEach(b => { b.disabled = true; });
  showToast('正在上传图片并保存...', true);

  try {
    // 并行上传所有需要上传的图片
    const [heroUrl, about1Url, about2Url, processUrl, contactUrl] = await Promise.all([
      _uploadHpSlot('hero'),
      _uploadHpSlot('about1'),
      _uploadHpSlot('about2'),
      _uploadHpSlot('process'),
      _uploadHpSlot('contact'),
    ]);

    const stats = ['1','2','3','4'].map(n => ({
      num:    getVal(`hp_stat${n}_num`).trim(),
      suffix: getVal(`hp_stat${n}_suffix`).trim(),
      label:  getVal(`hp_stat${n}_label`).trim(),
    }));

    const config = {
      hero: {
        bgUrl:   heroUrl,
        title:   getVal('hp_hero_title').trim(),
        sub:     getVal('hp_hero_sub').trim(),
        eyebrow: getVal('hp_hero_eyebrow').trim(),
      },
      stats,
      about: {
        label:   getVal('hp_about_label').trim(),
        title:   getVal('hp_about_title').trim(),
        desc:    getVal('hp_about_desc').trim(),
        rate:    getVal('hp_about_rate').trim(),
        img1Url: about1Url,
        img2Url: about2Url,
      },
      process: {
        bgUrl: processUrl,
        title: getVal('hp_process_title').trim(),
      },
      contact: {
        bgUrl:  contactUrl,
        phone:  getVal('hp_contact_phone').trim(),
        wechat: getVal('hp_contact_wechat').trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    await saveHomepageConfigDB(config);

    // 同时写入 localStorage 供前台快速读取
    localStorage.setItem('hc_homepage_config', JSON.stringify(config));

    showToast('首页配置已保存！前台将立即生效 ✅');

    // 更新 Hero 当前图片提示
    if (heroUrl) {
      const cur = document.getElementById('hp_hero_current');
      if (cur) cur.textContent = '已使用自定义图片';
    }
  } catch(e) {
    console.error('保存首页配置失败', e);
    showToast('保存失败，请检查网络', false);
  } finally {
    saveBtns.forEach(b => { b.disabled = false; });
  }
}
