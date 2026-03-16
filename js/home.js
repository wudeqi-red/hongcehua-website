/* 红策划 首页专用 JS */

document.addEventListener('DOMContentLoaded', function () {

    // ====== 导航栏滚动效果 ======
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // ====== 移动端汉堡菜单 ======
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });
    }

    // ====== 数字计数动画 ======
    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // 交叉观察器触发计数
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));
    }

    // ====== 滚动入场动画 ======
    const revealEls = document.querySelectorAll(
        '.svc-card, .case-big-card, .case-sm-card, .testi-card, .bc-card, .ps-item, .af-item'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // 稍微错开动画时间
                const delay = (entry.target.dataset.delay || 0) * 80;
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = entry.target.style.transform
                        .replace('translateY(32px)', 'translateY(0)');
                    entry.target.classList.add('revealed');
                }, delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealEls.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.dataset.delay = i % 4; // 每行4个错开
        revealObserver.observe(el);
    });

    // ====== 表单提交 ======
    window.submitForm = function (e) {
        e.preventDefault();
        const btn = e.target.querySelector('.btn-submit-new') ||
                    e.target.querySelector('.btn-submit');
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = '✅ 提交成功，稍后联系您！';
        btn.style.background = '#22c55e';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
            btn.disabled = false;
            e.target.reset();
        }, 3000);
    };

    // ====== 平滑滚动 ======
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 关闭移动菜单
                if (navLinks) navLinks.classList.remove('mobile-open');
            }
        });
    });

});
