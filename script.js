document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));
const apk=document.getElementById('apk');
const devModal=document.getElementById('devModal');
const devClose=document.getElementById('devClose');

if(apk){
  apk.addEventListener('click',e=>{
    e.preventDefault();
    devModal.classList.add('show');
  });
}

if(devClose){
  devClose.addEventListener('click',()=>{
    devModal.classList.remove('show');
  });
}

if(devModal){
  devModal.addEventListener('click',e=>{
    if(e.target===devModal){
      devModal.classList.remove('show');
    }
  });
}
// Continuous screenshot conveyor with center-focus scaling and drag support.
const gallery=document.querySelector('.screens');
const track=document.querySelector('.screens-track');
const firstSet=track?.querySelector('.screen-set');
if(gallery && track && firstSet){
  let offset=0, last=performance.now(), paused=false, dragging=false, startX=0, startOffset=0, loopWidth=0;
  const speed=38;
  const measure=()=>{ loopWidth=firstSet.getBoundingClientRect().width; };
  const normalize=()=>{ if(loopWidth>0){ while(offset<=-loopWidth) offset+=loopWidth; while(offset>0) offset-=loopWidth; } };
  const render=()=>{ normalize(); track.style.transform=`translate3d(${offset}px,0,0)`; updateCenter(); };
  const updateCenter=()=>{
    const center=gallery.getBoundingClientRect().left + gallery.clientWidth/2;
    let nearest=null, nearestDist=Infinity;
    track.querySelectorAll('.screen-card').forEach(card=>{
      const r=card.getBoundingClientRect(); const d=Math.abs((r.left+r.width/2)-center);
      if(d<nearestDist){nearestDist=d; nearest=card;}
    });
    track.querySelectorAll('.screen-card.is-center').forEach(c=>{if(c!==nearest)c.classList.remove('is-center')});
    if(nearest) nearest.classList.add('is-center');
  };
  const tick=(now)=>{
    const dt=Math.min(50,now-last); last=now;
    if(!paused && !dragging){offset-=speed*(dt/1000);render();} else updateCenter();
    requestAnimationFrame(tick);
  };
  measure(); render(); window.addEventListener('resize',()=>{measure();render()});
  gallery.addEventListener('pointerdown',e=>{dragging=true;paused=true;startX=e.clientX;startOffset=offset;gallery.classList.add('dragging');gallery.setPointerCapture?.(e.pointerId);});
  gallery.addEventListener('pointermove',e=>{if(dragging){offset=startOffset+(e.clientX-startX);render();}});
  const release=()=>{if(dragging){dragging=false;gallery.classList.remove('dragging');setTimeout(()=>paused=false,500);}};
  gallery.addEventListener('pointerup',release); gallery.addEventListener('pointercancel',release);
  gallery.addEventListener('mouseenter',()=>paused=true); gallery.addEventListener('mouseleave',()=>{if(!dragging)paused=false});
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
  setInterval(showService,2500);
}


// Payment cards: one card enters, grows, explains the method, then exits.
const paymentCards=[...document.querySelectorAll('.paymentVisual')];
if(paymentCards.length){
  let paymentActive=0;
  const showPayment=()=>{
    paymentCards.forEach((card,i)=>card.classList.toggle('paymentActive',i===paymentActive));
    paymentActive=(paymentActive+1)%paymentCards.length;
  };
  showPayment();
  setInterval(showPayment,2500);
}

// FAQ: automatic spotlight + full manual control.
const faqItems=[...document.querySelectorAll('.faqItem')];
if(faqItems.length){
  let faqActive=0, faqTimer=null, manualPause=false;
  const setFaq=(index, open=true)=>{
    faqItems.forEach((item,i)=>{
      item.classList.toggle('faqActive',i===index && open);
      item.open=(i===index && open);
    });
    faqActive=index;
  };
  const startFaqAuto=()=>{
    clearInterval(faqTimer);
    faqTimer=setInterval(()=>{
      if(!manualPause) setFaq((faqActive+1)%faqItems.length,true);
    },4300);
  };
  setFaq(0,true); startFaqAuto();
  faqItems.forEach((item,index)=>{
    item.querySelector('summary')?.addEventListener('click',(e)=>{
      e.preventDefault();
      const wasOpen=item.open;
      manualPause=true;
      if(wasOpen){
        item.open=false; item.classList.remove('faqActive');
        setTimeout(()=>{manualPause=false; startFaqAuto();},2200);
      }else{
        setFaq(index,true);
        setTimeout(()=>{manualPause=false; startFaqAuto();},5200);
      }
    });
  });
}

