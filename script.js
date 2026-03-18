document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const currentSpan = document.querySelector('.current');
    const totalSpan = document.querySelector('.total');
    const timelineItems = document.querySelectorAll('#outline-timeline .timeline-item');
    const tabs = document.querySelectorAll('.tab');
    let cur = 0;
    const N = slides.length;
    if (totalSpan) totalSpan.textContent = String(N).padStart(2,'0');
    sync();

    if (prevBtn) prevBtn.onclick = () => go(cur - 1);
    if (nextBtn) nextBtn.onclick = () => go(cur + 1);
    document.addEventListener('keydown', e => {
        if (e.key==='ArrowLeft') go(cur-1);
        else if (e.key==='ArrowRight'||e.key===' ') { e.preventDefault(); go(cur+1); }
        else if (e.key>='1'&&e.key<='4') go([0,5,9,14][+e.key-1]);
    });
    timelineItems.forEach(it => it.addEventListener('click', () => {
        const t = parseInt(it.dataset.target); if(!isNaN(t)) go(t);
    }));
    tabs.forEach(tab => tab.addEventListener('click', () => {
        go([0,5,9,14][parseInt(tab.dataset.part)]);
    }));

    function go(idx) {
        if (idx<0||idx>=N||idx===cur) return;
        slides[cur].classList.remove('active');
        slides[cur].classList.add(idx>cur?'prev':'next');
        cur = idx;
        slides[cur].classList.remove('prev','next');
        void slides[cur].offsetWidth;
        slides[cur].classList.add('active');
        sync();
    }
    function sync() {
        if (currentSpan) currentSpan.textContent = String(cur+1).padStart(2,'0');
        if (prevBtn) prevBtn.disabled = cur===0;
        if (nextBtn) nextBtn.disabled = cur===N-1;
        timelineItems.forEach((it,i) => it.classList.toggle('active-sub', i===cur));
        const p = cur<5?0:cur<9?1:cur<14?2:3;
        tabs.forEach((tab,i) => {
            tab.classList.toggle('active', i===p);
            const fill = tab.querySelector('.tab-progress-fill');
            const st = tab.querySelector('.part-status');
            if (fill) fill.style.width = i<=p?'100%':'0%';
            if (st) { st.textContent=i<=p?'Loaded':'Pending'; st.className='part-status '+(i<=p?'success':'pending'); }
        });
    }
});