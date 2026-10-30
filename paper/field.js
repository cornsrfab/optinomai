/* A field of paper modules in a hexagonal lattice, with one trash bin. Theme comes from <html data-theme="black|white">.
   Click a module to unfold it; the black paper carries one project's text when open. Drag a module onto the bin to throw it away. */
(() => {
  const theme = document.documentElement.dataset.theme || 'black', reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, WORKS = window.WORKS || [];
  const tone = theme === 'white' ? sh => { const g = Math.round(196 + 59*sh); return `rgb(${g},${g},${g+1})`; } : sh => { const g = Math.round(14 + 70*sh*sh); return `rgb(${g},${g},${g+1})`; };
  const ink = theme === 'white' ? '#333' : '#e6e6e6';
  const field = document.createElement('div'); field.id = 'field'; field.setAttribute('role','group'); field.setAttribute('aria-label', theme === 'white' ? '흰 종이모형' : '검은 종이모형');
  const trash = document.createElement('button'); trash.id = 'trash'; trash.setAttribute('aria-label','휴지통 — 누르면 버린 종이모형을 다시 꺼냅니다'); trash.title = '휴지통';
  trash.innerHTML = '<svg viewBox="0 0 48 60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><g class="lid"><path d="M6 13h36"/><path d="M18 13V8h12v5"/></g><path d="M10 17l3 37h22l3-37"/><path d="M19 23v25M24 23v25M29 23v25"/></svg><span id="count"></span>';
  document.body.append(field, trash); const count = trash.querySelector('#count');
  let cells = [], binned = [], openSize = 0;
  function paint(c) {
    const size = c.base + (openSize - c.base)*c.t, dpr = Math.min(devicePixelRatio||1, 2);
    // An opening sheet slides inward so it stays fully on screen.
    const cx = c.x + (Math.max(size/2 + 8, Math.min(innerWidth - size/2 - 8, c.x)) - c.x)*c.t, cy = c.y + (Math.max(size/2 + 8, Math.min(innerHeight - size/2 - 8, c.y)) - c.y)*c.t;
    c.el.style.width = c.el.style.height = size + 'px'; c.el.style.left = (cx - size/2) + 'px'; c.el.style.top = (cy - size/2) + 'px';
    if (c.cv.width !== Math.round(size*dpr)) { c.cv.width = c.cv.height = Math.round(size*dpr); }
    const ctx = c.cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,size,size);
    PaperMesh.render(ctx, c.model, c.angle, c.tilt, size, tone, size/2, size/2, c.t);
    if (c.work && c.t > .55) { ctx.globalAlpha = (c.t-.55)/.45; const s = size/420;
      PaperMesh.writeText(ctx, [[c.work.title, `bold ${Math.round(13*s)}px 'Courier New',monospace`], [String(c.work.year), `${Math.round(10*s)}px 'Courier New',monospace`], [' '], [c.work.desc, `${Math.round(10*s)}px 'Courier New',monospace`]], size/2, size/2, size*.46, ink, `${Math.round(10*s)}px 'Courier New',monospace`, Math.round(14*s));
      ctx.globalAlpha = 1; }
  }
  function build() {
    field.replaceChildren(); cells = []; binned = []; update();
    const W = innerWidth, H = innerHeight, step = Math.max(78, Math.min(124, W/10)), rowH = step*.87, base = step*.84; openSize = Math.min(520, Math.min(W,H)*.78);
    let index = 0;
    for (let row = 0; row*rowH < H + step; row++) for (let col = -1; col*step < W + step; col++) {
      const x = col*step + (row%2 ? step/2 : 0), y = row*rowH + step*.3, model = ((col%5)+5 + row*2) % 5;
      const el = document.createElement('button'); el.className = 'module'; el.tabIndex = -1;
      const work = theme === 'black' && WORKS.length ? WORKS[index++ % WORKS.length] : null;
      el.setAttribute('aria-label', (work ? `${work.title}, ${work.year} — ` : '') + '종이모형. 눌러서 펼치고, 휴지통으로 끌어서 버리기');
      const cv = document.createElement('canvas'); el.append(cv); field.append(el);
      const c = {el, cv, x, y, base, model, work, angle: .55 + col*.42 + row*.27, tilt: -.35 + (row%3)*.12, t: 0, target: 0, frame: 0};
      cells.push(c); paint(c); interact(c);
    }
  }
  function toggle(c, to = c.target ? 0 : 1) {
    c.target = to; cancelAnimationFrame(c.frame); c.el.classList.toggle('open', !!to); c.el.setAttribute('aria-pressed', String(!!to));
    if (reduced) { c.t = to; paint(c); return; }
    const from = c.t, start = performance.now();
    const step = now => { const k = Math.min(1,(now-start)/900), e = k*k*(3-2*k); c.t = from + (to-from)*e; paint(c); if (k<1) c.frame = requestAnimationFrame(step); };
    c.frame = requestAnimationFrame(step);
  }
  const overTrash = (x, y) => { const r = trash.getBoundingClientRect(); return x > r.left-30 && x < r.right+30 && y > r.top-30 && y < r.bottom+30; };
  function interact(c) {
    const el = c.el; let start = null, moved = false;
    el.addEventListener('pointerdown', e => { start = {x:e.clientX, y:e.clientY}; moved = false; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!start) return; if (Math.hypot(e.clientX-start.x, e.clientY-start.y) > 5) { moved = true; el.classList.add('dragging'); }
      if (moved) { el.style.transform = `translate(${e.clientX-start.x}px,${e.clientY-start.y}px) scale(1.08)`; trash.classList.toggle('open', overTrash(e.clientX, e.clientY)); } });
    el.addEventListener('pointerup', e => { if (!start) return; el.classList.remove('dragging'); trash.classList.remove('open');
      if (!moved) toggle(c); else if (overTrash(e.clientX, e.clientY)) throwAway(c, e.clientX-start.x, e.clientY-start.y); else el.style.transform = '';
      start = null; });
    el.addEventListener('pointercancel', () => { start = null; el.classList.remove('dragging'); el.style.transform = ''; });
  }
  function throwAway(c, dx, dy) {
    const el = c.el, r = trash.getBoundingClientRect(), b = el.getBoundingClientRect();
    el.classList.add('gone'); el.style.transform = `translate(${dx + r.left + r.width/2 - b.left - b.width/2}px,${dy + r.top + r.height*.55 - b.top - b.height/2}px) scale(.1) rotate(160deg)`;
    setTimeout(() => { el.hidden = true; }, reduced ? 0 : 450);
    binned.push(c); update(); if (!reduced) { trash.classList.remove('gulp'); void trash.offsetWidth; trash.classList.add('gulp'); }
  }
  const update = () => { count.textContent = binned.length || ''; };
  trash.addEventListener('click', () => { for (const c of binned) { c.el.hidden = false; c.el.classList.remove('gone'); c.el.style.transform = ''; } binned = []; update(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') cells.filter(c => c.target).forEach(c => toggle(c, 0)); });
  let last = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - last) > 60) { last = innerWidth; build(); } });
  build();
})();
