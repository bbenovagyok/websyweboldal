// app.js — Firebase vélemények + végtelen (duplikációmentes) ticker

/* ---------------- Firebase (CDN modulok) ---------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* --------- A TE Firebase configod (amit megadtál) --------- */
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

// Anon auth (ha a szabályok írni csak auth mellett engedik)
try { await signInAnonymously(auth); }
catch (e) { console.warn("Anon auth hiba:", e.message); }

/* -------------------- DOM elemek -------------------- */
const form = document.getElementById("reviewForm");
const list = document.getElementById("reviewsList");   // lehet rejtve
const tickerWrap = document.getElementById("tickerWrap");
const tickerInner = document.getElementById("tickerInner");

// Opcionális: csillagválasztó -> #stars [data-v] gombok + hidden #rating
const starsWrap = document.getElementById("stars");
const ratingInput = document.getElementById("rating");
if (starsWrap && ratingInput) {
  starsWrap.addEventListener("click", (e) => {
    const v = e.target?.dataset?.v;
    if (!v) return;
    ratingInput.value = v;
  });
}

/* -------------------- Segédfüggvények -------------------- */
const esc = s => (s || "").replace(/[&<>"']/g, m => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
}[m]));

// mini konfetti a beküldéshez
function burstFrom(el) {
  const n = 12, box = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    Object.assign(p.style, {
      position: "fixed", width: "6px", height: "6px",
      left: (box.left + box.width / 2) + "px",
      top: (box.top + box.height / 2) + "px",
      background: ["#a855f7", "#6366f1", "#22d3ee"][i % 3],
      borderRadius: "2px", pointerEvents: "none", zIndex: 9999
    });
    document.body.appendChild(p);
    const dx = (Math.random() - 0.5) * 240;
    const dy = (Math.random() - 0.6) * 240;
    p.animate(
      [{ transform: "translate(0,0)", opacity: 1 },
      { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }],
      { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).finished.then(() => p.remove());
  }
}

/* -------------------- Beküldés → Firestore -------------------- */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get("name") + "").trim();
  const text = (fd.get("text") + "").trim();
  const rating = parseInt(fd.get("rating"), 10) || 5;

  if (!name || !text) return;
  burstFrom(form);

  await addDoc(collection(db, "reviews"), {
    name, text, rating, ts: serverTimestamp()
  });

  form.reset();
  if (ratingInput) ratingInput.value = 5;
});

/* -------------------- Fallback DEMÓ vélemények -------------------- */
const DEMO = [
  { name: "Márk", rating: 5, text: "Gyors és profi munka, ajánlom mindenkinek!" },
  { name: "Kata", rating: 5, text: "Szép dizájn, mobilon is nagyon jól működik." },
  { name: "Ádám", rating: 4, text: "Rengeteget segített, köszönöm!" },
  { name: "Lilla", rating: 5, text: "Sokkal több lead jön be most." },
  { name: "Norbi", rating: 5, text: "Modern és gyors oldal, full elégedett vagyok." }
];

/* -------------------- Ticker (duplikáció nélkül) -------------------- */
let tickerTween;

function renderRows(rows) {
  if (!list || !tickerInner) return;

  // ürítés
  list.innerHTML = "";
  tickerInner.innerHTML = "";

  // erős deduplikáció (név+szöveg normalizálva)
  const seen = new Set();
  const clean = [];
  for (const r of rows) {
    const nm = (r.name || "").trim();
    const tx = (r.text || "").replace(/\s+/g, " ").trim();
    const key = (nm + "|" + tx).toLowerCase();
    if (!seen.has(key)) { seen.add(key); clean.push({ ...r, name: nm, text: tx }); }
  }

  // kirajzolás
  clean.forEach(r => {
    const safeName = esc(r.name || "Név nélkül");
    const safeText = esc(r.text || "");
    const rating = Math.max(1, Math.min(5, r.rating | 0 || 5));
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    // nagy kártya (ha akarod használni)
    const card = document.createElement("div");
    card.className = "glass p-5 rounded-2xl";
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${safeName}</div>
        <div class="text-yellow-400 text-sm">${stars}</div>
      </div>
      <p class="text-slate-300 text-sm mt-3">${safeText}</p>`;
    list.appendChild(card);

    // ticker sor
    const row = document.createElement("div");
    row.className = "ticker-row glass px-4 py-3 rounded-xl grid items-center gap-3 md:grid-cols-[160px,80px,1fr]";
    row.innerHTML = `
      <span class="name text-sm truncate flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-400 shrink-0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${safeName}
      </span>
      <span class="stars text-xs text-yellow-400 text-center whitespace-nowrap">${"★".repeat(rating)}</span>
      <span class="text text-slate-300 text-sm">${safeText}</span>`;
    tickerInner.appendChild(row);
  });

  // eredeti elemszám elmentése (klónok takarításához)
  tickerInner.dataset.baseCount = String(tickerInner.children.length);
  runTicker();
}

function runTicker() {
  if (!tickerWrap || !tickerInner) return;

  // előző anim leállítása
  if (tickerTween && tickerTween.kill) { tickerTween.kill(); tickerTween = null; }

  // klónok takarítása → csak az eredeti készlet maradjon
  const baseCount = parseInt(tickerInner.dataset.baseCount || tickerInner.children.length, 10);
  while (tickerInner.children.length > baseCount) {
    tickerInner.lastElementChild.remove();
  }

  // az „eredeti” magasság mérése
  const wrapH = tickerWrap.getBoundingClientRect().height || 200;
  const baseHeight = Array.from(tickerInner.children)
    .reduce((h, el) => h + el.getBoundingClientRect().height + 12 /*gap*/, 0);

  // Ha nem magasabb a tartalom → nincs klónozás/animáció → nincs duplázódás
  if (baseHeight <= wrapH) { gsap.set(tickerInner, { y: 0 }); return; }

  // Varrat nélküli loop → csak most klónozunk (egyszer)
  const clones = Array.from(tickerInner.children).map(n => n.cloneNode(true));
  clones.forEach(cl => tickerInner.appendChild(cl));

  gsap.set(tickerInner, { y: 0 });
  tickerTween = gsap.to(tickerInner, {
    y: -baseHeight,                       // csak az eredeti blokkot járjuk be
    duration: Math.max(15, baseHeight / 40),
    ease: "none",
    repeat: -1,
    onRepeat: () => gsap.set(tickerInner, { y: 0 })
  });
}

// Resize-re újrakalkulál (csak ha a szélesség változik - mobil address bar fix)
let rezTO;
let lastW = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === lastW) return; // Ne frissítsen, ha csak a magasság változott (pl. mobil scroll)
  lastW = window.innerWidth;

  clearTimeout(rezTO);
  rezTO = setTimeout(runTicker, 200);
});

/* -------------------- Firestore live + fallback -------------------- */
const q = query(collection(db, "reviews"), orderBy("ts", "desc"));
onSnapshot(q, (snap) => {
  const rows = [];
  snap.forEach(doc => rows.push(doc.data()));
  if (rows.length === 0) renderRows(DEMO);
  else renderRows(rows);
});
