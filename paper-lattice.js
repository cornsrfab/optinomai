/* Paper studies tiled as one continuous lattice behind the eye, in the spirit of Escher's Metamorphosis:
   the five hyparhedra repeat in a fixed rhythm, turn a little from cell to cell, and open gradually from left to right.
   Each cell can still be clicked to unfold or fold. The unfolding is an illustrative morph, not a rigid-fold solver. */
(() => {
  const host = document.querySelector('.paper-lattice');
  if (!host || !window.PaperModels) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = ['정사면체', '정육면체', '정팔면체', '정이십면체', '정십이면체'];
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const n = Math.hypot(...a) || 1; return a.map(x => x/n); };
  const light = unit([-.4, .6, 1]);
  const N = 5;
  // Triangles for each model, built once and shared by every cell.
  const meshes = window.PaperModels.map(model => {
    const triangles = [];
    model.patches.forEach((patch, pi) => {
      const [A,B,C,D] = patch, points = [], count = model.patches.length;
      const sector = pi / count * Math.PI * 2, next = (pi+1) / count * Math.PI * 2;
      const edgeB = [Math.cos(sector)*1.5, Math.sin(sector)*1.5], edgeD = [Math.cos(next)*1.5, Math.sin(next)*1.5];
      const tip = [Math.cos((sector+next)/2)*1.9, Math.sin((sector+next)/2)*1.9];
      for (let i=0;i<=N;i++) { points[i]=[]; for (let j=0;j<=N;j++) {
        const u=i/N, v=j/N;
        const p=A.map((a,k)=>(1-u)*(1-v)*a+u*(1-v)*B[k]+u*v*C[k]+(1-u)*v*D[k]);
        const du=A.map((a,k)=>(1-v)*(B[k]-a)+v*(C[k]-D[k])), dv=A.map((a,k)=>(1-u)*(D[k]-a)+u*(C[k]-B[k]));
        const normal=unit(cross(dv,du)), r=Math.max(Math.abs(2*u-1),Math.abs(2*v-1));
        const q=r*6, k=Math.floor(q), f=q-k, w=(1-f)*(-1)**k+f*(-1)**(k+1), ripple=.045*w*Math.min(1,r*6,(1-r)*6);
        const folded=p.map((x,k)=>x+normal[k]*ripple), open=[0,1].map(k=>u*(1-v)*edgeB[k]+u*v*tip[k]+(1-u)*v*edgeD[k]);
        open.push(ripple*.4); points[i][j]={folded,open};
      } }
      for (let i=0;i<N;i++) for (let j=0;j<N;j++) { const a=points[i][j],b=points[i+1][j],c=points[i+1][j+1],d=points[i][j+1]; triangles.push([a,b,c],[a,c,d]); }
    });
    return triangles;
  });
  const isColor = () => document.documentElement.classList.contains('color');
  // One shared canvas for the whole lattice (cheaper than a canvas per cell); buttons on top are click targets.
  const sheet = document.createElement('canvas'); sheet.className = 'paper-sheet'; sheet.setAttribute('aria-hidden','true');
  const ctx = sheet.getContext('2d');
  function paint(cell) {
    const {model, angle, tilt} = cell, t = cell.amount, size = cell.size;
    ctx.save(); ctx.translate(cell.x - size/2, cell.y - size/2); ctx.clearRect(0,0,size,size);
    ctx.globalAlpha = cell.fade;
    const a=angle*(1-t*.6), b=tilt*(1-t);
    const rotate=p=>{const x=p[0]*Math.cos(a)+p[2]*Math.sin(a), z=-p[0]*Math.sin(a)+p[2]*Math.cos(a); return [x,p[1]*Math.cos(b)-z*Math.sin(b),p[1]*Math.sin(b)+z*Math.cos(b)];};
    const faces=meshes[model].map(tr=>tr.map(p=>rotate(p.folded.map((x,k)=>x*(1-t)+p.open[k]*t))));
    faces.sort((a,b)=>a[0][2]+a[1][2]+a[2][2]-b[0][2]-b[1][2]-b[2][2]);
    const scale=size*.25, color=isColor();
    for (const ps of faces) {
      const normal=unit(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))), shade=Math.abs(normal.reduce((s,n,k)=>s+n*light[k],0));
      // Greys on white; in the colour version the paper takes the water's blue and catches light on the facing planes.
      ctx.fillStyle = color ? `rgb(${Math.round(70+58*shade)},${Math.round(94+56*shade)},${Math.round(114+54*shade)})` : `rgb(${Math.round(212+42*shade)},${Math.round(212+42*shade)},${Math.round(213+42*shade)})`;
      ctx.beginPath(); ps.forEach((p,i)=>i?ctx.lineTo(size/2+p[0]*scale,size/2-p[1]*scale):ctx.moveTo(size/2+p[0]*scale,size/2-p[1]*scale)); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  let cells = [];
  function build() {
    host.replaceChildren(sheet); cells = [];
    const W = host.clientWidth, H = host.clientHeight; if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio||1, 2); sheet.width = Math.round(W*dpr); sheet.height = Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    const fadeFrom = W > 760 ? 230 : -1, fadeTo = W > 760 ? 380 : 0;
    const step = Math.max(84, Math.min(132, W/11)), rowH = step*.87, size = step*.82;
    const cols = Math.ceil(W/step)+1, rows = Math.ceil(H/rowH)+1;
    for (let row=0; row<rows; row++) for (let col=0; col<cols; col++) {
      const x = col*step + (row%2 ? step/2 : 0), y = row*rowH + step*.35;
      // Rhythm: models repeat diagonally; rotation advances cell by cell; folds open toward the right edge.
      const model = (col + row*2) % 5, base = Math.max(0, Math.min(1, (x/W - .35)/.6));
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'paper-object';
      button.style.cssText = `left:${x-size/2}px;top:${y-size/2}px;width:${size}px`;
      button.setAttribute('aria-pressed','false'); button.setAttribute('aria-label',`${labels[model]} 종이모형 펼치기`);
      button.tabIndex = -1;
      host.append(button);
      const fade = Math.max(0, Math.min(1, (x - fadeFrom)/(fadeTo - fadeFrom)));
      if (!fade) { button.remove(); continue; }
      const cell = {button, x, y, fade, model, size, angle: .55 + col*.42 + row*.27, tilt: -.35 + (row%3)*.12, rest: base*base*.45, target: 0, amount: 0, frame: 0};
      cell.amount = cell.target = cell.rest; cells.push(cell);
      button.addEventListener('click', () => toggle(cell));
    }
    // Only the first cell of each model is reachable by keyboard, so tabbing stays short.
    [0,1,2,3,4].forEach(m => { const c = cells.find(c => c.model === m && c.button.getBoundingClientRect().left > 240); if (c) c.button.tabIndex = 0; });
    cells.forEach(paint);
  }
  function toggle(cell) {
    const open = cell.target < .99, to = open ? 1 : cell.rest;
    cell.target = to; cancelAnimationFrame(cell.frame);
    cell.button.setAttribute('aria-pressed', String(open));
    cell.button.setAttribute('aria-label', `${labels[cell.model]} 종이모형 ${open ? '접기' : '펼치기'}`);
    if (motion.matches) { cell.amount = to; paint(cell); return; }
    const from = cell.amount, start = performance.now();
    const step = now => { const t = Math.min(1,(now-start)/1100), e = t*t*(3-2*t); cell.amount = from + (to-from)*e; paint(cell); if (t<1) cell.frame = requestAnimationFrame(step); };
    cell.frame = requestAnimationFrame(step);
  }
  host.addEventListener('keydown', e => { if (e.key === 'Escape') { const c = cells.find(c => c.button === document.activeElement && c.target > .99); if (c) { toggle(c); e.stopPropagation(); } } });
  let resizeFrame, lastW = 0;
  window.addEventListener('resize', () => { if (Math.abs(host.clientWidth - lastW) < 40) return; cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { lastW = host.clientWidth; build(); }); });
  window.PaperRedraw = () => { if (!cells.length) build(); cells.forEach(paint); };
  lastW = host.clientWidth; build();
})();
