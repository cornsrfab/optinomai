/* Shared folded-paper meshes (the five hyparhedra from paper-models.js) and a tiny software renderer. */
window.PaperMesh = (() => {
  const sub=(a,b)=>a.map((x,i)=>x-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
  const light = unit([-.4,.6,1]), N = 6;
  const meshes = window.PaperModels.map(model => {
    const tris = [];
    for (const [A,B,C,D] of model.patches) {
      const pts = [];
      for (let i=0;i<=N;i++){pts[i]=[];for(let j=0;j<=N;j++){const u=i/N,v=j/N;
        const p=A.map((a,k)=>(1-u)*(1-v)*a+u*(1-v)*B[k]+u*v*C[k]+(1-u)*v*D[k]);
        const du=A.map((a,k)=>(1-v)*(B[k]-a)+v*(C[k]-D[k])),dv=A.map((a,k)=>(1-u)*(D[k]-a)+u*(C[k]-B[k]));
        const n=unit(cross(dv,du)),r=Math.max(Math.abs(2*u-1),Math.abs(2*v-1)),q=r*6,k=Math.floor(q),f=q-k,w=(1-f)*(-1)**k+f*(-1)**(k+1);
        pts[i][j]=p.map((x,m)=>x+n[m]*.045*w*Math.min(1,r*6,(1-r)*6));}}
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=pts[i][j],b=pts[i+1][j],c=pts[i+1][j+1],d=pts[i][j+1];tris.push([a,b,c],[a,c,d]);}
    }
    return tris;
  });
  // Draw one model into ctx, centred at (cx,cy), `size` px across. `tone(shade)` returns the face colour for a 0–1 light value.
  function render(ctx, model, angle, tilt, size, tone, cx = size/2, cy = size/2) {
    const rot = p => { const x=p[0]*Math.cos(angle)+p[2]*Math.sin(angle), z=-p[0]*Math.sin(angle)+p[2]*Math.cos(angle); return [x,p[1]*Math.cos(tilt)-z*Math.sin(tilt),p[1]*Math.sin(tilt)+z*Math.cos(tilt)]; };
    const faces = meshes[model].map(t => t.map(rot)).sort((a,b)=>a[0][2]+a[1][2]+a[2][2]-b[0][2]-b[1][2]-b[2][2]), s = size*.27;
    for (const ps of faces) {
      const sh = Math.abs(unit(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))).reduce((a,n,k)=>a+n*light[k],0));
      ctx.fillStyle = ctx.strokeStyle = tone(sh); ctx.lineWidth = .4;
      ctx.beginPath(); ps.forEach((p,i)=>i?ctx.lineTo(cx+p[0]*s,cy-p[1]*s):ctx.moveTo(cx+p[0]*s,cy-p[1]*s)); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  return { meshes, render };
})();
