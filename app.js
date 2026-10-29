const canvas=document.querySelector('#eye'),ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Archive items come from works.js (one item per image; works without images get one grey placeholder).
const WORKS=window.WORKS||[];
const grad=i=>`radial-gradient(ellipse at ${20+i*7%70}% ${15+(i*13)%65}%,#f5f5f5 0%,#c${i%4+3}c${i%4+3}c${i%4+3} 32%,#${['777','888','999','666'][i%4]} 72%,#454545 100%)`;
const items=[];WORKS.forEach(w=>(w.images.length?w.images:[null]).forEach((img,k)=>items.push({work:w,img,k,n:Math.max(1,w.images.length)})));
const astroItems=[['ngc6888','NGC 6888 — Crescent Nebula'],['m45','M45 — Pleiades'],['m31','M31 — Andromeda Galaxy'],['rosette','NGC 2237 — Rosette Nebula'],['saturn','Saturn'],['milkyway','Summer Milky Way'],['moon_eclipse_a','Lunar Eclipse — sequence'],['moon_eclipse_b','Lunar Eclipse — sequence']].map(([f,t])=>({title:t,full:`images/astro/full/${f}.jpg`}));
const personalItems=Array.from({length:6},(_,i)=>({title:`personal archive ${String(i+1).padStart(2,'0')}`,bg:grad(i+3)}));
const fullOf=it=>it.full?`#0b0c0c url("${it.full}") center/contain no-repeat`:it.bg?it.bg:it.img?`#0b0c0c url("images/works/full/${it.img}.jpg") center/contain no-repeat`:grad(items.indexOf(it));
const titleOf=it=>it.work?`${it.work.title}, ${it.work.year}`:it.title;
const N=Math.max(1,items.length);let list=items;
// Grey tiles for the eye surface, loaded once.
const tiles=items.map(it=>{if(!it.img)return null;const im=new Image();im.src=`images/works/tile/${it.img}.jpg`;return im;});
let w=0,h=0,r=0,baseRadius=0,rx=-.08,ry=-.19,tx=-.08,ty=-.19,auto=!reduced,drag=false,start=null,last=null,moved=false,patches=[],projected=[],hover=null,current=0,selected=null,lastFocus=null,opened=false;
const separation={sclera:0,iris:0,pupil:0};
const separationTarget={sclera:0,iris:0,pupil:0};
const partNames={sclera:'공막',iris:'홍채',pupil:'동공'};
const partButtons=[...document.querySelectorAll('[data-eye-part]')];
function syncParts(){partButtons.forEach(button=>{const key=button.dataset.eyePart;button.setAttribute('aria-pressed',String(Boolean(separationTarget[key])));button.setAttribute('aria-label',`${partNames[key]} 조각 ${separationTarget[key]?'다시 조립':'분리'}`);});}
function assembleEye(){Object.keys(separationTarget).forEach(key=>separationTarget[key]=0);syncParts();}
partButtons.forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.eyePart;separationTarget[key]=1-separationTarget[key];syncParts();
 // Bring the named front-facing structure into view without a full revolution.
 tx=-.08;ty+=Math.atan2(Math.sin(-.19-ty),Math.cos(-.19-ty));baseYaw=ty;drift=0;manualUntil=performance.now()+1600;hover=null;
}));
const pupil=.17,step=.095;
for(let ring=0;ring<31;ring++){let a=pupil+ring*step,b=Math.min(Math.PI,a+step*.93);if(a>=Math.PI)break;let count=Math.max(12,Math.round(Math.sin((a+b)/2)*65));for(let j=0;j<count;j++){let p=j/count*Math.PI*2,q=(j+.93)/count*Math.PI*2;patches.push({a,b,p,q,id:patches.length,index:(ring*7+j)%N,shade:((ring*19+j*31)%17)/17});}}
function resize(){const box=canvas.getBoundingClientRect();w=box.width;h=box.height;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);baseRadius=Math.min(w*.365,h*.395);r=baseRadius;}
new ResizeObserver(resize).observe(canvas);
function point(a,p,offset=[0,0,0]){let x=Math.sin(a)*Math.cos(p)+offset[0],y=Math.sin(a)*Math.sin(p)+offset[1],z=Math.cos(a)+offset[2];let y1=y*Math.cos(rx)-z*Math.sin(rx),z1=y*Math.sin(rx)+z*Math.cos(rx);let x1=x*Math.cos(ry)+z1*Math.sin(ry),z2=-x*Math.sin(ry)+z1*Math.cos(ry);let scale=3.8/(3.8-z2);return{x:w*.52+x1*r*scale,y:h*.49+y1*r*scale,z:z2};}
// Translate whole tiles in object coordinates; rotation and hit-testing use the same positions.
function tileOffset(f){
 const a=(f.a+f.b)/2,p=(f.p+f.q)/2;
 if(f.a>=.77 && a<1.75 && (p>4.55 || p<.18)){
  const t=separation.sclera,spread=.26+.16*Math.sin(a);
  return [Math.sin(a)*Math.cos(p)*spread*t,Math.sin(a)*Math.sin(p)*spread*t,.20*t];
 }
 if(f.a<.77){
  const sector=Math.floor(p/(Math.PI/4));
  const t=separation.iris*(sector%2===0?1:.6);
  return [Math.cos(p)*.20*t,Math.sin(p)*.20*t,(.30+(sector%2)*.08)*t];
 }
 return [0,0,0];
}
function pupilOffset(){return [-.40*separation.pupil,.24*separation.pupil,.48*separation.pupil];}
function poly(points){ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();}
function hit(x,y){for(let i=projected.length-1;i>=0;i--){const f=projected[i];let inside=false;for(let a=0,b=f.v.length-1;a<f.v.length;b=a++){const u=f.v[a],v=f.v[b];if((u.y>y)!=(v.y>y)&&x<(v.x-u.x)*(y-u.y)/(v.y-u.y)+u.x)inside=!inside;}if(inside)return f;}return null;}
let previousTime=0,drift=0,baseYaw=-.19,pupilPath=null,manualUntil=0,pupilCenter=null;
function inPupil(x,y){return pupilPath&&ctx.isPointInPath(pupilPath,x*canvas.width/w,y*canvas.height/h);}
function draw(time){if(VoidScene.active){previousTime=time;requestAnimationFrame(draw);return;}let dt=Math.min((time-previousTime)/1000,.04);previousTime=time;if(auto&&!drag&&!opened&&!VoidScene.active&&!Object.values(separationTarget).some(Boolean)&&time>manualUntil){drift+=dt*.18;ty=baseYaw+Math.sin(drift)*.24;}const ease=1-Math.exp(-dt*(reduced?20:8));rx+=(tx-rx)*ease;ry+=(ty-ry)*ease;for(const key of Object.keys(separation)){separation[key]=reduced?separationTarget[key]:separation[key]+(separationTarget[key]-separation[key])*(1-Math.exp(-dt*5));if(Math.abs(separation[key]-separationTarget[key])<.001)separation[key]=separationTarget[key];}r=baseRadius*(1-(w<400?.30:.20)*Math.max(...Object.values(separation)));ctx.clearRect(0,0,w,h);
let shadow=ctx.createRadialGradient(w*.53,h*.49+r*1.42,0,w*.53,h*.49+r*1.42,r*.9);shadow.addColorStop(0,'rgba(80,88,75,.12)');shadow.addColorStop(1,'rgba(80,88,75,0)');ctx.save();ctx.translate(0,h*.49+r*1.42);ctx.scale(1,.14);ctx.translate(0,-(h*.49+r*1.42));ctx.fillStyle=shadow;ctx.fillRect(0,0,w,h*6);ctx.restore();
// Each image is a curved spherical patch, projected with a perspective camera.
projected=patches.map(f=>{
 const centerA=(f.a+f.b)/2,centerP=(f.p+f.q)/2,normal=point(centerA,centerP);
 if(normal.z<.17)return null;
 const offset=tileOffset(f),pt=(a,p)=>point(a,p,offset),m=pt(centerA,centerP);
 const v=[pt(f.a,f.p),pt(f.a,centerP),pt(f.a,f.q),pt(centerA,f.q),pt(f.b,f.q),pt(f.b,centerP),pt(f.b,f.p),pt(centerA,f.p)];
 return {...f,v,z:m.z,lightZ:normal.z,origin:normal,center:m,detached:Math.hypot(...offset)>.01};
}).filter(Boolean).sort((a,b)=>a.z-b.z);
let border=point(0,0);ctx.beginPath();ctx.ellipse(w*.52,h*.49,r*1.036,r*1.036,0,0,Math.PI*2);const exposed=Math.max(...Object.values(separation));const core=ctx.createRadialGradient(w*.46,h*.40,r*.1,w*.52,h*.49,r*1.04);core.addColorStop(0,`rgb(${213-170*exposed},${216-170*exposed},${211-165*exposed})`);core.addColorStop(1,`rgb(${213-120*exposed},${216-120*exposed},${211-115*exposed})`);ctx.fillStyle=core;ctx.fill();
// Fine assembly guides connect a few lifted tiles to their seats.
ctx.save();ctx.strokeStyle='rgba(105,118,107,.24)';ctx.lineWidth=.6;ctx.setLineDash([2,4]);for(const f of projected){if(f.detached&&f.id%5===0){ctx.beginPath();ctx.moveTo(f.origin.x,f.origin.y);ctx.lineTo(f.center.x,f.center.y);ctx.stroke();}}ctx.restore();
for(const f of projected){let iris=f.a<.68,edge=f.a>.58&&f.a<.77;let light=iris?(edge?48:75+f.shade*50):181+f.shade*47;light*=.64+.36*f.lightZ;let g=ctx.createLinearGradient(f.v[0].x,f.v[0].y,f.v[4].x,f.v[4].y);g.addColorStop(0,`rgb(${light+20},${light+21},${light+19})`);g.addColorStop(1,`rgb(${light-19},${light-17},${light-20})`);poly(f.v);ctx.fillStyle=g;ctx.fill();const tile=tiles[f.index];if(tile&&tile.complete&&tile.naturalWidth){ctx.save();ctx.clip();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const v of f.v){x0=Math.min(x0,v.x);y0=Math.min(y0,v.y);x1=Math.max(x1,v.x);y1=Math.max(y1,v.y);}ctx.globalAlpha=iris?.5:.55+.45*f.lightZ;ctx.drawImage(tile,x0,y0,x1-x0,y1-y0);ctx.globalAlpha=iris?.55:.35;ctx.fillStyle=g;ctx.fill();ctx.restore();}if(f.detached){ctx.strokeStyle='rgba(50,59,51,.5)';ctx.lineWidth=1;ctx.stroke();}if(hover?.id===f.id){ctx.fillStyle='#ffffff65';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();}}
pupilPath=null;pupilCenter=null;if(border.z>.27){
 // Keep the aperture in place while its dark optical disk lifts out.
 if(separation.pupil>.01){const hole=[];for(let j=0;j<80;j++)hole.push(point(pupil,j/80*Math.PI*2));poly(hole);ctx.fillStyle='#171d1b';ctx.fill();}
 const offset=pupilOffset(),pv=[];for(let j=0;j<80;j++)pv.push(point(pupil,j/80*Math.PI*2,offset));
 pupilPath=new Path2D();pv.forEach((p,i)=>i?pupilPath.lineTo(p.x,p.y):pupilPath.moveTo(p.x,p.y));pupilPath.closePath();
 pupilCenter=point(0,0,offset);ctx.save();ctx.clip(pupilPath);ctx.fillStyle='#020407';ctx.fillRect(0,0,w,h);VoidScene.miniature(ctx,pupilCenter.x,pupilCenter.y,r*(.235+.04*separation.pupil),time);ctx.restore();
 if(separation.pupil>.01){ctx.strokeStyle='#87938a';ctx.lineWidth=1.5;ctx.stroke(pupilPath);}
}
// A restrained corneal highlight adds optical depth without hiding the archive.
if(border.z>.27){let glint=point(.30,4.0);ctx.save();ctx.translate(glint.x,glint.y);ctx.rotate(-.5);let g=ctx.createRadialGradient(0,0,0,0,0,r*.16);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.scale(1,.6);ctx.fillStyle=g;ctx.fillRect(-r*.2,-r*.2,r*.4,r*.4);ctx.restore();}const dial=document.querySelector('#rotation-angle');if(dial)dial.textContent=String(Math.round(((ry+.19)*180/Math.PI%360+360)%360)).padStart(3,'0')+'°';requestAnimationFrame(draw);}
requestAnimationFrame(draw);
const rot=document.querySelector('#rotation');function syncRotation(){rot.setAttribute('aria-pressed',auto);document.querySelector('#rotation-icon').textContent=auto?'Ⅱ':'▷';}syncRotation();rot.onclick=()=>{auto=!auto;syncRotation();};document.querySelector('#reset').onclick=()=>{tx=-.08;ty=-.19;baseYaw=-.19;drift=0;assembleEye();};
canvas.addEventListener('pointerdown',e=>{drag=true;moved=false;start=last={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{let rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;if(drag){if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)moved=true;ty+=(e.clientX-last.x)*.004;manualUntil=performance.now()+1400;tx=Math.max(-.65,Math.min(.65,tx-(e.clientY-last.y)*.004));baseYaw=ty;drift=0;last={x:e.clientX,y:e.clientY};hover=null;}else{hover=hit(x,y);}const label=document.querySelector('.hover-label');label.style.display=hover&&!drag?'block':'none';if(hover){label.textContent=`${items[hover.index]?titleOf(items[hover.index]):''} ↗`;label.style.left=`${Math.min(x+15,w-240)}px`;label.style.top=`${y-30}px`;}if(inPupil(x,y)&&!drag){label.style.display='block';label.textContent='↗';label.style.left=(x+15)+'px';label.style.top=(y-30)+'px';}canvas.style.cursor=drag?'grabbing':(hover||inPupil(x,y))?'pointer':'grab';});
canvas.addEventListener('pointerup',e=>{drag=false;if(!moved){let rect=canvas.getBoundingClientRect();if(inPupil(e.clientX-rect.left,e.clientY-rect.top)){const p=pupilCenter||point(0,0);VoidScene.open({x:rect.left+p.x,y:rect.top+p.y,r:r*.22});return;}let f=hit(e.clientX-rect.left,e.clientY-rect.top);if(f){selected=f;openImage(f.index,{x:e.clientX,y:e.clientY,size:Math.max(25,r*.13)},items);}}});canvas.addEventListener('pointercancel',()=>{drag=false;});canvas.addEventListener('pointerleave',()=>{hover=null;document.querySelector('.hover-label').style.display='none';});
const viewer=document.querySelector('#viewer'),square=document.querySelector('#square');
function updateImage(){const it=list[current];square.style.background=fullOf(it);document.querySelector('#viewer-number').textContent=it.work?`${it.work.year} — ${it.k+1} / ${it.n}`:`${String(current+1).padStart(2,'0')} / ${list.length}`;document.querySelector('#viewer-title').textContent=titleOf(it);const d=document.querySelector('.viewer-caption p');if(d)d.textContent=it.work?it.work.desc:'';}
function openImage(i,origin,lst){list=lst||items;current=i;opened=true;lastFocus=document.activeElement;viewer.hidden=false;updateImage();const b=square.getBoundingClientRect();if(!reduced){square.animate([{transform:origin?`translate(${origin.x-b.x-b.width/2}px,${origin.y-b.y-b.height/2}px) scale(${origin.size/b.width}) rotateY(35deg)`:'scale(.8)',opacity:.5},{transform:'translate(0,0) scale(1) rotateY(0)',opacity:1}],{duration:760,easing:'cubic-bezier(.2,.75,.15,1)'});viewer.animate([{backgroundColor:'#ffffff00',backdropFilter:'blur(0px)'},{backgroundColor:'#ffffffed',backdropFilter:'blur(10px)'}],{duration:550});}document.querySelector('#close-viewer').focus();}
function closeImage(){viewer.hidden=true;opened=false;lastFocus?.focus();}document.querySelector('#close-viewer').onclick=closeImage;viewer.onclick=e=>{if(e.target===viewer)closeImage();};document.querySelector('#prev').onclick=()=>{current=(current+list.length-1)%list.length;updateImage();};document.querySelector('#next').onclick=()=>{current=(current+1)%list.length;updateImage();};
const indexPanel=document.querySelector('#index'),indexToggle=document.querySelector('#index-toggle');function closeIndex(){indexPanel.hidden=true;indexToggle.setAttribute('aria-expanded','false');indexToggle.focus();}indexToggle.onclick=()=>{indexPanel.hidden=false;indexToggle.setAttribute('aria-expanded','true');document.querySelector('#close-index').focus();};document.querySelector('#close-index').onclick=closeIndex;
items.forEach((it,i)=>{const b=document.createElement('button');b.className='index-card';const bg=it.img?`#ddd url("images/works/thumb/${it.img}.jpg") center/cover`:grad(i);b.innerHTML=`<div style='background:${bg}'></div><p><span>${it.work.year} / ${it.work.title}${it.n>1?` (${it.k+1})`:''}</span><span>↗</span></p>`;b.onclick=()=>{let rect=b.firstElementChild.getBoundingClientRect();openImage(i,{x:rect.x+rect.width/2,y:rect.y+rect.height/2,size:rect.width},items);};document.querySelector('#index-grid').append(b);});
const about=document.querySelector('#about'),aboutToggle=document.querySelector('.about-toggle');function closeAbout(){about.hidden=true;aboutToggle.setAttribute('aria-expanded','false');aboutToggle.focus();}aboutToggle.onclick=()=>{about.hidden=!about.hidden;aboutToggle.setAttribute('aria-expanded',!about.hidden);};document.querySelector('.close-about').onclick=closeAbout;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!viewer.hidden)closeImage();else if(!indexPanel.hidden)closeIndex();else if(!about.hidden)closeAbout();else if(!VoidScene.active)assembleEye();}if(!viewer.hidden){if(e.key==='ArrowRight')document.querySelector('#next').click();if(e.key==='ArrowLeft')document.querySelector('#prev').click();}const panel=!viewer.hidden?viewer:!indexPanel.hidden?indexPanel:null;if(e.key==='Tab'&&panel){const list=[...panel.querySelectorAll('button')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});


