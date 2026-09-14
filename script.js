document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));
// Download button: the APK is still under development. Show a dedicated modal instead of navigating.
const ensureDevModal=()=>{
  let modal=document.getElementById('devModal');
  if(modal) return modal;

  modal=document.createElement('div');
  modal.id='devModal';
  modal.className='devModal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`
    <div class="devModalBox" role="dialog" aria-modal="true" aria-labelledby="devModalTitle">
      <div class="devIcon">🚧</div>
      <h3 id="devModalTitle">التطبيق قيد التطوير</h3>
      <p>تطبيق KingstooR سيكون متاحاً للتحميل قريباً.</p>
      <button id="devClose" type="button">حسناً</button>
    </div>`;

  document.body.appendChild(modal);

  if(!document.getElementById('devModalRuntimeStyle')){
    const style=document.createElement('style');
    style.id='devModalRuntimeStyle';
    style.textContent=`
      .devModal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(2,4,12,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .devModal.show{display:flex}
      .devModalBox{width:min(92vw,390px);padding:28px 22px;text-align:center;border:1px solid #303653;border-radius:24px;background:linear-gradient(145deg,#101426,#080b15);box-shadow:0 25px 80px rgba(0,0,0,.65),0 0 35px rgba(167,77,255,.16);color:#fff;animation:devModalIn .22s ease-out}
      .devIcon{font-size:42px;line-height:1;margin-bottom:14px}
      .devModalBox h3{margin:0 0 9px;font-size:22px;font-weight:950}
      .devModalBox p{margin:0 auto 20px;color:#b8bed2;font-size:13px;line-height:1.9}
      .devModalBox button{border:0;border-radius:12px;padding:11px 28px;background:linear-gradient(90deg,#a74dff,#ff4d9d);color:#fff;font-weight:900;font-size:13px;cursor:pointer;box-shadow:0 8px 25px rgba(167,77,255,.25)}
      @keyframes devModalIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
  }

  return modal;
};

const showDevModal=()=>{
  const modal=ensureDevModal();
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
};

const hideDevModal=()=>{
  const modal=document.getElementById('devModal');
  if(modal){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  }
};

document.addEventListener('click',e=>{
  const apk=e.target.closest?.('#apk');
  if(apk){
    e.preventDefault();
    e.stopPropagation();
    showDevModal();
    return;
  }

  if(e.target.closest?.('#devClose')){
    e.preventDefault();
    hideDevModal();
    return;
  }

  if(e.target.id==='devModal'){
    hideDevModal();
  }
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') hideDevModal();
});

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
