document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));
const apk=document.getElementById('apk');if(apk){apk.addEventListener('click',e=>{e.preventDefault();fetch('download/app.apk',{method:'HEAD'}).then(r=>{if(r.ok)location.href='download/app.apk';else throw 0}).catch(()=>alert('ضع ملف التطبيق الحقيقي باسم app.apk داخل مجلد download ثم أعد النشر على Vercel.'))})}

// Continuous automatic screenshot marquee. It pauses while the user touches/drags it.
const gallery=document.querySelector('.screens');
const track=document.querySelector('.screens-track');
if(gallery && track){
  let raf=0, last=performance.now(), paused=false, dragging=false, startX=0, startScroll=0;
  const speed=0.38;
  const firstSet=track.querySelector('.screen-set');
  const loopWidth=()=>firstSet ? firstSet.getBoundingClientRect().width : 0;
  function tick(now){
    const dt=Math.min(32,now-last); last=now;
    if(!paused && !dragging){
      gallery.scrollLeft += speed*dt;
      const w=loopWidth();
      if(w && gallery.scrollLeft >= w) gallery.scrollLeft -= w;
    }
    raf=requestAnimationFrame(tick);
  }
  gallery.addEventListener('pointerdown',e=>{dragging=true;paused=true;startX=e.clientX;startScroll=gallery.scrollLeft;gallery.setPointerCapture?.(e.pointerId)});
  gallery.addEventListener('pointermove',e=>{if(!dragging)return;gallery.scrollLeft=startScroll-(e.clientX-startX)});
  const stop=()=>{if(!dragging)return;dragging=false;setTimeout(()=>paused=false,900)};
  gallery.addEventListener('pointerup',stop);gallery.addEventListener('pointercancel',stop);
  gallery.addEventListener('pointerleave',()=>{if(dragging){dragging=false;setTimeout(()=>paused=false,900)}});
  gallery.addEventListener('mouseenter',()=>paused=true);
  gallery.addEventListener('mouseleave',()=>{if(!dragging)paused=false});
  raf=requestAnimationFrame(tick);
}