document.querySelector("#enter-void").onclick=()=>VoidScene.open();

const workList=document.querySelector('.work-list');if(workList&&WORKS.length){workList.replaceChildren();for(const year of [...new Set(WORKS.map(w=>w.year))].sort((a,b)=>b-a)){const sec=document.createElement('section');sec.className='work-year';const h=document.createElement('h2');h.textContent=year;sec.append(h);for(const w of WORKS.filter(w=>w.year===year)){const b=document.createElement('button');b.className='work-link';b.textContent=w.title;b.dataset.image=items.findIndex(it=>it.work===w);sec.append(b);}workList.append(sec);}}
document.querySelectorAll('.work-link').forEach(button=>{button.onclick=()=>openImage(Number(button.dataset.image),null,items);});

// Dedicated placeholder collections; replace these slots with personal photographs later.
const collectionPanel=document.createElement('section');collectionPanel.id='collection-panel';collectionPanel.hidden=true;collectionPanel.setAttribute('role','dialog');collectionPanel.setAttribute('aria-modal','true');collectionPanel.setAttribute('aria-labelledby','collection-title');collectionPanel.style.cssText='position:fixed;inset:0;background:white;z-index:9;overflow:auto;padding:7%';collectionPanel.innerHTML='<div class="index-heading"><h2 id="collection-title"></h2><button id="collection-close" aria-label="사진 모음 닫기">×</button></div><p class="collection-empty-note">사진을 위한 빈 자리 · placeholder images</p><div id="collection-grid" class="collection-grid"></div>';
document.body.append(collectionPanel);const collectionGrid=collectionPanel.querySelector('#collection-grid');collectionGrid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:30px 20px';let collectionTrigger=null;
function closeCollection(){collectionPanel.hidden=true;collectionTrigger?.focus();}
collectionPanel.querySelector('#collection-close').onclick=closeCollection;
document.querySelectorAll('[data-collection]').forEach(button=>{button.onclick=()=>{collectionTrigger=button;const isAstro=button.dataset.collection==='astro';const lst=isAstro?astroItems:personalItems;collectionPanel.querySelector('#collection-title').textContent=isAstro?'astrophotography':'personal archive';collectionPanel.querySelector('.collection-empty-note').textContent=isAstro?'천구(동공 속 공간)에서 실제 위치로도 볼 수 있습니다':'사진을 위한 빈 자리 · placeholder images';collectionGrid.replaceChildren();lst.forEach((it,i)=>{const card=document.createElement('button');card.className='index-card';const art=document.createElement('div');art.style.background=it.full?`#111 url("${it.full}") center/cover`:it.bg;const caption=document.createElement('p');caption.textContent=isAstro?it.title:String(i+1).padStart(2,'0');card.append(art,caption);card.setAttribute('aria-label',it.title);card.onclick=()=>{openImage(i,null,lst);};collectionGrid.append(card);});collectionPanel.hidden=false;collectionPanel.querySelector('#collection-close').focus();};});
collectionPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeCollection();}if(e.key==='Tab'){const buttons=[...collectionPanel.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});


// 1,200 CSS pixels of wheel travel maps to one complete revolution.
document.querySelector('main').addEventListener('wheel',e=>{
 if(e.ctrlKey||VoidScene.active||opened||!indexPanel.hidden||!collectionPanel.hidden)return;
 e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
 const delta=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX)*unit;
 ty+=Math.max(-600,Math.min(600,delta))*Math.PI*2/1200;
 baseYaw=ty;drift=0;manualUntil=performance.now()+1400;hover=null;
 document.querySelector('.hover-label').style.display='none';
},{passive:false});

