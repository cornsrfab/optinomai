/* Shared folded-paper meshes (the five hyparhedra from paper-models.js) and a tiny software renderer.
   Every vertex carries a folded position and an "open" position on a flat radial sheet, so a model can be drawn at any
   unfolding amount t (0 = folded object, 1 = flat sheet facing the viewer). The unfolding is an illustrative morph, not a rigid-fold solver. */
window.PaperMesh = (() => {
  const sub=(a,b)=>a.map((x,i)=>x-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
  const light = unit([-.4,.6,1]), N = 6;
  const meshes = window.PaperModels.map(model => {
    const tris = [], count = model.patches.length;
    model.patches.forEach((patch, pi) => {
      const [A,B,C,D] = patch, pts = [];
      const sector = pi/count*Math.PI*2, next = (pi+1)/count*Math.PI*2;
      const edgeB = [Math.cos(sector)*1.5, Math.sin(sector)*1.5], edgeD = [Math.cos(next)*1.5, Math.sin(next)*1.5], tip = [Math.cos((sector+next)/2)*1.9, Math.sin((sector+next)/2)*1.9];
      for (let i=0;i<=N;i++){pts[i]=[];for(let j=0;j<=N;j++){const u=i/N,v=j/N;
        const p=A.map((a,k)=>(1-u)*(1-v)*a+u*(1-v)*B[k]+u*v*C[k]+(1-u)*v*D[k]);
        const du=A.map((a,k)=>(1-v)*(B[k]-a)+v*(C[k]-D[k])),dv=A.map((a,k)=>(1-u)*(D[k]-a)+u*(C[k]-B[k]));
        const n=unit(cross(dv,du)),r=Math.max(Math.abs(2*u-1),Math.abs(2*v-1)),q=r*6,k=Math.floor(q),f=q-k,w=(1-f)*(-1)**k+f*(-1)**(k+1),ripple=.045*w*Math.min(1,r*6,(1-r)*6);
        const folded=p.map((x,m)=>x+n[m]*ripple), open=[0,1].map(k=>u*(1-v)*edgeB[k]+u*v*tip[k]+(1-u)*v*edgeD[k]); open.push(ripple*.4);
        pts[i][j]={folded,open};}}
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=pts[i][j],b=pts[i+1][j],c=pts[i+1][j+1],d=pts[i][j+1];tris.push([a,b,c],[a,c,d]);}
    });
    return tris;
  });
  // Draw one model into ctx, centred at (cx,cy), `size` px across, unfolded by t. `tone(shade)` gives the face colour for a 0–1 light value.
  function render(ctx, model, angle, tilt, size, tone, cx = size/2, cy = size/2, t = 0) {
    const a = angle*(1-t*.6), b = tilt*(1-t);
    const rot = p => { const x=p[0]*Math.cos(a)+p[2]*Math.sin(a), z=-p[0]*Math.sin(a)+p[2]*Math.cos(a); return [x,p[1]*Math.cos(b)-z*Math.sin(b),p[1]*Math.sin(b)+z*Math.cos(b)]; };
    const pos = t ? v => rot(v.folded.map((x,k)=>x*(1-t)+v.open[k]*t)) : v => rot(v.folded);
    const faces = meshes[model].map(tr => tr.map(pos)).sort((p,q)=>p[0][2]+p[1][2]+p[2][2]-q[0][2]-q[1][2]-q[2][2]), s = size*.27;
    for (const ps of faces) {
      const sh = Math.abs(unit(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))).reduce((acc,n,k)=>acc+n*light[k],0));
      ctx.fillStyle = ctx.strokeStyle = tone(sh); ctx.lineWidth = .4;
      ctx.beginPath(); ps.forEach((p,i)=>i?ctx.lineTo(cx+p[0]*s,cy-p[1]*s):ctx.moveTo(cx+p[0]*s,cy-p[1]*s)); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  // Word-wrapped, centred text block for the open sheet.
  function writeText(ctx, lines, cx, cy, width, color, font, lineHeight) {
    ctx.save(); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const out = [];
    for (const [text, f] of lines) { ctx.font = f || font; let line = '';
      for (const word of String(text).split(/\s+/)) { const trial = line ? line + ' ' + word : word; if (ctx.measureText(trial).width > width && line) { out.push([line, ctx.font]); line = word; } else line = trial; }
      if (line) out.push([line, ctx.font]); }
    const total = out.length*lineHeight; out.forEach(([l, f], i) => { ctx.font = f; ctx.fillText(l, cx, cy - total/2 + lineHeight*(i+.5)); });
    ctx.restore();
  }
  return { meshes, render, writeText };
})();
