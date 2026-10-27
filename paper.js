/* Small paper studies. The unfolding is an illustrative morph, not a rigid-fold solver. */
(() => {
  const host = document.querySelector('.paper-scatter');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = ['정사면체', '정육면체', '정팔면체', '정이십면체', '정십이면체'];
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const n = Math.hypot(...a) || 1; return a.map(x => x/n); };
  const light = unit([-.4, .6, 1]);
  const instances = [];
  window.PaperModels.forEach((model, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `paper-object paper-object-${index}`;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${labels[index]} 종이모형 펼치기`);
    button.innerHTML = '<canvas aria-hidden="true"></canvas><span class="paper-hint">unfold</span>';
    host.append(button);
    const canvas = button.querySelector('canvas'), ctx = canvas.getContext('2d');
    const triangles = [], N = 12;
    // Preserve each saddle and its concentric square pleats; spread patches into a radial sheet study.
    model.patches.forEach((patch, pi) => {
      const [A,B,C,D] = patch, points = [], count = model.patches.length;
      const sector = pi / count * Math.PI * 2;
      const next = (pi+1) / count * Math.PI * 2;
      const edgeB = [Math.cos(sector)*1.5, Math.sin(sector)*1.5];
      const edgeD = [Math.cos(next)*1.5, Math.sin(next)*1.5];
      const tip = [Math.cos((sector+next)/2)*1.9, Math.sin((sector+next)/2)*1.9];
      for(let i=0;i<=N;i++) {
        points[i]=[];
        for(let j=0;j<=N;j++) {
          const u=i/N,v=j/N;
          const p=A.map((a,k)=>(1-u)*(1-v)*a+u*(1-v)*B[k]+u*v*C[k]+(1-u)*v*D[k]);
          const du=A.map((a,k)=>(1-v)*(B[k]-a)+v*(C[k]-D[k]));
          const dv=A.map((a,k)=>(1-u)*(D[k]-a)+u*(C[k]-B[k]));
          const normal=unit(cross(dv,du)),r=Math.max(Math.abs(2*u-1),Math.abs(2*v-1));
          const q=r*6,k=Math.floor(q),f=q-k,w=(1-f)*(-1)**k+f*(-1)**(k+1);
          const ripple=.045*w*Math.min(1,r*6,(1-r)*6);
          const folded=p.map((x,k)=>x+normal[k]*ripple);
          const open=[0,1].map(k=>u*(1-v)*edgeB[k]+u*v*tip[k]+(1-u)*v*edgeD[k]);
          open.push(ripple*.4);
          points[i][j]={folded,open};
        }
      }
      for(let i=0;i<N;i++) for(let j=0;j<N;j++) {
        const a=points[i][j],b=points[i+1][j],c=points[i+1][j+1],d=points[i][j+1];
        triangles.push([a,b,c],[a,c,d]);
      }
    });
    let amount=0,target=0,frame=0;
    function draw(t) {
      const size=button.clientWidth,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(size*dpr)){canvas.width=Math.round(size*dpr);canvas.height=canvas.width;}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
      const a=(.55+index*.63)*(1-t),b=-.35*(1-t);
      const rotate=p=>{const x=p[0]*Math.cos(a)+p[2]*Math.sin(a),z=-p[0]*Math.sin(a)+p[2]*Math.cos(a);return [x,p[1]*Math.cos(b)-z*Math.sin(b),p[1]*Math.sin(b)+z*Math.cos(b)];};
      const faces=triangles.map(tr=>tr.map(p=>rotate(p.folded.map((x,k)=>x*(1-t)+p.open[k]*t))));
      faces.sort((a,b)=>a.reduce((s,p)=>s+p[2],0)-b.reduce((s,p)=>s+p[2],0));
      const scale=size*.25;
      for(const ps of faces){
        const normal=unit(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])));
        const shade=Math.abs(normal.reduce((s,n,k)=>s+n*light[k],0));
        const g=Math.round(175+77*shade);
        ctx.fillStyle=`rgb(${g},${g},${Math.min(255,g+1)})`;
        ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(size/2+p[0]*scale,size/2-p[1]*scale):ctx.moveTo(size/2+p[0]*scale,size/2-p[1]*scale));ctx.closePath();ctx.fill();
      }
    }
    function toggle(){
      target=1-target;cancelAnimationFrame(frame);
      button.setAttribute('aria-pressed',String(Boolean(target)));
      button.setAttribute('aria-label',`${labels[index]} 종이모형 ${target?'접기':'펼치기'}`);
      button.querySelector('.paper-hint').textContent=target?'fold':'unfold';
      if(motion.matches){amount=target;draw(amount);return;}
      const from=amount,start=performance.now();
      const animate=now=>{const t=Math.min(1,(now-start)/1100),ease=t*t*(3-2*t);amount=from+(target-from)*ease;draw(amount);if(t<1)frame=requestAnimationFrame(animate);};
      frame=requestAnimationFrame(animate);
    }
    button.addEventListener('click',toggle);
    // Native buttons support keyboard and touch without intercepting the eye canvas.
    button.addEventListener('keydown',e=>{if(e.key==='Escape'&&target){toggle();e.stopPropagation();}});
    instances.push(()=>draw(amount));draw(0);
  });
  let resizeFrame;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>instances.forEach(draw=>draw()));});
})();
