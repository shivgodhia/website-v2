// Scroll-driven reveals. Each [data-scrolly] section is tall; its stage is sticky,
// and scroll position inside the section drives what the stage shows.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('scrub')) return;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  // Split the intro paragraph into words so they can light up one by one.
  document.querySelectorAll('[data-words]').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else {
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = part;
              frag.append(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  const sections = [...document.querySelectorAll('[data-scrolly]')].map(el => {
    const steps = [...el.querySelectorAll('.step')];
    el.style.setProperty('--n', steps.length || 1);
    return {
      el,
      steps,
      vis: [...el.querySelectorAll('[data-vis-id]')],
      rail: [...el.querySelectorAll('[data-rail]')],
      words: [...el.querySelectorAll('.w')],
      counters: [...el.querySelectorAll('[data-count]')],
      last: -1,
    };
  });

  const progress = el => {
    const r = el.getBoundingClientRect();
    const total = el.offsetHeight - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  const update = () => {
    for (const s of sections) {
      const p = progress(s.el);
      s.el.style.setProperty('--p', p.toFixed(4));

      if (s.words.length) {
        const lit = Math.round(clamp((p - 0.08) / 0.6) * s.words.length);
        s.words.forEach((w, i) => w.classList.toggle('on', i < lit));
      }

      if (!s.steps.length) continue;
      const n = s.steps.length;
      const idx = Math.min(Math.floor(p * n), n - 1);
      const local = clamp(p * n - idx);
      s.el.style.setProperty('--t', local.toFixed(4));

      if (idx !== s.last) {
        s.last = idx;
        const cur = s.steps[idx];
        s.steps.forEach((st, i) => {
          st.classList.toggle('on', i === idx);
          st.classList.toggle('past', i < idx);
        });
        const v = cur.dataset.vis;
        s.vis.forEach(x => x.classList.toggle('on', x.dataset.visId === v));
        const g = cur.dataset.group;
        s.rail.forEach(x => x.classList.toggle('on', x.dataset.rail === g));
        s.counters.forEach(c => {
          if (cur.contains(c) && !c.dataset.done) countUp(c);
        });
      }
    }
  };

  function countUp(el) {
    el.dataset.done = '1';
    const to = parseFloat(el.dataset.count);
    const dp = (el.dataset.count.split('.')[1] || '').length;
    const start = performance.now();
    const tick = now => {
      const k = clamp((now - start) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toFixed(dp);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Rail labels jump to the first step in their group.
  sections.forEach(s =>
    s.rail.forEach(r =>
      r.addEventListener('click', e => {
        e.preventDefault();
        const i = s.steps.findIndex(st => st.dataset.group === r.dataset.rail);
        const top =
          s.el.offsetTop + ((i + 0.05) / s.steps.length) * (s.el.offsetHeight - innerHeight);
        scrollTo({ top, behavior: 'smooth' });
      }),
    ),
  );

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
