// Side rail: one dot per [data-nav] section. Hover magnifies nearby dots and pops a
// label; drag anywhere on the rail to scrub the page; click a dot to jump to it.
(() => {
  const items = [...document.querySelectorAll('[data-nav]')];
  if (!items.length) return;
  const scrub = document.documentElement.classList.contains('scrub');
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  const nav = document.createElement('nav');
  nav.className = 'rail-nav';
  nav.setAttribute('aria-label', 'Page sections');
  nav.innerHTML =
    '<div class="rail-track"><div class="rail-fill"></div></div><div class="rail-thumb"></div>';
  const fill = nav.querySelector('.rail-fill');
  const thumb = nav.querySelector('.rail-thumb');

  const marks = items.map(el => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail-mark';
    const sub = el.dataset.navSub ? `<em>${el.dataset.navSub}</em>` : '';
    b.innerHTML = `<span class="rail-dot"></span><span class="rail-tip">${el.dataset.nav}${sub}</span>`;
    b.setAttribute('aria-label', el.dataset.nav);
    nav.append(b);
    return { el, b, y: 0, frac: 0 };
  });
  document.body.append(nav);

  // Where each section starts, in page scroll pixels. Steps inside a pinned section
  // start part-way through that section's scroll.
  const targetY = el => {
    const sec = el.closest('[data-scrolly]');
    const top = n => n.getBoundingClientRect().top + scrollY;
    if (scrub && sec && sec !== el) {
      const steps = [...sec.querySelectorAll('.step')];
      const i = steps.indexOf(el);
      return top(sec) + ((i + 0.02) / steps.length) * (sec.offsetHeight - innerHeight);
    }
    return Math.max(0, top(el) - (el.matches('[data-scrolly]') ? 0 : 24));
  };

  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

  // Dots are spaced evenly; scroll maps piecewise-linearly between them, so every
  // section gets the same share of the rail however long it is on the page.
  const layout = () => {
    const n = marks.length;
    marks.forEach((m, i) => {
      m.y = targetY(m.el);
      m.frac = n > 1 ? i / (n - 1) : 0;
      m.b.style.top = `${m.frac * 100}%`;
    });
    marks[0].y = 0;
    sync();
  };
  const ys = () => [...marks.map(m => m.y), maxScroll()];
  const toFrac = y => {
    const pts = ys();
    const n = marks.length;
    for (let i = 0; i < n - 1; i++) {
      if (y < pts[i + 1])
        return (i + clamp((y - pts[i]) / Math.max(1, pts[i + 1] - pts[i]))) / (n - 1);
    }
    return 1;
  };
  const toY = f => {
    const n = marks.length;
    const x = clamp(f) * (n - 1);
    const i = Math.min(Math.floor(x), n - 2);
    const pts = ys();
    const a = pts[i];
    const b = i + 1 < n - 1 ? pts[i + 1] : Math.max(pts[n - 1], pts[n]);
    return a + (x - i) * (b - a);
  };

  let active = -1;
  // Pick rail colours from whatever is painted behind it.
  const lum = c => {
    const m = c.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && +m[3] < 0.5)) return null;
    return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
  };
  const tone = () => {
    const r = nav.getBoundingClientRect();
    nav.style.pointerEvents = 'none';
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    nav.style.pointerEvents = '';
    let l = null;
    for (const el of stack) {
      if (nav.contains(el)) continue;
      l = lum(getComputedStyle(el).backgroundColor);
      if (l !== null) break;
    }
    if (l === null) l = lum(getComputedStyle(document.body).backgroundColor) ?? 1;
    nav.classList.toggle('on-light', l > 0.55);
  };

  const sync = () => {
    tone();
    const f = toFrac(scrollY);
    fill.style.transform = `scaleY(${f})`;
    thumb.style.top = `${f * 100}%`;
    let a = 0;
    marks.forEach((m, i) => {
      if (scrollY + 4 >= m.y) a = i;
    });
    if (a !== active) {
      active = a;
      marks.forEach((m, i) => m.b.classList.toggle('on', i === a));
    }
  };

  // Dock-style magnification around the pointer.
  const magnify = clientY => {
    const r = nav.getBoundingClientRect();
    let near = null;
    let best = Infinity;
    marks.forEach(m => {
      const d = Math.abs(clientY - (r.top + m.frac * r.height));
      const s = 1 + 1.6 * Math.max(0, 1 - d / 70);
      m.b.style.setProperty('--s', s.toFixed(3));
      if (d < best) {
        best = d;
        near = m;
      }
    });
    marks.forEach(m => m.b.classList.toggle('near', m === near && best < 40));
  };
  const relax = () => {
    marks.forEach(m => {
      m.b.style.setProperty('--s', 1);
      m.b.classList.remove('near');
    });
  };

  // Drag to scrub; a press without movement on a dot is a click.
  let dragging = false;
  let startY = 0;
  let moved = false;
  let downMark = null;
  const scrubTo = clientY => {
    const r = nav.getBoundingClientRect();
    scrollTo({ top: toY((clientY - r.top) / r.height), behavior: 'instant' });
  };
  nav.addEventListener('pointerdown', e => {
    dragging = true;
    moved = false;
    startY = e.clientY;
    downMark = e.target.closest('.rail-mark');
    nav.setPointerCapture(e.pointerId);
    nav.classList.add('dragging');
    e.preventDefault();
  });
  nav.addEventListener('pointermove', e => {
    magnify(e.clientY);
    if (!dragging) return;
    if (Math.abs(e.clientY - startY) > 4) moved = true;
    if (moved) scrubTo(e.clientY);
  });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    nav.classList.remove('dragging');
    if (!moved) {
      if (downMark) {
        const m = marks.find(x => x.b === downMark);
        scrollTo({ top: m.y + 1, behavior: 'smooth' });
      } else scrubTo(e.clientY);
    }
    if (e.pointerType !== 'mouse') relax();
  };
  nav.addEventListener('pointerup', end);
  nav.addEventListener('pointercancel', end);
  nav.addEventListener('pointerleave', () => {
    if (!dragging) relax();
  });
  marks.forEach(m =>
    m.b.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollTo({ top: m.y + 1, behavior: 'smooth' });
      }
    }),
  );

  addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  layout();
})();
