/* ============================================================
   auth.js - 登录状态管理（基于 CloudBase）
   ============================================================ */

/* ---------- 鉴权：未登录跳转登录页 ---------- */
function requireLogin() {
  const sess = sessionStorage.getItem('hc_logged_user');
  if (!sess) {
    window.location.href = 'login.html';
    return null;
  }
  try {
    return JSON.parse(sess);
  } catch {
    window.location.href = 'login.html';
    return null;
  }
}

/* ---------- 获取当前登录用户 ---------- */
function getCurrentUser() {
  try {
    const sess = sessionStorage.getItem('hc_logged_user');
    return sess ? JSON.parse(sess) : null;
  } catch { return null; }
}

/* ---------- 退出登录 ---------- */
function adminLogout() {
  sessionStorage.removeItem('hc_logged_user');
  window.location.href = 'login.html';
}
