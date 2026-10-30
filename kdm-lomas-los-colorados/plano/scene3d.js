/* NWS · Lámina CCTV-01 · escenas 3D (three.js r128)
   Exterior de planta + interiores: data center, sala de control S/E y nave de motores. */
(function(){
'use strict';
const T=window.THREE;

function init(){
const D=window.PLANO;
const {W,H,PX,TYPES,NODES,CAMS,FIBER,PTP,PHOTOS,ALLPH,utpRoute}=D;
const $=s=>document.querySelector(s);
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=$('#c3d'),stage=$('#p-3d');
const rad=d=>d*Math.PI/180;
const M=(px,py)=>[(px-W/2)/PX,(py-H/2)/PX];
const GW=W/PX,GH=H/PX;

/* ---------- renderer ---------- */
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();const l=$('#load3d');l.hidden=false;l.textContent='La vista 3D se detuvo por falta de memoria gráfica. Recarga la página.'});
const cam=new T.PerspectiveCamera(40,1,0.05,4000);
const ctl=new T.OrbitControls(cam,canvas);ctl.enableDamping=true;ctl.dampingFactor=.08;ctl.screenSpacePanning=true;
const ANISO=renderer.capabilities.getMaxAnisotropy();

/* ---------- utilidades ---------- */
let seed=11;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
function rgb(hex,k){const c=new T.Color(hex);return `rgb(${Math.min(255,c.r*255*k)|0},${Math.min(255,c.g*255*k)|0},${Math.min(255,c.b*255*k)|0})`}
function ctex(w,h,draw,rx=1,ry=1,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);if(srgb)t.encoding=T.sRGBEncoding;t.anisotropy=ANISO;return t}
function speckle(g,w,h,base,amt,n){g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<n;i++){const v=(R()-.5)*amt;g.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;g.fillRect(R()*w,R()*h,1+R()*2.5,1+R()*2.5)}}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const std=o=>new T.MeshStandardMaterial(Object.assign({roughness:.8,metalness:0},o));
const basic=o=>new T.MeshBasicMaterial(o);
const TXC={};const tx=(k,f)=>TXC[k]||(TXC[k]=f());
const corr=(base,rx=1,ry=1)=>{const t=ctex(128,8,(g,w,h)=>{for(let x=0;x<w;x++){g.fillStyle=rgb(base,.86+.16*Math.sin(x/w*Math.PI*2*8));g.fillRect(x,0,1,h)}});t.repeat.set(rx,ry);return t};
const MAT={
  steel:std({color:'#a9b0b7',metalness:.65,roughness:.38}),
  galv:std({color:'#c3c8cc',metalness:.55,roughness:.45}),
  white:std({color:'#f2f3f3',roughness:.42}),
  offwhite:std({color:'#e9e6df',roughness:.6}),
  dark:std({color:'#1a2129',roughness:.5,metalness:.2}),
  black:std({color:'#0e1216',roughness:.45,metalness:.25}),
  concrete:std({color:'#cfcac0',roughness:.92}),
  brown:std({color:'#5b2a1c',roughness:.35,metalness:.05}),
  green:std({color:'#3fae2a',roughness:.45,metalness:.15}),
  greenDark:std({color:'#2f7f23',roughness:.5,metalness:.15}),
  yellow:std({color:'#e6b400',roughness:.45,metalness:.1}),
  glass:std({color:'#a9cfe0',transparent:true,opacity:.16,roughness:.05,metalness:.3,depthWrite:false}),
  alu:std({color:'#c9cdd1',metalness:.7,roughness:.3}),
  lamp:basic({color:'#fff8e6'}),
};
let cur=null; // grupo destino
function box(w,h,d,mat,x=0,y=0,z=0,p){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||cur).add(m);return m}
function cyl(rt,rb,h,mat,x=0,y=0,z=0,p,seg=18){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,seg),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||cur).add(m);return m}
function grp(x=0,y=0,z=0,p){const g=new T.Group();g.position.set(x,y,z);(p||cur).add(g);return g}
function tubeAlong(pts,r,mat,p,seg){const c=new T.CatmullRomCurve3(pts,false,'catmullrom',.3);const m=new T.Mesh(new T.TubeGeometry(c,seg||Math.max(16,pts.length*10),r,6,false),mat);m.castShadow=true;(p||cur).add(m);return m}
function aimY(obj,dx,dz){obj.rotation.y=Math.atan2(dx,dz)}

/* ---------- etiquetas ---------- */
function label(text,{color='#1aa3e0',sub=null,size=1,light=false,icon=null}={}){
  const s=2,c=document.createElement('canvas'),g=c.getContext('2d');
  const f1=`700 ${26*s}px Montserrat, system-ui, sans-serif`,f2=`500 ${19*s}px Montserrat, system-ui, sans-serif`;
  g.font=f1;const tw=g.measureText(text).width;g.font=f2;const sw=sub?g.measureText(sub).width:0;
  const pad=14*s,dot=12*s,hh=(sub?74:48)*s,w=Math.ceil(pad*2+dot+10*s+Math.max(tw,sw)),tail=9*s;
  c.width=w;c.height=hh+tail;
  g.fillStyle=light?'rgba(255,255,255,.96)':'rgba(8,18,31,.92)';rrect(g,s,s,w-2*s,hh-2*s,10*s);g.fill();
  g.strokeStyle=color;g.lineWidth=2*s;g.stroke();
  g.beginPath();g.moveTo(w/2-tail,hh-2*s);g.lineTo(w/2,hh+tail-s);g.lineTo(w/2+tail,hh-2*s);g.closePath();g.fillStyle=color;g.fill();
  g.fillStyle=color;g.beginPath();g.arc(pad+dot/2,24*s,dot/2,0,Math.PI*2);g.fill();
  g.fillStyle=light?'#0b1f3a':'#ffffff';g.font=f1;g.textBaseline='middle';g.fillText(text,pad+dot+10*s,25*s);
  if(sub){g.fillStyle=light?'#4a5866':'#9fb2cb';g.font=f2;g.fillText(sub,pad+dot+10*s,54*s)}
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=ANISO;
  const sp=new T.Sprite(new T.SpriteMaterial({map:t,depthTest:false,sizeAttenuation:false,transparent:true}));
  const k=.00015*size;sp.scale.set(c.width*k,c.height*k,1);sp.center.set(.5,0);sp.renderOrder=20;return sp}

/* ---------- placas de equipos (texturas frontales) ---------- */
function plate(kind,units,txt){return tx('p:'+kind+units+(txt||''),()=>ctex(512,Math.round(46*units),(g,w,h)=>{
  const port=(x,y,s=14)=>{g.fillStyle='#05070a';g.fillRect(x,y,s,s*.8);g.fillStyle='#2b3138';g.fillRect(x+2,y+s*.55,s-4,2)};
  if(kind==='patch'){g.fillStyle='#16191d';g.fillRect(0,0,w,h);for(let i=0;i<24;i++){const x=60+(i%12)*32+(i>=12?0:0),y=i<12?6:24;port(x,y,15)}g.fillStyle='#cfd5db';g.font='9px sans-serif';g.fillText('CAT6',10,26)}
  else if(kind==='org'){g.fillStyle='#121417';g.fillRect(0,0,w,h);g.fillStyle='#050607';g.fillRect(30,h*.35,w-60,h*.3);for(let x=34;x<w-34;x+=4){g.fillStyle='#1d2126';g.fillRect(x,h*.35,2,h*.3)}}
  else if(kind==='switch'||kind==='switchBlue'||kind==='poe'){g.fillStyle=kind==='switchBlue'?'#2f5fb4':kind==='poe'?'#1b2027':'#2a2f35';g.fillRect(0,0,w,h);for(let i=0;i<24;i++){port(70+(i%12)*30,i<12?5:22,13);g.fillStyle=R()>.4?'#4ade80':'#f59e0b';g.fillRect(72+(i%12)*30,i<12?3:40,3,2)}
    if(kind==='poe'){port(440,6,18);port(470,6,18);g.fillStyle='#22d3ee';g.font='bold 9px sans-serif';g.fillText('SFP',445,40);g.fillStyle='#e5e7eb';g.fillText('PoE 16',14,26)}}
  else if(kind==='fiber'){g.fillStyle='#d9d7cf';g.fillRect(0,0,w,h);g.fillStyle='#1d2b3a';g.font=`bold ${Math.min(26,h*.33)}px Montserrat, sans-serif`;g.fillText(txt||'CABECERA ÓPTICA',120,h*.42);for(let i=0;i<24;i++){const x=30+i*19,y=h*.72;g.fillStyle='#6b7280';g.beginPath();g.arc(x,y,6,0,7);g.fill();g.fillStyle=i%5===0?'#facc15':'#111';g.beginPath();g.arc(x,y,3,0,7);g.fill()}}
  else if(kind==='server'){g.fillStyle='#14171b';g.fillRect(0,0,w,h);g.fillStyle='#2b3138';for(let y=8;y<h-8;y+=6)for(let x=60;x<w-60;x+=6){g.fillRect(x,y,3,3)}g.fillStyle='#9aa3ad';g.fillRect(20,h/2-12,22,24);g.fillStyle='#38bdf8';g.fillRect(w-36,h/2-3,8,6)}
  else if(kind==='ups'){g.fillStyle='#16191d';g.fillRect(0,0,w,h);g.fillStyle='#0b3a2a';g.fillRect(w-150,h*.3,90,h*.35);g.fillStyle='#4ade80';g.font='bold 14px monospace';g.fillText('100%',w-140,h*.55);g.fillStyle='#2b3138';for(let x=20;x<w-170;x+=10)g.fillRect(x,8,5,h-16)}
  else if(kind==='nvr'){g.fillStyle='#111418';g.fillRect(0,0,w,h);g.fillStyle='#1aa3e0';g.fillRect(24,h-10,w-48,3);g.fillStyle='#e5e7eb';g.font='bold 15px Montserrat, sans-serif';g.fillText('NVR 32CH · 4 HDD',30,h*.48);for(let i=0;i<4;i++){g.fillStyle='#22c55e';g.fillRect(w-120+i*22,h*.38,10,4)}}
  else if(kind==='pc'){g.fillStyle='#c7ccd1';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){g.fillStyle='#1f2937';g.fillRect(130+i*55,h*.35,34,h*.3)}g.fillStyle='#22c55e';g.fillRect(40,h*.45,8,8)}
  else if(kind==='pdu'){g.fillStyle='#16191d';g.fillRect(0,0,w,h);for(let i=0;i<8;i++){g.fillStyle='#000';g.beginPath();g.arc(80+i*48,h/2,10,0,7);g.fill()}g.fillStyle='#ef4444';g.fillRect(24,h/2-6,14,12)}
  else if(kind==='beige'){g.fillStyle='#d7d4cb';g.fillRect(0,0,w,h);g.fillStyle='#9ca3af';g.fillRect(20,h*.4,60,h*.2)}
  else if(kind==='blank'){g.fillStyle='#e9e8e2';g.fillRect(0,0,w,h);g.fillStyle='#b7b4ab';g.fillRect(14,h/2-4,8,8);g.fillRect(w-22,h/2-4,8,8)}
}))}
function equip(rk,u,units,kind,{depth=.55,txt,hl=false}={}){const h=units*.0445-.004,y=rk.userData.y0+(u-1)*.0445+h/2;
  const side=hl?std({color:'#22d3ee',emissive:'#0e7490',emissiveIntensity:.5,roughness:.4}):MAT.dark;
  const m=box(.44,h,depth,[side,side,side,side,std({map:plate(kind,units,txt),roughness:.5,emissive:hl?'#0e4a5c':'#000000',emissiveIntensity:hl?.35:0}),side],0,y,rk.userData.zf-depth/2,rk);
  const ears=box(.482,h,.012,MAT.black,0,y,rk.userData.zf+.004,rk);ears.material=std({color:kind==='fiber'?'#cfccc3':'#15181c',roughness:.5});ears.renderOrder=0;ears.scale.z=1;
  m.userData.equip=kind;return m}
