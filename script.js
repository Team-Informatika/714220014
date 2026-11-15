/* ==========================================================
   script.js – dipakai bersama oleh semua halaman portofolio
   Letakkan di assets/script.js dan panggil di akhir <body>:
   <script src="assets/script.js"></script>

   Catatan: skrip kecil di <head> (penerapan tema awal) sengaja
   tetap inline agar halaman tidak berkedip saat dimuat.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- 1. Menu mobile ---------- */
  const menuBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  /* ---------- 2. Dark mode (tombol desktop & mobile) ---------- */
  function toggleTheme() {
    const root = document.documentElement;
    root.classList.toggle('dark');
    try {
      localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
    } catch (e) { /* abaikan jika storage diblokir */ }
  }
  document.getElementById('toggle-dark')?.addEventListener('click', toggleTheme);
  document.getElementById('toggle-dark-m')?.addEventListener('click', toggleTheme);

  /* ---------- 3. Animasi muncul saat di-scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Browser lama: langsung tampilkan semua
    revealEls.forEach((el) => el.classList.add('show'));
  }

  /* ---------- 4. Filter kategori (khusus skills.html) ---------- */
  const chips = document.querySelectorAll('#filters .chip');
  const skillItems = document.querySelectorAll('.skill-item');
  if (chips.length && skillItems.length) {
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;

        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        skillItems.forEach((item) => {
          const match = filter === 'all' || item.dataset.cat === filter;
          item.classList.toggle('hidden', !match);
          if (match) item.classList.add('show');
        });
      });
    });
  }

  /* ---------- 5. Efek ketik (khusus index.html) ---------- */
  const typedEl = document.getElementById('typed');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typedEl && !reduceMotion) {
    const roles = ['Frontend Developer', 'UI/UX Enthusiast', 'Software Engineer', 'Fotografer'];
    let r = 0, c = 0, deleting = false;

    const tick = () => {
      const word = roles[r];
      typedEl.textContent = word.slice(0, c);

      if (!deleting && c < word.length) { c++; setTimeout(tick, 90); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1500); }
      else if (c > 0) { c--; setTimeout(tick, 45); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
    };

    typedEl.textContent = '';
    tick();
  }
})();