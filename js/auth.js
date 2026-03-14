/* ============================================================
   auth.js - 登录认证逻辑
   ============================================================ */

// 默认账号密码（首次使用，登录后可在后台修改）
const DEFAULT_ADMIN = { user: 'admin', pass: 'hongcehua2024' };

function getAdminCredentials() {
  try {
    const raw = localStorage.getItem('hc_admin_credentials');
    return raw ? JSON.parse(raw) : DEFAULT_ADMIN;
  } catch { return DEFAULT_ADMIN; }
}

function saveAdminCredentials(user, pass) {
  localStorage.setItem('hc_admin_credentials', JSON.stringify({ user, pass }));
}

/* ---------- 登录页逻辑 ---------- */
function doLogin() {
  const inputUser = document.getElementById('loginUser')?.value.trim();
  const inputPass = document.getElementById('loginPass')?.value;
  const errEl = document.getElementById('loginError');

  const cred = getAdminCredentials();

  if (inputUser === cred.user && inputPass === cred.pass) {
    // 写入登录态（sessionStorage，关闭浏览器后自动失效）
    sessionStorage.setItem('hc_admin_logged', '1');
    window.location.href = 'admin.html';
  } else {
    errEl && errEl.classList.add('show');
    document.getElementById('loginPass').value = '';
    setTimeout(() => errEl && errEl.classList.remove('show'), 3000);
  }
}

function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ---------- 后台页鉴权（在 admin.js 之前执行） ---------- */
function requireLogin() {
  if (!sessionStorage.getItem('hc_admin_logged')) {
    window.location.href = 'login.html';
  }
}

function adminLogout() {
  sessionStorage.removeItem('hc_admin_logged');
  window.location.href = 'login.html';
}
