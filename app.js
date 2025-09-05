// Firebase modulok (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// 🔑 a TE Firebase configod
const firebaseConfig = {
  apiKey: "AIzaSyA4iZQp0Evx77PIDpG6eRmRuV63eGHtwfU",
  authDomain: "websy-velemenyek.firebaseapp.com",
  projectId: "websy-velemenyek",
  storageBucket: "websy-velemenyek.firebasestorage.app",
  messagingSenderId: "47514318127",
  appId: "1:47514318127:web:403255ebaa6eb72478ddda"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Anon auth (ha rules kéri)
try {
  await signInAnonymously(auth);
} catch (e) {
  console.warn("Anon auth hiba:", e);
  alert(
    "Nem sikerült bejelentkezni anonim módban.\n" +
    "Firebase Console → Authentication → Sign-in method → Anonymous → Enable, majd próbáld újra."
  );
}

// DOM elemek
const form = document.getElementById("reviewForm");
const list = document.getElementById("reviewsList");
const tickerInner = document.getElementById("tickerInner");
const submitBtn = form?.querySelector("button") || null;

const esc = (s) =>
  (s || "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
  );

// mini konfetti
function burstFrom(el) {
  const n = 14, box = el.getBoundingClientRect();
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

// submit → Firestore (hibakezeléssel)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get("name") + "").trim();
  const text = (fd.get("text") + "").trim();
  const rating = parseInt(fd.get("rating"), 10) || 5;
  if (!name || !text) return;

  // UI lock
  const orig = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.textContent = "Küldés…";
  }

  try {
    burstFrom(form);
    await addDoc(collection(db, "reviews"), {
      name,
      text,
      rating,
      ts: serverTimestamp(),
    });
    form.reset();
  } catch (err) {
    console.error("Firestore write error:", err);
    const msg =
      err?.code === "permission-denied"
        ? "Engedély hiba: kapcsold be az Anonymous sign-in-t a Firebase Authentication > Sign-in method alatt, és ellenőrizd a Firestore Rules-t."
        : "Nem sikerült menteni a véleményt. Nézd meg a konzolt a részletekért.";
    alert(msg);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.textContent = orig;
    }
  }
});

// live lista
const q = query(collection(db, "reviews"), orderBy("ts", "desc"));
onSnapshot(q, (snap) => {
  list.innerHTML = "";
  tickerInner.innerHTML = "";

  if (snap.empty) {
    // ha nincs igazi review → teszt adatok
    const demo = [
      { name: "Márk", rating: 5, text: "Gyors és profi munka, ajánlom mindenkinek!" },
      { name: "Kata", rating: 5, text: "Szép dizájn, mobilon is nagyon jól működik." },
      { name: "Ádám", rating: 4, text: "Rengeteget segített, köszönöm!" },
      { name: "Lilla", rating: 5, text: "Szuper, sokkal több lead jön be!" },
      { name: "Norbi", rating: 5, text: "Full elégedett vagyok, modern és gyors oldal." },
    ];
    renderReviews(demo);
  } else {
    const data = [];
    snap.forEach((doc) => data.push(doc.data()));
    renderReviews(data);
  }
});

function renderReviews(data) {
  data.forEach((r) => {
    const card = document.createElement("div");
    card.className = "glass p-5 rounded-2xl";
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${esc(r.name || "Név nélkül")}</div>
        <div class="text-yellow-400 text-sm">
          ${"★".repeat(r.rating || 5)}${"☆".repeat(Math.max(0, 5 - (r.rating || 5)))}
        </div>
      </div>
      <p class="text-slate-300 text-sm mt-3">${esc(r.text || "")}</p>`;
    list.appendChild(card);

    const row = document.createElement("div");
    row.className = "flex items-center justify-between gap-3 glass px-4 py-3 rounded-xl";
    row.innerHTML = `
      <span class="text-sm">${esc(r.name || "")}</span>
      <span class="text-xs text-yellow-400">${"★".repeat(r.rating || 5)}</span>
      <span class="text-slate-300 text-sm truncate">${esc(r.text || "")}</span>`;
    tickerInner.appendChild(row);
  });

  // ticker anim (GSAP a globálból)
  const h = tickerInner.scrollHeight;
  gsap.set(tickerInner, { y: 0 });
  gsap.to(tickerInner, {
    y: -Math.max(0, h - 160),
    duration: Math.max(10, h / 25),
    ease: "none",
    repeat: -1,
    yoyo: true,
  });
}