// Dedicated policies interface.
const policyModal=document.getElementById('policyModal');
const openPolicies=()=>{
  if(!policyModal) return;
  policyModal.classList.add('show'); policyModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modalOpen');
};
const closePolicies=()=>{
  if(!policyModal) return;
  policyModal.classList.remove('show'); policyModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modalOpen');
};
document.querySelectorAll('a[href="#policies"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openPolicies();history.replaceState(null,'','#policies');}));
policyModal?.querySelectorAll('[data-policy-close]').forEach(el=>el.addEventListener('click',closePolicies));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePolicies();});
policyModal?.querySelectorAll('.policyTab').forEach(tab=>tab.addEventListener('click',()=>{
  const key=tab.dataset.policyTab;
  policyModal.querySelectorAll('.policyTab').forEach(t=>t.classList.toggle('active',t===tab));
  policyModal.querySelectorAll('.policyContent').forEach(c=>c.classList.toggle('active',c.dataset.policyContent===key));
}));
if(location.hash==='#policies') openPolicies();

// Draggable WhatsApp support button
const whatsappFloat=document.getElementById('whatsappFloat');

if(whatsappFloat){
  let dragging=false;
  let moved=false;
  let startX=0;
  let startY=0;
  let startLeft=0;
  let startTop=0;

  whatsappFloat.addEventListener('pointerdown',e=>{
    dragging=true;
    moved=false;

    const rect=whatsappFloat.getBoundingClientRect();

    startX=e.clientX;
    startY=e.clientY;
    startLeft=rect.left;
    startTop=rect.top;

    whatsappFloat.style.left=startLeft+'px';
    whatsappFloat.style.top=startTop+'px';
    whatsappFloat.style.right='auto';
    whatsappFloat.style.bottom='auto';

    whatsappFloat.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  whatsappFloat.addEventListener('pointermove',e=>{
    if(!dragging)return;

    const dx=e.clientX-startX;
    const dy=e.clientY-startY;

    if(Math.abs(dx)>4 || Math.abs(dy)>4){
      moved=true;
    }

    if(!moved)return;

    const maxX=window.innerWidth-whatsappFloat.offsetWidth;
    const maxY=window.innerHeight-whatsappFloat.offsetHeight;

    const x=Math.max(0,Math.min(startLeft+dx,maxX));
    const y=Math.max(0,Math.min(startTop+dy,maxY));

    whatsappFloat.style.left=x+'px';
    whatsappFloat.style.top=y+'px';

    e.preventDefault();
  });

  const stopDrag=e=>{
    if(!dragging)return;

    dragging=false;

    if(e.pointerId!==undefined){
      try{
        whatsappFloat.releasePointerCapture(e.pointerId);
      }catch(err){}
    }
  };

  whatsappFloat.addEventListener('pointerup',stopDrag);
  whatsappFloat.addEventListener('pointercancel',stopDrag);

  whatsappFloat.addEventListener('click',e=>{
    if(moved){
      e.preventDefault();
      e.stopPropagation();
      moved=false;
    }
  });

  whatsappFloat.addEventListener('dragstart',e=>{
    e.preventDefault();
  });
}


// Email support via Vercel serverless function + Resend
const emailSupportForm = document.getElementById('emailSupportForm');
if(emailSupportForm){
  const submitBtn = document.getElementById('emailSupportSubmit');
  const status = document.getElementById('emailSupportStatus');
  emailSupportForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(emailSupportForm.website.value) return;
    submitBtn.disabled = true;
    status.textContent = 'جاري إرسال رسالتك...';
    try{
      const data = Object.fromEntries(new FormData(emailSupportForm).entries());
      const res = await fetch('/api/support', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:data.name,email:data.email,message:data.message})
      });
      const out = await res.json().catch(()=>({}));
      if(!res.ok || !out.success) throw new Error(out.error || 'send_failed');
      emailSupportForm.reset();
      status.textContent = 'تم الإرسال ✅ ستصلك رسالة تأكيد عبر support@kingstoor.com';
    }catch(err){
      status.textContent = 'تعذر الإرسال حالياً. حاول مرة أخرى بعد قليل.';
    }finally{
      submitBtn.disabled = false;
    }
  });
}
