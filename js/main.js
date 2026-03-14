/* ============================================================
   main.js - 首页交互逻辑
   ============================================================ */

// 导航栏滚动效果
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// 数字滚动动画
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// Intersection Observer 触发数字动画
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounters(); obs.disconnect(); } });
  }, { threshold: 0.5 });
  obs.observe(heroStats);
}

// 表单提交
function submitForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  btn.textContent = '✅ 提交成功，我们将尽快联系您！';
  btn.disabled = true;
  btn.style.background = 'linear-gradient(135deg,#43e97b,#38f9d7)';
  setTimeout(() => {
    btn.textContent = '立即咨询 🚀';
    btn.disabled = false;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

// 汉堡菜单（移动端）
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks && navLinks.classList.toggle('mobile-open');
  });
}
