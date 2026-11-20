/*
 * bg-theme.js — latar belakang animasi mengikuti tema
 *  - Gelap : langit malam, bulan, bintang berkedip, meteor jatuh
 *  - Cerah : langit biru, matahari, awan bergerak, burung terbang
 *
 * Pemakaian: <script src="bg-theme.js" defer></script> sebelum </body>
 * Tema dibaca dari class "dark" pada <html> (sama seperti tombol toggle kamu).
 */
(function () {
  'use strict';

  // ---------- Canvas ----------
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-theme-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;z-index:-5;pointer-events:none;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDark = () => document.documentElement.classList.contains('dark');

  let W = 0, H = 0, dpr = 1, raf = 0, last = 0, time = 0;
  let stars = [], meteors = [], clouds = [], birds = [];
  let nextMeteor = 1;

  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------- Setup ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduceMotion) render();
  }

  function build() {
    const small = W < 640;

    // Bintang
    const starCount = Math.floor((W * H) / (small ? 5500 : 4500));
    stars = Array.from({ length: starCount }, () => ({
      x: rand(0, W), y: rand(0, H * 0.9),
      d: rand(0.3, 1.6),
      r: rand(0.4, 1.6),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.8, 2.6)
    }));

    // Awan (3 lapisan: jauh, tengah, dekat)
    const cloudCount = small ? 6 : 9;
    clouds = Array.from({ length: cloudCount }, (_, i) => {
      const layer = i % 3; // 0 jauh, 2 dekat
      return {
        x: rand(-200, W),
        y: rand(H * 0.05, H * 0.55),
        scale: [0.6, 0.9, 1.3][layer] * (small ? 0.7 : 1),
        speed: [6, 12, 20][layer],
        alpha: [0.55, 0.75, 0.92][layer],
        puffs: Array.from({ length: 5 }, (_, k) => ({
          dx: k * 34 + rand(-6, 6),
          dy: rand(-14, 6) - (k === 1 || k === 2 ? 14 : 0),
          r: rand(24, 40)
        }))
      };
    });

    // Burung
    const birdCount = small ? 4 : 7;
    birds = Array.from({ length: birdCount }, () => newBird(true));

    meteors = [];
  }

  function newBird(anywhere) {
    return {
      x: anywhere ? rand(-100, W) : -rand(40, 200),
      y: rand(H * 0.08, H * 0.5),
      speed: rand(40, 85),
      size: rand(7, 13),
      phase: rand(0, Math.PI * 2),
      flap: rand(5, 8),
      bob: rand(0, Math.PI * 2),
      bobAmp: rand(6, 18)
    };
  }

  // ---------- TEMA GELAP ----------
  function drawNight(dt) {
    // Langit
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#020617');
    g.addColorStop(0.55, '#0b1230');
    g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Bintang
    for (const s of stars) {
      if (!reduceMotion) {
        // Bergeser pelan (parallax: bintang dekat lebih cepat), lalu muncul lagi dari sisi seberang
        s.x -= 9 * s.d * dt;
        s.y += 2.5 * s.d * dt;
        if (s.x < -4) s.x = W + 4;
        if (s.y > H * 0.92) s.y = -4;
      }
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bulan
    const mr = Math.max(28, Math.min(52, W * 0.045));
    // Bulan melintasi langit membentuk busur (~100 detik), lalu muncul lagi dari kanan
    const p = (0.25 + time * 0.01) % 1;
    const mx = W * (1.12 - 1.24 * p);
    const my = Math.max(80, H * 0.28 - Math.sin(Math.PI * p) * H * 0.17) + Math.sin(time * 0.8) * 3;
    ctx.globalAlpha = Math.max(0, Math.min(1, p / 0.08, (1 - p) / 0.08));
    const glow = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 4.5);
    glow.addColorStop(0, 'rgba(226,232,240,0.35)');
    glow.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(mx, my, mr * 4.5, 0, Math.PI * 2); ctx.fill();

    const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, '#ffffff');
    mg.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();

    // Kawah
    ctx.fillStyle = 'rgba(100,116,139,0.28)';
    [[-0.35, -0.2, 0.22], [0.25, 0.1, 0.28], [-0.1, 0.45, 0.15], [0.4, -0.4, 0.12]]
      .forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
        ctx.fill();
      });
    ctx.globalAlpha = 1;

    // Meteor
    if (!reduceMotion) {
      nextMeteor -= dt;
      if (nextMeteor <= 0 && meteors.length < 5) {
        const speed = rand(520, 820);
        const ang = rand(Math.PI * 0.72, Math.PI * 0.8); // ke kiri-bawah
        meteors.push({
          x: rand(W * 0.2, W * 1.1),
          y: rand(-60, H * 0.35),
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          len: rand(110, 220),
          life: 0,
          max: rand(0.9, 1.6)
        });
        nextMeteor = rand(0.6, 2.4);
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt; m.y += m.vy * dt; m.life += dt;
        const fade = 1 - m.life / m.max;
        if (fade <= 0 || m.x < -300 || m.y > H + 300) { meteors.splice(i, 1); continue; }
        const mag = Math.hypot(m.vx, m.vy);
        const tx = m.x - (m.vx / mag) * m.len;
        const ty = m.y - (m.vy / mag) * m.len;
        const lg = ctx.createLinearGradient(m.x, m.y, tx, ty);
        lg.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
        lg.addColorStop(0.3, `rgba(250,204,21,${0.5 * fade})`);
        lg.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.strokeStyle = lg;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // ---------- TEMA CERAH ----------
  function drawDay(dt) {
    // Langit
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#38bdf8');
    g.addColorStop(0.6, '#bae6fd');
    g.addColorStop(1, '#fef9c3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Matahari
    const sr = Math.max(34, Math.min(60, W * 0.05));
    const sx = W * 0.85, sy = Math.max(100, H * 0.18);
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 5);
    glow.addColorStop(0, 'rgba(253,224,71,0.55)');
    glow.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 5, 0, Math.PI * 2); ctx.fill();

    // Sinar berputar pelan
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(time * 0.15);
    ctx.strokeStyle = 'rgba(251,191,36,0.75)';
    ctx.lineWidth = Math.max(2.5, sr * 0.07);
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r1 = sr * 1.3, r2 = sr * (i % 2 ? 1.65 : 1.95);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();

    const sg = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
    sg.addColorStop(0, '#fef08a');
    sg.addColorStop(1, '#f59e0b');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();

    // Awan
    for (const c of clouds) {
      if (!reduceMotion) {
        c.x += c.speed * dt;
        if (c.x > W + 80) c.x = -260 * c.scale;
      }
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.fillStyle = `rgba(255,255,255,${c.alpha})`;
      ctx.beginPath();
      for (const p of c.puffs) {
        ctx.moveTo(p.dx + p.r, p.dy);
        ctx.arc(p.dx, p.dy, p.r, 0, Math.PI * 2);
      }
      ctx.rect(0, 0, 4 * 34, 20);
      ctx.fill();
      ctx.restore();
    }

    // Burung
    ctx.strokeStyle = 'rgba(30,41,59,0.8)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      if (!reduceMotion) {
        b.x += b.speed * dt;
        b.phase += b.flap * dt;
        b.bob += dt * 1.2;
        if (b.x > W + 60) birds[i] = newBird(false);
      }
      const y = b.y + Math.sin(b.bob) * b.bobAmp;
      const f = Math.sin(b.phase);          // -1..1
      const s = b.size;
      ctx.lineWidth = Math.max(1.5, s * 0.22);
      ctx.beginPath();
      ctx.moveTo(b.x - s * 1.4, y - f * s * 0.7);
      ctx.quadraticCurveTo(b.x - s * 0.6, y - s * 0.6 - f * s * 0.4, b.x, y);
      ctx.quadraticCurveTo(b.x + s * 0.6, y - s * 0.6 - f * s * 0.4, b.x + s * 1.4, y - f * s * 0.7);
      ctx.stroke();
    }
  }

  // ---------- Loop ----------
  function render(dt = 0) {
    if (isDark()) drawNight(dt); else drawDay(dt);
  }

  function frame(ts) {
    const dt = Math.min((ts - last) / 1000 || 0, 0.05);
    last = ts;
    time += dt;
    render(dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduceMotion) { render(); return; }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { resize(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else start();
  });

  // Gambar ulang saat tema diganti (penting untuk mode reduced-motion)
  new MutationObserver(() => { if (reduceMotion) render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  resize();
  start();
})();