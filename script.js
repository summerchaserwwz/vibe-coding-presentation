document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const currentSpan = document.querySelector('.current');
    const totalSpan = document.querySelector('.total');
    const timelineItems = Array.from(document.querySelectorAll('#outline-timeline .timeline-item'));
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const slideContainer = document.querySelector('.slide-container');
    const partStartIndices = [0, 5, 9, 14];
    let currentIndex = 0;

    prepareSlideCanvases(slides);

    if (totalSpan) {
        totalSpan.textContent = String(slides.length).padStart(2, '0');
    }

    if (prevBtn) {
        prevBtn.onclick = () => go(currentIndex - 1);
    }

    if (nextBtn) {
        nextBtn.onclick = () => go(currentIndex + 1);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            go(currentIndex - 1);
            return;
        }

        if (event.key === 'ArrowRight' || event.key === ' ') {
            event.preventDefault();
            go(currentIndex + 1);
            return;
        }

        if (event.key >= '1' && event.key <= '4') {
            go(partStartIndices[Number(event.key) - 1]);
        }
    });

    timelineItems.forEach((item) => {
        item.addEventListener('click', () => {
            const targetIndex = Number.parseInt(item.dataset.target ?? '', 10);

            if (!Number.isNaN(targetIndex)) {
                go(targetIndex);
            }
        });
    });

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const partIndex = Number.parseInt(tab.dataset.part ?? '', 10);
            go(partStartIndices[partIndex]);
        });
    });

    const refreshSlideLayout = bindResponsiveLayout(slideContainer, slides);
    sync();

    /**
     * 将每一页的标题区与主体区拆开，统一交给 CSS 布局系统处理。
     * 这样可以在不重写现有 HTML 的前提下，让主体区自动吃满剩余高度。
     */
    function prepareSlideCanvases(slideNodes) {
        slideNodes.forEach((slide, index) => {
            const firstElement = slide.firstElementChild;

            slide.dataset.slideIndex = String(index + 1);

            if (firstElement && firstElement.classList.contains('slide-fit-shell')) {
                return;
            }

            const shell = document.createElement('div');
            const header = document.createElement('div');
            const body = document.createElement('div');
            const nodes = Array.from(slide.childNodes);

            shell.className = 'slide-fit-shell';
            header.className = 'slide-fit-header';
            body.className = 'slide-fit-body';

            nodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
                    return;
                }

                const element = node.nodeType === Node.ELEMENT_NODE ? node : null;
                const isHeaderNode = Boolean(
                    element &&
                    (
                        element.classList.contains('tag-row') ||
                        element.classList.contains('slide-title') ||
                        element.classList.contains('subtitle')
                    )
                );

                if (isHeaderNode) {
                    header.appendChild(node);
                    return;
                }

                body.appendChild(node);
            });

            shell.appendChild(header);
            shell.appendChild(body);
            slide.appendChild(shell);
        });
    }

    /**
     * 监听窗口和画布尺寸变化，为当前宽高比切换紧凑模式。
     * 紧凑模式只在确实发生溢出时生效，正常比例下仍保持原视觉风格。
     */
    function bindResponsiveLayout(container, slideNodes) {
        const refresh = () => {
            slideNodes.forEach(updateSlideOverflowState);
        };

        const queueRefresh = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(refresh);
            });
        };

        window.addEventListener('resize', queueRefresh);

        if (typeof ResizeObserver === 'function' && container) {
            const resizeObserver = new ResizeObserver(queueRefresh);
            resizeObserver.observe(container);
        }

        if (document.fonts?.ready) {
            document.fonts.ready.then(queueRefresh).catch(() => {});
        }

        queueRefresh();
        return queueRefresh;
    }

    /**
     * 当主体内容滚动尺寸超过可用尺寸时，为该页打上紧凑模式标记。
     * 这样浏览器缩放或小尺寸屏幕下不会再把内容顶出中间画布。
     */
    function updateSlideOverflowState(slide) {
        const body = slide.querySelector('.slide-fit-body');

        if (!body) {
            return;
        }

        slide.classList.remove('slide-compact');

        const overflowY = body.scrollHeight - body.clientHeight;
        const overflowX = body.scrollWidth - body.clientWidth;
        const isCompact = overflowY > 6 || overflowX > 6;

        slide.classList.toggle('slide-compact', isCompact);
    }

    function go(nextIndex) {
        if (nextIndex < 0 || nextIndex >= slides.length || nextIndex === currentIndex) {
            return;
        }

        slides[currentIndex].classList.remove('active');
        slides[currentIndex].classList.add(nextIndex > currentIndex ? 'prev' : 'next');
        currentIndex = nextIndex;
        slides[currentIndex].classList.remove('prev', 'next');
        void slides[currentIndex].offsetWidth;
        slides[currentIndex].classList.add('active');
        sync();
    }

    function sync() {
        if (currentSpan) {
            currentSpan.textContent = String(currentIndex + 1).padStart(2, '0');
        }

        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = currentIndex === slides.length - 1;
        }

        timelineItems.forEach((item, index) => {
            item.classList.toggle('active-sub', index === currentIndex);
        });

        const activePartIndex =
            currentIndex < 5 ? 0 :
            currentIndex < 9 ? 1 :
            currentIndex < 14 ? 2 : 3;

        tabs.forEach((tab, index) => {
            tab.classList.toggle('active', index === activePartIndex);

            const fill = tab.querySelector('.tab-progress-fill');
            const status = tab.querySelector('.part-status');

            if (fill) {
                fill.style.width = index <= activePartIndex ? '100%' : '0%';
            }

            if (status) {
                status.textContent = index <= activePartIndex ? 'Loaded' : 'Pending';
                status.className = `part-status ${index <= activePartIndex ? 'success' : 'pending'}`;
            }
        });

        refreshSlideLayout();
    }
});
