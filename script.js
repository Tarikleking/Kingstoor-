document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));
const apk=document.getElementById('apk');if(apk){apk.addEventListener('click',e=>{e.preventDefault();fetch('download/app.apk',{method:'HEAD'}).then(r=>{if(r.ok)location.href='download/app.apk';else throw 0}).catch(()=>alert('ضع ملف التطبيق الحقيقي باسم app.apk داخل مجلد download ثم أعد النشر على Vercel.'))})}

// Continuous, seamless screenshot marquee. Works independently of browser reduced-motion settings.
const gallery=document.querySelector('.screens');
const track=document.querySelector('.screens-track');
const firstSet=track?.querySelector('.screen-set');
if(gallery && track && firstSet){
  let offset=0, last=performance.now(), paused=false, dragging=false, startX=0, startOffset=0, loopWidth=0;
  const speed=42; // pixels per second
  const measure=()=>{ loopWidth=firstSet.getBoundingClientRect().width; };
  const normalize=()=>{ if(loopWidth>0){ while(offset<=-loopWidth) offset+=loopWidth; while(offset>0) offset-=loopWidth; } };
  const render=()=>{ normalize(); track.style.transform=`translate3d(${offset}px,0,0)`; };
  const tick=(now)=>{
    const dt=Math.min(50, now-last); last=now;
    if(!paused && !dragging){ offset -= speed*(dt/1000); render(); }
    requestAnimationFrame(tick);
  };
  measure();
  window.addEventListener('resize',measure);
  gallery.addEventListener('pointerdown',e=>{
    dragging=true; paused=true; startX=e.clientX; startOffset=offset;
    gallery.classList.add('dragging'); gallery.setPointerCapture?.(e.pointerId);
  });
  gallery.addEventListener('pointermove',e=>{if(dragging){offset=startOffset+(e.clientX-startX);render();}});
  const release=()=>{if(dragging){dragging=false;gallery.classList.remove('dragging');setTimeout(()=>paused=false,500);}};
  gallery.addEventListener('pointerup',release); gallery.addEventListener('pointercancel',release);
  gallery.addEventListener('mouseenter',()=>paused=true);
  gallery.addEventListener('mouseleave',()=>{if(!dragging)paused=false});
  requestAnimationFrame(tick);
}


// Services cinematic rotation: one card enters, grows, then exits before the next appears.
const serviceCards=[...document.querySelectorAll('.serviceVisual')];
if(serviceCards.length){
  let active=0;
  const showService=()=>{
    serviceCards.forEach((card,i)=>card.classList.toggle('serviceActive',i===active));
    active=(active+1)%serviceCards.length;
  };
  showService();
  setInterval(showService,1800);
}
