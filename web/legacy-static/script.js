document.addEventListener("DOMContentLoaded", () => {
    /* =========================================
       模块一：首屏入场动画
       ========================================= */
    setTimeout(() => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
    }, 100);

    /* =========================================
       模块二：核心理念滚动滑入动效
       ========================================= */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const ethosObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.observe-target').forEach(target => {
        ethosObserver.observe(target);
    });

    /* =========================================
       模块三：设施展示区块滚动监听
       ========================================= */
    const facilityObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const observeContainers = document.querySelectorAll('.facility-section .observe-container');
    observeContainers.forEach(container => {
        facilityObserver.observe(container);
    });

    /* =========================================
       模块四：横向滚动逻辑 (增加移动端判断)
       ========================================= */
    const container = document.querySelector('.why-choose-us-container');
    const track = document.querySelector('.horizontal-track');

    if (container && track) {
        let isTicking = false;

        function updateHorizontalScroll() {
            // 如果是移动端，直接退出并清除 transform，交由 CSS 垂直排版
            if (window.innerWidth <= 768) {
                track.style.transform = 'none';
                isTicking = false;
                return;
            }

            const rect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const maxScrollDistance = rect.height - viewportHeight;
            const currentScroll = -rect.top;
            let progress = currentScroll / maxScrollDistance;
            progress = Math.max(0, Math.min(1, progress));
            const movePercentage = progress * -75;
            track.style.transform = `translate3d(${movePercentage}%, 0, 0)`;
            isTicking = false;
        }

        window.addEventListener('scroll', () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateHorizontalScroll);
                isTicking = true;
            }
        });

        // 监听屏幕尺寸变化，重置状态
        window.addEventListener('resize', () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateHorizontalScroll);
                isTicking = true;
            }
        });

        updateHorizontalScroll();
    }

    /* =========================================
       全局组件：可关闭按钮交互
       ========================================= */
    const secondaryCta = document.getElementById('secondaryCta');
    const closeCtaBtn = document.getElementById('closeCtaBtn');

    if (closeCtaBtn && secondaryCta) {
        closeCtaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            secondaryCta.classList.add('cta-shrinking');

            secondaryCta.addEventListener('transitionend', function handler(event) {
                if (event.propertyName === 'transform') {
                    secondaryCta.style.display = 'none';
                    secondaryCta.removeEventListener('transitionend', handler);
                }
            });
        });
    }

    /* =========================================
       模块五：资讯与活动 (增加移动端隔离)
       ========================================= */
    const newsData = [
        { id: 1, image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop', date: '2024.10', title: '秋学期开课通知', excerpt: '2024秋季学期将于9月正式开启，新学期增设了更多融合课程，欢迎新老学员报名参加。' },
        { id: 2, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop', date: '2024.10', title: '家长课堂第42期', excerpt: '本期家长课堂主题为「如何在家庭中支持孩子融合」，特邀资深儿童心理学家分享经验。' },
        { id: 3, image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1000&auto=format&fit=crop', date: '2024.09', title: '户外实践活动', excerpt: '全校师生前往植物园开展户外实践，通过自然观察和互动游戏，提升孩子们的社交能力。' },
        { id: 4, image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=1000&auto=format&fit=crop', date: '2024.09', title: '融合教育研讨会', excerpt: '学校承办市级融合教育研讨会，分享我校在融合教育领域的实践成果与心得体会。' },
        { id: 5, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop', date: '2024.08', title: '暑假成果展', excerpt: '暑期课程圆满结束，孩子们展示了自己在艺术、运动、手工等方面的丰硕成果。' },
        { id: 6, image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop', date: '2024.08', title: '教师培训圆满完成', excerpt: '全体教师参加暑期专项培训，学习最新的融合教育理念与实践方法，为新学期做好准备。' }
    ];

    function initNewsSlider() {
        const track = document.getElementById('sliderTrack');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const navDots = document.getElementById('navDots');

        if (!track || !btnPrev || !btnNext || !navDots) return;

        track.innerHTML = newsData.map(item => `
            <article class="news-card" data-id="${item.id}">
                <div class="card-image-box">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>
                <div class="card-text-box">
                    <time class="card-date">${item.date}</time>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-excerpt">${item.excerpt}</p>
                </div>
            </article>
        `).join('');

        let currentIndex = 0;
        let isAnimating = false;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;

        function getVisibleCards() {
            return window.innerWidth >= 768 ? 2 : 1;
        }

        function getTotalPages() {
            return Math.ceil(newsData.length - getVisibleCards() + 1);
        }

        function getCardWidth() {
            const wrapper = document.getElementById('sliderWrapper');
            if (!wrapper) return 300;
            const visibleCards = getVisibleCards();
            const gap = visibleCards === 2 ? 32 : 16; 
            return (wrapper.clientWidth - gap * (visibleCards - 1)) / visibleCards;
        }

        function getTranslate() {
            const cardWidth = getCardWidth();
            const gap = getVisibleCards() === 2 ? 32 : 16;
            return -(currentIndex * (cardWidth + gap));
        }

        function updateSlider() {
            if (window.innerWidth <= 768) return; // 移动端交由原生 CSS 滚动控制
            const translate = getTranslate();
            track.style.transform = `translateX(${translate}px)`;
            updateControls();
        }

        function updateControls() {
            const totalPages = getTotalPages();
            if(btnPrev) btnPrev.disabled = currentIndex === 0;
            if(btnNext) btnNext.disabled = currentIndex === totalPages - 1;
            const dots = navDots.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        function createDots() {
            navDots.innerHTML = '';
            for (let i = 0; i < getTotalPages(); i++) {
                const dot = document.createElement('button');
                dot.className = 'dot';
                dot.setAttribute('aria-label', `跳转到第 ${i + 1} 页`);
                dot.addEventListener('click', () => {
                    if (!isAnimating && i !== currentIndex) {
                        currentIndex = i;
                        updateSlider();
                    }
                });
                navDots.appendChild(dot);
            }
        }

        function goNext() {
            if (isAnimating || window.innerWidth <= 768) return;
            if (currentIndex < getTotalPages() - 1) { currentIndex++; updateSlider(); }
        }

        function goPrev() {
            if (isAnimating || window.innerWidth <= 768) return;
            if (currentIndex > 0) { currentIndex--; updateSlider(); }
        }

        function touchStart(event) {
            if (window.innerWidth <= 768) return; // 拦截移动端触摸，使用原生 scroll-snap
            isDragging = true;
            startX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX;
            track.style.transition = 'none';
            prevTranslate = currentTranslate;
            isAnimating = false;
        }

        function touchMove(event) {
            if (!isDragging || window.innerWidth <= 768) return;
            const currentPageX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX;
            currentTranslate = prevTranslate + (currentPageX - startX);
            requestAnimationFrame(() => { track.style.transform = `translateX(${currentTranslate}px)`; });
        }

        function touchEnd() {
            if (window.innerWidth <= 768) return;
            isDragging = false;
            track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            const movedBy = currentTranslate - prevTranslate;
            const threshold = getCardWidth() * 0.2; 
            if (movedBy < -threshold && currentIndex < getTotalPages() - 1) currentIndex++;
            else if (movedBy > threshold && currentIndex > 0) currentIndex--;
            currentTranslate = getTranslate();
            track.style.transform = `translateX(${currentTranslate}px)`;
            updateControls();
        }

        if(btnPrev) btnPrev.addEventListener('click', goPrev);
        if(btnNext) btnNext.addEventListener('click', goNext);
        track.addEventListener('touchstart', touchStart, {passive: true});
        track.addEventListener('touchmove', touchMove, {passive: true});
        track.addEventListener('touchend', touchEnd);
        track.addEventListener('mousedown', touchStart);
        track.addEventListener('mousemove', touchMove);
        track.addEventListener('mouseup', touchEnd);
        track.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                createDots();
                updateSlider();
            }
        });

        if (window.innerWidth > 768) {
            createDots();
            updateSlider();
        }
    }

    initNewsSlider();

    /* =========================================
       模块六：家长感受
       ========================================= */
    const testimonialObserverOptions = { root: null, rootMargin: '0px', threshold: 0.25 };
    const testimonialObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, testimonialObserverOptions);

    document.querySelectorAll('#testimonials .observe-target').forEach(target => {
        testimonialObserver.observe(target);
    });

    /* =========================================
       模块七：社交矩阵
       ========================================= */
    const socialMatrixObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('observe-target')) {
                    entry.target.classList.add('is-visible');
                }
                if (entry.target.classList.contains('scrapbook-grid')) {
                    entry.target.querySelectorAll('.observe-item').forEach((item, index) => {
                        setTimeout(() => { item.classList.add('reveal'); }, index * 150);
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: "0px", threshold: 0.15 });

    document.querySelectorAll('.matrix-header, .matrix-ctas, .scrapbook-grid').forEach(el => {
        socialMatrixObserver.observe(el);
    });

    /* =========================================
       模块八：咨询表单交互
       ========================================= */
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            const formData = {
                title: document.getElementById('title').value,
                firstName: document.getElementById('fname').value,
                lastName: document.getElementById('lname').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            
            submitBtn.innerText = '发送中...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert(`感谢您的咨询，${formData.lastName}${formData.title}！我们会尽快回复您的邮箱：${formData.email}`);
                consultationForm.reset();
                submitBtn.innerText = originalText;
                submitBtn.style.opacity = '1';
                submitBtn.disabled = false;
            }, 1500);
        });
    }
});
