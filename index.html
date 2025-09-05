// Firebase modulok (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// 🔑 a TE Firebase configod
const firebaseConfig = {
  apiKey: "AIzaSyA4iZp0Evxv77PlDPG6eRmRuV63eGHtwfU",
  authDomain: "websy-velemenyek.firebaseapp.com",
  projectId: "websy-velemenyek",
  storageBucket: "websy-velemenyek.appspot.com",
  messagingSenderId: "47514318127",
  appId: "1:47514318127:web:403255ebaa6eb72478ddda"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Anon auth
try { await signInAnonymously(auth); } catch(e){ console.warn('Anon auth hiba:', e.message); }

// DOM
const form = document.getElementById('reviewForm');
const list = document.getElementById('reviewsList');
const tickerInner = document.getElementById('tickerInner');

// escape
const esc = s => (s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

// mini konfetti (marad)
function burstFrom(el){
  const n=14, box=el.getBoundingClientRect();
  for(let i=0;i<n;i++){
    const p=document.createElement('span');
    p.style.position='fixed';
    p.style.width=p.style.height='6px';
    p.style.left=(box.left+box.width/2)+'px';
    p.style.top=(box.top+box.height/2)+'px';
    p.style.background=['#a855f7','#6366f1','#22d3ee'][i%3];
    p.style.borderRadius='2px'; p.style.pointerEvents='none';
    document.body.appendChild(p);
    const dx=(Math.random()-0.5)*240, dy=(Math.random()-0.6)*240;
    p.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx}px,${dy}px)`,opacity:0}],{duration:700+Math.random()*300,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.then(()=>p.remove());
  }
}

// submit → Firestore
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get('name')+'').trim();
  const text = (fd.get('text')+'').trim();
  const rating = parseInt(fd.get('rating'),10)||5;
  if(!name || !text) return;

  burstFrom(form);

  await addDoc(collection(db,'reviews'),{
    name, text, rating, ts: serverTimestamp()
  });
  form.reset();
});

// végtelen ticker anim
let tickerTween;
function runTicker(){
  if(!tickerInner) return;
  if(tickerTween){ tickerTween.kill(); tickerTween = null; }

  // Ha nincs elég elem, ne animáljon
  const rows = tickerInner.children.length;
  if(rows === 0) return;

  // Duplázás a nahtalan loophoz
  // (előbb töröljük a korábbi duplázást)
  const half = Math.floor(rows/2);
  // ha már duplázott (páros és első fele == második fele), ne ismét duplázd
  if(rows > 1){
    // oké
  }
  // Egyszerű módszer: mindig duplázunk frissen felépített listán
  // (a felépítést mi végezzük az onSnapshotban, ott mindig tiszta a lista)

  const kids = Array.from(tickerInner.children);
  kids.forEach(k => tickerInner.appendChild(k.cloneNode(true)));

  const wrapH = tickerInner.parentElement.getBoundingClientRect().height || 200;
  const scrollH = tickerInner.scrollHeight / 2; // csak az eredeti lista magassága
  const dist = Math.max(0, scrollH);

  gsap.set(tickerInner,{y:0});
  tickerTween = gsap.to(tickerInner,{
    y: -dist,
    duration: Math.max(15, dist/40),
    ease: "none",
    repeat: -1,
    onRepeat: () => gsap.set(tickerInner,{y:0})
  });
}

// live lista
const q = query(collection(db,'reviews'), orderBy('ts','desc'));
onSnapshot(q,(snap)=>{
  list.innerHTML=''; 
  tickerInner.innerHTML='';

  snap.forEach(doc=>{
    const r = doc.data();

    // nagy kártya (ha kéne)
    const card = document.createElement('div');
    card.className = 'glass p-5 rounded-2xl';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${esc(r.name||'Név nélkül')}</div>
        <div class="text-yellow-400 text-sm">${'★'.repeat(r.rating||5)}${'☆'.repeat(Math.max(0,5-(r.rating||5)))}</div>
      </div>
      <p class="text-slate-300 text-sm mt-3">${esc(r.text||'')}</p>`;
    list.appendChild(card);

    // TICKER sor (mobilbarát grid)
    const row = document.createElement('div');
    row.className = 'glass px-4 py-3 rounded-xl';
    row.innerHTML = `
      <span class="text-sm">${esc(r.name||'')}</span>
      <span class="text-xs text-yellow-400 text-center">${'★'.repeat(r.rating||5)}</span>
      <span class="text-slate-300 text-sm">${esc(r.text||'')}</span>`;
    tickerInner.appendChild(row);
  });

  // anim indítás / újraindítás
  runTicker();

  // resizen újraszámol
  let resizeTO;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTO);
    resizeTO = setTimeout(runTicker, 200);
  }, { once: true });
});