function rack(x,z,{color='#0f1317',open=false,door=false,frame=null}={}){const g=grp(x,0,z);const w=.6,d=.8,h=2.06,fm=std({color:frame||color,roughness:.55,metalness:.35});
  for(const sx of[-1,1])for(const sz of[-1,1])box(.045,h,.045,fm,sx*(w/2-.022),h/2,sz*(d/2-.022),g);
  box(w,.05,d,fm,0,h-.025,0,g);box(w,.08,d,fm,0,.04,0,g);
  for(const sz of[-1,1])box(w,.04,.04,fm,0,h*.5,sz*(d/2-.02),g);
  if(!open){const pm=std({color,roughness:.5,metalness:.3});box(.012,h-.1,d-.05,pm,-w/2+.006,h/2,0,g);box(.012,h-.1,d-.05,pm,w/2-.006,h/2,0,g);box(w-.05,h-.1,.012,pm,0,h/2,-d/2+.006,g)}
  const rail=std({color:'#9aa1a8',metalness:.6,roughness:.4});for(const sx of[-1,1]){box(.02,h-.12,.03,rail,sx*.235,h/2,d/2-.09,g);box(.02,h-.12,.03,rail,sx*.235,h/2,-d/2+.12,g)}
  if(door){const df=std({color,roughness:.5,metalness:.35});box(.03,h-.08,.03,df,-w/2+.015,h/2,d/2+.01,g);box(.03,h-.08,.03,df,w/2-.015,h/2,d/2+.01,g);box(w,.03,.03,df,0,h-.06,d/2+.01,g);box(w,.03,.03,df,0,.08,d/2+.01,g);
    const gl=box(w-.04,h-.14,.006,MAT.glass,0,h/2,d/2+.012,g);gl.castShadow=false}
  g.userData={y0:.11,zf:d/2-.09,h};return g}

/* ---------- cámaras (modelos) ---------- */
function camModel(type,color,scale=1){const g=new T.Group();const head=new T.Group();g.add(head);const wm=MAT.white,dk=std({color:'#0a0d11',roughness:.15,metalness:.5});const ring=basic({color});
  if(type==='ptz'){cyl(.03,.03,.22,wm,0,-.11,0,g);box(.05,.05,.22,wm,0,-.02,.1,g);head.position.set(0,-.06,.22);cyl(.13,.13,.14,wm,0,-.07,0,head,24);
    const dome=new T.Mesh(new T.SphereGeometry(.12,24,14,0,Math.PI*2,Math.PI/2,Math.PI/2),dk);dome.position.y=-.14;head.add(dome);const r=new T.Mesh(new T.TorusGeometry(.13,.012,6,32),ring);r.rotation.x=Math.PI/2;r.position.y=-.14;head.add(r)}
  else{box(.06,.06,.06,wm,0,0,-.03,g);const arm=box(.035,.035,.12,wm,0,0,.04,g);head.position.set(0,0,.11);
    const L=type==='vf'?.32:type==='pan'?.16:.24,Wd=type==='pan'?.3:.11;
    if(type==='pan'){box(Wd,.11,L,wm,0,0,L/2,head);for(const sx of[-1,1]){const l=cyl(.035,.035,.01,dk,sx*.065,0,L+.003,head,20);l.rotation.x=Math.PI/2}box(Wd+.02,.012,L+.05,wm,0,.063,L/2+.02,head)}
    else{const b=cyl(.055,.055,L,wm,0,0,L/2,head,22);b.rotation.x=Math.PI/2;box(.13,.01,L+.06,wm,0,.064,L/2+.02,head);const gl=cyl(.047,.047,.01,dk,0,0,L+.002,head,22);gl.rotation.x=Math.PI/2}
    const r=box(type==='pan'?Wd+.006:.118,type==='pan'?.116:.118,.02,ring,0,0,L*.62,head);r.castShadow=false}
  g.scale.setScalar(scale);g.userData.head=head;return g}
function fovGeom(fov,r,h){const n=Math.max(10,Math.round(fov/5)),a=rad(fov),pts=[];for(let i=0;i<=n;i++){const t=-a/2+a*i/n;pts.push([Math.sin(t)*r,.08,Math.cos(t)*r])}
  const pos=[];for(let i=0;i<n;i++){const p=pts[i],q=pts[i+1];pos.push(0,h,0,...p,...q);pos.push(0,.08,0,...q,...p)}
  pos.push(0,h,0,0,.08,0,...pts[0]);pos.push(0,h,0,...pts[n],0,.08,0);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
  const lp=[0,h,0,...pts[0],0,h,0,...pts[n]];for(let i=0;i<n;i++)lp.push(...pts[i],...pts[i+1]);
  const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));return {geo,lg}}
function fovMesh(fov,r,h,color,parent){const g=new T.Group();const {geo,lg}=fovGeom(fov,r,h);
  const m=new T.Mesh(geo,new T.MeshBasicMaterial({color,transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}));
  const l=new T.LineSegments(lg,new T.LineBasicMaterial({color,transparent:true,opacity:.75}));g.add(m,l);g.userData={m,l,fov,color};(parent||cur).add(g);return g}
function setFov(g,fov,r,h){const {geo,lg}=fovGeom(fov,r,h);g.userData.m.geometry.dispose();g.userData.l.geometry.dispose();g.userData.m.geometry=geo;g.userData.l.geometry=lg}
function frustumTo(from,corners,color,parent){const pos=[];for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];pos.push(from.x,from.y,from.z,a.x,a.y,a.z,b.x,b.y,b.z)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  const m=new T.Mesh(geo,new T.MeshBasicMaterial({color,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));(parent||cur).add(m);
  const lp=[];for(const c of corners)lp.push(from.x,from.y,from.z,c.x,c.y,c.z);for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];lp.push(a.x,a.y,a.z,b.x,b.y,b.z)}
  const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));const l=new T.LineSegments(lg,new T.LineBasicMaterial({color}));(parent||cur).add(l);return [m,l]}

/* ---------- escenas ---------- */
const SC={};let active=null;
function newScene(key,{bgTop,bgBot}){const s=new T.Scene();const sky=new T.Mesh(new T.SphereGeometry(1800,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(bgTop)},bot:{value:new T.Color(bgBot)}},
  vertexShader:'varying vec3 vp;void main(){vp=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vp;void main(){float h=normalize(vp).y;vec3 c=mix(bot,top,smoothstep(-.05,.55,h));gl_FragColor=vec4(c,1.);}'}));
  sky.renderOrder=-1;s.add(sky);const o={key,scene:s,root:new T.Group(),views:{},pick:[],layers:{fov:[],utp:[],fo:[],ptp:[],foto:[],lbl:[],humo:[]},walls:[],pulses:[],tick:[],sky};s.add(o.root);SC[key]=o;return o}
function lightsDay(o,{intensity=1.25,ext=220}={}){const s=o.scene;s.add(new T.HemisphereLight('#e8f1fb','#8a7656',.5));
  const sun=new T.DirectionalLight('#fff1dc',intensity*.9);sun.position.set(-ext*.55,ext,ext*.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
  Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext*.6,bottom:-ext*.6,near:1,far:ext*4});s.add(sun);s.add(sun.target);return sun}
function lightsRoom(o,{w,d,h,warm='#fffaf0',count=2,intensity=.55}){const s=o.scene;s.add(new T.HemisphereLight('#f4f7fb','#4a4f56',.42));
  const dl=new T.DirectionalLight('#ffffff',.42);dl.position.set(-w*.6,h*4,d*1.2);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-.0005;dl.shadow.normalBias=.01;Object.assign(dl.shadow.camera,{left:-w,right:w,top:d,bottom:-d,near:.5,far:h*10});s.add(dl);
  for(let i=0;i<count;i++){const p=new T.PointLight(warm,intensity,Math.max(w,d)*1.4,1.6);p.position.set(-w/2+w*(i+.5)/count,h-.25,0);s.add(p)}}
function cutawayRoom(o,{w,d,h,floorMat,wallMat,ceilMat,glassFront=false,windowBack=false,trim='#2a3442'}){cur=o.root;
  box(w+.4,.25,d+.4,std({color:'#2b3644',roughness:.8}),0,-.125,0);const fl=box(w,.02,d,floorMat,0,.01,0);fl.castShadow=false;
  const mk=(sx,sz,len,nx,nz,glass)=>{const th=.12,g=new T.Group();cur.add(g);
    if(glass){const fm=MAT.alu;const ww=sz===0?th:len,dd=sz===0?len:th;box(ww,.06,dd,fm,sx,h-.03,sz,g);box(ww,.06,dd,fm,sx,.03,sz,g);const n=Math.round(len/1.2);for(let i=0;i<=n;i++){const t=-len/2+len*i/n;box(sz===0?th:.05,h,sz===0?.05:th,fm,sx+(sz===0?0:t),h/2,sz+(sz===0?t:0),g)}
      box(sz===0?.008:len,h-.1,sz===0?len:.008,MAT.glass,sx,h/2,sz,g);box(sz===0?.02:len,.05,sz===0?len:.02,fm,sx,1.05,sz,g)}
    else{const m=box(sz===0?th:len,h,sz===0?len:th,wallMat,sx,h/2,sz,g);
      if(windowBack&&nz>0){const wv=box(1.6,1.0,.14,std({color:'#bcd9ec',emissive:'#9cc5e6',emissiveIntensity:.6,roughness:.1}),-w*.12,1.55,sz,g);box(1.7,.06,.16,MAT.alu,-w*.12,2.08,sz,g);box(1.7,.06,.16,MAT.alu,-w*.12,1.02,sz,g)}}
    o.walls.push({g,n:new T.Vector3(nx,0,nz)})};
  mk(0,-d/2,w,0,1,false);mk(0,d/2,w,0,-1,glassFront);mk(-w/2,0,d,1,0,false);mk(w/2,0,d,-1,0,false);
  const ceil=new T.Mesh(new T.PlaneGeometry(w,d),ceilMat);ceil.rotation.x=Math.PI/2;ceil.position.y=h;cur.add(ceil);o.ceil=ceil;
  // corner trims for a clean model look
  const tm=std({color:trim,roughness:.6});box(w+.4,.04,.04,tm,0,.02,d/2+.2);box(w+.4,.04,.04,tm,0,.02,-d/2-.2);box(.04,.04,d+.4,tm,w/2+.2,.02,0);box(.04,.04,d+.4,tm,-w/2-.2,.02,0)}

