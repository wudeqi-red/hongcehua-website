/* ============================================================
   cloud.js - 腾讯云 CloudBase 数据库封装
   环境ID: redcehua-7gt17uaj749c797c
   ============================================================ */

const ENV_ID = 'redcehua-7gt17uaj749c797c';

let _app = null;
let _db  = null;

/* ---------- 初始化 ---------- */
async function initCloud() {
  if (_app) return _app;
  _app = cloudbase.init({ env: ENV_ID, region: 'ap-shanghai' });
  // 匿名登录（新版SDK写法）
  try {
    const auth = _app.auth({ persistence: 'local' });
    const loginState = await auth.getLoginState();
    if (!loginState) {
      await auth.signInAnonymously();
    }
  } catch(e) { console.warn('匿名登录失败', e); }
  _db = _app.database();
  return _app;
}

function getDB() {
  if (!_db) throw new Error('CloudBase 尚未初始化，请先调用 initCloud()');
  return _db;
}

/* ============================================================
   通用 CRUD 封装
   ============================================================ */

/** 获取集合全部数据（最多1000条） */
async function dbGetAll(collection) {
  await initCloud();
  const db = getDB();
  // CloudBase 单次最多100条，需分页
  let list = [];
  let page = 0;
  const pageSize = 100;
  while (true) {
    const res = await db.collection(collection).skip(page * pageSize).limit(pageSize).get();
    list = list.concat(res.data);
    if (res.data.length < pageSize) break;
    page++;
  }
  return list;
}

/** 新增一条记录，返回新记录的 _id */
async function dbAdd(collection, data) {
  await initCloud();
  const res = await getDB().collection(collection).add(data);
  return res.id;
}

/** 更新一条记录（按 _id） */
async function dbUpdate(collection, id, data) {
  await initCloud();
  await getDB().collection(collection).doc(id).update(data);
}

/** 删除一条记录（按 _id） */
async function dbRemove(collection, id) {
  await initCloud();
  await getDB().collection(collection).doc(id).remove();
}

/** 按条件查询（返回数组） */
async function dbWhere(collection, where) {
  await initCloud();
  const res = await getDB().collection(collection).where(where).get();
  return res.data;
}

/* ============================================================
   用户账号模块
   集合名: hc_users
   字段: username, password(明文，后续可升级hash), role(admin/sub), createdAt, email
   ============================================================ */

const USERS_COL = 'hc_users';

/** 查找用户 */
async function findUser(username) {
  const list = await dbWhere(USERS_COL, { username });
  return list[0] || null;
}

/** 验证登录 */
async function verifyLogin(username, password) {
  const user = await findUser(username);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

/** 创建用户（管理员创建子账号） */
async function createUser(username, password, role = 'sub', email = '') {
  // 检查用户名是否已存在
  const exist = await findUser(username);
  if (exist) throw new Error('用户名已存在');
  const id = await dbAdd(USERS_COL, {
    username,
    password,
    role,
    email,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** 修改密码 */
async function changePassword(userId, newPassword) {
  await dbUpdate(USERS_COL, userId, { password: newPassword });
}

/** 修改用户名 */
async function changeUsername(userId, newUsername) {
  await dbUpdate(USERS_COL, userId, { username: newUsername });
}

/** 获取所有用户 */
async function getAllUsers() {
  return await dbGetAll(USERS_COL);
}

/** 删除用户 */
async function deleteUser(userId) {
  await dbRemove(USERS_COL, userId);
}

/* ============================================================
   确保默认管理员账号存在
   首次使用时自动初始化 admin / hongcehua2024
   ============================================================ */
async function ensureAdminExists() {
  try {
    await initCloud();
    const admin = await findUser('admin');
    if (!admin) {
      await createUser('admin', 'hongcehua2024', 'admin', '');
      console.log('默认管理员账号已初始化');
    }
  } catch(e) {
    console.warn('初始化管理员账号失败', e);
  }
}

/* ============================================================
   博主 / 案例 / 供应商 / 询盘 集合名
   ============================================================ */
const BLOGGERS_COL  = 'hc_bloggers';
const CASES_COL     = 'hc_cases';
const SUPPLIERS_COL = 'hc_suppliers';
const INQUIRIES_COL = 'hc_inquiries';
const HOMEPAGE_COL  = 'hc_homepage_config';

/* ============================================================
   首页配置模块
   存储为单条文档（key: 'main'）
   ============================================================ */

/** 读取首页配置 */
async function getHomepageConfig() {
  try {
    await initCloud();
    const list = await dbWhere(HOMEPAGE_COL, { key: 'main' });
    return list[0] || null;
  } catch(e) {
    console.warn('读取首页配置失败', e);
    return null;
  }
}

/** 保存首页配置 */
async function saveHomepageConfigDB(config) {
  await initCloud();
  const list = await dbWhere(HOMEPAGE_COL, { key: 'main' });
  if (list[0]) {
    await dbUpdate(HOMEPAGE_COL, list[0]._id, { ...config, key: 'main' });
  } else {
    await dbAdd(HOMEPAGE_COL, { ...config, key: 'main' });
  }
}

/** 上传首页配置图片到云存储 */
async function uploadHpImage(file, slot) {
  await initCloud();
  const ext  = file.name.split('.').pop();
  const path = `homepage/${slot}_${Date.now()}.${ext}`;
  const res  = await _app.uploadFile({ cloudPath: path, filePath: file });
  const urlRes = await _app.getTempFileURL({ fileList: [res.fileID] });
  return urlRes.fileList[0]?.tempFileURL || '';
}

/** 上传案例 PDF 到云存储，返回临时访问 URL */
async function uploadCasePDF(file, caseTitle) {
  await initCloud();
  // 用时间戳 + 安全文件名避免冲突
  const safeName = caseTitle.replace(/[^\w\u4e00-\u9fa5]/g, '_').slice(0, 30);
  const path = `cases/pdf/${safeName}_${Date.now()}.pdf`;
  const res  = await _app.uploadFile({ cloudPath: path, filePath: file });
  // 获取长期 fileID（存入数据库），同时拿一个临时URL用于立即预览
  const urlRes = await _app.getTempFileURL({ fileList: [res.fileID] });
  return {
    fileID:  res.fileID,
    tempUrl: urlRes.fileList[0]?.tempFileURL || '',
  };
}

/** 根据已存的 fileID 刷新临时访问 URL（前台展示时调用） */
async function refreshPDFUrl(fileID) {
  await initCloud();
  const urlRes = await _app.getTempFileURL({ fileList: [fileID] });
  return urlRes.fileList[0]?.tempFileURL || '';
}
