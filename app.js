// Firebase modulok (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// 🔑 a TE Firebase configod
const firebaseConfig = {
  apiKey: "AIzaSyDhV4g-7V2SW-ygR41jkERJgzsHtv9_S4Q",
  authDomain: "websy-velemenyek.firebaseapp.com",
  projectId: "websy-velemenyek",
  storageBucket: "websy-velemenyek.appspot.com",
  messagingSenderId: "47514318127",
  appId: "1:47514318127:web:403255ebaa6eb72478ddda",
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Anon auth
try {
  await signInAnonymously(auth);
} catch (e) {
  console.warn("Anon auth hiba:", e.message);
}

// DOM
const form = document.getElementById("reviewForm");
const list = document.getElementById("reviewsList");
const tickerInner = document.getElementById("tickerInner");
const sendBtn =
  document.getElementById("sendReviewBtn") ||
  form?.querySelector('button[type="submit"]');

// Fallback DEMÓ vélemények (max 5)
const DEMO = [
  { name: "Márk", rating: 5, text: "Gyors és profi munka, ajánlom mindenkinek!" },
  { name: "Kata", rating: 5, text: "Szép dizájn, mobilon is nagyon jól működik." },
  { name: "Ádám", rating: 4, text: "Rengeteget segített, köszönöm!" },
  { name: "Lilla", rating: 5, text: "Sokkal több lead jön be most." },
  { name: "Norbi", rating: 5, text: "Modern és gyors oldal, full elégedett vagyok." },
];

// escape
const esc = (s) =>
  (s || "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

// mini konfetti
function burstFrom(el) {
  if (!el) return;
  const n = 14,
    box = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("span");
    p.style.position = "fixed";
    p.style.width = p.style.height = "6px";
    p.style.left = box.left + box.width / 2 + "px";
    p.style.top = box.top + box.height / 2 + "px";
    p.style.background = ["#a855f7", "#6366f1", "#22d3ee"][i % 3];
    p.style.borderRadius = "2px";
    p.style.pointerEvents = "none";
    document.body.appendChild(p);
    const dx = (Math.random() - 0.5) * 240,
      dy = (Math.random() - 0.6) * 240;
    p.animate(
      [
        { transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).finished.then(() => p.remove());
  }
}

// --- Dedup hash (ugyanazzal a név+szöveg párossal ne jöhessen több példány) ---
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return "r" + Math.abs(h);
};

// submit → Firestore (dupla-küldés tiltás + dedup kulcs)
let isSending = false;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSending) return;

  const fd = new FormData(form);
  const name = (fd.get("name") + "").trim();
  const text = (fd.get("text") + "").trim();
  const rating = parseInt(fd.get("rating"), 10) || 5;
  if (!name || !text) return;

  isSending = true;
  sendBtn && sendBtn.classList.add("opacity-60", "pointer-events-none");

  try {
    burstFrom(sendBtn || form);

    // dedup kulcs: ugyanazzal a név+szöveg kombóval ugyanazt a dokumentumot írjuk felül
    const key = hash((name + "|" + text).toLowerCase());
    await setDoc(doc(db, "reviews", key), {
      name,
      text,
      rating,
      ts: serverTimestamp(),
    });

    form.reset();
  } catch (err) {
    console.warn("Review mentési hiba:", err);
  } finally {
    isSending = false;
    sendBtn && sendBtn.classList.remove("opacity-60", "pointer-events-none");
  }
});

// ----------- Végtelen ticker kezelése -----------
let tickerTween;
function runTicker() {
  if (!tickerInner) return;
  if (tickerTween && tickerTween.kill) {
    tickerTween.kill();
    tickerTween = null;
  }

  const childCount = tickerInner.children.length;
  if (childCount === 0) return;

  // Duplázás a nahtalan loophoz: előbb töröljük a korábbi klónokat, ha voltak
  const kids = Array.from(tickerInner.children);
  const half = kids.length / 2;
  if (Number.isInteger(half)) {
    // ha előzőleg dupláztunk, töröljük a második felét
    for (let i = half; i < kids.length; i++) kids[i].remove();
  }

  const originals = Array.from(tickerInner.children).map((n) => n.cloneNode(true));
  originals.forEach((cl) => tickerInner.appendChild(cl));

  const wrapH = tickerInner.parentElement.getBoundingClientRect().height || 200;
  const dist = tickerInner.scrollHeight / 2; // az „eredeti” blokk magassága

  if (dist <= wrapH * 0.6) {
    // ha rövid a tartalom, ne animáljunk – de jelenjen meg
    gsap.set(tickerInner, { y: 0 });
    return;
  }

  gsap.set(tickerInner, { y: 0 });
  tickerTween = gsap.to(tickerInner, {
    y: -dist,
    duration: Math.max(15, dist / 40),
    ease: "none",
    repeat: -1,
    onRepeat: () => gsap.set(tickerInner, { y: 0 }),
  });
}

// render helper -> felépíti a listákat és indítja az animot
function renderRows(rows) {
  // törlés
  list.innerHTML = "";
  tickerInner.innerHTML = "";

  // plusz helyi dedup biztos ami biztos (ha régi duplák bent maradtak)
  const seen = new Set();
  const clean = [];
  for (const r of rows) {
    const key = ((r.name || "") + "|" + (r.text || "")).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      clean.push(r);
    }
  }

  clean.forEach((r) => {
    const safeName = esc(r.name || "Név nélkül");
    const safeText = esc(r.text || "");
    const rating = Math.max(1, Math.min(5, r.rating | 0 || 5));
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    // nagy kártya (bal oldal)
    const card = document.createElement("div");
    card.className = "glass p-5 rounded-2xl";
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${safeName}</div>
        <div class="text-yellow-400 text-sm">${stars}</div>
      </div>
      <p class="text-slate-300 text-sm mt-3">${safeText}</p>`;
    list.appendChild(card);

    // ticker sor (jobb oldal) — 3 oszlop: Név | Csillagok | Szöveg
    const row = document.createElement("div");
    row.className =
      "glass px-4 py-3 rounded-xl grid items-center gap-3 md:grid-cols-[140px,70px,1fr] grid-cols-[110px,60px,1fr]";
    row.innerHTML = `
      <span class="text-sm truncate">${safeName}</span>
      <span class="text-xs text-yellow-400 text-center whitespace-nowrap">${"★".repeat(rating)}</span>
      <span class="text-slate-300 text-sm">${safeText}</span>`;
    tickerInner.appendChild(row);
  });

  runTicker(); // indul az anim
}

// ----------- Firestore live + fallback -----------
// Gondoskodunk róla, hogy csak egyszer legyen aktív listener
if (window.__reviewsUnsub) {
  try {
    window.__reviewsUnsub();
  } catch (_) {}
  window.__reviewsUnsub = null;
}

const q = query(collection(db, "reviews"), orderBy("ts", "desc"));
window.__reviewsUnsub = onSnapshot(
  q,
  (snap) => {
    const rows = [];
    snap.forEach((doc) => rows.push(doc.data()));
    renderRows(rows.length ? rows : DEMO);

    // egyszeri resize-handler a ticker újraszámolására
    if (!window.__tickerResizeBound) {
      let to;
      window.addEventListener("resize", () => {
        clearTimeout(to);
        to = setTimeout(runTicker, 200);
      });
      window.__tickerResizeBound = true;
    }
  },
  (err) => {
    console.warn("Firestore onSnapshot hiba:", err?.message || err);
    // Ha bármi hiba van, mutassuk a demókat
    renderRows(DEMO);
  }
);
