// Firebase modulok (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// 🔑 a TE Firebase configod
const firebaseConfig = {
  apiKey: "AIzaSyDhV4g-7V2SW-ygR41jkERJgzsHtv9_S4Q",
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

// Fallback DEMÓ vélemények (max 5)
const DEMO = [
  { name: "Márk",  rating: 5, text: "Gyors és profi munka, ajánlom mindenkinek!" },
  { name: "Kata",  rating: 5, text: "Szép dizájn, mobilon is nagyon jól működik." },
  { name: "Ádám",  rating: 4, text: "Rengeteget segített, köszönöm!" },
  { name: "Lilla", rating: 5, text: "Sokkal több lead jön be most." },
  { name: "Norbi", rating: 5, text: "Modern és gyors oldal, full elégedett vagyok." },
];

// escape
const esc = s => (s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

// mini konfetti
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

// ----------- Végtelen ticker kezelése -----------
let tickerTween;

// render helper -> felépíti a listákat és indítja az animot
function renderRows(rows){
  // törlés
  list.innerHTML = '';
  tickerInner.innerHTML = '';

  rows.forEach(r=>{
    const safeName = esc(r.name || 'Név nélkül');
    const safeText = esc(r.text || '');
    const rating = Math.max(1, Math.min(5, r.rating|0 || 5));
    const stars = '★'.repeat(rating) + '☆'.repeat(5-rating);

    // nagy kártya (ha később vissza akarod kapcsolni)
    const card = document.createElement('div');
    card.className = 'glass p-5 rounded-2xl';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${safeName}</div>
        <div class="text-yellow-400 text-sm">${stars}</div>
      </div>
      <p class="text-slate-300 text-sm mt-3">${safeText}</p>`;
    list.appendChild(card);

    // ticker sor (grid: név | csillag | szöveg)
    const row = document.createElement('div');
    row.className = 'glass px-4 py-3 rounded-xl';
    row.innerHTML = `
      <span class="text-sm">${safeName}</span>
      <span class="text-xs text-yellow-400 text-center">${'★'.repeat(rating)}</span>
      <span class="text-slate-300 text-sm">${safeText}</span>`;
    tickerInner.appendChild(row);
  });

  runTicker(); // indul az anim
}

function runTicker(){
  if(!tickerInner) return;
  if(tickerTween){ tickerTween.kill(); tickerTween = null; }

  const childCount = tickerInner.children.length;
  if(childCount === 0) return;

  // duplázás a nahtalan loophoz
  const clones = Array.from(tickerInner.children).map(n => n.cloneNode(true));
  clones.forEach(cl => tickerInner.appendChild(cl));

  const wrapH = tickerInner.parentElement.getBoundingClientRect().height || 200;
  const dist = tickerInner.scrollHeight / 2; // az „eredeti” blokk magassága

  // ha nem elég magas a tartalom, anim nélkül is oké – de látszódjon
  if(dist <= wrapH * 0.6){
    gsap.set(tickerInner, { y: 0 });
    return;
  }

  gsap.set(tickerInner,{y:0});
  tickerTween = gsap.to(tickerInner,{
    y: -dist,
    duration: Math.max(15, dist/40),
    ease: 'none',
    repeat: -1,
    onRepeat: () => gsap.set(tickerInner,{y:0})
  });
}

// ----------- Firestore live + fallback -----------
const q = query(collection(db,'reviews'), orderBy('ts','desc'));
onSnapshot(q,(snap)=>{
  const rows = [];
  snap.forEach(doc => rows.push(doc.data()));

  if(rows.length === 0){
    // nincs adat → demó
    renderRows(DEMO);
  } else {
    renderRows(rows);
  }

  // resizen újrakalkulál
  let to;
  window.addEventListener('resize', ()=>{
    clearTimeout(to);
    to = setTimeout(runTicker, 200);
  }, { once: true });
});
