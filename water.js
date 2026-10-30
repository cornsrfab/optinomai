/* Colour version only: the page as water. Slow caustic light and drifting particles behind the floating eye. */
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'water'; canvas.setAttribute('aria-hidden', 'true');
  document.querySelector('main').prepend(canvas);
  const ctx = canvas.getContext('2d'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, raf = 0;
  const motes = Array.from({length: 70}, (_, i) => ({x: Math.random(), y: Math.random(), r: .6 + Math.random()*1.8, v: .004 + Math.random()*.012, p: Math.random()*6.28}));
  function size() { const d = .5; W = innerWidth; H = innerHeight; canvas.width = W*d; canvas.height = H*d; ctx.setTransform(d,0,0,d,0,0); }
  function frame(t) {
    raf = 0; if (!document.documentElement.classList.contains('color')) { ctx.clearRect(0,0,W,H); return; }
    const s = t/1000; ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation = 'lighter';
    // Caustics: overlapping soft bands of light that slowly wander.
    for (let i = 0; i < 6; i++) {
      const x = W*(.15 + .7*((Math.sin(s*.05*(i+1) + i*1.7) + 1)/2)), y = H*(.1 + .8*((Math.cos(s*.04*(i+2) + i) + 1)/2)), rad = Math.max(W,H)*(.18 + .06*Math.sin(s*.3 + i));
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(190,225,245,.07)'); g.addColorStop(1, 'rgba(190,225,245,0)');
      ctx.fillStyle = g; ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
    }
    for (const m of motes) {
      if (!reduced) { m.y -= m.v*.016; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); } }
      const x = (m.x + Math.sin(s*.4 + m.p)*.006)*W, y = m.y*H;
      ctx.fillStyle = `rgba(220,240,250,${.18 + .2*Math.sin(s + m.p)**2})`; ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!reduced) raf = setTimeout(() => requestAnimationFrame(frame), 40);
  }
  window.WaterRefresh = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('resize', () => { size(); window.WaterRefresh(); });
  size(); window.WaterRefresh();
})();
