/* 红策划 首页专用 JS */

/* ====== 首页配置动态加载 ====== */
(function applyHomepageConfig() {
    try {
        const raw = localStorage.getItem('hc_homepage_config');
        if (!raw) return;
        const cfg = JSON.parse(raw);
        if (!cfg) return;

        // ---------- Hero 大图 ----------
        if (cfg.hero) {
            const h = cfg.hero;
            if (h.bgUrl) {
                const heroImg = document.querySelector('.hero-bg-img img');
                if (heroImg) heroImg.src = h.bgUrl;
            }
            if (h.eyebrow) {
                const eyebrowEl = document.querySelector('.hero-eyebrow');
                if (eyebrowEl) {
                    // 保留两个 .dot 元素，只更新文字
                    const dots = eyebrowEl.querySelectorAll('.dot');
                    eyebrowEl.innerHTML = '';
                    if (dots[0]) eyebrowEl.appendChild(dots[0]);
                    eyebrowEl.appendChild(document.createTextNode(' ' + h.eyebrow + ' '));
                    if (dots[1]) eyebrowEl.appendChild(dots[1]);
                }
            }
            if (h.title) {
                const h1 = document.querySelector('.hero-h1');
                if (h1) h1.innerHTML = h.title;
            }
            if (h.sub) {
                const subEl = document.querySelector('.hero-sub');
                if (subEl) subEl.textContent = h.sub;
            }
        }

        // ---------- 数据条 ----------
        if (cfg.stats && cfg.stats.length) {
            const items = document.querySelectorAll('.hsb-item');
            cfg.stats.forEach((s, i) => {
                if (!items[i]) return;
                const numEl = items[i].querySelector('.hsb-num');
                const labelEl = items[i].querySelector('.hsb-label');
                if (numEl && s.num) {
                    const counter = numEl.querySelector('.counter');
                    if (counter) {
                        counter.setAttribute('data-target', s.num);
                        counter.textContent = '0';
                    }
                    // 更新后缀文字（counter 后面的文本节点）
                    if (s.suffix !== undefined) {
                        Array.from(numEl.childNodes).forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE) node.textContent = s.suffix;
                        });
                    }
                }
                if (labelEl && s.label) labelEl.textContent = s.label;
            });
        }

        // ---------- 关于我们 ----------
        if (cfg.about) {
            const a = cfg.about;
            if (a.label) {
                const el = document.querySelector('.about-section .section-label');
                if (el) el.textContent = a.label;
            }
            if (a.title) {
                const el = document.querySelector('.about-section .section-title');
                if (el) el.innerHTML = a.title;
            }
            if (a.desc) {
                const el = document.querySelector('.about-desc');
                if (el) el.textContent = a.desc;
            }
            if (a.img1Url) {
                const el = document.querySelector('.about-img-main img');
                if (el) el.src = a.img1Url;
            }
            if (a.img2Url) {
                const el = document.querySelector('.about-img-sub img');
                if (el) el.src = a.img2Url;
            }
            if (a.rate) {
                const el = document.querySelector('.ab-num');
                if (el) el.textContent = a.rate + '%';
            }
        }

        // ---------- 合作流程背景图 ----------
        if (cfg.process) {
            const p = cfg.process;
            if (p.bgUrl) {
                const el = document.querySelector('.process-bg img');
                if (el) el.src = p.bgUrl;
            }
            if (p.title) {
                const el = document.querySelector('.process-section .section-title');
                if (el) el.innerHTML = p.title;
            }
        }

        // ---------- 联系我们 ----------
        if (cfg.contact) {
            const c = cfg.contact;
            if (c.bgUrl) {
                const el = document.querySelector('.contact-bg img');
                if (el) el.src = c.bgUrl;
            }
            if (c.phone) {
                // 更新所有出现联系电话的地方
                document.querySelectorAll('.cil-val').forEach(el => {
                    if (/^\d{11}$/.test(el.textContent.trim()) || el.textContent.trim() === '18860923047') {
                        el.textContent = c.phone;
                    }
                });
                // 页脚电话
                const footerPhone = document.querySelector('a[href^="tel:"]');
                if (footerPhone) {
                    footerPhone.href = 'tel:' + c.phone;
                    footerPhone.textContent = '📞 ' + c.phone;
                }
            }
            if (c.wechat) {
                // 联系区微信
                const wechatVal = document.querySelectorAll('.cil-val')[1];
                if (wechatVal) wechatVal.textContent = c.wechat;
            }
        }

    } catch(e) {
        console.warn('首页配置加载失败', e);
    }
})();



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
