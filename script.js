/* ===========================
    Utilities
    =========================== */
    const $  = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    /* ===========================
    Header shadow on scroll
    =========================== */
    const header = $('.site-header');
    const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 4) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    /* ===========================
    Mobile nav toggle
    =========================== */
    const toggle  = $('.nav-toggle');
    const navList = $('#primary-menu');
    if (toggle && navList) {
    toggle.addEventListener('click', () => {
        const open = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    // Close on link click
    $$('#primary-menu a').forEach(a =>
        a.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        })
    );
    }

    /* ===========================
    Current year
    =========================== */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ===========================
    Smooth anchor offset for sticky header
    =========================== */
    const smoothTo = target => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 78; // header height
    window.scrollTo({ top: y, behavior: 'smooth' });
    };
    $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id && id.length > 1) {
        e.preventDefault();
        smoothTo(id);
        history.pushState(null, '', id);
        }
    });
    });

    /* ===========================
    Intersection reveal
    =========================== */
    const io = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
        }
        });
    },
    { threshold: 0.12 }
    );
    $$('[data-animate]').forEach(el => io.observe(el));

    /* ===========================
    Audio players: exclusive play + time
    =========================== */
    const players = $$('.player');
    let currentAudio = null;

    const formatTime = secs => {
    if (!isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
    };

    players.forEach(p => {
    const audio = $('audio', p);
    const btn   = $('.play', p);
    const time  = $('.time', p);
    if (!audio || !btn || !time) return;

    const setPlaying = playing => {
        btn.classList.toggle('is-playing', playing);
        btn.textContent = playing ? 'Pause' : 'Play';
    };

    btn.addEventListener('click', () => {
        if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.dispatchEvent(new Event('pause'));
        }
        if (audio.paused) {
        audio.play().catch(() => {/* user gesture may be needed */});
        currentAudio = audio;
        setPlaying(true);
        } else {
        audio.pause();
        setPlaying(false);
        }
    });

    audio.addEventListener('timeupdate', () => { time.textContent = formatTime(audio.currentTime); });
    audio.addEventListener('loadedmetadata', () => { time.textContent = formatTime(audio.duration); });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => { setPlaying(false); time.textContent = formatTime(audio.duration); });
    });

    /* Play all and Stop all */
    $('#play-all')?.addEventListener('click', async () => {
    for (const p of players) {
        const audio = $('audio', p);
        if (audio) { try { await audio.play(); } catch {} }
    }
    });
    $('#stop-all')?.addEventListener('click', () => {
    players.forEach(p => $('audio', p)?.pause());
    });

    /* ===========================
    Download inline SVG logo
    =========================== */
    $('#download-logo')?.addEventListener('click', () => {
    const svg = $('#kj-logo');
    if (!svg) return;

    const clone = svg.cloneNode(true);
    clone.setAttribute('width', '960');
    clone.setAttribute('height', '240');

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const xml  = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Keira-Jarvis-Logo.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    /* ===========================
    Contact form (Formspree)
    - Requires form action="https://formspree.io/f/mnnayngl"
    - Shows status message inline without leaving the page
    =========================== */
    (() => {
    const form   = $('#contact-form');
    if (!form) return;

    const status = $('#form-status') || (function(){
        // if the status element is missing, create one after the form
        const p = document.createElement('p');
        p.id = 'form-status';
        p.className = 'hint';
        p.setAttribute('role', 'status');
        p.setAttribute('aria-live', 'polite');
        form.appendChild(p);
        return p;
    })();

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const copyBtn   = $('#copy-email');
        if (submitBtn) submitBtn.disabled = true;
        if (status) status.textContent = 'Sending...';

        try {
        const data = new FormData(form);
        const res = await fetch(form.action || 'https://formspree.io/f/mnnayngl', {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
            form.reset();
            if (status) status.textContent = 'Thanks for your message. I will reply soon.';
        } else {
            let msg = 'Something went wrong. Please email me directly.';
            try {
            const out = await res.json();
            if (out?.errors?.[0]?.message) msg = out.errors[0].message;
            } catch {}
            if (status) status.textContent = msg;
        }
        } catch {
        if (status) status.textContent = 'Network error. Please email me directly.';
        } finally {
        if (submitBtn) submitBtn.disabled = false;
        }
    });

    /* Copy email helper */
    $('#copy-email')?.addEventListener('click', async e => {
        const btn   = e.currentTarget;
        const email = btn.getAttribute('data-email') || 'Keira.Jarvis@hotmail.co.uk';
        try {
        await navigator.clipboard.writeText(email);
        btn.textContent = 'Email copied';
        setTimeout(() => { btn.textContent = 'Copy email'; }, 1500);
        } catch {
        alert(email);
        }
    });
})();