/* ======================= EXTERIOR ======================= */
let EXT=null;
function buildExterior(){const o=newScene('ext',{bgTop:'#6d9ccf',bgBot:'#dfe7ee'});EXT=o;cur=o.root;o.scene.fog=new T.Fog('#c3d2e0',650,1700);
  const sun=lightsDay(o,{ext:200});o.sun=sun;
  // terreno con cerros
  const tg=new T.PlaneGeometry(2200,1700,140,110);tg.rotateX(-Math.PI/2);const p=tg.attributes.position,cols=[];const cA=new T.Color('#7d6646'),cB=new T.Color('#4f5a33'),cC=new T.Color('#8a7350');
  const n2=(x,z)=>Math.sin(x*.011)*Math.cos(z*.013)*.5+Math.sin(x*.027+z*.019)*.3+Math.sin(x*.061-z*.043)*.2;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const dx=Math.max(0,Math.abs(x)-GW/2-8),dz=Math.max(0,Math.abs(z)-GH/2-8);const dd=Math.hypot(dx,dz);
    let y=dd<=0?-.15:Math.min(1,dd/35)*(8+n2(x,z)*6)+Math.max(0,dd-35)*.32*(1+.5*n2(x*.5,z*.5));
    if(z<-GH/2-5)y+=Math.min(80,Math.max(0,-z-GH/2-5)*.55)*(.75+.35*n2(x,z)); // ladera norte del relleno
    p.setY(i,y);const k=Math.min(1,y/25);const c=cA.clone().lerp(cB,k*.9);c.lerp(cC,.25*(n2(x*2,z*2)+.5));cols.push(c.r,c.g,c.b)}
  tg.setAttribute('color',new T.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
  const dirt=ctex(256,256,(g,w,h)=>{speckle(g,w,h,'#d8d8d8',.35,26000);for(let i=0;i<220;i++){g.fillStyle=`rgba(${R()>.5?'60,70,30':'90,70,40'},${.15+R()*.25})`;g.beginPath();g.arc(R()*w,R()*h,1+R()*5,0,7);g.fill()}},90,70);
  const terr=new T.Mesh(tg,std({vertexColors:true,map:dirt,roughness:.97,flatShading:true}));terr.receiveShadow=true;cur.add(terr);
  // suelo satelital
  const loader=new T.TextureLoader();const sat=loader.load('tex.jpg',()=>{o.satReady=true;if(active===o)$('#load3d').hidden=true},undefined,()=>{$('#load3d').textContent='No se pudo cargar la imagen satelital.'});sat.encoding=T.sRGBEncoding;sat.anisotropy=ANISO;
  const ground=new T.Mesh(new T.PlaneGeometry(GW,GH),std({map:sat,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.position.y=.02;ground.receiveShadow=true;cur.add(ground);
  const roofMat=std({map:sat,roughness:.7,metalness:.1});
  function bld(x0,y0,x1,y1,h,{wall='#dcd6c8',ribs=true}={}){const w=(x1-x0)/PX,d=(y1-y0)/PX;const geo=new T.BoxGeometry(w,h,d);const pos=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=8;i<12;i++){const px=(x0+x1)/2+pos.getX(i)*PX,py=(y0+y1)/2+pos.getZ(i)*PX;uv.setXY(i,px/W,1-py/H)}uv.needsUpdate=true;
    const wm=std({color:'#ffffff',map:ribs?corr(wall,Math.max(1,w/4),1):null,roughness:.65,metalness:.15});const wm2=std({color:'#ffffff',map:ribs?corr(wall,Math.max(1,d/4),1):null,roughness:.65,metalness:.15});
    const m=new T.Mesh(geo,[wm2,wm2,roofMat,wm,wm,wm]);const [cx,cz]=M((x0+x1)/2,(y0+y1)/2);m.position.set(cx,h/2,cz);m.castShadow=m.receiveShadow=true;cur.add(m);
    box(w+.3,.25,d+.3,std({color:'#c2c4c4',roughness:.6,metalness:.2}),cx,h,cz);return m}
  // nave de motores
  bld(1110,745,1865,890,11,{wall:'#dfd8c6'});bld(1865,705,1980,895,13,{wall:'#d6d0c0'});bld(1980,750,2400,885,11,{wall:'#dfd8c6'});
  // módulos de radiadores y escapes
  const radG=new T.BoxGeometry(3.4,3.0,7.2),radM=std({color:'#c8ccd1',metalness:.4,roughness:.5});const n=Math.floor((1880-1130)/48);const im=new T.InstancedMesh(radG,radM,n);const im2=new T.InstancedMesh(new T.CylinderGeometry(.35,.4,7,10),MAT.steel,n);const im3=new T.InstancedMesh(new T.CylinderGeometry(.55,.55,2.2,12),MAT.galv,n);
  const dm=new T.Object3D();for(let i=0;i<n;i++){const [cx,cz]=M(1148+i*48,680);dm.position.set(cx,1.5,cz);dm.rotation.set(0,0,0);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);dm.position.set(cx,4.5,cz-2.6);dm.updateMatrix();im2.setMatrixAt(i,dm.matrix);dm.position.set(cx,7.4,cz-2.6);dm.rotation.z=Math.PI/2;dm.updateMatrix();im3.setMatrixAt(i,dm.matrix)}
  [im,im2,im3].forEach(m=>{m.castShadow=m.receiveShadow=true;cur.add(m)});
  bld(1150,470,1900,600,4.2,{wall:'#cfcabd'});bld(2410,735,2525,780,3.5);bld(2575,715,2725,830,5.5);bld(2585,530,2705,655,4.5);
  [2220,2265,2310,2355,2400].forEach(x=>{const [cx,cz]=M(x,575);cyl(2.2,2.2,4.6,MAT.white,cx,2.3,cz);cyl(2.25,2.25,.15,MAT.galv,cx,4.65,cz)});
  // subestación
  bld(2865,595,3055,668,3.6,{wall:'#ece9e2'});bld(2820,600,2862,640,3,{wall:'#ece9e2'});
  const conc=std({color:'#d7d2c6',roughness:.9}),ins=MAT.brown;
  const insul=(x,y,z,hh=1.1)=>{const pts=[];const k=8;for(let i=0;i<=k;i++){const t=i/k;pts.push(new T.Vector2(i%2?.11:.17,t*hh))}const m=new T.Mesh(new T.LatheGeometry(pts,14),ins);m.position.set(x,y,z);m.castShadow=true;cur.add(m);return m};
  const gantry=(px,py,span=7,hh=9)=>{const [cx,cz]=M(px,py);for(const o2 of[-span/2,span/2])box(.42,hh,.42,conc,cx+o2,hh/2,cz);box(span+.6,.35,.35,MAT.galv,cx,hh-.6,cz);for(let i=-1;i<=1;i++)insul(cx+i*2.1,hh-.42,cz)};
  gantry(2990,745);gantry(3110,745,6);gantry(2930,955,6,8);
  const trafo=(px,py)=>{const [cx,cz]=M(px,py);box(4.4,3.6,3.2,std({color:'#b9c0c6',metalness:.35,roughness:.5}),cx,2.1,cz);for(let i=0;i<9;i++)box(.06,2.8,1.1,MAT.galv,cx-2+i*.5,2,cz+2.1);box(4.6,.3,3.4,MAT.dark,cx,.15,cz);for(let i=-1;i<=1;i++)insul(cx+i*1.2,3.9,cz-.6,1.3)};
  trafo(2945,880);trafo(3065,900);
  const breaker=(px,py)=>{const [cx,cz]=M(px,py);for(const sx of[-.5,.5])box(.12,3.4,.12,MAT.galv,cx+sx,1.7,cz);box(1.4,1.1,.9,std({color:'#b6bcc2',metalness:.4,roughness:.45}),cx,3.9,cz);for(let i=-1;i<=1;i++)insul(cx+i*.45,4.45,cz,.9)};
  breaker(3020,820);breaker(3100,830);breaker(2900,830);
  // malla perimetral subestación
  const fenceTex=ctex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(225,230,235,.9)';g.lineWidth=2;for(let i=-64;i<128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+64,64);g.stroke();g.beginPath();g.moveTo(i+64,0);g.lineTo(i,64);g.stroke()}},1,1,false);
  const fp=[[2820,690],[3205,690],[3205,1010],[2820,1010],[2820,690]];for(let i=0;i<4;i++){const [a,b]=M(...fp[i]),[c2,d2]=M(...fp[i+1]);const len=Math.hypot(c2-a,d2-b);const t=fenceTex.clone();t.needsUpdate=true;t.repeat.set(len/1.2,2);
    const pl=new T.Mesh(new T.PlaneGeometry(len,2.4),std({map:t,transparent:true,alphaTest:.3,side:T.DoubleSide,metalness:.4,roughness:.5}));pl.position.set((a+c2)/2,1.25,(b+d2)/2);pl.rotation.y=-Math.atan2(d2-b,c2-a);cur.add(pl);
    const np=Math.ceil(len/3);for(let k=0;k<=np;k++){box(.08,2.6,.08,MAT.galv,a+(c2-a)*k/np,1.3,b+(d2-b)*k/np)}}
  // oficinas, contenedores, planta de gas
  bld(175,220,280,320,4);bld(255,320,300,380,3);bld(405,240,500,385,3.5);bld(500,225,560,315,4,{wall:'#2f7fc1'});bld(545,270,650,395,3.2);
  bld(700,265,810,345,4,{wall:'#2f7fc1'});bld(440,450,590,570,4);bld(295,535,370,615,3);bld(865,455,960,545,5);bld(845,750,1000,845,6);bld(650,740,790,840,5);
  const contC=['#2f6db0','#c94a3a','#e5e7eb','#2f6db0','#d97706'];for(let i=0;i<5;i++){const [cx,cz]=M(25+i*50,690);box(5.6,2.6,2.44,std({map:corr(contC[i],3,1),roughness:.6,metalness:.25}),cx,1.3,cz)}
  [[985,265,17],[975,410,15]].forEach(([x,y,h])=>{const [cx,cz]=M(x,y);cyl(1.3,1.6,h,std({color:'#8b95a1',metalness:.5,roughness:.45}),cx,h/2,cz,null,20);for(let k=1;k<4;k++){const r=new T.Mesh(new T.TorusGeometry(2.1,.08,6,28),MAT.galv);r.rotation.x=Math.PI/2;r.position.set(cx,h*k/4,cz);cur.add(r)}box(4.6,.15,4.6,MAT.galv,cx,h*.62,cz)});
  {const [hx,hz]=M(642,750);const t=cyl(2.4,2.4,24,MAT.white,hx,2.7,hz,null,24);t.rotation.x=Math.PI/2;for(const o2 of[-9,9])box(1.2,1.4,3.2,conc,hx,.7,hz+o2)}
  const pipe=MAT.yellow;[[880,300,880,520],[880,520,1080,520],[930,300,1060,300]].forEach(([a,b,c2,d2])=>{const [x1,z1]=M(a,b),[x2,z2]=M(c2,d2);tubeAlong([new T.Vector3(x1,1.4,z1),new T.Vector3(x2,1.4,z2)],.42,pipe,null,4)});
  // postes de iluminación (como en las fotos)
  const poleM=std({color:'#d7d3cb',roughness:.85});[[905,330],[600,430],[2745,505],[2700,560],[180,520],[1000,330],[60,470],[3150,640]].forEach(([x,y])=>{const [cx,cz]=M(x,y);cyl(.12,.2,11,poleM,cx,5.5,cz,null,10);box(.9,.18,.4,std({color:'#3a3f45',emissive:'#fff6d8',emissiveIntensity:.25}),cx+.35,11,cz)});
  // vegetación
  const treeM=std({color:'#5f7a3a',roughness:.9,flatShading:true}),trunk=std({color:'#6b4f33'});[[300,300],[180,300],[640,290],[420,420],[650,520],[400,860],[480,890],[600,1050],[740,1100],[2800,520],[3330,560],[150,880]].forEach(([x,y],i)=>{const [cx,cz]=M(x,y);cyl(.15,.2,2,trunk,cx,1,cz,null,6);const s=new T.Mesh(new T.IcosahedronGeometry(2+(i%3)*.6,0),treeM);s.position.set(cx,3.2,cz);s.castShadow=true;cur.add(s)});
  // ---- cajas de control para cámaras de pantalla (2–5)
  o.ctrlBoxes={};
  // ---- cámaras
  o.cams={};CAMS.forEach(c=>addExtCam(o,c));
  // ---- nodos
  Object.entries(NODES).forEach(([k,n])=>{const [x,z]=M(n.x,n.y);const g=grp(x,0,z);const onRoof=k==='DC';const base=onRoof?11.25:0;
    if(k==='SW16'){cyl(.1,.14,4,MAT.galv,0,2,0,g);box(.6,.8,.3,std({color:'#e5e7eb',roughness:.4}),0,2.6,.2,g)}
    else{box(1.1,1.6,.7,std({color:k==='DC'?'#0f2236':'#e8edf2',roughness:.45,metalness:.3}),0,base+.8,0,g);for(let i=0;i<4;i++)box(.8,.05,.01,basic({color:i%2?'#22d3ee':'#1aa3e0'}),0,base+.45+i*.28,.36,g)}
    const l=label(n.short,{color:k==='DC'?'#1aa3e0':'#ffffff',size:1.3,sub:k==='DC'?'NVR 32 canales':k==='S1'?'Switch PoE + SFP':k==='S15'?'Switch PoE + radios PTP':'Gabinete IP66'});l.position.y=base+(k==='SW16'?3.6:2.2);g.add(l);o.layers.lbl.push(l)});
  // ---- enlaces
  const V=(px,py,h)=>{const [x,z]=M(px,py);return new T.Vector3(x,h,z)};
  const tube=(pts,color,r,layer,glow,speed,count)=>{const curve=new T.CatmullRomCurve3(pts,false,'catmullrom',.02);const seg=Math.max(30,pts.length*30);
    const m=new T.Mesh(new T.TubeGeometry(curve,seg,r,8,false),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.55,roughness:.4}));cur.add(m);o.layers[layer].push(m);
    if(glow){const g2=new T.Mesh(new T.TubeGeometry(curve,seg,r*2.8,8,false),basic({color,transparent:true,opacity:.16,depthWrite:false}));cur.add(g2);o.layers[layer].push(g2)}
    for(let i=0;i<count;i++){const p2=new T.Mesh(new T.SphereGeometry(r*2.3,12,10),basic({color:'#ffffff'}));cur.add(p2);o.layers[layer].push(p2);o.pulses.push({p:p2,curve,t:i/count,speed})}};
  FIBER.forEach(f=>tube(f.pts.map(([x,y],i)=>V(x,y,i===f.pts.length-1?11.6:.45)),'#22d3ee',.5,'fo',true,.05,5));
  o.utpTubes={};const mkUtp=c=>{if(c.medium!=='UTP')return;if(o.utpTubes[c.n]){o.utpTubes[c.n].forEach(m=>{cur.remove(m);o.layers.utp=o.layers.utp.filter(x=>x!==m);o.pulses=o.pulses.filter(pp=>pp.p!==m)})}
    const before=o.root.children.length;const r=utpRoute(c);const top=mountH(c);const pts=r.map(([x,y],i)=>V(x,y,i===0?top:(c.node==='DC'?11.3:.3)));if(c.node==='DC'){pts[pts.length-1].y=11.6}else{pts[pts.length-1].y=1}
    tube(pts,'#fb923c',.24,'utp',false,.08,2);o.utpTubes[c.n]=o.root.children.slice(before)};
  o.mkUtp=c=>{const sv=cur;cur=o.root;mkUtp(c);cur=sv};CAMS.forEach(mkUtp);
  tube([V(420,470,2.6),V(467,435,5.5)],'#fb923c',.12,'utp',false,.1,1);
  PTP.forEach(l=>{const a=V(l.a[0],l.a[1],7.6),b=V(l.b[0],l.b[1],7.6);const mid=a.clone().add(b).multiplyScalar(.5);mid.y+=a.distanceTo(b)*.16;const curve=new T.QuadraticBezierCurve3(a,mid,b);
    const ln=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(80)),new T.LineDashedMaterial({color:'#e879f9',dashSize:1.1,gapSize:.8}));ln.computeLineDistances();cur.add(ln);o.layers.ptp.push(ln);
    const gl=new T.Mesh(new T.TubeGeometry(curve,60,.32,8,false),basic({color:'#e879f9',transparent:true,opacity:.2,depthWrite:false}));cur.add(gl);o.layers.ptp.push(gl);
    [[a,b],[b,a]].forEach(([v,w2])=>{cyl(.07,.09,7.6,MAT.galv,v.x,3.8,v.z);const dish=new T.Group();dish.position.copy(v);cur.add(dish);dish.lookAt(w2.x,v.y,w2.z);const d1=new T.Mesh(new T.CylinderGeometry(.28,.22,.12,20),MAT.white);d1.rotation.x=Math.PI/2;d1.castShadow=true;dish.add(d1);o.layers.ptp.push(dish)});
    for(let i=0;i<3;i++){const p2=new T.Mesh(new T.SphereGeometry(.42,12,10),basic({color:'#f5d0fe'}));cur.add(p2);o.layers.ptp.push(p2);o.pulses.push({p:p2,curve,t:i/3,speed:.16})}
    const lb=label('PTP 5 GHz',{color:'#e879f9',size:1.1});lb.position.copy(mid);lb.position.y-=a.distanceTo(b)*.06;cur.add(lb);o.layers.lbl.push(lb)});
  // ---- pines de fotos e interiores
  PHOTOS.forEach(gp=>{const [x,z]=M(gp.x,gp.y);const pin=label('Foto · '+gp.photos.length,{color:'#1aa3e0',light:true,size:1.1});pin.position.set(x,9,z);pin.userData.photo=gp;cur.add(pin);o.pick.push(pin);o.layers.foto.push(pin);
    const st=cyl(.04,.04,9,basic({color:'#1aa3e0'}),x,4.5,z,null,6);st.castShadow=false;o.layers.foto.push(st)});
  [['dc',2352,690,'Interior · Data center','Rack 45U · estado actual y propuesta'],['se',2960,560,'Interior · Sala de control','Cámara 01 · tableros de protección'],['nave',1500,700,'Interior · Nave de motores','Motogeneradores y cámaras']].forEach(([k,px,py,t,sub])=>{const [x,z]=M(px,py);const l=label(t,{color:'#facc15',sub,size:1.3});l.position.set(x,k==='nave'?15:9,z);l.userData.enter=k;cur.add(l);o.pick.push(l)});
  /*HUMO3D*/{const [hx,hz]=M(1925,860);const hl=label('Detección de humo',{color:'#f87171',sub:'3 salas · 6 detectores',size:1.1});hl.position.set(hx,13,hz);cur.add(hl);o.layers.humo.push(hl)}
  o.views={
    general:{p:[-95,70,175],t:[15,0,-5],cap:'Planta KDM Energía · 18 cámaras, 2 troncales de fibra existentes y 3 enlaces PTP',photo:null},
    se:{p:[150,30,75],t:[118,2,22],cap:'Subestación · cámaras 2 a 5 enfocadas a los paneles de control; cámara 6 en el acceso',photo:'fcea5928'},
    nave:{p:[-40,38,72],t:[-6,4,12],cap:'Nave de motores · cámaras 7 a 13 conectadas por UTP al rack del data center',photo:'719b8c58'},
    dc:{p:[110,26,40],t:[78,8,14],cap:'Data center · llegada de las troncales de fibra existentes',photo:'a8f4e373'},
    of:{p:[-120,48,62],t:[-135,2,-22],cap:'Oficinas y acceso · PTZ 14 y 17 y enlaces PTP hacia la sala de la cámara 15',photo:'8dc1e0d9'}
  };
  o.order=['general','se','nave','dc','of'];
  let tt=0;o.tick.push(dt=>{tt+=dt;const k=1+.25*Math.sin(tt*3);o.root.traverse(m=>{if(m.userData.sweep)m.rotation.y+=dt*.7;if(m.userData.pulse)m.scale.setScalar(k)})});
}
function mountH(c){return c.mount.startsWith('Muro nave')?11.9:c.mount.startsWith('Muro')?c.h:c.h}
function addExtCam(o,c){const t=TYPES[c.type];const prev=o.cams[c.n];if(prev){o.root.remove(prev.g);o.layers.fov=o.layers.fov.filter(x=>x!==prev.fov);o.layers.lbl=o.layers.lbl.filter(x=>x!==prev.lbl);o.pick=o.pick.filter(x=>x!==prev.hit)}
  cur=o.root;const [x,z]=M(c.x,c.y);const g=grp(x,0,z);const h=mountH(c);const onWall=c.mount.startsWith('Muro');
  if(!onWall)cyl(.16,.22,h,MAT.galv,0,h/2,0,g,10);else{cyl(.12,.12,1.6,MAT.galv,0,h-.8,0,g,8)}
  cyl(.24,.24,.5,basic({color:t.color}),0,h-.9,0,g,12);
  const a=rad(c.dir),dx=Math.cos(a),dz=Math.sin(a);const sc=5.5;
  const disc=new T.Mesh(new T.CircleGeometry(2.4,32),basic({color:t.color,transparent:true,opacity:.55,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.18;g.add(disc);
  const ringB=new T.Mesh(new T.RingGeometry(2.4,2.9,40),basic({color:'#ffffff',transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}));ringB.rotation.x=-Math.PI/2;ringB.position.y=.2;g.add(ringB);
  const glow=new T.Mesh(new T.SphereGeometry(1.6,20,14),basic({color:t.color,transparent:true,opacity:.28,depthWrite:false}));glow.position.y=h+.2;g.add(glow);glow.userData.pulse=true;
  const m=camModel(c.type,t.color,sc);m.position.set(0,h,0);if(c.type!=='ptz'){aimY(m,dx,dz);m.userData.head.rotation.x=rad(c.n<=5?12:22)}g.add(m);
  let fov;if(t.fov>=360){const ring=new T.Mesh(new T.RingGeometry(c.range*.1,c.range,64),basic({color:t.color,transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.12;fov=new T.Group();fov.add(ring);
      const beam=fovMesh(40,c.range,h,t.color,fov);beam.userData.sweep=true;g.add(fov)}
  else{fov=fovMesh(t.fov,c.range,h,t.color,g);aimY(fov,dx,dz)}
  // panel de control objetivo (cámaras 2–5)
  if(c.n>=2&&c.n<=5){const bx=1.8*dx,bz=1.8*dz;box(.12,1.4,.12,MAT.galv,bx,.7,bz,g);const pb=box(.8,1,.35,std({color:'#c9ced3',metalness:.35,roughness:.45}),bx,1.9,bz,g);aimY(pb,-dx,-dz);
    const sc2=box(.3,.2,.02,std({color:'#0f172a',emissive:'#38bdf8',emissiveIntensity:.8}),bx-dx*.19,2.05,bz-dz*.19,g);aimY(sc2,-dx,-dz)}
  const lbl=label('C'+String(c.n).padStart(2,'0')+' · '+t.abbr,{color:t.color,sub:t.label,size:1.35});lbl.position.y=h+2.6;g.add(lbl);o.layers.lbl.push(lbl);
  const hit=new T.Mesh(new T.CylinderGeometry(3.2,3.2,h+4,10),basic({visible:false}));hit.position.y=(h+4)/2;hit.userData.cam=c.n;g.add(hit);o.pick.push(hit);
  const halo=new T.Mesh(new T.RingGeometry(3.2,4.2,40),basic({color:'#ffffff',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.25;g.add(halo);
  o.layers.fov.push(fov);o.cams[c.n]={g,fov,lbl,hit,halo,c};
  if(LAYERSTATE.fov===false)fov.visible=false;if(LAYERSTATE.lbl===false)lbl.visible=false}
const LAYERSTATE={};

/* ======================= DATA CENTER ======================= */
function buildDC(){const o=newScene('dc',{bgTop:'#0d1a2b',bgBot:'#22344a'});cur=o.root;const w=6.6,d=4.8,h=2.7;
  lightsRoom(o,{w,d,h,count:2,intensity:.5});
  cutawayRoom(o,{w,d,h,floorMat:std({map:tx('wood',()=>ctex(512,512,(g,W2,H2)=>{for(let i=0;i<8;i++){const y=i*H2/8;g.fillStyle=rgb('#b7895a',.82+R()*.26);g.fillRect(0,y,W2,H2/8);for(let k=0;k<30;k++){g.strokeStyle='rgba(70,45,20,.13)';g.beginPath();const yy=y+R()*H2/8;g.moveTo(0,yy);g.bezierCurveTo(W2*.3,yy+R()*5-2,W2*.6,yy+R()*5-2,W2,yy);g.stroke()}g.fillStyle='rgba(60,35,15,.55)';g.fillRect(0,y,W2,1.5);g.fillRect(R()*W2,y,1.5,H2/8)}},3,2)),roughness:.55}),
    wallMat:std({color:'#e2d9c2',roughness:.9}),ceilMat:std({map:tx('tiles',()=>ctex(256,256,(g,W2,H2)=>{speckle(g,W2,H2,'#ecebe5',.07,4000);g.strokeStyle='#b5b1a7';g.lineWidth=5;g.strokeRect(0,0,W2,H2)},6,5)),side:T.FrontSide,roughness:.9}),glassFront:true,windowBack:true});
  // luminarias, escalerilla, ductos flexibles
  for(const lx of[-1.6,1.6]){const l=box(1.2,.04,.6,MAT.lamp,lx,h-.03,.4);l.castShadow=false}
  const trayY=h-.28,trayZ=-1.2;for(const sz of[-.15,.15])box(5.6,.06,.02,MAT.galv,0,trayY,trayZ+sz);for(let i=0;i<28;i++)box(.025,.015,.3,MAT.galv,-2.8+i*.2,trayY-.02,trayZ);
  for(let i=0;i<5;i++)cyl(.008,.008,.28,MAT.galv,-2.6+i*1.3,h-.14,trayZ,null,6);
  box(.9,.3,.22,std({color:'#f4f4f2',roughness:.4}),-w/2+.2,h-.45,.6).rotation.y=Math.PI/2;
  const flexT=tx('flex',()=>ctex(32,64,(g,W2,H2)=>{for(let y=0;y<H2;y++){g.fillStyle=rgb('#a6abb0',.8+.25*Math.sin(y/H2*Math.PI*2*8));g.fillRect(0,y,W2,1)}},1,6));const flexM=std({map:flexT,roughness:.6});
  // monitor y escalera (detalle de la foto)
  box(.5,.32,.04,MAT.black,-2.7,.35,1.4).rotation.y=.6;
  {const lg=grp(-2.9,0,-.2);for(const sx of[-.22,.22]){const r=box(.04,1.7,.06,MAT.alu,sx,.85,0,lg);r.rotation.x=-.18}for(let i=1;i<6;i++)box(.44,.03,.12,MAT.alu,0,i*.28,-.04*i,lg);box(.5,.06,.2,std({color:'#c62828'}),0,1.68,-.3,lg)}
  // racks
  const rW=rack(-1.75,-1.35,{color:'#d9d6cc',open:true,frame:'#d9d6cc'});
  const rA=rack(-.85,-1.35,{color:'#121619',door:true});const rB=rack(.05,-1.35,{color:'#121619',open:true});
  o.whiteRack=rW;
  // equipos rack blanco (estado actual)
  cur=rW;const curEq=[[42,1,'pc'],[41,1,'switchBlue'],[39,1,'patch'],[37,1,'switch'],[34,2,'fiber'],[31,1,'beige'],[29,1,'beige'],[24,2,'server'],[20,2,'server'],[3,3,'ups']];
  curEq.forEach(([u,n,k])=>equip(rW,u,n,k));
  // equipos existentes racks negros
  [[40,1,'patch'],[38,1,'switch'],[36,1,'org'],[34,1,'patch'],[30,2,'server'],[26,2,'server']].forEach(([u,n,k])=>equip(rA,u,n,k));
  [[42,1,'patch'],[40,1,'switch'],[38,1,'switch'],[33,2,'server'],[28,2,'server'],[22,3,'beige'],[3,3,'ups']].forEach(([u,n,k])=>equip(rB,u,n,k));
  cur=o.root;
  // ductos flexibles al rack blanco (actual) y al rack central (propuesta)
  const mkFlex=(x,par)=>{const g=new T.Group();par.add(g);const plate=box(.62,.012,.42,std({color:'#c9c8c2',roughness:.6}),x,2.32,-1.35,g);for(let i=0;i<4;i++){const fx=x-.21+i*.14;const f=cyl(.052,.052,trayY-2.33,flexM,fx,(trayY+2.33)/2,-1.35+(i%2?.07:-.07),g,14);cyl(.065,.065,.04,MAT.alu,fx,2.36,-1.35+(i%2?.07:-.07),g,14)}return g};
  const flexNow=mkFlex(-1.75,o.root),flexNew=mkFlex(-.85,o.root);flexNew.visible=false;
  // cableado desordenado (estado actual)
  const messy=new T.Group();o.root.add(messy);const colors=['#f1f1ef','#f1f1ef','#e2e2df','#f1f1ef','#cfd3d8','#3b82f6','#facc15','#f97316','#ffffff','#9ca3af'];
  for(let i=0;i<70;i++){const col=colors[i%colors.length];const sx=-1.75+(R()-.5)*.36,sz=-1.35+(R()-.5)*.3;const end=R();
    const pts=[new T.Vector3(sx,2.32,sz),new T.Vector3(sx+(R()-.5)*.3,2.0-R()*.2,-.9+R()*.25),new T.Vector3(-1.75+(R()-.5)*.6,1.2+R()*.8,-.78+R()*.3)];
    if(end<.45)pts.push(new T.Vector3(-1.75+(R()-.5)*.4,.8+R()*1.1,-1.0+R()*.05));else if(end<.75){pts.push(new T.Vector3(-1.4+R()*.8,.5+R()*.4,-.5+R()*.4),new T.Vector3(-1.2+R()*1.2,.03,-.4+R()*.6))}else pts.push(new T.Vector3(-1.1+(R()-.5)*.3,1+R(),-1.0));
    tubeAlong(pts,.0045+R()*.003,std({color:col,roughness:.6}),messy,26)}
  for(let k=0;k<6;k++){const cx=-1.0+R()*.7,cz=-.35+R()*.5,col=k%2?'#f97316':'#facc15';const pts=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2*3;pts.push(new T.Vector3(cx+Math.cos(a)*(.18+i*.002),.02+i*.0009,cz+Math.sin(a)*(.14+i*.002)))}tubeAlong(pts,.004,std({color:col}),messy,120)}
  // propuesta: equipos migrados al rack central (resaltados)
  const prop=new T.Group();o.root.add(prop);cur=rA;const propEq=[[24,1,'org'],[23,1,'patch',{hl:true}],[22,1,'org'],[21,1,'patch',{hl:true}],[19,2,'fiber',{hl:true,txt:'CABECERA ÓPTICA'}],[17,1,'poe',{hl:true}],[16,1,'switchBlue'],[15,1,'pc'],[13,2,'nvr',{hl:true}],[26,1,'pc',{hl:true}],[10,2,'server'],[7,2,'server'],[2,3,'ups'],[1,1,'pdu']];
  const propMeshes=propEq.map(([u,n,k,op])=>{const m=equip(rA,u,n,k,op||{});return m});cur=o.root;
  // cordones ordenados
  const neat=new T.Group();rA.add(neat);for(let i=0;i<12;i++){const y=rA.userData.y0+(22+(i%3)-1)*.0445,x=-.2+i*.035;tubeAlong([new T.Vector3(x,y,.33),new T.Vector3(x,y-.05,.37),new T.Vector3(x,y-.1-(i%3)*.04,.36),new T.Vector3(-.26,y-.12,.33)],.003,std({color:i%4===0?'#3b82f6':'#e5e7eb'}),neat,14)}
  const vm=box(.05,1.9,.08,MAT.black,-.29,1.05,.36,rA);
  const ghost=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.6,2.06,.8)),new T.LineDashedMaterial({color:'#94a3b8',dashSize:.06,gapSize:.04}));ghost.position.set(-1.75,1.03,-1.35);ghost.computeLineDistances();o.root.add(ghost);
  const lbGhost=label('Rack 1 retirado',{color:'#94a3b8',size:.85});lbGhost.position.set(-1.75,2.2,-1.35);o.root.add(lbGhost);
  const pl=[['Patch panels Cat6 + organizadores','nuevo',22.5],['Cabecera óptica reubicada','fibra existente',19.5],['Switch PoE 16p + SFP','nuevo',17],['NVR 32 canales · 4 HDD','nuevo',13.5],['Servidores y UPS migrados','desde rack blanco',8],['Central detección de humo Hub 2','nueva · avisa por app y 4G',26]].map(([t,s,u])=>{const l=label(t,{color:'#22d3ee',sub:s,size:.78});l.center.set(0,.5);l.position.set(-.85+.42,rA.userData.y0+u*.0445,-1.35+.42);o.root.add(l);return l});
  const lbNow=[['Rack 1 · blanco 45U','se retira',-1.75],['Rack 2 · negro','recibe todo el rack 1',-.85],['Rack 3 · negro','se mantiene',.05]].map(([t,s,x])=>{const l=label(t,{color:x<-1?'#f59e0b':'#1aa3e0',sub:s,size:.85});l.position.set(x,2.5,-1.35);o.root.add(l);return l});
  const lbFinal=[['Rack 2','consolidado',-.85],['Rack 3','sin cambios',.05]].map(([t,sub,x])=>{const l=label(t,{color:'#22c55e',sub,size:.85});l.position.set(x,2.5,-1.35);o.root.add(l);return l});
  o.setState=st=>{const prop2=st==='propuesta';lbFinal.forEach(l=>l.visible=prop2);rW.visible=!prop2;messy.visible=!prop2;flexNow.visible=!prop2;flexNew.visible=prop2;propMeshes.forEach(m=>m.visible=prop2);neat.visible=prop2;vm.visible=prop2;ghost.visible=prop2;lbGhost.visible=prop2;pl.forEach(l=>l.visible=prop2);lbNow.forEach(l=>l.visible=!prop2);
    rA.children.filter(c2=>c2.material===MAT.glass).forEach(c2=>c2.visible=!prop2)};
  o.views={
    overview:{p:[3.6,4.2,5.6],t:[-.4,1,-.8],cap:'Data center · tres racks: el blanco (a retirar), el negro central (destino) y el negro derecho',photo:'a8f4e373'},
    front:{p:[-.9,1.5,2.2],t:[-1.25,1.15,-1.2],cap:'Rack blanco 45U · cabecera óptica, servidores y cableado sin ordenar',photo:'46e9bfa1'},
    top:{p:[-1.0,2.55,.4],t:[-1.6,2.2,-1.3],cap:'Llegada de ductos y bandeja sobre el rack blanco',photo:'6ca4c9eb'},
    prop:{p:[.4,1.45,1.9],t:[-.85,1.0,-1.35],cap:'Propuesta NWS · todo el contenido del rack blanco pasa al segundo rack; quedan solo 2 racks',photo:null}
  };o.order=['overview','front','top'];o.setState('actual')}

/* ======================= SALA DE CONTROL S/E ======================= */
function relayFace(kind){return tx('relay:'+kind,()=>ctex(512,256,(g,w,h)=>{g.fillStyle='#2b2f34';g.fillRect(0,0,w,h);g.fillStyle='#3a3f45';rrect(g,6,6,w-12,h-12,18);g.fill();
  if(kind==='c90'){g.fillStyle='#ececec';g.fillRect(40,60,140,110);g.fillStyle='#333';g.font='9px monospace';for(let i=0;i<9;i++)g.fillText('TRIP L90 87L  Z'+i,46,75+i*11);g.fillStyle='#f6c7c7';g.fillRect(230,40,170,130);g.fillStyle='#d32f2f';g.fillRect(270,60,30,30);g.fillRect(270,110,30,30);g.strokeStyle='#333';g.beginPath();g.moveTo(285,90);g.lineTo(285,110);g.moveTo(285,140);g.lineTo(285,165);g.stroke();
    for(let i=0;i<5;i++){g.fillStyle='#585e66';rrect(g,190,40+i*26,26,18,4);g.fill();rrect(g,412,40+i*26,26,18,4);g.fill()}g.fillStyle='#e5e7eb';g.font='bold 14px sans-serif';g.fillText('C90 Plus',40,215)}
  else if(kind==='meter'){g.fillStyle='#111';g.fillRect(0,0,w,h);g.fillStyle='#9be7ff';g.fillRect(140,50,230,120);g.fillStyle='#0b3a4a';g.font='bold 36px monospace';g.fillText('23.1 kV',160,125)}
  else{g.fillStyle='#1d2126';g.fillRect(40,40,250,170);for(let r=0;r<12;r++)for(let c=0;c<4;c++){g.fillStyle=(r+c)%7===0?'#ef4444':(r*c)%5===1?'#22c55e':'#4b5563';g.fillRect(50+c*60,48+r*13,8,6);g.fillStyle='#9ca3af';g.fillRect(62+c*60,49+r*13,36,3)}
    g.fillStyle='#111827';g.fillRect(320,40,150,60);g.fillStyle='#93c5fd';g.font='12px monospace';g.fillText(kind.toUpperCase()+' OK',335,74);for(let i=0;i<12;i++){g.fillStyle=['#38bdf8','#2563eb','#6b7280'][i%3];rrect(g,320+(i%4)*38,115+Math.floor(i/4)*30,28,20,5);g.fill()}g.fillStyle='#e5e7eb';g.font='bold 14px sans-serif';g.fillText(kind==='t60'?'T60':kind==='l90'?'L90':'D60',40,232)}
}))}
function textPlate(lines,{w=512,h=128,bg='#f4f4f2',fg='#1f2937',size=30}={}){return tx('tp:'+lines.join('|'),()=>ctex(w,h,(g,W2,H2)=>{g.fillStyle=bg;g.fillRect(0,0,W2,H2);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font=`700 ${size}px Montserrat, sans-serif`;lines.forEach((l,i)=>g.fillText(l,W2/2,H2/(lines.length+1)*(i+1)))}))}
function buildSE(){const o=newScene('se',{bgTop:'#0d1a2b',bgBot:'#22344a'});cur=o.root;const w=8.4,d=5.2,h=3;
  lightsRoom(o,{w,d,h,count:3,intensity:.42});
  cutawayRoom(o,{w,d,h,floorMat:std({map:tx('fgrey',()=>ctex(512,512,(g,W2,H2)=>{speckle(g,W2,H2,'#9da3a4',.12,16000)},2,2)),roughness:.75}),wallMat:std({color:'#dedbd2',roughness:.9}),ceilMat:std({color:'#f4f4f2',side:T.FrontSide}),windowBack:false});
  // tapas de canaleta en el piso
  const plateM=std({color:'#9aa3aa',metalness:.6,roughness:.5});for(let i=0;i<6;i++)for(let j=0;j<2;j++)box(.55,.012,.9,plateM,-3.6+i*.62,.02,-.2+j*1.0);
  for(let i=0;i<3;i++){const l=box(1.3,.06,.18,MAT.lamp,-2.6+i*2.6,h-.05,.6);l.castShadow=false}
  for(const px of[-3.9,3.9])cyl(.025,.025,h,std({color:'#c7cbd0'}),px,h/2,-2.45,null,8);tubeAlong([new T.Vector3(-4,h-.1,-2.4),new T.Vector3(4,h-.1,-2.4)],.025,std({color:'#c7cbd0'}),null,4);
  // tableros grises izquierda
  const tg=std({color:'#d5d8d6',roughness:.55,metalness:.2});[[-3.55,.9],[-2.75,1.2]].forEach(([x,ww])=>{box(ww,1.9,.45,tg,x,1.15+(ww>1?0:-.05),-2.3);for(let i=0;i<4;i++)box(.06,.06,.02,basic({color:i%2?'#ef4444':'#22c55e'}),x-ww/2+.2+i*.12,1.9,-2.07);box(.18,.6,.4,tg,x,.3,-2.3)});
  // armarios de protección
  const cab=(x,title,items)=>{const g=grp(x,0,-2.05);const wm=std({color:'#f6f6f4',roughness:.4,metalness:.1});
    box(.8,2.25,.6,wm,0,1.125,0,g);box(.82,.08,.62,wm,0,2.29,0,g);
    const hdr=box(.68,.2,.01,std({map:textPlate(title,{size:24})}),0,2.05,.305,g);
    items.forEach(([k,y,hh,lab])=>{const face=k==='blank'?std({color:'#e6e6e3'}):std({map:relayFace(k),roughness:.4,emissive:'#ffffff',emissiveMap:relayFace(k),emissiveIntensity:.18});
      box(.66,hh,.05,face,0,y,.3,g);if(lab)box(.6,.05,.005,std({map:textPlate([lab],{h:64,size:28})}),0,y-hh/2-.04,.302,g)});
    const gl=box(.78,2.2,.01,MAT.glass,0,1.12,.33,g);gl.castShadow=false;box(.02,.2,.03,MAT.alu,.37,1.2,.34,g);return g};
  const ht1=cab(-.45,['S/E LOMAS LOS COLORADOS','ARMARIO DE CONTROL Y PROTECCIÓN','PAÑO HT1'],[['c90',1.72,.34,'CONTROLADOR GE-C90 (AB)'],['t60',1.25,.34,'PROTECCIÓN GE-T60 87-T1 (AC)'],['blank',.75,.4],['blank',.32,.3]]);
  const hl=cab(.37,['S/E LOMAS LOS COLORADOS','ARMARIO DE CONTROL Y PROTECCIÓN','PAÑO HL'],[['l90',1.72,.3,'PROTECCIÓN GE-L90 87-L (AC)'],['d60',1.3,.3,'PROTECCIÓN GE-D60 21-21N (AD)'],['meter',.92,.22,'MEDIDOR'],['blank',.45,.35,'BLOCKS DE PRUEBA']]);
  const com=cab(1.19,['ARMARIO','COMUNICACIONES','—'],[['blank',1.85,.12,'GPS 1094B'],['blank',1.6,.18,'HMI'],['blank',1.38,.1,'(GW #1)'],['blank',.9,.5,'CABECERA ÓPTICA']]);
  {const cg=new T.Group();com.add(cg);for(let k=0;k<5;k++){const pts=[];for(let i=0;i<=30;i++){const a=i/30*Math.PI*2*2;pts.push(new T.Vector3(-.15+k*.07+Math.cos(a)*.08,.55+Math.sin(a)*.08-i*.003,.33))}tubeAlong(pts,.003,std({color:'#facc15'}),cg,80)}}
  // mobiliario (foto)
  {const ch=grp(2.9,0,.2);box(.45,.06,.45,MAT.black,0,.48,0,ch);box(.45,.5,.06,MAT.black,0,.78,-.22,ch);cyl(.025,.025,.45,MAT.steel,0,.24,0,ch,8)}
  box(.8,.45,.5,std({color:'#b08b5e',roughness:.8}),3.6,.23,-.9);box(.5,.35,.35,std({color:'#f2f2f0'}),3.6,.62,-.9);
  box(1.0,.3,.22,std({color:'#f4f4f2',roughness:.4}),-w/2+.15,2.4,-.4).rotation.y=Math.PI/2;
  // cámara 01 (varifocal) enfocando la pantalla del C90
  const c1=CAMS.find(c=>c.n===1),t1=TYPES[c1.type];const lens=new T.Vector3(-.45,2.15,-.25);
  cyl(.03,.03,h-2.25,MAT.galv,lens.x,(h+2.25)/2,lens.z,null,8);
  const cm=camModel('vf',t1.color,1.15);cm.position.copy(lens);cm.position.y-=.02;o.root.add(cm);const scr=new T.Vector3(-.45,1.72,-1.75+.0);
  aimY(cm,0,-1);cm.userData.head.rotation.x=Math.atan2(lens.y-scr.y,lens.z-scr.z);
  const corners=[[-.33,1.86],[.33,1.86],[.33,1.58],[-.33,1.58]].map(([dx,y])=>new T.Vector3(-.45+dx,y,-1.74));
  const fr=frustumTo(new T.Vector3(lens.x,lens.y-.05,lens.z-.35),corners,t1.color,o.root);o.layers.fov.push(...fr);
  const l1=label('C01 · Varifocal 4MP',{color:t1.color,sub:'Enfoca el controlador GE-C90 · ≈1,5 m',size:.9});l1.position.set(lens.x,lens.y+.35,lens.z);o.root.add(l1);o.layers.lbl.push(l1);
  const hit=new T.Mesh(new T.SphereGeometry(.25,8,6),basic({visible:false}));hit.position.copy(lens);hit.userData.cam=1;o.root.add(hit);o.pick.push(hit);
  const lbC=[['Paño HT1','C90 · T60',-.45],['Paño HL','L90 · D60 · medidor',.37],['Comunicaciones','GPS · HMI · cabecera óptica',1.19]].map(([t,s,x])=>{const l=label(t,{color:'#ffffff',sub:s,size:.8});l.position.set(x,2.55,-2.05);o.root.add(l);o.layers.lbl.push(l);return l});
  // switch NWS propuesto en sala C1
  {const g=grp(2.2,0,-2.35);box(.6,.6,.35,std({color:'#e8edf2',roughness:.4,metalness:.2}),0,1.7,0,g);box(.5,.08,.02,std({map:plate('poe',2)}),0,1.72,.18,g);const l=label('Gabinete 6U NWS',{color:'#1aa3e0',sub:'Switch PoE + SFP · UPS',size:.8});l.position.set(0,2.1,0);g.add(l);o.layers.lbl.push(l)}
  /*HUMOSE*/{const HR='#ef4444',rs=[];let tq=0;[-1.3,1.3].forEach((dx,j)=>{cyl(.13,.14,.06,MAT.white,dx,h-.03,-.6,null,20);const led=new T.Mesh(new T.SphereGeometry(.03,8,6),basic({color:HR}));led.position.set(dx,h-.07,-.6);cur.add(led);
      const r=new T.Mesh(new T.RingGeometry(.2,.27,32),basic({color:HR,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));r.rotation.x=-Math.PI/2;r.position.set(dx,h-.08,-.6);r.userData.ph=j*.5;cur.add(r);rs.push(r);o.layers.humo.push(r)});
    box(.18,.18,.08,std({color:HR,emissive:HR,emissiveIntensity:.5}),3.9,2.4,-2.5);
    const lh=label('Detección de humo · sala de control',{color:'#f87171',sub:'2 detectores + sirena · foto 01',size:.62});lh.position.set(0,h+.35,-.6);cur.add(lh);o.layers.humo.push(lh);
    o.tick.push(dt=>{tq+=dt;rs.forEach(r=>{const k=(tq*.8+r.userData.ph)%1;r.scale.setScalar(1+k*1.8);r.material.opacity=.7*(1-k)})})}
  o.views={
    overview:{p:[3.4,3.6,4.8],t:[0,1.2,-1.4],cap:'Sala de control de la subestación · armarios Paño HT1, Paño HL y comunicaciones',photo:'bb4ef8f8'},
    c01:{p:[.6,1.9,.9],t:[-.45,1.65,-1.7],cap:'Cámara 01 · varifocal a ≈1,5 m del controlador GE-C90, IR desactivado por reflejo del vidrio',photo:'dc5758b0'},
    com:{p:[1.9,1.5,.2],t:[1.19,1.1,-2.0],cap:'Armario de comunicaciones · cabecera óptica con fibra existente al data center',photo:'095612c3'},
    humo:{p:[2.6,2.1,2.4],t:[0,2.8,-.6],cap:'Sala de control S/E · 2 detectores de humo y sirena; enlace por radio con la central Hub 2 del data center',photo:'bb4ef8f8'}
  };o.order=['overview','c01','com','humo']}

/* ======================= NAVE DE MOTORES ======================= */
function buildNave(){const o=newScene('nave',{bgTop:'#0d1a2b',bgBot:'#22344a'});cur=o.root;const w=40,d=18,h=9;
  o.scene.add(new T.HemisphereLight('#ffffff','#6b6f74',.7));const dl=new T.DirectionalLight('#ffffff',.6);dl.position.set(-20,40,25);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-.0005;Object.assign(dl.shadow.camera,{left:-30,right:30,top:20,bottom:-20,near:1,far:120});o.scene.add(dl);
  for(let i=0;i<4;i++){const p=new T.PointLight('#fff6e6',.35,30,1.5);p.position.set(-15+i*10,h-1,0);o.scene.add(p)}
  cutawayRoom(o,{w,d,h,floorMat:std({map:tx('fnave',()=>ctex(512,512,(g,W2,H2)=>{speckle(g,W2,H2,'#d6d6d0',.08,20000);for(let i=0;i<30;i++){g.fillStyle='rgba(140,110,90,.08)';g.beginPath();g.arc(R()*W2,R()*H2,10+R()*30,0,7);g.fill()}},6,3)),roughness:.6,metalness:.05}),
    wallMat:std({map:corr('#d8d1bd',10,1),roughness:.7,metalness:.1}),ceilMat:std({color:'#e8e8e6',side:T.FrontSide})});
  // cerchas y lucarnas
  for(let x=-18;x<=18;x+=6){box(.25,.5,d,MAT.steel,x,h-.25,0);for(let z=-8;z<=8;z+=2)box(.08,.08,.08,MAT.steel,x,h-.6,z)}
  for(let x=-15;x<=15;x+=6){const s=box(2.2,.04,d-1,basic({color:'#f7fbff'}),x,h-.04,0);s.castShadow=false}
  for(let x=-16;x<=16;x+=8)for(const z of[-4,4]){cyl(.25,.35,.3,std({color:'#555',emissive:'#fff2cc',emissiveIntensity:.6}),x,h-1.4,z,null,14);cyl(.01,.01,1,MAT.steel,x,h-.8,z,null,4)}
  // ductos laterales
  tubeAlong([new T.Vector3(-19,6.8,-8.3),new T.Vector3(19,6.8,-8.3)],.6,MAT.galv,null,6);
  // tapas de canaleta
  for(let x=-19;x<19;x+=1.3)box(1.2,.015,.7,std({color:'#a9afb4',metalness:.5,roughness:.5}),x+.6,.02,1.5);
  // motogeneradores
  const genset=(x)=>{const g=grp(x,0,-3.6);box(6.6,.35,2.3,MAT.dark,0,.175,0,g);
    box(3.8,1.5,1.5,MAT.green,-.9,1.1,0,g);for(let i=0;i<10;i++)box(.28,.22,.42,MAT.greenDark,-2.55+i*.37,1.96,i%2?.35:-.35,g);
    const gen=cyl(.95,.95,1.9,MAT.green,2.1,1.25,0,g,24);gen.rotation.z=Math.PI/2;box(.3,1.2,1.6,MAT.greenDark,1.1,1.0,0,g);
    cyl(.32,.32,h-2.2,std({color:'#cfd3d6',metalness:.6,roughness:.35}),-1.2,2.2+(h-2.2)/2,-.4,g,16);cyl(.35,.35,.6,MAT.steel,-1.2,2.4,-.4,g,16);
    box(1.0,2.1,.6,MAT.white,3.9,1.05,1.0,g);box(.3,.2,.02,std({color:'#facc15'}),3.9,1.6,1.31,g);tubeAlong([new T.Vector3(3.6,.4,.8),new T.Vector3(3.2,.1,.6),new T.Vector3(2.6,.4,.4)],.08,std({color:'#7c4a2a'}),g,8)};
  for(let i=0;i<5;i++)genset(-16+i*8);
  // cámaras de nave (ubicación referencial en muro frontal)
  const navCams=[[8,14],[9,8],[10,2],[11,-6],[12,-12],[13,-17]];
  navCams.forEach(([n,x])=>{const c=CAMS.find(c=>c.n===n),t=TYPES[c.type];const g=grp(x,0,d/2-.15);box(.3,.3,.1,MAT.galv,0,6,0,g);const m=camModel(c.type,t.color,1.8);m.position.set(0,6,-.25);aimY(m,0,-1);m.userData.head.rotation.x=rad(26);g.add(m);
    const f=fovMesh(t.fov>=180?160:t.fov,t.fov>=180?11:13,6,t.color,g);f.rotation.y=Math.PI;f.position.z=-.2;o.layers.fov.push(f);
    const l=label('C'+String(n).padStart(2,'0')+' · '+t.abbr,{color:t.color,sub:t.label,size:.8});l.position.set(0,7.1,-.2);g.add(l);o.layers.lbl.push(l);
    const hit=new T.Mesh(new T.SphereGeometry(.6,8,6),basic({visible:false}));hit.position.set(0,6,-.3);hit.userData.cam=n;g.add(hit);o.pick.push(hit)});
  // salas eléctricas con detección de humo (fotos 13 y 14) · ubicación referencial
  const HRED='#ef4444',rings=[];const salaH=3.2;let tH=0;
  [[-16.2,'Sala eléctrica 1','foto 13 · tableros y escalerilla'],[-9.4,'Sala eléctrica 2','foto 14 · tableros de distribución']].forEach(([cx,t,s2])=>{
    const g=grp(cx,0,6);const sw=6.2,sd=5;const wm=std({color:'#fde2e2',transparent:true,opacity:.55,roughness:.8,depthWrite:false});
    box(sw,salaH,.12,wm,0,salaH/2,-sd/2,g);box(.12,salaH,sd,wm,-sw/2,salaH/2,0,g);box(.12,salaH,sd,wm,sw/2,salaH/2,0,g);
    const fr=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(sw,salaH,sd)),new T.LineBasicMaterial({color:'#ef4444'}));fr.position.y=salaH/2;g.add(fr);
    const slab=new T.Mesh(new T.PlaneGeometry(sw,sd),std({color:'#f1f1ef',transparent:true,opacity:.25,side:T.DoubleSide,depthWrite:false}));slab.rotation.x=-Math.PI/2;slab.position.y=salaH;g.add(slab);
    for(let i=0;i<5;i++)box(1.0,2.1,.6,std({color:'#cfd3cc',roughness:.6}),-2.4+i*1.05,1.05,-1.9,g);
    [-1.4,1.6].forEach((dx,j)=>{cyl(.26,.28,.1,MAT.white,dx,salaH-.05,0,g,20);const led=new T.Mesh(new T.SphereGeometry(.045,8,6),basic({color:HRED}));led.position.set(dx,salaH-.1,0);g.add(led);
      const ring=new T.Mesh(new T.RingGeometry(.38,.5,32),basic({color:HRED,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(dx,salaH-.13,0);ring.userData.ph=j*.5;g.add(ring);rings.push(ring);o.layers.humo.push(ring)});
    box(.25,.25,.12,std({color:HRED,emissive:HRED,emissiveIntensity:.5}),sw/2-.35,2.6,-sd/2+.1,g);
    const l=label(t+' · detección de humo',{color:'#f87171',sub:s2+' · 2 detectores + sirena',size:.8});l.position.set(0,salaH+1,0);g.add(l);o.layers.humo.push(l)});
  o.tick.push(dt=>{tH+=dt;rings.forEach(r=>{const k=(tH*.8+r.userData.ph)%1;r.scale.setScalar(1+k*2.2);r.material.opacity=.7*(1-k)})});
  const note=label('Ubicación de cámaras referencial',{color:'#facc15',sub:'se confirma en la visita de instalación',size:.8});note.position.set(0,h+.6,d/2);o.root.add(note);
  o.views={
    overview:{p:[26,22,30],t:[0,2,0],cap:'Nave de motores · cinco motogeneradores y cobertura propuesta desde el muro',photo:'34de1432'},
    floor:{p:[-17,2.2,6.5],t:[8,2,-2],cap:'Pasillo de la nave · panorámicas 180° cubren el largo del pasillo',photo:'1bc37bf3'},
    gens:{p:[6,4,4],t:[-2,1.5,-3.5],cap:'Motogeneradores · cada uno con su tablero de control',photo:'719b8c58'},
    humo:{p:[-5,9,19],t:[-12.8,1.4,5.5],cap:'Salas eléctricas · 2 detectores de humo y sirena por sala (6 en total con la sala de control S/E); la central Hub 2 avisa por app y 4G',photo:'e6605971'}
  };o.order=['overview','floor','gens','humo']}

/* ---------- control de escenas, vistas y recorrido ---------- */
const BUILD={ext:buildExterior,dc:buildDC,se:buildSE,nave:buildNave};
const SCENE_NAME={ext:'Exterior',dc:'Data center',se:'Sala de control S/E',nave:'Nave de motores'};
const VIEW_NAME={general:'General',se:'Subestación',nave:'Nave',dc:'Data center',of:'Oficinas',overview:'General',front:'Rack blanco',top:'Ductos',prop:'Propuesta',c01:'Cámara 01',com:'Comunicaciones',floor:'Pasillo',gens:'Motores',humo:'Detección de humo'};
function ensure(k){if(!SC[k]){const s=cur;BUILD[k]();cur=s;const o=SC[k];o.ceilItems=[];o.root.traverse(m=>{if(m.material===MAT.lamp)o.ceilItems.push(m)});applyLayers(o)}return SC[k]}
let tw=null,curView=null,dcState='actual';
const fade=$('#fade3d');
function setScene(k,view,instant){const o=ensure(k);const change=active!==o;
  const go=()=>{active=o;if(k!=='ext')$('#load3d').hidden=true;else if(o.satReady)$('#load3d').hidden=true;ctl.maxPolarAngle=k==='ext'?Math.PI*.47:Math.PI*.49;ctl.minDistance=k==='ext'?10:.6;ctl.maxDistance=k==='ext'?600:k==='nave'?90:14;
    renderViewsBar();document.querySelectorAll('#scenes [data-scene]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scene===k));
    $('#dcstate').hidden=k!=='dc';goView(view||o.order[0],change||instant)};
  if(change&&!instant&&!REDUCED){fade.classList.add('on');setTimeout(()=>{go();setTimeout(()=>fade.classList.remove('on'),60)},280)}else go()}
function goView(v,jump){const o=active,vw=o.views[v];if(!vw)return;curView=v;const p1=new T.Vector3(...vw.p),t1=new T.Vector3(...vw.t);
  if(jump||REDUCED){cam.position.copy(p1);ctl.target.copy(t1);tw=null}else tw={t:0,dur:2.4,p0:cam.position.clone(),t0:ctl.target.clone(),p1,t1};
  const cap=$('#cap3d');cap.textContent=vw.cap;setInset(vw.photo);document.querySelectorAll('#views [data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v))}
function setInset(id){const f=$('#inset');if(!id){f.hidden=true;return}const p=ALLPH.find(p=>p.src.indexOf(id)>=0);if(!p){f.hidden=true;return}f.hidden=false;f.querySelector('img').src=p.thumb;f.querySelector('img').alt=p.cap;f.querySelector('figcaption').textContent='Foto del levantamiento · '+p.cap;f.dataset.src=p.src}
$('#inset').addEventListener('click',()=>{const s=$('#inset').dataset.src;const i=ALLPH.findIndex(p=>p.src===s);if(i>=0)D.openLB(i)});
function renderViewsBar(){const o=active;$('#views').innerHTML=Object.keys(o.views).map(v=>`<button class="btn" data-view="${v}" aria-pressed="false">${VIEW_NAME[v]||v}</button>`).join('')}
$('#views').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;setTour(false);if(active.key==='dc'&&b.dataset.view==='prop')setDC('propuesta');goView(b.dataset.view)});
$('#scenes').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(!b)return;setTour(false);setScene(b.dataset.scene)});
function setDC(st){dcState=st;ensure('dc').setState(st);document.querySelectorAll('#dcstate [data-st]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.st===st))}
$('#dcstate').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;setTour(false);setDC(b.dataset.st);if(b.dataset.st==='propuesta')goView('prop');else goView('front')});
const TOUR=[['ext','general'],['ext','se'],['se','overview'],['se','c01'],['se','humo'],['ext','nave'],['nave','overview'],['nave','floor'],['nave','humo'],['ext','dc'],['dc','overview','actual'],['dc','front','actual'],['dc','prop','propuesta'],['ext','of']];
let touring=!REDUCED,ti=0,hold=0;const tb=$('#b-tour');
function setTour(on){touring=on;tb.classList.toggle('on',on);tb.textContent=on?'Detener recorrido':'Recorrido animado';hold=0}
tb.onclick=()=>{if(!touring){ti=-1;hold=99}setTour(!touring)};
function tourStep(){ti=(ti+1)%TOUR.length;const [s,v,st]=TOUR[ti];if(st)setDC(st);if(!active||active.key!==s)setScene(s,v);else goView(v)}
ctl.addEventListener('start',()=>{if(touring)setTour(false);tw=null});

/* ---------- capas ---------- */
function applyLayers(o){Object.entries(LAYERSTATE).forEach(([k,on])=>(o.layers[k]||[]).forEach(m=>m.visible=on))}
window.__layer3d=(k,on)=>{LAYERSTATE[k]=on;Object.values(SC).forEach(o=>(o.layers[k]||[]).forEach(m=>m.visible=on))};
['fov','utp','fo','ptp','foto','lbl'].forEach(k=>{const el=document.getElementById('L-'+k);if(el&&!el.checked)LAYERSTATE[k]=false});

/* ---------- selección y edición ---------- */
window.__sel3d=(n,from3d)=>{if(EXT)Object.values(EXT.cams).forEach(o2=>o2.halo.material.opacity=o2.c.n===n?.9:0);
  if(from3d||$('#p-3d').hidden)return;const c=CAMS.find(c=>c.n===n);setTour(false);
  if(active!==EXT)setScene('ext',null,true);const g=EXT.cams[n].g.position;tw={t:0,dur:1.8,p0:cam.position.clone(),t0:ctl.target.clone(),p1:new T.Vector3(g.x+16,mountH(c)+12,g.z+22),t1:new T.Vector3(g.x,mountH(c)*.5,g.z)};
  $('#cap3d').textContent='Cámara '+String(n).padStart(2,'0')+' · '+TYPES[c.type].label+' · '+c.sector;setInset((c.photos||[])[0]||null)};
window.__cam3d=c=>{if(!EXT)return;addExtCam(EXT,c);if(EXT.mkUtp)EXT.mkUtp(c)};

/* ---------- interacción ---------- */
const ray=new T.Raycaster(),mouse=new T.Vector2();let down=null;
canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
const hitTest=e=>{const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,cam);return ray.intersectObjects(active.pick.filter(x=>x.visible!==false&&(!x.parent||x.parent.visible!==false)),false)[0]};
canvas.addEventListener('pointermove',e=>{if(!active||e.buttons)return;canvas.style.cursor=hitTest(e)?'pointer':''});
canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5||!active)return;const h=hitTest(e);if(!h)return;const u=h.object.userData;
  if(u.photo){const i=ALLPH.findIndex(p=>p.src===u.photo.photos[0].src);D.openLB(i);return}
  if(u.enter){setTour(false);setScene(u.enter);return}
  if(u.cam){D.selectCam(u.cam,true)}});

/* ---------- bucle ---------- */
let running=true,last=performance.now(),err=false;
window.__run3d=on=>{const was=running;running=on;if(on&&!was){last=performance.now();requestAnimationFrame(loop)}};
function resize(){const r=stage.getBoundingClientRect();if(r.width<2)return;renderer.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage);resize();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const tmp=new T.Vector3();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(tw){tw.t+=dt/tw.dur;const k=ease(Math.min(1,tw.t));cam.position.lerpVectors(tw.p0,tw.p1,k);ctl.target.lerpVectors(tw.t0,tw.t1,k);if(tw.t>=1)tw=null}
  else if(touring){hold+=dt;if(hold>3.6){hold=0;tourStep()}}
  if(!REDUCED){active.pulses.forEach(p=>{p.t=(p.t+p.speed*dt)%1;p.p.position.copy(p.curve.getPointAt(p.t))});active.tick.forEach(f=>f(dt))}
  // corte tipo maqueta: oculta muros entre la cámara y el recinto
  if(active.walls.length){tmp.copy(cam.position).sub(ctl.target);tmp.y=0;tmp.normalize();active.walls.forEach(wl=>{wl.g.visible=wl.n.dot(tmp)>-.2});if(active.ceil){const v=cam.position.y<active.ceil.position.y;active.ceil.visible=v;(active.ceilItems||[]).forEach(m=>m.visible=v)}}
  ctl.update();renderer.render(active.scene,cam)}
function loop(now){if(!running)return;try{frame(now)}catch(e){if(!err){err=true;const l=$('#load3d');l.hidden=false;l.textContent='Error 3D: '+(e&&e.message||e)}}requestAnimationFrame(loop)}
// arranque
const hs=(location.hash.match(/vista-3d-(ext|se|nave|dc)/)||[])[1];if(hs){touring=false;setScene(hs,null,true)}else{setScene('ext','general',true);cam.position.set(-200,280,380);goView('general')}setTour(touring);
requestAnimationFrame(loop);
}
window.NWS3D={init};
})();
