/* A field of paper modules in a hexagonal lattice, with one trash bin. Theme comes from <html data-theme="black|white">. */
(() => {
  const theme = document.documentElement.dataset.theme || 'black', reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tone = theme === 'white' ? sh => { const g = Math.round(196 + 59*sh); return `rgb(${g},${g},${g+1})`; } : sh => { const g = Math.round(14 + 70*sh*sh); return `rgb(${g},${g},${g+1})`; };
  const field = document.createElement('div'); field.id = 'field'; field.setAttribute('role','group'); field.setAttribute('aria-label', theme === 'white' ? '흰 종이모형' : '검은 종이모형');
  const trash = document.createElement('button'); trash.id = 'trash'; trash.setAttribute('aria-label','휴지통 — 누르면 버린 종이모형을 다시 꺼냅니다'); trash.title = '휴지통';
  trash.innerHTML = '<svg viewBox="0 0 48 60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><g class="lid"><path d="M6 13h36"/><path d="M18 13V8h12v5"/></g><path d="M10 17l3 37h22l3-37"/><path d="M19 23v25M24 23v25M29 23v25"/></svg><span id="count"></span>';
  document.body.append(field, trash); const count = trash.querySelector('#count');
  let modules = [], binned = [];
  function build() {
    field.replaceChildren(); modules = []; binned = []; update();
    const W = innerWidth, H = innerHeight, step = Math.max(78, Math.min(124, W/10)), rowH = step*.87, size = step*.84, dpr = Math.min(devicePixelRatio||1, 2);
    for (let row = 0; row*rowH < H + step; row++) for (let col = -1; col*step < W + step; col++) {
      const x = col*step + (row%2 ? step/2 : 0), y = row*rowH + step*.3, model = ((col%5)+5 + row*2) % 5;
      const el = document.createElement('button'); el.className = 'module'; el.tabIndex = -1; el.setAttribute('aria-label','종이모형 — 휴지통으로 끌어서 버리기');
      el.style.cssText = `left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px`;
      const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(size*dpr); const ctx = cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
      PaperMesh.render(ctx, model, .55 + col*.42 + row*.27, -.35 + (row%3)*.12, size, tone);
      el.append(cv); field.append(el); modules.push(el); drag(el);
    }
  }
  const overTrash = (x, y) => { const r = trash.getBoundingClientRect(); return x > r.left-30 && x < r.right+30 && y > r.top-30 && y < r.bottom+30; };
  function drag(el) {
    let start = null;
    el.addEventListener('pointerdown', e => { start = {x:e.clientX, y:e.clientY}; el.setPointerCapture(e.pointerId); el.classList.add('dragging'); });
    el.addEventListener('pointermove', e => { if (!start) return; el.style.transform = `translate(${e.clientX-start.x}px,${e.clientY-start.y}px) scale(1.08)`; trash.classList.toggle('open', overTrash(e.clientX, e.clientY)); });
    el.addEventListener('pointerup', e => { if (!start) return; el.classList.remove('dragging'); trash.classList.remove('open'); if (overTrash(e.clientX, e.clientY)) throwAway(el, e.clientX-start.x, e.clientY-start.y); else el.style.transform = ''; start = null; });
    el.addEventListener('pointercancel', () => { start = null; el.classList.remove('dragging'); el.style.transform = ''; });
  }
  function throwAway(el, dx, dy) {
    const r = trash.getBoundingClientRect(), b = el.getBoundingClientRect();
    el.classList.add('gone'); el.style.transform = `translate(${dx + r.left + r.width/2 - b.left - b.width/2}px,${dy + r.top + r.height*.55 - b.top - b.height/2}px) scale(.1) rotate(160deg)`;
    setTimeout(() => { el.hidden = true; }, reduced ? 0 : 450);
    binned.push(el); update(); if (!reduced) { trash.classList.remove('gulp'); void trash.offsetWidth; trash.classList.add('gulp'); }
  }
  const update = () => { count.textContent = binned.length || ''; };
  trash.addEventListener('click', () => { for (const el of binned) { el.hidden = false; el.classList.remove('gone'); el.style.transform = ''; } binned = []; update(); });
  let last = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - last) > 60) { last = innerWidth; build(); } });
  build();
})();
