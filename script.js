/* Utilities */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Header shadow on scroll */
const header = document.querySelector('.site-header');
const onScroll = () => {
    if (window.scrollY > 4) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    /* Mobile nav toggle */
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.getElementById('primary-menu');
    if (toggle) {
    toggle.addEventListener('click', () => {
        const open = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    // Close on link click
    $$('#primary-menu a').forEach(a => a.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }));
    }

    /* Current year */
    $('#year').textContent = new Date().getFullYear();

    /* Smooth anchor offset fix for sticky header */
    const smoothTo = target => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
    };
    $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
        e.preventDefault();
        smoothTo(id);
        history.pushState(null, '', id);
        }
    });
    });

    /* Intersection reveal */
    const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
        }
    });
    },{ threshold: 0.12 });
    $$('[data-animate]').forEach(el => io.observe(el));

    /* Audio players: exclusive play, time display */
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
    const btn = $('.play', p);
    const time = $('.time', p);

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

    audio.addEventListener('timeupdate', () => time.textContent = formatTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => time.textContent = formatTime(audio.duration));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => { setPlaying(false); time.textContent = formatTime(audio.duration); });
    });

    /* Play all and Stop all */
    $('#play-all')?.addEventListener('click', async () => {
    for (const p of players) {
        const audio = $('audio', p);
        try { await audio.play(); } catch {}
    }
    });
    $('#stop-all')?.addEventListener('click', () => {
    players.forEach(p => $('audio', p).pause());
    });

    /* Download inline SVG logo */
    $('#download-logo')?.addEventListener('click', () => {
    const svg = document.getElementById('kj-logo');
    if (!svg) return;
    // Clone to ensure clean serialisation
    const clone = svg.cloneNode(true);
    // Set explicit width and height for export
    clone.setAttribute('width', '960');
    clone.setAttribute('height', '240');
    // Add white background rect for versatility
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Keira-Jarvis-Logo.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    /* Contact form: open mailto with prefilled subject and body */
    $('#contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const type = data.get('type') || 'Project';
    const message = data.get('message') || '';

    const subject = encodeURIComponent(`[${type}] Voice over enquiry from ${name}`);
    const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\nMessage:\n${message}\n`
    );
    window.location.href = `mailto:voice@keirajarvis.com?subject=${subject}&body=${body}`;
    });

    /* Copy email helper */
    $('#copy-email')?.addEventListener('click', async e => {
    const email = e.currentTarget.getAttribute('data-email');
    try{
        await navigator.clipboard.writeText(email);
        e.currentTarget.textContent = 'Email copied';
        setTimeout(() => e.currentTarget.textContent = 'Copy email', 1500);
    }catch{
        alert(email);
    }
});
