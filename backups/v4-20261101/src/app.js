/* ================= PHARM MASTER app ================= */
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DAY = 864e5, MIN = 6e4;
const DRUG = Object.fromEntries(DRUGS.map(d => [d.id, d]));
const SYS = Object.fromEntries(SYSTEMS.map(s => [s.k, s]));
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[rnd(a.length)];
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const firstClause = s => String(s || "").split(/[;.]/)[0].trim();
function dstr(t = Date.now()) { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function fmtDate(t) { return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function rel(t) { const d = t - Date.now(); if (d <= 0) return "due now"; if (d < 3600e3) return "in " + Math.ceil(d / MIN) + " min"; if (d < DAY) return "in " + Math.ceil(d / 3600e3) + " h"; return "in " + Math.round(d / DAY) + " d"; }

/* ---------- icons ---------- */
const P = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  session: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  library: "M8 3h8v3H8zM7 6h10v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM7 11h10M7 16h10",
  systems: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  games: "M8 4h4v3a2 2 0 1 0 4 0V4h4v8h-3a2 2 0 1 0 0 4h3v4H4V4h4z",
  hold: "M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-12.8 4L4 14a1.6 1.6 0 0 1 2.6-1.8L7 13",
  rescue: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  math: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2",
  exam: "M9 4h6v3H9zM6 5h3M15 5h3v15H6V5M9 12l2 2 4-4",
  missed: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  compare: "M4 4h6v16H4zM14 4h6v16h-6z",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  src: "M6 3h9l4 4v14H6zM14 3v5h5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  up: "M12 19V5M6 11l6-6 6 6", down: "M12 5v14M6 13l6 6 6-6",
  bookmark: "M6 3h12v18l-6-4-6 4z", flag: "M5 21V4h11l-2 4 2 4H5",
  check: "M5 12l5 5 9-10", back: "M15 5l-7 7 7 7", search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l5 5", play: "M7 4l13 8-13 8z", clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z", target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01", x: "M6 6l12 12M18 6L6 18",
  cardio: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  resp: "M12 3v9M12 9c-2 0-3 1-4.5 3.5S4 20 3.5 18 4 9 7 8M12 9c2 0 3 1 4.5 3.5S20 20 20.5 18 20 9 17 8",
  endo: "M12 9C9 5 4 6 4 10.5S9 17 12 14c3 3 8 1 8-3.5S15 5 12 9zM12 14v6",
  psych: "M9 21v-3H7a2 2 0 0 1-2-2v-3l-2-1 2-3.5A7 7 0 0 1 19 10c0 3-1 4.5-2 5.5V21M11 8a2 2 0 1 1 3 2",
  neuro: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M18 18l-4-4M18 6l-4 4M6 18l4-4",
  mat: "M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9 22v-5l-1.5-5a4.5 4.5 0 0 1 9 0c0 3-2.5 3-2.5 6v4M14 14a2 2 0 1 1 3 1.5",
  peds: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 21l.5-9h7l.5 9M6 13l2.5-1.5M18 13l-2.5-1.5",
  repro: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 14v7M9 18h6",
  blood: "M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11z",
  integ: "M3 7h18M3 12c3-2 6 2 9 0s6 2 9 0M3 17h18",
  msk: "M6 6l12 12M4.5 7.5a2 2 0 1 1 3-3M19.5 16.5a2 2 0 1 1-3 3M7.5 4.5a2 2 0 1 1-3 3M16.5 19.5a2 2 0 1 1 3-3",
  gi: "M9 3v4c0 2-4 3-4 8a6 6 0 0 0 12 1c0-3 3-3 3-6 0-2-2-3-4-2",
  uri: "M15 4c-4 0-7 3-7 8s3 8 7 8c3 0 3-3 1-5s-2-4 0-6 2-5-1-5zM8 12H5v8",
  infect: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3",
  onc: "M12 3a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4zM10 13l-4 8M14 13l4 8",
  pain: "M13 2L4 14h7l-1 8 9-12h-7z"
};
const ico = (k, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k] || ""}"/></svg>`;

/* ---------- state & persistence ---------- */
const KEY = "pharm-master-v1";
const DEF = () => ({ v: 1, schema: 2, recent: [], resume: null, updatedAt: 0, cards: {}, qs: {}, conceptMiss: {}, missed: {}, journal: [], sessions: [], days: {}, mins: {},
  examDate: "", target: 20, bookmarks: [], flags: [], math: { att: 0, cor: 0, recent: [], byType: {} }, hold: {}, rescue: {}, games: { played: 0, best: {} },
  sysScores: {}, exams: [], firstLog: [], rep: { att: 0, cor: 0 }, applyLog: [], seenDrugs: {} });
function migrate(o) { // v2 schema: additive only — never removes or resets existing fields
  o = Object.assign(DEF(), o);
  if (!o.schema || o.schema < 2) { o.schema = 2; o.recent = o.recent || []; o.resume = o.resume || null; }
  if (o.mm && o.mm.mode === "advanced") o.mm.mode = "exam";
  return o;
}
function loadLocal() { try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (!o.schema) { try { localStorage.setItem(KEY + "-pre-v2", raw); } catch (e) { } } return migrate(o); } } catch (e) { } return DEF(); }
let S = loadLocal();
const cloud = { ref: null, on: false, writing: false, pending: false };
let saveTimer = null, cloudTimer = null, lastCloud = 0, dirty = false;
const CLOUD_GAP = 20e3; // v2: cloud writes throttled (was ~1/min of activity → 75 versions); local save stays fast
function save() { dirty = true; S.updatedAt = Date.now(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 800); }
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); dirty = false; return true; } catch (e) { return false; } }
async function flush(force) {
  clearTimeout(saveTimer); saveLocal();
  if (!cloud.ref) return;
  const wait = CLOUD_GAP - (Date.now() - lastCloud);
  if (!force && wait > 0) { if (!cloudTimer) cloudTimer = setTimeout(() => { cloudTimer = null; flush(true); }, wait); return; }
  if (cloud.writing) { cloud.pending = true; return; }
  cloud.writing = true; lastCloud = Date.now();
  try { await cloud.ref.set({ json: JSON.stringify(S), updatedAt: S.updatedAt }); setSync(true); }
  catch (e) { setSync(false, e && e.code === "quota_exceeded" ? "Cloud storage full" : "Saved on this device"); }
  cloud.writing = false;
  if (cloud.pending) { cloud.pending = false; flush(true); }
}
/* v2: never lose the last few seconds — write on tab hide / close */
window.addEventListener("pagehide", () => { if (!dirty && !cloudTimer) return; if (dirty) saveLocal(); if (cloud.ref) flush(true); }); // only unsaved changes — never overwrites newer data from another tab
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && (dirty || cloudTimer)) { if (dirty) saveLocal(); if (cloud.ref && S.updatedAt > lastCloud) flush(true); } });
/* v2: automatic safety copy before import, reset, or schema migration (keeps last 3) */
function backupProgress(reason) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY + "-backups") || "[]");
    list.unshift({ at: Date.now(), reason, json: JSON.stringify(S) });
    localStorage.setItem(KEY + "-backups", JSON.stringify(list.slice(0, 3))); return true;
  } catch (e) { return false; }
}
function listBackups() { try { return JSON.parse(localStorage.getItem(KEY + "-backups") || "[]"); } catch (e) { return []; } }
function setSync(on, msg) { cloud.on = on; const el = $("#sync"); if (el) el.innerHTML = `<span class="dot ${on ? "on" : ""}"></span><span>${esc(msg || (on ? "Synced to your account" : "Saved on this device"))}</span>`; }
async function initCloud() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    cloud.ref = db.doc("data/users/" + uid + "/progress");
    const snap = await cloud.ref.get();
    if (snap.exists) {
      const d = snap.data();
      if (d && d.json && (d.updatedAt || 0) > (S.updatedAt || 0)) { S = migrate(JSON.parse(d.json)); try { localStorage.setItem(KEY, d.json); } catch (e) { } route(); }
      else if ((S.updatedAt || 0) > (d.updatedAt || 0)) flush();
    } else if (S.updatedAt) flush();
    setSync(true);
  } catch (e) { setSync(false); }
}

/* activity minutes + streak */
let lastAct = 0, beat = 0;
function touch() { lastAct = Date.now(); if (!S.days[dstr()]) { S.days[dstr()] = 1; save(); } }
document.addEventListener("pointerdown", touch, { passive: true });
document.addEventListener("keydown", touch);
setInterval(() => {
  if (document.visibilityState === "visible" && Date.now() - lastAct < 90e3) {
    const k = dstr(); S.mins[k] = Math.round(((S.mins[k] || 0) + .25) * 100) / 100;
    if (++beat % 4 === 0) save();
  }
}, 15e3);
function streak() { let n = 0, t = Date.now(); if (!S.days[dstr(t)]) t -= DAY; while (S.days[dstr(t)]) { n++; t -= DAY; } return n; }

function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }

/* ---------- flashcards & SRS ---------- */
const IV = [0, 1, 3, 7, 14, 30, 60];
const LEVELS = ["New", "Learning", "Reviewing", "Strong", "Maintained"];
function cardKinds(d) { const k = ["core", "safety", "danger", "teach"]; if (d.anti && !/^No antidote/.test(d.anti)) k.push("anti"); return k; }
function cardQA(d, kind) {
  const n = esc(d.g);
  switch (kind) {
    case "core": return { q: `${n}: what class is it, and what is it used for?`, a: `<b>${esc(d.cls)}</b><br>${esc(d.ind)}<br><span class="muted small">How: ${esc(d.moa)}</span>` };
    case "safety": return { q: `Before or during ${n}: what do you assess, and when would you hold or call?`, a: `<b>Monitor:</b> ${esc(d.mon)}<br><b>Nursing:</b> ${esc(d.nur)}` };
    case "danger": return { q: `${n}: what serious adverse effect or toxicity are you watching for?`, a: esc(d.sae) };
    case "teach": return { q: `${n}: what is the single most important thing to teach the client?`, a: esc(d.teach) };
    case "anti": return { q: `What reverses or treats ${n} toxicity?`, a: `<b>${esc(d.anti)}</b>` };
  }
}
function levelOfCard(c) { if (!c || !c.reps) return "New"; if (c.box <= 2) return "Learning"; if (c.box === 3) return "Reviewing"; if (c.box <= 5) return "Strong"; return "Maintained"; }
function drugLevel(d) {
  const cs = cardKinds(d).map(k => S.cards[d.id + ":" + k]).filter(c => c && c.reps);
  if (!cs.length) return "New";
  const avg = cs.reduce((a, c) => a + c.box, 0) / cs.length;
  const coverage = cs.length / cardKinds(d).length;
  let lvl = avg < 2.5 ? "Learning" : avg < 3.5 ? "Reviewing" : avg < 5.5 ? "Strong" : "Maintained";
  if (coverage < .6 && LEVELS.indexOf(lvl) > 2) lvl = "Reviewing";
  if (cs.some(c => c.lastRes === "miss")) lvl = "Learning";
  return lvl;
}
function gradeCard(key, res, conf) {
  const c = S.cards[key] || { box: 0, reps: 0, lapses: 0 }, now = Date.now();
  if (res === "got") {
    if (conf === "guess") { c.box = Math.max(1, c.box); c.due = now + DAY; }
    else { c.box = Math.min(6, c.box + 1); c.due = now + IV[c.box] * DAY * (conf === "unsure" ? .5 : 1); }
  } else if (res === "partial") { c.box = Math.max(1, c.box - 1); c.due = now + DAY; }
  else { c.box = 1; c.lapses = (c.lapses || 0) + 1; c.due = now + 10 * MIN; }
  c.reps++; c.last = now; c.lastRes = res; c.lastConf = conf;
  S.cards[key] = c; touch(); save();
}
function dueKeys() { const now = Date.now(); return Object.entries(S.cards).filter(([, c]) => c.reps && c.due <= now).sort((a, b) => a[1].due - b[1].due).map(([k]) => k); }

/* ---------- question bank ---------- */
const sysOf = q => q.sys || [];
const SCEN_Q = SCENARIOS.map(s => ({
  id: "hold:" + s.id, sys: (DRUG[s.drug] || { sys: [] }).sys, fmt: "mc", d: 3, drug: s.drug, concept: "hold-" + s.drug, scen: s,
  stem: "What is the safest nursing action?", opts: s.opts, key: s.key, rat: s.rat, why: s.why, src: s.src,
  obj: "Decide whether to give, hold, or clarify using the order's own parameters.", short: firstClause(s.rat) + "."
}));
// Generated recall items. v2: † markers stripped from options, distractors rejected when they share a
// content word with ANY of the target drug's facts (prevents two defensible answers), and kinds already
// covered by an authored question are skipped (audit: genDupOfAuthored).
const clean = t => String(t || "").replace(/†/g, "").replace(/\s+/g, " ").trim();
const STOPW = new Set("with from that this have into than then them they when what which while also each other only over under more most less such some very does dose doses drug drugs give used uses take taken client patient nurse level levels serum signs effects effect therapy".split(" "));
const words = t => clean(t).toLowerCase().replace(/[^a-z0-9⁺ ]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOPW.has(w));
const GEN_SKIP = new Set(["gen:heparin:anti", "gen:lorazepam:cls", "gen:lorazepam:sae", "gen:donepezil:mon", "gen:magsulfate:anti", "gen:acyclovir:cls", "gen:cephalexin:sae", "gen:regular:mon"]);
function genQuestions() {
  const out = [], antis = DRUGS.filter(d => d.anti && !/^No antidote/.test(d.anti));
  const others = (d, pool, field, n = 3) => {
    const own = new Set(words([d.ae, d.sae, d.mon, d.ci, d.nur, d.teach, d.ix, d.moa, d.cls, d.anti, d.exam].join(" ")));
    const tgt = clean(field(d));
    return shuffle(pool.filter(o => o.id !== d.id && !o.sys.some(s => d.sys.includes(s)) && field(o) && clean(field(o)) !== tgt && !words(field(o)).some(w => own.has(w))))
      .reduce((acc, o) => { const v = clean(field(o)); if (v && !acc.includes(v) && acc.length < n) acc.push(v); return acc; }, []);
  };
  const push = q => { if (!GEN_SKIP.has(q.id)) out.push(q); };
  DRUGS.forEach(d => {
    const base = { sys: d.sys, drug: d.id, gen: true, src: d.src, d: 1 };
    if (d.anti && !/^No antidote/.test(d.anti)) {
      const c = clean(firstClause(d.anti)), ds = others(d, antis, o => firstClause(o.anti));
      if (ds.length === 3) { const opts = shuffle([c, ...ds]); push({ ...base, id: `gen:${d.id}:anti`, fmt: "mc", concept: d.id + "-anti", stem: `A client shows signs of ${d.g} toxicity. Which agent should the nurse anticipate?`, opts, key: opts.indexOf(c), rat: clean(`${d.anti} is the reversal agent for ${d.g}. ${d.exam}`), obj: `Recall the antidote for ${d.g}.`, short: `${d.g} → ${c}.` }); }
    }
    const dc = others(d, DRUGS, o => o.cls);
    if (dc.length === 3) { const c = clean(d.cls), opts = shuffle([c, ...dc]); push({ ...base, id: `gen:${d.id}:cls`, fmt: "mc", concept: d.id + "-cls", stem: `${d.g} (${d.b}) belongs to which drug class?`, opts, key: opts.indexOf(c), rat: clean(`${d.g} is a ${d.cls}. ${d.moa}`), obj: `Classify ${d.g}.`, short: `${d.g} = ${c}.` }); }
    const ds2 = others(d, DRUGS, o => firstClause(o.sae));
    if (ds2.length === 3 && firstClause(d.sae)) { const c = clean(firstClause(d.sae)), opts = shuffle([c, ...ds2]); push({ ...base, id: `gen:${d.id}:sae`, d: 2, fmt: "mc", concept: d.id + "-sae", stem: `A client receiving ${d.g} should be monitored most closely for which serious adverse effect?`, opts, key: opts.indexOf(c), rat: clean(`Serious effects of ${d.g}: ${d.sae}.`), obj: `Identify the serious adverse effect of ${d.g}.`, short: `${d.g}: watch for ${c}.` }); }
    const dm = others(d, DRUGS, o => firstClause(o.mon));
    if (dm.length === 3 && firstClause(d.mon)) { const c = clean(firstClause(d.mon)), opts = shuffle([c, ...dm]); push({ ...base, id: `gen:${d.id}:mon`, d: 2, fmt: "mc", concept: d.id + "-mon", stem: `Which assessment is most specific to safe ${d.g} therapy?`, opts, key: opts.indexOf(c), rat: clean(`For ${d.g}: ${d.mon}. ${d.nur}`), obj: `Prioritize monitoring for ${d.g}.`, short: `${d.g}: ${c}.` }); }
  });
  return out;
}
const GEN = genQuestions();
const ALLQ = [...QUESTIONS, ...SCEN_Q, ...GEN];
const QBYID = Object.fromEntries(ALLQ.map(q => [q.id, q]));

function srcHTML(src, flag) {
  const t = src ? `Source: ${esc(SRC[src[0]])}${src[1] ? " — " + esc(src[1]) : ""}` : "Reference content — not found in your course files. Verify with your drug guide.";
  return `<div class="srcline">${ico("src", 14)}<span>${t}${flag ? " · <b>Generated from the medication database</b>" : ""}</span></div>`;
}
function verBadge(v) { return { S: `<span class="chip badge-S" title="Confirmed in your course files">Course-confirmed</span>`, P: `<span class="chip badge-P" title="Core facts from your course files; † items are supplementary reference">Course + reference †</span>`, R: `<span class="chip badge-R" title="Not found in your course files">Reference — verify</span>` }[v] || ""; }
function sysChips(list) { return list.map(k => `<span class="chip"><span class="sys-dot" style="background:${SYS[k].c}"></span>${esc(SYS[k].n)}</span>`).join(""); }

/* record a question attempt */
function recordQ(q, ok, ansText, conf) {
  const r = S.qs[q.id] || { att: 0, cor: 0 }, now = Date.now(), first = r.att === 0;
  r.att++; if (ok) r.cor++; if (first) r.first = ok; r.last = now; S.qs[q.id] = r;
  if (first) { S.firstLog.push({ t: now, ok, sys: sysOf(q), gen: !!q.gen }); if (S.firstLog.length > 400) S.firstLog.splice(0, S.firstLog.length - 400); }
  else { S.rep.att++; if (ok) S.rep.cor++; }
  if (q.id.startsWith("hold:")) { const h = S.hold[q.id] || { att: 0, cor: 0 }; h.att++; if (ok) h.cor++; S.hold[q.id] = h; S.applyLog.push({ t: now, ok }); }
  const m = S.missed[q.id];
  if (!ok) {
    const wrongIdx = typeof ansText === "number" ? ansText : null;
    S.missed[q.id] = { ans: typeof ansText === "string" ? ansText : "", misc: (q.why && wrongIdx != null && q.why[wrongIdx]) || "", when: now, due: now + DAY, count: (m ? m.count : 0) + 1, resolved: false, guess: false };
    S.conceptMiss[q.concept] = (S.conceptMiss[q.concept] || 0) + 1;
    if (q.drug && DRUG[q.drug]) { const key = q.drug + ":safety", c = S.cards[key] || { box: 1, reps: 0, lapses: 0 }; c.due = now; if (!c.reps) { c.reps = 1; c.box = 1; c.lastRes = "miss"; } S.cards[key] = c; }
  } else if (conf === "guess") {
    S.missed[q.id] = Object.assign(m || { count: 0 }, { ans: "Correct, but you were guessing", misc: "A lucky guess isn't knowledge yet — review the rationale.", when: now, due: now + DAY, resolved: false, guess: true });
  } else if (m) { m.resolved = true; m.streak = (m.streak || 0) + 1; m.due = now + [3, 7, 14][Math.min(2, m.streak - 1)] * DAY; }
  touch(); save();
}
function ansToText(q, a) {
  if (a == null) return "No answer";
  if (q.fmt === "mc") return q.opts[a];
  if (q.fmt === "sata") return [...a].map(i => q.opts[i]).join("; ") || "None selected";
  if (q.fmt === "order") return a.map((i, n) => (n + 1) + ". " + q.opts[i]).join("  ");
  if (q.fmt === "matrix") return q.rows.map((r, i) => r + " → " + (a[i] != null ? q.cols[a[i]] : "—")).join("; ");
  if (q.fmt === "bowtie") return `Condition: ${a.c != null ? q.cond[a.c] : "—"}; Actions: ${[...a.a].map(i => q.act[i]).join(", ")}; Monitor: ${[...a.m].map(i => q.mon[i]).join(", ")}`;
}
function correctText(q) {
  if (q.fmt === "mc") return q.opts[q.key];
  if (q.fmt === "sata") return q.key.map(i => q.opts[i]).join("; ");
  if (q.fmt === "order") return q.opts.map((o, i) => (i + 1) + ". " + o).join("  ");
  if (q.fmt === "matrix") return q.rows.map((r, i) => r + " → " + q.cols[q.key[i]]).join("; ");
  if (q.fmt === "bowtie") return `Condition: ${q.cond[q.condKey]}; Actions: ${q.actKey.map(i => q.act[i]).join(", ")}; Monitor: ${q.monKey.map(i => q.mon[i]).join(", ")}`;
}
function evaluate(q, a) {
  if (a == null) return false;
  if (q.fmt === "mc") return a === q.key;
  if (q.fmt === "sata") return a.size === q.key.length && q.key.every(k => a.has(k));
  if (q.fmt === "order") return a.every((v, i) => v === i);
  if (q.fmt === "matrix") return q.key.every((k, i) => a[i] === k);
  if (q.fmt === "bowtie") return a.c === q.condKey && a.a.size === 2 && q.actKey.every(k => a.a.has(k)) && a.m.size === 2 && q.monKey.every(k => a.m.has(k));
}
function answered(q, a) {
  if (a == null) return false;
  if (q.fmt === "sata") return a.size > 0;
  if (q.fmt === "matrix") return a.every(v => v != null);
  if (q.fmt === "bowtie") return a.c != null && a.a.size === 2 && a.m.size === 2;
  return true;
}
function initAns(q) {
  if (q.fmt === "sata") return new Set();
  if (q.fmt === "order") { let o; do { o = shuffle(q.opts.map((_, i) => i)); } while (o.every((v, i) => v === i) && q.opts.length > 1); return o; }
  if (q.fmt === "matrix") return q.rows.map(() => null);
  if (q.fmt === "bowtie") return { c: null, a: new Set(), m: new Set() };
  return null;
}

/* ---------- mechanism chain visual ---------- */
function chainHTML(d) {
  const ch = d.chain || [];
  return `<div class="chain" role="img" aria-label="Mechanism: ${esc(d.g)} → ${esc(ch.join(" → "))}">
   <div class="node first"><b>Medication</b>${esc(d.g)}</div><div class="arr">${ico("arrow")}</div>
   <div class="node"><b>Physiologic effect</b>${esc(ch[0] || "")}${ch[1] ? "<br><span class='muted'>" + esc(ch[1]) + "</span>" : ""}</div><div class="arr">${ico("arrow")}</div>
   <div class="node last"><b>Patient outcome</b>${esc(ch[2] || d.out)}</div></div>`;
}

/* ================= QUIZ RUNNER ================= */
/* opts: {items, mode:'tutor'|'exam', title, onDone(result), conf:true, el} */
/* v2: resumable quizzes — answers serialised into S.resume after every change */
const serA = a => a instanceof Set ? { $s: [...a] } : (a && typeof a === "object" && !Array.isArray(a)) ? { $b: 1, c: a.c, a: [...a.a], m: [...a.m] } : a;
const deA = a => a && a.$s ? new Set(a.$s) : a && a.$b ? { c: a.c, a: new Set(a.a), m: new Set(a.m) } : a;
function Quiz(el, opts) {
  const R0 = opts.resumeState;
  const items = R0 ? R0.items.map(r => { const q = QBYID[r.id]; return q && { q, a: deA(r.a), perm: r.perm, done: r.done, ok: r.ok, conf: r.conf, flag: r.flag, firstAtt: r.fa }; }).filter(Boolean)
    : opts.items.map(q => ({ q, a: initAns(q), perm: shuffle((q.opts || []).map((_, i) => i)), done: false, ok: null, conf: null, flag: false, firstAtt: !S.qs[q.id] }));
  let i = R0 ? Math.min(R0.i || 0, items.length - 1) : 0; const start = Date.now() - (R0 ? (R0.el || 0) * 1000 : 0); const mode = opts.mode || "tutor";
  function persist() {
    if (!opts.resumeKey) return;
    S.resume = { key: opts.resumeKey, title: opts.title || "Quiz", mode, conf: !!opts.conf, t: Date.now(), i, n: items.length, el: Math.round((Date.now() - start) / 1000), meta: opts.resumeMeta || null,
      items: items.map(x => ({ id: x.q.id, a: serA(x.a), perm: x.perm, done: x.done, ok: x.ok, conf: x.conf, flag: x.flag, fa: x.firstAtt })) };
    save();
  }
  let timerIv = null;
  function header() {
    const n = items.length;
    return `<div class="row between"><div class="label">${esc(opts.title || "")} · Question ${i + 1} of ${n}${mode === "exam" ? " · Exam mode" : " · Tutor mode"}</div>
      ${mode === "exam" ? `<div class="mono small" id="qtimer">00:00</div>` : ""}</div>
      <div class="progress-line"><i style="width:${pct(i, n)}%"></i></div>`;
  }
  function optBtn(q, it, oi, multi) {
    const sel = multi ? it.a.has(oi) : it.a === oi;
    let cls = "opt" + (multi ? " sq" : "");
    if (it.done && mode === "tutor" || opts.review) { const right = multi ? q.key.includes(oi) : q.key === oi; if (right) cls += " correct"; else if (sel) cls += " wrong"; }
    const letter = "ABCDEFGHIJ"[it.perm.indexOf(oi)];
    return `<button class="${cls}" data-o="${oi}" aria-pressed="${sel}" ${it.done && mode === "tutor" || opts.review ? "disabled" : ""}><span class="mk">${multi ? (sel ? "✓" : "") : letter}</span><span>${esc(q.opts[oi])}</span></button>`;
  }
  function body(it) {
    const q = it.q, locked = (it.done && mode === "tutor") || opts.review;
    let h = "";
    if (q.scen) h += marHTML(q.scen);
    h += `<div class="q-stem">${esc(q.stem)}</div>`;
    if (q.fmt === "sata") h += `<div class="small muted">Select all that apply.</div>`;
    if (q.fmt === "mc" || q.fmt === "sata") h += `<div class="stack" role="group">${it.perm.map(oi => optBtn(q, it, oi, q.fmt === "sata")).join("")}</div>`;
    if (q.fmt === "order") h += `<div class="small muted">Use the arrows to put the steps in order (first at the top).</div><ol class="ord">${it.a.map((oi, pos) => `<li class="${locked ? (oi === pos ? "correct" : "wrong") : ""}"><span class="n">${pos + 1}</span><span class="t">${esc(q.opts[oi])}</span>${locked ? "" : `<button class="iconbtn" data-up="${pos}" aria-label="Move up: ${esc(q.opts[oi])}" ${pos === 0 ? "disabled" : ""}>${ico("up", 16)}</button><button class="iconbtn" data-dn="${pos}" aria-label="Move down: ${esc(q.opts[oi])}" ${pos === it.a.length - 1 ? "disabled" : ""}>${ico("down", 16)}</button>`}</li>`).join("")}</ol>`;
    if (q.fmt === "matrix") h += `<div class="tbl"><table class="mx"><thead><tr><th></th>${q.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${q.rows.map((r, ri) => `<tr><th scope="row">${esc(r)}</th>${q.cols.map((c, ci) => { const chk = it.a[ri] === ci; const mark = locked ? (q.key[ri] === ci ? "ok" : chk ? "bad" : "") : ""; return `<td class="${mark}"><input type="radio" name="mx-${esc(q.id)}-${ri}" data-r="${ri}" data-c="${ci}" ${chk ? "checked" : ""} ${locked ? "disabled" : ""} aria-label="${esc(r)}: ${esc(c)}"></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (q.fmt === "bowtie") {
      const col = (title, arr, key, sel, multi, keyArr) => `<div class="stack"><h4>${title}</h4>${arr.map((o, oi) => { const s = multi ? sel.has(oi) : sel === oi; let c = "opt" + (multi ? " sq" : ""); if (locked) { const right = multi ? keyArr.includes(oi) : keyArr === oi; if (right) c += " correct"; else if (s) c += " wrong"; } return `<button class="${c}" data-bt="${key}" data-o="${oi}" aria-pressed="${s}" ${locked ? "disabled" : ""}><span class="mk">${s ? "✓" : ""}</span><span>${esc(o)}</span></button>`; }).join("")}</div>`;
      h += `<div class="small muted">Choose 1 condition, 2 actions to take, and 2 parameters to monitor.</div><div class="bow">${col("Actions to take (2)", q.act, "a", it.a.a, true, q.actKey)}${col("Most likely condition (1)", q.cond, "c", it.a.c, false, q.condKey)}${col("Parameters to monitor (2)", q.mon, "m", it.a.m, true, q.monKey)}</div>`;
    }
    return h;
  }
  function confHTML(it) {
    if (!opts.conf || it.done) return "";
    return `<div class="conf"><span class="label">How sure are you?</span>${["sure", "unsure", "guess"].map(c => `<button class="btn sm ${it.conf === c ? "primary" : ""}" data-conf="${c}" aria-pressed="${it.conf === c}">${{ sure: "Sure", unsure: "Unsure", guess: "Guessing" }[c]}</button>`).join("")}</div>`;
  }
  function feedbackHTML(it) {
    const q = it.q, ok = it.ok;
    const wrongMc = q.fmt === "mc" && !ok ? it.a : null;
    let why = "";
    if (q.why) { const ent = Object.entries(q.why); if (ent.length) why = `<div class="why"><div class="label">Why the other choices are less appropriate</div>${ent.map(([k, v]) => `<div><b>${esc((q.opts || [])[k] || "")}</b> — ${esc(v)}</div>`).join("")}</div>`; }
    const cm = S.conceptMiss[q.concept] || 0;
    const alt = !ok && cm >= 2 ? altHTML(q) : "";
    return `<div class="fb ${ok ? "ok" : "bad"}" role="status"><h4>${ico(ok ? "check" : "x")} ${ok ? (it.conf === "guess" ? "Correct — but you guessed, so it's queued for review" : "Correct") : "Not quite"}</h4>
      ${!ok ? `<div class="small"><b>Your answer:</b> ${esc(ansToText(q, it.a))}</div>${wrongMc != null && q.why && q.why[wrongMc] ? `<div class="small"><b>The misconception:</b> ${esc(q.why[wrongMc])}</div>` : ""}<div class="small"><b>Correct answer:</b> ${esc(correctText(q))}</div>` : ""}
      <div><b>Rationale.</b> ${esc(q.rat)}</div>${why}
      <div class="small"><b>Learning objective:</b> ${esc(q.obj || "")}</div>${srcHTML(q.src, q.gen)}
      ${!ok ? `<div class="small muted">Saved to your Missed list — review scheduled ${fmtDate(Date.now() + DAY)}.</div>` : ""}</div>${alt}`;
  }
  function render() {
    clearInterval(timerIv);
    if (i >= items.length) return finish();
    persist();
    const it = items[i], q = it.q;
    const canCheck = answered(q, it.a) && (!opts.conf || it.conf);
    el.innerHTML = `<div class="q card">${header()}${body(it)}${confHTML(it)}
      ${it.done && mode === "tutor" ? feedbackHTML(it) : ""}
      <div class="row between">
        <div class="row">${mode === "exam" ? `<button class="btn sm ghost" data-act="prev" ${i === 0 ? "disabled" : ""}>Previous</button><button class="btn sm ghost" data-act="flagq" aria-pressed="${it.flag}">${ico("flag", 16)} ${it.flag ? "Flagged" : "Flag for review"}</button>` : ""}</div>
        <div class="row">${mode === "tutor" ? (it.done ? `<button class="btn primary" data-act="next">${i === items.length - 1 ? "Finish" : "Next question"}</button>` : `<button class="btn primary" data-act="check" ${canCheck ? "" : "disabled"}>Check answer</button>`)
          : `${i === items.length - 1 ? `<button class="btn primary" data-act="submit">Review &amp; submit</button>` : `<button class="btn primary" data-act="next">Next</button>`}`}</div>
      </div>${mode === "exam" ? paletteHTML() : ""}</div>`;
    bind(it);
    if (mode === "exam") { const t = $("#qtimer", el); const tick = () => { if (!t.isConnected) return clearInterval(timerIv); const s = Math.floor((Date.now() - start) / 1000); t.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }; tick(); timerIv = setInterval(tick, 1000); }
  }
  function paletteHTML() {
    return `<details><summary class="small">Question map (${items.filter(x => answered(x.q, x.a)).length}/${items.length} answered)</summary><div class="row" style="margin-top:8px">${items.map((x, k) => `<button class="btn sm ${k === i ? "primary" : ""}" data-go="${k}" aria-label="Go to question ${k + 1}">${k + 1}${x.flag ? "⚑" : ""}${answered(x.q, x.a) ? "" : "·"}</button>`).join("")}</div></details>`;
  }
  function bind(it) {
    const q = it.q;
    el.onclick = e => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.conf) { it.conf = b.dataset.conf; return render(); }
      if (b.dataset.go != null) { i = +b.dataset.go; return render(); }
      if (b.dataset.bt) { const k = b.dataset.bt, o = +b.dataset.o; if (k === "c") it.a.c = o; else { const s = it.a[k]; if (s.has(o)) s.delete(o); else { if (s.size >= 2) s.delete([...s][0]); s.add(o); } } return render(); }
      if (b.dataset.o != null && (q.fmt === "mc" || q.fmt === "sata")) { const o = +b.dataset.o; if (q.fmt === "mc") it.a = o; else { it.a.has(o) ? it.a.delete(o) : it.a.add(o); } return render(); }
      if (b.dataset.up != null) { const p = +b.dataset.up; [it.a[p - 1], it.a[p]] = [it.a[p], it.a[p - 1]]; render(); const nb = $(`[data-up="${p - 1}"]`, el) || $(`[data-dn="${p - 1}"]`, el); nb && nb.focus(); return; }
      if (b.dataset.dn != null) { const p = +b.dataset.dn; [it.a[p + 1], it.a[p]] = [it.a[p], it.a[p + 1]]; render(); const nb = $(`[data-dn="${p + 1}"]`, el) || $(`[data-up="${p + 1}"]`, el); nb && nb.focus(); return; }
      const act = b.dataset.act;
      if (act === "check") { it.done = true; it.ok = evaluate(q, it.a); recordQ(q, it.ok, q.fmt === "mc" ? it.a : ansToText(q, it.a), it.conf); if (q.fmt === "mc" && !it.ok && S.missed[q.id]) S.missed[q.id].ans = q.opts[it.a]; return render(); }
      if (act === "next") { i++; return render(); }
      if (act === "prev") { i = Math.max(0, i - 1); return render(); }
      if (act === "flagq") { it.flag = !it.flag; return render(); }
      if (act === "submit") { return confirmSubmit(); }
      if (act === "alt-new") { const nq = altQuestion(q); if (nq) { items.splice(i + 1, 0, { q: nq, a: initAns(nq), perm: shuffle((nq.opts || []).map((_, k) => k)), done: false, ok: null, conf: null, flag: false }); i++; render(); } return; }
    };
    el.onchange = e => { const r = e.target; if (r.dataset.r != null) { it.a[+r.dataset.r] = +r.dataset.c; render(); } };
  }
  function confirmSubmit() {
    const un = items.filter(x => !answered(x.q, x.a)).length;
    el.insertAdjacentHTML("beforeend", `<div class="inline-confirm card" id="subconf"><b>${un ? un + " question" + (un > 1 ? "s are" : " is") + " unanswered." : "All questions answered."}</b><span class="small">Submitting scores the exam and shows every rationale.</span><div class="row"><button class="btn primary" id="doSub">Submit exam</button><button class="btn" id="noSub">Keep working</button></div></div>`);
    $("#doSub", el).onclick = () => { items.forEach(x => { x.done = true; x.ok = evaluate(x.q, x.a); recordQ(x.q, x.ok, x.q.fmt === "mc" ? x.a : ansToText(x.q, x.a), x.conf); if (x.q.fmt === "mc" && !x.ok && S.missed[x.q.id]) S.missed[x.q.id].ans = x.a != null ? x.q.opts[x.a] : "No answer"; }); i = items.length; render(); };
    $("#noSub", el).onclick = () => $("#subconf", el).remove();
    $("#doSub", el).focus();
  }
  function finish() {
    el.onclick = null; el.onchange = null;
    if (opts.resumeKey && S.resume && S.resume.key === opts.resumeKey) { S.resume = null; save(); }
    const n = items.length, c = items.filter(x => x.ok).length;
    const fa = items.filter(x => x.firstAtt), fac = fa.filter(x => x.ok).length;
    const rp = items.filter(x => !x.firstAtt), rpc = rp.filter(x => x.ok).length;
    const res = { n, c, score: pct(c, n), fa: fa.length, fac, rp: rp.length, rpc, secs: Math.round((Date.now() - start) / 1000) };
    if (opts.onDone && opts.onDone(res, items) === "custom") return;
    const bySys = {};
    items.forEach(x => sysOf(x.q).forEach(s => { bySys[s] = bySys[s] || [0, 0]; bySys[s][1]++; if (x.ok) bySys[s][0]++; }));
    el.innerHTML = `<div class="card stack-lg"><div class="row between"><div class="head"><div class="label">${esc(opts.title || "Results")}</div><h2>${res.score}% <span class="muted small">(${c}/${n})</span></h2></div>
      <div class="row"><span class="chip ${res.score >= 80 ? "badge-S" : "badge-flag"}">${res.score >= 80 ? "At or above the 80% goal" : "Below the 80% goal"}</span></div></div>
      <div class="grid g3"><div class="stat"><span class="label">First attempts</span><span class="v">${fa.length ? pct(fac, fa.length) + "%" : "—"}</span><span class="small muted">${fac}/${fa.length} new-to-you questions</span></div>
      <div class="stat"><span class="label">Repeated questions</span><span class="v">${rp.length ? pct(rpc, rp.length) + "%" : "—"}</span><span class="small muted">${rpc}/${rp.length} seen before</span></div>
      <div class="stat"><span class="label">Time</span><span class="v mono">${Math.floor(res.secs / 60)}:${String(res.secs % 60).padStart(2, "0")}</span></div></div>
      <div class="stack"><div class="label">By body system</div>${Object.entries(bySys).map(([k, [a, b]]) => `<div class="sysrow"><span>${esc(SYS[k].n)}</span><div class="bar ${pct(a, b) >= 80 ? "ok" : "bad"}"><i style="width:${pct(a, b)}%"></i></div><span class="mono">${pct(a, b)}%</span></div>`).join("")}</div>
      <div class="stack"><div class="label">Review every question</div>${items.map((x, k) => `<details class="panel"><summary>${x.ok ? "✓" : "✗"} ${k + 1}. ${esc(x.q.stem.slice(0, 110))}${x.q.stem.length > 110 ? "…" : ""}</summary><div style="margin-top:10px">${reviewHTML(x)}</div></details>`).join("")}</div>
      <div class="row"><button class="btn primary" data-nav="missed">Go to Missed questions</button><button class="btn" data-act="again">Start another</button></div></div>`;
    el.querySelector("[data-act=again]").onclick = () => opts.again ? opts.again() : route();
  }
  function reviewHTML(x) {
    const q = x.q;
    return `${q.scen ? marHTML(q.scen) : ""}<div class="small"><b>Your answer:</b> ${esc(ansToText(q, x.a))}</div><div class="small"><b>Correct:</b> ${esc(correctText(q))}</div><div class="small" style="margin-top:6px">${esc(q.rat)}</div>${srcHTML(q.src, q.gen)}`;
  }
  render();
}
function altHTML(q) {
  const d = q.drug && DRUG[q.drug];
  return `<div class="card flat stack" style="border-color:var(--accent)"><div class="label">You've missed this concept more than once — try it another way</div>
    <div><b>Short version:</b> ${esc(q.short || firstClause(q.rat))}</div>${d ? chainHTML(d) + `<div class="sticker">${esc(d.exam)}</div>` : ""}
    ${altQuestion(q) ? `<div><button class="btn sm primary" data-act="alt-new">Try a new patient scenario</button></div>` : ""}</div>`;
}
function altQuestion(q) {
  const pool = ALLQ.filter(o => o.id !== q.id && (o.concept === q.concept || (q.drug && o.drug === q.drug)));
  const unseen = pool.filter(o => !S.qs[o.id]);
  return (unseen.length ? pick(unseen) : pool.length ? pick(pool) : null);
}
function marHTML(s) {
  return `<div class="mar"><div class="order"><b>Medication order</b>${esc(s.order)}</div>
   ${[["Client", s.pt], ["Vital signs", s.vit], ["Labs", s.labs], ["Allergies", s.allergy], ["Current meds", s.meds], ["Nurse's note", s.note]].map(([k, v]) => `<div class="f"><span class="k">${k}</span><span class="${k === "Vital signs" || k === "Labs" ? "mono" : ""}">${esc(v)}</span></div>`).join("")}</div>`;
}

/* ================= FLASH RUNNER ================= */
function Flash(el, keys, opts = {}) {
  let i = 0, conf = null, shown = false, typed = "";
  const results = { got: 0, partial: 0, miss: 0 };
  function render() {
    if (i >= keys.length) { if (opts.onDone) return opts.onDone(results); el.innerHTML = `<div class="empty">No cards left here.</div>`; return; }
    const [id, kind] = keys[i].split(":"), d = DRUG[id], qa = cardQA(d, kind), c = S.cards[keys[i]];
    el.innerHTML = `<div class="flash"><div class="row between"><span class="label">Card ${i + 1} of ${keys.length} · ${esc(kind === "anti" ? "antidote" : kind)}</span><span class="lvl lvl-${levelOfCard(c)}">${levelOfCard(c)}</span></div>
      <div class="prompt">${qa.q}</div>
      ${!shown ? `<div class="field"><label for="fl-type">Answer from memory first (optional to type)</label><textarea id="fl-type" rows="2" placeholder="Say it out loud or type it…">${esc(typed)}</textarea></div>
      <div class="conf"><span class="label">How sure are you?</span>${["sure", "unsure", "guess"].map(x => `<button class="btn sm ${conf === x ? "primary" : ""}" data-c="${x}" aria-pressed="${conf === x}">${{ sure: "Sure", unsure: "Unsure", guess: "Guessing" }[x]}</button>`).join("")}</div>
      <div><button class="btn primary" id="fl-show" ${conf ? "" : "disabled"}>Reveal answer</button> ${conf ? "" : `<span class="small muted">Pick a confidence level first.</span>`}</div>` :
      `${typed ? `<div class="panel small"><b>You said:</b> ${esc(typed)}</div>` : ""}<div class="reveal"><div>${qa.a}</div>${d.aid ? `<div class="small"><b>Memory aid:</b> ${esc(d.aid)}</div>` : ""}${d.flag && kind === "safety" ? `<div class="flagbox"><b>Review this number:</b> ${esc(d.flag)}</div>` : ""}${srcHTML(d.src)}</div>
      <div class="row"><span class="label">How did you do?</span><button class="btn danger" data-g="miss">Missed it</button><button class="btn" data-g="partial">Partly</button><button class="btn primary" data-g="got">Got it</button></div>`}</div>`;
    const ta = $("#fl-type", el); if (ta) ta.oninput = () => typed = ta.value;
    el.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.c) { conf = b.dataset.c; return render(); }
      if (b.id === "fl-show") { shown = true; render(); const g = $("[data-g=got]", el); g && g.focus(); return; }
      if (b.dataset.g) { gradeCard(keys[i], b.dataset.g, conf); results[b.dataset.g]++; S.seenDrugs[id] = 1; i++; conf = null; shown = false; typed = ""; render(); } };
  }
  render();
}

/* ================= ANALYTICS ================= */
function firstAcc(n = 100, filt) { const L = S.firstLog.filter(x => !filt || filt(x)).slice(-n); return { n: L.length, c: L.filter(x => x.ok).length, p: L.length ? L.filter(x => x.ok).length / L.length : 0 }; }
function sysStats() {
  return SYSTEMS.map(s => {
    const fa = firstAcc(400, x => x.sys.includes(s.k));
    const drugs = DRUGS.filter(d => d.sys.includes(s.k));
    const m = drugs.filter(d => LEVELS.indexOf(drugLevel(d)) >= 2).length;
    const started = drugs.filter(d => drugLevel(d) !== "New").length;
    const parts = []; if (fa.n >= 3) parts.push(fa.p); if (started) parts.push(m / drugs.length);
    const score = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
    return { k: s.k, n: s.n, c: s.c, score, qn: fa.n, drugs: drugs.length, mastered: m };
  });
}
function readiness() {
  const fa = firstAcc(100), p1 = DRUGS.filter(d => d.p === 1);
  const cov = p1.filter(d => LEVELS.indexOf(drugLevel(d)) >= 2).length / p1.length;
  const ap = S.applyLog.slice(-30);
  const app = ap.length ? ap.filter(x => x.ok).length / ap.length : 0;
  return { score: Math.round(100 * (0.6 * fa.p + 0.25 * cov + 0.15 * app)), fa, cov, app, apn: ap.length, reliable: fa.n >= 30 };
}
function missedConcepts() {
  const lab = {}; ALLQ.forEach(q => { if (!lab[q.concept]) lab[q.concept] = q.short || q.obj; });
  return Object.entries(S.conceptMiss).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => ({ k, n, label: lab[k] || k }));
}

/* ================= VIEWS ================= */
const VIEWS = { home: vHome, session: vSession, library: vLibrary, systems: vSystems, games: vGames, hold: vHold, rescue: vRescue, math: vMedMath, exam: vExam, missed: vMissed, compare: vCompare, progress: vProgress, insulin: vInsulin };
/* v2 navigation: five areas; every older screen lives inside one of them, and old #hashes still work */
const AREAS = [
  { k: "home", n: "Home", ic: "home", views: ["home"] },
  { k: "learn", n: "Learn", ic: "library", views: ["library", "systems", "insulin", "session", "compare", "games"] },
  { k: "math", n: "MED Math", ic: "math", views: ["math"] },
  { k: "exams", n: "Exams", ic: "exam", views: ["exam", "hold", "rescue", "missed"] },
  { k: "progress", n: "Progress", ic: "progress", views: ["progress"] }
];
const SUBN = { insulin: "Insulin Lab", library: "Medications", systems: "Body systems", session: "Study session", compare: "Compare", games: "Matching", exam: "Practice exam", hold: "Give · hold · clarify", rescue: "Antidote rescue", missed: "Missed & weak" };
const areaOf = v => AREAS.find(a => a.views.includes(v)) || AREAS[0];
const HASH_ARG = new Set(["library", "systems", "math", "insulin"]); // sub-views that belong in the URL so Back works
const NAV = AREAS.map(a => [a.views[0], a.n]); // kept for compatibility
function shell() {
  document.documentElement.lang = "en";
  $("#app").innerHTML = `<a class="skip" href="#main" data-skip>Skip to content</a><div class="shell"><header class="top"><div class="top-row"><button class="iconbtn backbtn" id="backBtn" aria-label="Go back" hidden>${ico("back", 18)}</button><a class="brand" href="#home" aria-label="PHARM MASTER home"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--teal)"/><stop offset="1" stop-color="var(--violet)"/></linearGradient></defs><rect x="2" y="2" width="30" height="30" rx="9" fill="url(#bg1)"/><rect x="10" y="7" width="14" height="4" rx="1.5" fill="#fff" opacity=".9"/><rect x="9" y="11" width="16" height="16" rx="3.5" fill="#fff"/><path d="M14 22v-7h2.6a2 2 0 0 1 0 4H14m2.6 0 2.6 3" stroke="#193557" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div>PHARM MASTER<small>The Nursing Medication Lab</small></div></a>
    <div class="top-tools"><span class="sync" id="sync" title="Where your progress is saved"><span class="dot"></span><span>Saved on this device</span></span><button class="iconbtn" id="themeBtn" aria-label="Toggle light or dark mode"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg></button></div></div>
    <nav class="nav" aria-label="Main">${AREAS.map(a => `<a href="#${a.views[0]}" data-k="${a.k}">${ico(a.ic, 20)}<span>${a.n}</span></a>`).join("")}</nav></header>
    <main class="main" id="main" tabindex="-1"><div id="subnav"></div><div class="wrap" id="view"></div></main></div>`;
  $("#themeBtn").onclick = () => { const r = document.documentElement, cur = r.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), nx = cur === "dark" ? "light" : "dark"; r.setAttribute("data-theme", nx); try { localStorage.setItem(KEY + "-theme", nx); } catch (e) { } };
  try { const t = localStorage.getItem(KEY + "-theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) { }
  $("#backBtn").onclick = () => goBack();
  document.addEventListener("click", e => {
    const sk = e.target.closest("[data-skip]"); if (sk) { e.preventDefault(); focusMain(); return; }
    const n = e.target.closest("[data-nav]"); if (n) { e.preventDefault(); go(n.dataset.nav, n.dataset.arg); }
  });
}
let ROUTE_ARG = null, LAST_VIEW = null, LAST_HASH = null, NAV_DEPTH = 0, FIRST_ROUTE = true;
function go(k, arg) {
  if (k === "learn") k = "library"; if (k === "exams") k = "exam";
  const h = HASH_ARG.has(k) && arg != null && arg !== "" ? `${k}/${encodeURIComponent(arg)}` : k;
  ROUTE_ARG = HASH_ARG.has(k) ? null : (arg ?? null);
  if (location.hash === "#" + h) route(); else location.hash = h;
}
function goBack() { const cur = (location.hash || "#home").slice(1).split("/"); if (NAV_DEPTH > 0) { NAV_DEPTH -= 2; history.back(); } else go(cur.length > 1 ? cur[0] : areaOf(cur[0]).k === "home" ? "home" : areaOf(cur[0]).views[0] === cur[0] ? "home" : areaOf(cur[0]).views[0]); }
function focusMain() { const h = $("#view h1") || $("#view h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } else $("#main").focus({ preventScroll: true }); }
function route() {
  const raw = (location.hash || "#home").slice(1), parts = raw.split("/");
  let k = parts[0]; if (k === "learn") k = "library"; if (k === "exams") k = "exam";
  const v = VIEWS[k] ? k : "home", harg = parts.length > 1 ? decodeURIComponent(parts.slice(1).join("/")) : null;
  if (v === "library") { const ns = harg && DRUG[harg] ? harg : null; if (ns !== LIB.sel) LIB.tab = "glance"; LIB.sel = ns; }
  else if (v === "systems") SYSV.sel = harg && SYS[harg] ? harg : null;
  else if (v !== LAST_VIEW && ROUTE_ARG == null) { RES.id = null; }
  if (v === "math") { if (harg) ROUTE_ARG = harg; else if (raw !== LAST_HASH && ROUTE_ARG == null) MMV.tab = "home"; }
  if (v === "insulin") { IVV.tab = harg || "home"; }
  LAST_VIEW = v; LAST_HASH = raw;
  const area = areaOf(v);
  $$(".nav a").forEach(a => a.setAttribute("aria-current", a.dataset.k === area.k ? "page" : "false"));
  $("#subnav").innerHTML = area.views.length > 1 ? `<nav class="subnav" aria-label="${esc(area.n)} sections"><div class="subnav-in">${area.views.map(x => `<a href="#${x}" data-sub="${x}" aria-current="${x === v ? "page" : "false"}">${esc(SUBN[x])}</a>`).join("")}</div></nav>` : "";
  const bb = $("#backBtn"); if (bb) bb.hidden = v === "home" && !harg;
  const view = $("#view"); view.onclick = null; view.onchange = null; view.innerHTML = "";
  try { VIEWS[v](view, ROUTE_ARG); } catch (err) { console.error(err); view.innerHTML = `<div class="card"><h1 class="h3">Something went wrong on this screen</h1><p class="muted">${esc(err.message)}. Your progress is safe. Try another section or reload.</p></div>`; }
  ROUTE_ARG = null;
  const act = $(`.subnav a[aria-current="page"]`); act && act.scrollIntoView && act.scrollIntoView({ block: "nearest", inline: "center" });
  if (window.scrollY > 0) window.scrollTo(0, 0);
  if (!FIRST_ROUTE) focusMain(); FIRST_ROUTE = false;
}
const foot = () => `<div class="foot">For education only — not for real-time prescribing or medication administration decisions. Always follow the actual order, your facility's policy and a current drug reference. Badges show whether each fact came from your course files (Course-confirmed), mixes course and reference content (†), or needs verification.</div>`;

/* ---------- HOME (v2) ---------- */
function noteRecent(kind, id) { S.recent = (S.recent || []).filter(r => !(r.k === kind && r.id === id)); S.recent.unshift({ k: kind, id, t: Date.now() }); S.recent = S.recent.slice(0, 12); save(); }
function recentHTML() {
  const r = (S.recent || []).map(x => x.k === "drug" && DRUG[x.id] ? `<a class="pill" href="#library/${x.id}"><span class="sys-dot" style="background:${SYS[DRUG[x.id].sys[0]].c}"></span>${esc(DRUG[x.id].g)}</a>`
    : x.k === "sys" && SYS[x.id] ? `<a class="pill" href="#systems/${x.id}">${ico(x.id, 14)}${esc(SYS[x.id].n)}</a>`
    : x.k === "ins" ? `<a class="pill" href="#insulin">${ico("endo", 14)}Insulin Lab</a>`
    : x.k === "lesson" && MM.LESSONS[x.id - 1] ? `<a class="pill" href="#math/lesson%3A${x.id}">${ico("math", 14)}Lesson ${x.id}</a>` : "").filter(Boolean).slice(0, 8);
  return r.length ? `<div class="pills">${r.join("")}</div>` : `<div class="empty small">Open a medication, body system or MED MATH lesson and it will appear here.</div>`;
}
function resumeInfo() {
  const r = S.resume; if (!r || !r.items || !r.items.length || Date.now() - r.t > 14 * DAY) return null;
  return { label: `Resume ${r.title}`, sub: `Question ${Math.min(r.i + 1, r.n)} of ${r.n} · paused ${rel(r.t)}`, run: () => resumeNow() };
}
let PENDING_RESUME = false;
function resumeNow() {
  const r = S.resume; if (!r) return;
  if (r.key === "exam") { PENDING_RESUME = true; go("exam"); }
}
function vHome(el) {
  const R = readiness(), mmo = mmOverall(), overall = Math.round(0.7 * R.score + 0.3 * mmo);
  const due = dueKeys().length, mdue = mmDue().length, missDue = Object.values(S.missed).filter(m => !m.resolved && m.due <= Date.now()).length;
  const st = sysStats(), today = S.mins[dstr()] || 0, stk = streak();
  const ranked = st.filter(s => s.score != null).sort((a, b) => b.score - a.score);
  const weak = ranked.slice(-3).reverse();
  const days = S.examDate ? Math.ceil((new Date(S.examDate + "T08:00") - Date.now()) / DAY) : null;
  const plan = sessionPlan(20), res = resumeInfo();
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const ring = (v, size, label) => { const r = 54, C = 2 * Math.PI * r, off = C * (1 - clamp(v, 0, 100) / 100); return `<svg viewBox="0 0 132 132" width="${size}" height="${size}" role="img" aria-label="${label} ${v} percent"><circle cx="66" cy="66" r="${r}" fill="none" stroke="var(--track)" stroke-width="12"/><circle cx="66" cy="66" r="${r}" fill="none" stroke="url(#rg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 66 66)" class="ring-arc"/><line x1="66" y1="6" x2="66" y2="18" stroke="var(--ink)" stroke-width="2" transform="rotate(288 66 66)"/><text x="66" y="68" text-anchor="middle" font-size="28" font-weight="800" fill="var(--ink)" font-family="inherit">${v}%</text><text x="66" y="88" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="inherit">goal 80%</text><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--teal)"/><stop offset="1" stop-color="var(--violet)"/></linearGradient></defs></svg>`; };
  const cont = res || { label: due ? "Continue studying" : "Start today's session", sub: `${plan.title} · 20 minutes${due ? ` · ${due} reviews due` : ""}`, run: () => go("session", 20) };
  el.innerHTML = `
  <section class="hero2"><div class="hero2-in">
    <div class="stack"><span class="eyebrow">${greet}, Nick${stk ? ` · ${stk}-day streak` : ""}${days != null && days >= 0 ? ` · ${days} days to your exam` : ""}</span>
     <h1>Know it. Explain it. Give it safely.</h1>
     <button class="cta" id="contBtn"><span class="cta-ic">${ico(res ? "play" : "arrow", 22)}</span><span class="cta-t"><b>${esc(cont.label)}</b><small>${esc(cont.sub)}</small></span></button>
     <div class="search" role="search"><label for="hq" class="sr">Search medications</label>${ico("search", 18)}<input id="hq" type="search" placeholder="Search a drug, class, lab or antidote — e.g. Lasix, INR" autocomplete="off" aria-controls="hqres"><div id="hqres" class="search-res" role="listbox" hidden></div></div>
    </div>
    <div class="hero2-ring">${ring(overall, 148, "Overall exam readiness")}<div class="xs" style="text-align:center">Overall readiness<br><span class="muted">Pharmacology ${R.score}% · Med math ${mmo}%</span></div></div>
  </div></section>
  <div class="quick">
    <button class="qa" data-nav="library">${ico("library", 22)}<b>Medications</b><small>${DRUGS.length} drugs</small></button>
    <button class="qa" data-nav="exam">${ico("exam", 22)}<b>Practice exam</b><small>Unseen-first</small></button>
    <button class="qa" data-nav="math" data-arg="bench">${ico("math", 22)}<b>Workbench</b><small>Syringe · pump · drip</small></button>
    <button class="qa" data-nav="insulin">${ico("endo", 22)}<b>Insulin Lab</b><small>Mix · give · checkoff</small></button>
  </div>
  <div class="grid g3">
   <div class="card stack"><div class="label">${ico("clock", 14)} Due for review</div>
    <div class="due-list">
     <button class="due" data-nav="session" data-arg="10" ${due ? "" : "disabled"}><span class="n">${due}</span><span>Medication cards</span></button>
     <button class="due" data-nav="math" data-arg="review" ${mdue ? "" : "disabled"}><span class="n">${mdue}</span><span>Math skills</span></button>
     <button class="due" data-nav="missed" ${missDue ? "" : "disabled"}><span class="n">${missDue}</span><span>Missed questions</span></button>
    </div></div>
   <div class="card stack"><div class="label">${ico("eye", 14)} Recently studied</div>${recentHTML()}</div>
   <div class="card stack"><div class="row between"><div class="label">${ico("target", 14)} Today</div><span class="xs muted">${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span></div>
    <div class="row between"><span class="big"><b>${Math.round(today)}</b><span class="small muted"> / ${S.target} min</span></span><span class="small muted">${stk} day streak</span></div>
    <div class="bar ${today >= S.target ? "ok" : ""}"><i style="width:${clamp(pct(today, S.target), 0, 100)}%"></i></div>
    <div class="field"><label for="examDate">Exam date</label><input type="date" id="examDate" value="${esc(S.examDate)}"></div></div>
  </div>
  <div class="grid g2">
   <div class="card stack" id="qmm"><div class="row between"><div class="label">${ico("math", 14)} Quick MED Math challenge</div><span class="xs muted">1 problem · checked by the math engine</span></div><div id="qmmz"><p class="small muted">One calculation picked from your due and weakest skills.</p><button class="btn primary" id="qmmGo">Try one problem</button></div></div>
   <div class="card stack"><div class="label">${ico("spark", 14)} Focus next</div>${weak.length ? `<div class="stack">${weak.map(s => sysRow(s, "bad")).join("")}</div>` : `<div class="empty small">Answer a few questions and your weakest systems will show here.</div>`}
    <div class="row"><button class="btn sm" data-nav="systems">Body systems</button><button class="btn sm" data-nav="progress">Full progress</button></div></div>
  </div>
  ${foot()}`;
  $("#contBtn").onclick = cont.run;
  $("#examDate").onchange = e => { S.examDate = e.target.value; save(); route(); };
  $("#qmmGo").onclick = () => mmPractice($("#qmmz"), { next: prev => mmPickNext(prev), max: 1, title: "Quick challenge", onDone: () => { $("#qmmz").insertAdjacentHTML("beforeend", `<div class="row"><button class="btn sm" data-nav="math" data-arg="practice">Keep practicing</button></div>`); } });
  const q = $("#hq"), out = $("#hqres");
  const find = t => { t = t.toLowerCase().trim(); if (!t) return []; const sc = d => d.g.toLowerCase().startsWith(t) || d.b.toLowerCase().includes(t) ? 0 : d.cls.toLowerCase().includes(t) ? 1 : 2; return DRUGS.filter(d => [d.g, d.b, d.cls, d.ind, d.sae, d.anti, d.mon, d.exam].join(" ").toLowerCase().includes(t)).sort((a, b) => sc(a) - sc(b)).slice(0, 6); };
  q.oninput = () => { const r = find(q.value); out.hidden = !q.value.trim(); out.innerHTML = r.length ? r.map(d => `<a role="option" class="sr-item" href="#library/${d.id}"><span class="sys-dot" style="background:${SYS[d.sys[0]].c}"></span><span><b>${esc(d.g)}</b> <span class="muted small">${esc(d.b)}</span><br><span class="xs muted">${esc(d.cls)}</span></span></a>`).join("") + `<button class="sr-all" id="hqall">See all results in the library →</button>` : `<div class="sr-item muted small">No medications match “${esc(q.value)}”.</div>`; const all = $("#hqall"); if (all) all.onclick = () => { LIB.q = q.value; go("library"); }; };
  q.onkeydown = e => { if (e.key === "Enter") { const f = out.querySelector("a.sr-item"); if (f) location.hash = f.getAttribute("href").slice(1); } if (e.key === "ArrowDown") { const f = out.querySelector("a.sr-item"); if (f) { e.preventDefault(); f.focus(); } } if (e.key === "Escape") { out.hidden = true; } };
  out.onkeydown = e => { const items = [...out.querySelectorAll("a.sr-item,#hqall")], i = items.indexOf(document.activeElement); if (e.key === "ArrowDown" && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); } if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? items[i - 1] : q).focus(); } };
}
function sysRow(s, cls) { const v = Math.round(s.score * 100); return `<div class="sysrow"><span class="row" style="gap:6px;flex-wrap:nowrap"><span class="sys-dot" style="background:${s.c}"></span>${esc(s.n)}</span><div class="bar ${cls}"><i style="width:${v}%"></i></div><span class="mono">${v}%</span></div>`; }

/* ---------- SESSION ---------- */
function newDrugsQueue(n) {
  const st = sysStats(); const weakSys = st.filter(s => s.score != null).sort((a, b) => a.score - b.score).map(s => s.k);
  const fresh = DRUGS.filter(d => drugLevel(d) === "New").sort((a, b) => a.p - b.p || (weakSys.indexOf(b.sys[0]) - weakSys.indexOf(a.sys[0])));
  const out = [], usedSys = new Set();
  for (const d of fresh) { if (out.length >= n) break; if (!usedSys.has(d.sys[0])) { out.push(d); usedSys.add(d.sys[0]); } }
  for (const d of fresh) { if (out.length >= n) break; if (!out.includes(d)) out.push(d); }
  return out;
}
function applyQueue(n) {
  const st = sysStats().filter(s => s.score != null).sort((a, b) => a.score - b.score).map(s => s.k);
  const dueMissed = Object.entries(S.missed).filter(([, m]) => !m.resolved && m.due <= Date.now()).map(([id]) => QBYID[id]).filter(Boolean);
  const unseen = shuffle([...QUESTIONS, ...SCEN_Q].filter(q => !S.qs[q.id]));
  unseen.sort((a, b) => { const ia = st.indexOf(sysOf(a)[0]), ib = st.indexOf(sysOf(b)[0]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
  const out = []; const usedSys = new Set();
  dueMissed.slice(0, Math.ceil(n / 3)).forEach(q => out.push(q));
  const scen = unseen.find(q => q.scen); if (scen && out.length < n) out.push(scen);
  for (const q of unseen) { if (out.length >= n) break; if (!out.includes(q) && !usedSys.has(sysOf(q)[0])) { out.push(q); usedSys.add(sysOf(q)[0]); } }
  for (const q of shuffle(ALLQ)) { if (out.length >= n) break; if (!out.includes(q)) out.push(q); }
  return shuffle(out);
}
function sessionPlan(min) {
  const f = min / 20, revMin = Math.round(5 * f), learnMin = Math.round(7 * f), appMin = Math.round(6 * f), expMin = Math.max(1, min - revMin - learnMin - appMin);
  const nRev = Math.max(3, Math.round(revMin * 1.2)), nNew = Math.max(1, Math.round(learnMin / 3.5)), nApp = Math.max(3, Math.round(appMin / 1.2));
  const due = dueKeys().length, newD = newDrugsQueue(nNew);
  return { min, nRev, nNew, nApp, newD, title: `${min} minutes: ${Math.min(due, nRev) || "warm-up"} reviews, ${newD.length} new drug${newD.length === 1 ? "" : "s"}, ${nApp} clinical questions`,
    phases: [{ k: "review", name: "Due reviews", min: revMin, desc: due ? `${Math.min(due, nRev)} cards due now, oldest first.` : "Nothing due — warm up with your shakiest cards." },
    { k: "learn", name: "Learn new", min: learnMin, desc: newD.length ? newD.map(d => d.g).join(", ") + " — read, then recall." : "Everything has been started; reinforce weak drugs." },
    { k: "apply", name: "Clinical challenges", min: appMin, desc: `${nApp} questions from your weakest systems, including a give/hold decision.` },
    { k: "explain", name: "Explain & summarize", min: expMin, desc: "Explain one drug in your own words, then compare." }] };
}
let SESSION = null;
function vSession(el, arg) {
  if (arg) SESSION = null;
  if (!SESSION) {
    const min = +arg || 20;
    if (!arg) { el.innerHTML = `<div class="head"><span class="label">Study session</span><h1>Pick a length</h1><p>Each session follows the same rhythm, scaled to your time: review what's due, learn something new, apply it to a patient, then explain it back.</p></div><div class="grid g4">${[10, 20, 30, 45].map(m => { const p = sessionPlan(m); return `<button class="card stack" style="text-align:left;cursor:pointer" data-nav="session" data-arg="${m}"><h2>${m} min</h2>${p.phases.map(x => `<span class="small">${x.min} min · ${esc(x.name)}</span>`).join("")}</button>`; }).join("")}</div>${foot()}`; return; }
    const p = sessionPlan(min);
    let rev = dueKeys().slice(0, p.nRev);
    if (rev.length < 3) { const extra = Object.entries(S.cards).filter(([k, c]) => c.reps && !rev.includes(k)).sort((a, b) => a[1].box - b[1].box || (b[1].lapses || 0) - (a[1].lapses || 0)).slice(0, 3 - rev.length).map(([k]) => k); rev = rev.concat(extra); }
    SESSION = { min, plan: p, phase: 0, phaseStart: Date.now(), start: Date.now(), rev, learn: p.newD.map(d => d.id), learnStep: 0, learnRead: false, app: applyQueue(p.nApp), stats: { rev: 0, learned: 0, applied: 0, appliedOk: 0 } };
  }
  renderSession(el);
}
function renderSession(el) {
  const s = SESSION, ph = s.plan.phases[s.phase];
  const elapsed = Math.floor((Date.now() - s.phaseStart) / MIN);
  el.innerHTML = `<div class="row between"><div class="head"><span class="label">${s.min}-minute session</span><h2>${esc(ph.name)}</h2></div><button class="btn sm ghost" id="endS">End session</button></div>
   <div class="phase">${s.plan.phases.map((p, i) => `<span class="${i === s.phase ? "on" : i < s.phase ? "done" : ""}">${p.min}′ ${esc(p.name)}</span>`).join("")}</div>
   <div class="small muted" id="phaseClock">${elapsed} of ${ph.min} minutes used in this block.</div><div id="phaseBody"></div>`;
  $("#endS").onclick = () => { if (confirmInline(el, "End this session now? Completed work is already saved.", () => { finishSession(true); })) { } };
  const body = $("#phaseBody", el);
  const next = () => { s.phase++; s.phaseStart = Date.now(); if (s.phase >= s.plan.phases.length) return finishSession(); renderSession(el); };
  if (ph.k === "review") {
    if (!s.rev.length) { body.innerHTML = `<div class="empty">No cards to review yet — that's normal on day one. Move on to learning.</div><button class="btn primary" style="margin-top:12px">Continue</button>`; body.querySelector("button").onclick = next; return; }
    Flash(body, s.rev, { onDone: r => { s.stats.rev += r.got + r.partial + r.miss; next(); } });
  } else if (ph.k === "learn") {
    if (!s.learn.length) { body.innerHTML = `<div class="empty">You've started every drug. Reinforcing your weakest instead.</div>`; const weakest = DRUGS.filter(d => drugLevel(d) === "Learning").slice(0, 1).map(d => d.id); s.learn = weakest; if (!weakest.length) { next(); return; } }
    const d = DRUG[s.learn[s.learnStep]];
    if (!d) return next();
    if (!s.learnRead) {
      body.innerHTML = `<div class="stack-lg"><p class="muted">Read this once, slowly. Next you'll recall it without looking.</p>${quickGlance(d, false)}${chainHTML(d)}<div class="row"><button class="btn primary" id="learnGo">I've read it — test me</button><span class="small muted">Drug ${s.learnStep + 1} of ${s.learn.length}</span></div></div>`;
      $("#learnGo").onclick = () => { s.learnRead = true; renderSession(el); };
    } else {
      Flash(body, [d.id + ":core", d.id + ":safety"], { onDone: () => { s.stats.learned++; s.learnStep++; s.learnRead = false; if (s.learnStep >= s.learn.length) next(); else renderSession(el); } });
    }
  } else if (ph.k === "apply") {
    Quiz(body, { items: s.app, mode: "tutor", conf: true, title: "Clinical challenge", onDone: (r) => { s.stats.applied += r.n; s.stats.appliedOk += r.c; S.applyLog.push(...Array(r.c).fill({ t: Date.now(), ok: true }), ...Array(r.n - r.c).fill({ t: Date.now(), ok: false })); S.applyLog = S.applyLog.slice(-200); next(); return "custom"; } });
  } else {
    const d = DRUG[s.learn[0]] || DRUG[(s.rev[0] || "digoxin:core").split(":")[0]] || DRUG.digoxin;
    body.innerHTML = `<div class="card stack"><div class="label">Self-explanation</div><h3>Explain ${esc(d.g)} to a new nursing student.</h3><p class="muted">Cover how it works, why the nurse ${esc(firstClause(d.nur).toLowerCase() || "monitors it")}, and one thing you'd teach the client.</p>
     <div class="field"><label for="expl">Your explanation</label><textarea id="expl" rows="5"></textarea></div><div class="row"><button class="btn primary" id="explGo">Compare with the model answer</button></div><div id="explOut"></div></div>`;
    $("#explGo").onclick = () => { const txt = $("#expl").value.trim(); if (txt) { S.journal.push({ t: Date.now(), drug: d.id, txt }); S.journal = S.journal.slice(-60); save(); }
      $("#explOut").innerHTML = `<div class="panel stack small"><div><b>How it works:</b> ${esc(d.moa)}</div><div><b>Why the nursing action:</b> ${esc(d.nur)}</div><div><b>Teach:</b> ${esc(d.teach)}</div><div class="sticker">${esc(d.exam)}</div></div><div class="small muted">Summary of today: ${s.stats.rev} reviews, ${s.stats.learned} new drugs, ${s.stats.applied} clinical items (${pct(s.stats.appliedOk, s.stats.applied)}% correct).</div><button class="btn primary" id="finS">Finish session</button>`;
      $("#finS").onclick = () => finishSession(); };
  }
}
function finishSession(early) {
  const s = SESSION; if (!s) return go("home");
  S.sessions.push({ t: Date.now(), min: s.min, rev: s.stats.rev, learned: s.stats.learned, applied: s.stats.applied, appliedOk: s.stats.appliedOk, early: !!early });
  S.sessions = S.sessions.slice(-100); touch(); save(); SESSION = null; toast(early ? "Session ended — progress saved" : "Session complete — nice work"); go("home");
}
function confirmInline(el, msg, yes) {
  const ex = $("#inlconf"); if (ex) ex.remove();
  el.insertAdjacentHTML("afterbegin", `<div class="inline-confirm" id="inlconf"><b>${esc(msg)}</b><div class="row"><button class="btn danger" id="icYes">Yes</button><button class="btn" id="icNo">Cancel</button></div></div>`);
  $("#icYes").onclick = () => { $("#inlconf").remove(); yes(); }; $("#icNo").onclick = () => $("#inlconf").remove(); $("#icYes").focus(); return false;
}

/* ---------- LIBRARY ---------- */
const LIB = { q: "", sys: "", cls: "", pri: "", lvl: "", ver: "", anti: "", bm: false, sel: null, view: "list", tab: "glance" };
function quickGlance(d, clickable = true) {
  const lvl = drugLevel(d), tag = clickable ? "a" : "div";
  return `<${tag} class="rx" ${clickable ? `href="#library/${d.id}" data-drug="${d.id}" aria-label="${esc(d.g)}, ${esc(d.cls)}. Open lesson"` : ""} style="--sc:${SYS[d.sys[0]].c}"><div class="rx-band"></div><div class="rx-body">
   <div class="rx-top"><div><div class="rx-name">${esc(d.g)}</div><div class="rx-brand">${esc(d.b)}</div></div><span class="rx-num">P${d.p}</span></div>
   <dl><dt>Class</dt><dd>${esc(d.cls)}</dd><dt>Purpose</dt><dd>${esc(d.ind)}</dd><dt>Assess</dt><dd>${esc(clean(firstClause(d.mon)))}</dd><dt>Danger</dt><dd>${esc(clean(firstClause(d.sae)))}</dd></dl>
   <div class="sticker">${esc(d.exam)}</div></div>
   <div class="rx-foot">${verBadge(d.v)}${d.flag ? `<span class="chip badge-flag">Number to review</span>` : ""}<span class="lvl lvl-${lvl}">${lvl}</span>${S.bookmarks.includes(d.id) ? `<span class="chip">${ico("bookmark", 12)} Saved</span>` : ""}</div></${tag}>`;
}
// v2: compact, scannable list row (the full label card is one tap away)
function medRow(d) {
  const lvl = drugLevel(d);
  return `<a class="medrow" href="#library/${d.id}" data-drug="${d.id}" style="--sc:${SYS[d.sys[0]].c}"><span class="mr-ic" aria-hidden="true">${ico(d.sys[0], 18)}</span>
   <span class="mr-main"><span class="mr-name">${esc(d.g)} <span class="mr-brand">${esc(d.b)}</span></span><span class="mr-cls">${esc(d.cls)}</span><span class="mr-danger">${ico("flag", 12)} ${esc(clean(firstClause(d.sae)))}</span></span>
   <span class="mr-meta"><span class="lvl lvl-${lvl}">${lvl}</span><span class="xs muted">P${d.p}${S.bookmarks.includes(d.id) ? " · saved" : ""}</span></span></a>`;
}
function vLibrary(el, arg) {
  if (arg) LIB.sel = arg;
  if (LIB.sel && DRUG[LIB.sel]) return deepDive(el, DRUG[LIB.sel]);
  const classes = [...new Set(DRUGS.map(d => d.cls))].sort();
  el.innerHTML = `<div class="head"><span class="label">Medication library · ${DRUGS.length} drugs</span><h1>Every drug, step by step.</h1><p>Search by generic or brand name, class, indication, adverse effect, antidote, or lab. Each drug opens as a five-step lesson.</p></div>
   <div class="card stack"><div class="field"><label for="libq">Search</label><input type="search" id="libq" placeholder="e.g. Lasix, hypokalemia, INR, antidote, seizures" value="${esc(LIB.q)}"></div>
    <details class="filters" ${LIB.sys || LIB.cls || LIB.pri || LIB.lvl || LIB.ver || LIB.anti ? "open" : ""}><summary class="small"><b>Filters</b> <span class="muted">system, class, priority, mastery, source, antidote</span></summary><div class="grid g4" style="margin-top:10px">
     ${sel("libsys", "Body system", [["", "All systems"], ...SYSTEMS.map(s => [s.k, s.n])], LIB.sys)}
     ${sel("libcls", "Class", [["", "All classes"], ...classes.map(c => [c, c])], LIB.cls)}
     ${sel("libpri", "Exam priority", [["", "Any"], ["1", "P1 — highest"], ["2", "P2"], ["3", "P3"]], LIB.pri)}
     ${sel("liblvl", "Mastery", [["", "Any"], ...LEVELS.map(l => [l, l])], LIB.lvl)}
     ${sel("libver", "Source status", [["", "Any"], ["S", "Course-confirmed"], ["P", "Course + reference"], ["R", "Reference — verify"], ["flag", "Has a number to review"]], LIB.ver)}
     ${sel("libanti", "Antidote", [["", "Any"], ["y", "Has an antidote"]], LIB.anti)}
    </div></details><label class="row small"><input type="checkbox" id="libbm" ${LIB.bm ? "checked" : ""}> Show only bookmarked</label></div>
   <div class="row between"><div class="small muted" id="libcount" aria-live="polite"></div><div class="seg sm" role="group" aria-label="Layout"><button data-view="list" aria-pressed="${LIB.view === "list"}">List</button><button data-view="cards" aria-pressed="${LIB.view === "cards"}">Label cards</button></div></div><div class="${LIB.view === "cards" ? "grid g3" : "medlist"}" id="libgrid"></div>${foot()}`;
  const draw = () => {
    const q = LIB.q.toLowerCase().trim();
    const res = DRUGS.filter(d => (!LIB.sys || d.sys.includes(LIB.sys)) && (!LIB.cls || d.cls === LIB.cls) && (!LIB.pri || d.p === +LIB.pri) && (!LIB.lvl || drugLevel(d) === LIB.lvl)
      && (!LIB.ver || (LIB.ver === "flag" ? !!d.flag : d.v === LIB.ver)) && (!LIB.anti || (d.anti && !/^No antidote/.test(d.anti))) && (!LIB.bm || S.bookmarks.includes(d.id))
      && (!q || [d.g, d.b, d.cls, d.ind, d.ae, d.sae, d.anti, d.mon, d.moa, d.exam].join(" ").toLowerCase().includes(q)));
    $("#libcount").textContent = `${res.length} medication${res.length === 1 ? "" : "s"}`;
    $("#libgrid").innerHTML = res.length ? res.map(d => LIB.view === "cards" ? quickGlance(d) : medRow(d)).join("") : `<div class="empty">No medications match. Try fewer filters or a different word.</div>`;
  };
  draw();
  $("#libq").oninput = e => { LIB.q = e.target.value; draw(); };
  [["libsys", "sys"], ["libcls", "cls"], ["libpri", "pri"], ["liblvl", "lvl"], ["libver", "ver"], ["libanti", "anti"]].forEach(([id, k]) => $("#" + id).onchange = e => { LIB[k] = e.target.value; draw(); });
  $("#libbm").onchange = e => { LIB.bm = e.target.checked; draw(); };
  $$("[data-view]", el).forEach(b => b.onclick = () => { LIB.view = b.dataset.view; vLibrary(el); });
  
}
function sel(id, label, options, val) { return `<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map(([v, n]) => `<option value="${esc(v)}" ${String(val) === String(v) ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>`; }
/* v2: five-step progressive lesson per drug. All facts are the drug's own (sourced/flagged) fields — nothing new is asserted. */
const INSLINK = { lispro: "timeline", regular: "mix", nph: "mix", glargine: "cases", degludec: "chart", premix7030: "chart" };
const DSTEPS = [["glance", "Quick Glance", "eye"], ["understand", "Understand It", "bulb"], ["apply", "Apply It", "hold"], ["remember", "Remember It", "spark"], ["master", "Master It", "target"]];
function rangeOf(d) { // therapeutic ranges are read from the drug's own monitoring text, never invented
  const txt = clean([d.mon, d.nur, d.exam].join(" ")), m = txt.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*(mcg\/mL|mEq\/L|ng\/mL|mg\/dL|seconds|sec|× ?control)/i);
  if (!m) return null; const lo = +m[1], hi = +m[2]; if (!(hi > lo)) return null;
  const at = Math.max(0, m.index - 40), ctx = txt.slice(at, m.index).split(/[.;:]/).pop().trim();
  return { lo, hi, unit: m[3], label: ctx || "Target range" };
}
function rangeHTML(r) {
  const span = r.hi - r.lo, min = Math.max(0, r.lo - span * .75), max = r.hi + span * .75, X = v => ((v - min) / (max - min) * 100).toFixed(1);
  return `<div class="labvis" role="img" aria-label="${esc(r.label)}: target ${r.lo} to ${r.hi} ${esc(r.unit)}. Below is subtherapeutic, above risks toxicity."><div class="lv-track"><span class="lv-low" style="width:${X(r.lo)}%">Low</span><span class="lv-ok" style="left:${X(r.lo)}%;width:${(X(r.hi) - X(r.lo)).toFixed(1)}%">Target</span><span class="lv-hi" style="left:${X(r.hi)}%">High</span></div>
   <div class="lv-scale"><span style="left:${X(r.lo)}%">${MM.fmt(r.lo)}</span><span style="left:${X(r.hi)}%">${MM.fmt(r.hi)}</span></div><div class="xs muted">${esc(r.label)} (${esc(r.unit)}) — from this drug's monitoring notes${r.flag ? "" : ""}.</div></div>`;
}
function mechAnim(d) {
  const ch = d.chain || [];
  return `<ol class="mech" aria-label="How ${esc(d.g)} works, in three steps">${[["Medication", d.g, "rescue"], ["Effect in the body", ch[0] || d.moa, "spark"], ["What changes", ch[1] || "", "arrow"], ["Patient outcome", ch[2] || d.out, "check"]].filter(x => x[1]).map((x, i) => `<li style="--i:${i}"><span class="mech-ic">${ico(x[2], 18)}</span><span><b>${esc(x[0])}</b><span>${esc(x[1])}</span></span></li>`).join("")}</ol>`;
}
function deepDive(el, d) {
  const qs = ALLQ.filter(q => q.drug === d.id), bm = S.bookmarks.includes(d.id), fl = S.flags.includes(d.id);
  const facts = [["Generic / brand", `${d.g} — ${d.b}`], ["Class", d.cls], ["Mechanism (simply)", d.moa], ["Indications", d.ind], ["Expected outcome", d.out], ["Common adverse effects", d.ae], ["Serious effects / toxicity", d.sae], ["Contraindications & precautions", d.ci], ["Interactions", d.ix], ["Assess & monitor", d.mon], ["Nursing interventions", d.nur], ["Patient teaching", d.teach], ["Antidote / reversal", d.anti || "None specific"], ["Exam concept", d.exam], ["Memory aid", d.aid || "—"]];
  if (!DSTEPS.some(x => x[0] === LIB.tab)) LIB.tab = "glance";
  if (!(S.recent && S.recent[0] && S.recent[0].id === d.id)) noteRecent("drug", d.id);
  S.seenDrugs = S.seenDrugs || {}; const seen = S.seenDrugs[d.id] = S.seenDrugs[d.id] || {}; seen[LIB.tab] = 1;
  const scen = SCEN_Q.filter(q => q.drug === d.id), clin = QUESTIONS.filter(q => q.drug === d.id), unseen = qs.filter(q => !S.qs[q.id]);
  const rg = rangeOf(d), stepI = DSTEPS.findIndex(x => x[0] === LIB.tab);
  const kinds = cardKinds(d).map(k => ({ k, c: S.cards[d.id + ":" + k] }));
  const panel = {
    glance: () => `${INSLINK[d.id] ? `<a class="inslink" href="#insulin/${INSLINK[d.id]}">${ico("endo", 18)}<span><b>Open the Insulin Lab</b><span class="small">${d.id === "nph" || d.id === "regular" ? "Mix regular + NPH step by step, read the curves, practice the checkoff" : "Timeline, give/hold/clarify cases, pen and syringe checkoffs"}</span></span>${ico("arrow", 16)}</a>` : ""}${updHTML(d)}${quickGlance(d, false)}<div class="grid g2"><div class="panel stack"><span class="label">${ico("flag", 14)} Major safety concern</span><div>${esc(clean(d.sae))}</div></div><div class="panel stack"><span class="label">${ico("eye", 14)} Essential nursing assessment</span><div>${esc(clean(d.mon))}</div></div></div>${d.anti && !/^No antidote/.test(d.anti) ? `<div class="panel row"><span class="label">Antidote / reversal</span><b>${esc(clean(d.anti))}</b></div>` : ""}`,
    understand: () => `<div class="card stack"><span class="label">In plain language</span><p class="lead">${esc(clean(d.moa))}</p>${mechAnim(d)}</div>
      ${rg ? `<div class="card stack"><span class="label">Lab monitoring</span>${rangeHTML(rg)}</div>` : ""}
      <div class="card stack"><span class="label">Mechanism chain</span>${chainHTML(d)}<div class="grid g2"><div class="panel"><span class="label">Indications</span><div>${esc(clean(d.ind))}</div></div><div class="panel"><span class="label">Expected outcome</span><div>${esc(clean(d.out))}</div></div></div></div>`,
    apply: () => `<div class="grid g3 admin"><div class="panel stack"><span class="label">1 · Before you give</span><div class="small"><b>Assess:</b> ${esc(clean(d.mon))}</div><div class="small"><b>Do not give / use caution:</b> ${esc(clean(d.ci))}</div></div><div class="panel stack"><span class="label">2 · While giving</span><div class="small">${esc(clean(d.nur))}</div><div class="small"><b>Interactions:</b> ${esc(clean(d.ix))}</div></div><div class="panel stack"><span class="label">3 · After — evaluate</span><div class="small"><b>Working:</b> ${esc(clean(d.out))}</div><div class="small"><b>Report:</b> ${esc(clean(d.sae))}</div></div></div>
      <div class="card stack"><div class="row between"><span class="label">Administration scenario${scen.length + clin.length > 1 ? "s" : ""}</span><span class="xs muted">${scen.length} give/hold · ${clin.length} clinical</span></div>${scen.length || clin.length ? `<div id="applyz"><button class="btn primary" id="applyGo">${ico("play", 16)} Start the scenario</button></div>` : `<div class="empty small">No authored scenario for this drug yet — use Master It for generated practice, or try Give · hold · clarify.</div>`}</div>`,
    remember: () => `<div class="grid g2"><div class="card stack aid"><span class="label">${ico("bulb", 14)} Memory aid</span><p class="lead">${esc(d.aid || d.exam)}</p><div class="small muted"><b>Exam concept:</b> ${esc(d.exam)}</div></div>
      <div class="card stack"><span class="label">Recall check</span><p class="small muted">Say or write the answer before you reveal it — that retrieval is what builds memory.</p><button class="btn primary" id="drill">Recall drill (${kinds.length} cards)</button></div></div>
      <div class="card stack"><div class="label">Explain it back</div><div class="field"><label for="ddx">Why does the nurse ${esc(firstClause(d.nur).toLowerCase())}?</label><textarea id="ddx"></textarea></div><div class="row"><button class="btn sm" id="ddxGo">Save &amp; compare</button></div><div id="ddxOut"></div></div>
      <div id="ddzone"></div>`,
    master: () => `<div class="card stack"><div class="row between"><span class="label">Unseen questions</span><span class="xs muted">${unseen.length} new of ${qs.length}</span></div><p class="small muted">Questions you haven't answered come first, so this checks understanding rather than memory of a past answer.</p>
      <div class="row"><button class="btn primary" id="quizMe" ${qs.length ? "" : "disabled"}>${qs.length ? `Answer ${Math.min(6, qs.length)} questions` : "No questions yet"}</button>${drugMathFor(d) ? `<button class="btn" data-nav="math" data-arg="drug:${d.id}">${ico("math", 16)} Med math challenge</button>` : ""}</div></div>
      <div class="card stack"><span class="label">Spaced review status</span><div class="srs">${kinds.map(x => `<div class="srs-row"><span>${esc({ core: "Core action", safety: "Safety check", danger: "Danger signs", teach: "Teaching", anti: "Antidote" }[x.k] || x.k)}</span><span class="lvl lvl-${levelOfCard(x.c)}">${levelOfCard(x.c)}</span><span class="xs muted">${x.c && x.c.due ? (x.c.due <= Date.now() ? "due now" : "next " + fmtDate(x.c.due)) : "not started"}</span></div>`).join("")}</div></div>
      <div id="ddzone"></div>`
  };
  el.innerHTML = `<div class="row inback"><button class="btn sm ghost" id="back">${ico("back", 16)} Back</button></div>
   <div class="drughead" style="--sc:${SYS[d.sys[0]].c}"><div class="head"><div class="row">${sysChips(d.sys)}${verBadge(d.v)}<span class="lvl lvl-${drugLevel(d)}">${drugLevel(d)}</span></div><h1>${esc(d.g)}</h1><p>${esc(d.b)} · ${esc(d.cls)}</p></div>
    <div class="row"><button class="btn sm" id="bmBtn" aria-pressed="${bm}">${ico("bookmark", 16)} ${bm ? "Bookmarked" : "Bookmark"}</button><button class="btn sm" id="flBtn" aria-pressed="${fl}">${ico("flag", 16)} ${fl ? "Flagged" : "Flag for review"}</button></div></div>
   <div class="steps" role="tablist" aria-label="Lesson steps">${DSTEPS.map(([k, n, ic], i) => `<button role="tab" id="tab-${k}" aria-selected="${k === LIB.tab}" aria-controls="ddpanel" tabindex="${k === LIB.tab ? 0 : -1}" data-tab="${k}" class="${seen[k] ? "seen" : ""}"><span class="st-n">${seen[k] && k !== LIB.tab ? ico("check", 14) : i + 1}</span><span>${n}</span></button>`).join("")}</div>
   ${d.flag ? `<div class="flagbox"><b>Number or claim to review:</b> ${esc(d.flag)}</div>` : ""}
   <div id="ddpanel" role="tabpanel" aria-labelledby="tab-${LIB.tab}" class="stack-lg">${panel[LIB.tab]()}</div>
   <div class="row between steps-nav">${stepI > 0 ? `<button class="btn" data-tab="${DSTEPS[stepI - 1][0]}">${ico("back", 16)} ${DSTEPS[stepI - 1][1]}</button>` : "<span></span>"}${stepI < DSTEPS.length - 1 ? `<button class="btn primary" data-tab="${DSTEPS[stepI + 1][0]}">Next: ${DSTEPS[stepI + 1][1]} ${ico("arrow", 16)}</button>` : `<button class="btn" data-nav="library">${ico("library", 16)} Back to all medications</button>`}</div>
   <details class="card allfacts"><summary><b>All ${facts.length} facts</b> <span class="small muted">— complete reference for ${esc(d.g)}</span></summary><div class="facts">${facts.map(([k, v]) => `<div class="f"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("")}</div>${srcHTML(d.src)}${d.v === "P" ? `<div class="small muted">Items marked † are supplementary reference information, not from your course files.</div>` : ""}</details>
   ${foot()}`;
  save();
  const setTab = k => { LIB.tab = k; deepDive(el, d); const t = $(`#tab-${k}`, el); t && t.focus(); };
  $(".steps", el).onkeydown = e => { const i = DSTEPS.findIndex(x => x[0] === LIB.tab); if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setTab(DSTEPS[(i + (e.key === "ArrowRight" ? 1 : DSTEPS.length - 1)) % DSTEPS.length][0]); } if (e.key === "Home") { e.preventDefault(); setTab(DSTEPS[0][0]); } if (e.key === "End") { e.preventDefault(); setTab(DSTEPS[DSTEPS.length - 1][0]); } };
  $$("[data-tab]", el).forEach(b => b.onclick = () => { setTab(b.dataset.tab); if (b.closest(".steps-nav")) $(".steps", el).scrollIntoView({ block: "start", behavior: "smooth" }); });
  $("#back").onclick = () => goBack();
  $("#bmBtn").onclick = () => { S.bookmarks = bm ? S.bookmarks.filter(x => x !== d.id) : [...S.bookmarks, d.id]; save(); deepDive(el, d); };
  $("#flBtn").onclick = () => { S.flags = fl ? S.flags.filter(x => x !== d.id) : [...S.flags, d.id]; save(); deepDive(el, d); };
  const dr = $("#drill"); if (dr) dr.onclick = () => { Flash($("#ddzone"), cardKinds(d).map(k => d.id + ":" + k), { onDone: r => { $("#ddzone").innerHTML = `<div class="card">Drill done: ${r.got} got it, ${r.partial} partly, ${r.miss} missed. Missed cards come back in 10 minutes.</div>`; } }); $("#ddzone").scrollIntoView({ behavior: "smooth" }); };
  const qm = $("#quizMe"); if (qm && qs.length) qm.onclick = () => { const pool = [...shuffle(unseen), ...shuffle(qs.filter(q => S.qs[q.id]))].slice(0, 6); Quiz($("#ddzone"), { items: pool, mode: "tutor", conf: true, title: d.g }); $("#ddzone").scrollIntoView({ behavior: "smooth" }); };
  const ag = $("#applyGo"); if (ag) ag.onclick = () => { Quiz($("#applyz"), { items: [...shuffle(scen), ...shuffle(clin)].slice(0, 4), mode: "tutor", conf: true, title: d.g + " · apply it" }); };
  const dx = $("#ddxGo"); if (dx) dx.onclick = () => { const t = $("#ddx").value.trim(); if (t) { S.journal.push({ t: Date.now(), drug: d.id, txt: t }); save(); } $("#ddxOut").innerHTML = `<div class="panel small"><b>Compare:</b> ${esc(clean(d.moa))} ${esc(clean(d.nur))}</div>`; };
}

/* ---------- SYSTEMS ---------- */
const SYSV = { sel: null };
function vSystems(el, arg) {
  if (arg) SYSV.sel = arg;
  if (SYSV.sel) return moduleView(el, SYSV.sel);
  const st = Object.fromEntries(sysStats().map(s => [s.k, s]));
  el.innerHTML = `<div class="head"><span class="label">Learn by body system</span><h1>Sixteen modules.</h1><p>Each has a visual intro, the classes, the high-priority drugs, safety warnings, a comparison, memory aids, practice questions and a mastery check.</p></div>
   <div class="grid g3">${SYSTEMS.map(s => { const x = st[s.k], best = S.sysScores[s.k]; return `<button class="systile" data-sys="${s.k}"><span class="ic" style="background:${s.c}22;color:${s.c}">${ico(s.k, 26)}</span><span class="meta"><b>${esc(s.n)}</b><span class="small muted">${x.drugs} drugs · ${x.mastered} at Reviewing+${best ? ` · check ${best.best}%` : ""}</span></span></button>`; }).join("")}</div>${foot()}`;
  el.onclick = e => { const b = e.target.closest("[data-sys]"); if (b) { el.onclick = null; go("systems", b.dataset.sys); } };
}
function moduleView(el, k) {
  const s = SYS[k], M = MODULES[k], drugs = DRUGS.filter(d => d.sys.includes(k));
  const classes = [...new Set(drugs.map(d => d.cls))];
  const pri = drugs.filter(d => d.p === 1).slice(0, 6);
  const authored = [...QUESTIONS, ...SCEN_Q].filter(q => sysOf(q).includes(k));
  const cmp = M.compare && COMPARE.find(c => c.id === M.compare);
  el.innerHTML = `<div class="row inback"><button class="btn sm ghost" id="back">${ico("back", 16)} Back</button></div>
   <div class="card modhead" style="--sc:${s.c}"><div class="hero"><div class="head"><span class="label">Module</span><h1>${esc(s.n)}</h1><p>${esc(M.intro)}</p></div><span class="ic" style="color:${s.c}">${ico(k, 96)}</span></div></div>
   ${k === "endo" ? `<a class="inslink big" href="#insulin">${ico("endo", 22)}<span><b>Insulin Learning Lab</b><span class="small">Timeline & clock · Give/Treat/Clarify cases · vial mixing · pen & syringe checkoffs · 44-item quiz</span></span>${ico("arrow", 18)}</a>` : ""}
   <div class="grid g2"><div class="card stack"><div class="label">Class map · tap a class</div><div class="classmap" id="classmap" role="group" aria-label="Drug classes in ${esc(s.n)}">${classes.map(c => `<button class="cls-node" data-cls="${esc(c)}" aria-pressed="false" style="--sc:${s.c}"><b>${esc(c)}</b><span class="xs muted">${drugs.filter(d => d.cls === c).length} drug${drugs.filter(d => d.cls === c).length > 1 ? "s" : ""}</span></button>`).join("")}</div><div id="classout" aria-live="polite"><div class="xs muted">Choose a class to see how it works and which drugs belong to it.</div></div></div>
    <div class="card stack"><div class="label">Safety warnings</div>${M.warn.map(w => `<div class="sticker">${esc(w)}</div>`).join("")}</div></div>
   <div class="stack"><div class="label">High-priority medications</div><div class="grid g3" id="mpri">${(pri.length ? pri : drugs.slice(0, 3)).map(d => quickGlance(d)).join("")}</div></div>
   ${cmp ? `<div class="card stack"><div class="label">Comparison chart</div><h2 class="h3">${esc(cmp.t)}</h2>${compareTable(cmp)}<p class="small"><b>What actually matters:</b> ${esc(cmp.point)}</p></div>` : ""}
   <div class="card stack"><div class="label">Memory aids</div>${M.aids.map(a => `<div class="panel">${esc(a)}</div>`).join("")}<p class="small muted">Memory aids help you retrieve; they don't replace practicing the retrieval itself.</p></div>
   <div class="card stack"><div class="row between"><div class="head"><div class="label">Practice</div><h2 class="h3">${Math.min(10, authored.length)} original questions</h2></div><div class="row"><button class="btn" id="mprac">Practice (tutor mode)</button><button class="btn primary" id="mcheck">Mastery check</button></div></div>
    ${S.sysScores[k] ? `<div class="small">Last mastery check: <b>${S.sysScores[k].last}%</b> · best ${S.sysScores[k].best}%</div>` : ""}<div id="mzone"></div></div>${foot()}`;
  $("#back").onclick = () => goBack();
  noteRecent("sys", k);
  const cm = $("#classmap"); if (cm) cm.onclick = e => { const b = e.target.closest("[data-cls]"); if (!b) return; $$("[data-cls]", cm).forEach(x => x.setAttribute("aria-pressed", x === b)); const c = b.dataset.cls, ds = drugs.filter(d => d.cls === c), r = ds[0]; $("#classout").innerHTML = `<div class="panel stack"><b>${esc(c)}</b><div class="small">${esc(clean(r.moa))}</div>${chainHTML(r)}<div class="pills">${ds.map(d => `<a class="pill" href="#library/${d.id}">${esc(d.g)}</a>`).join("")}</div><div class="xs muted">Mechanism shown for ${esc(r.g)}; open each drug for its own details.</div></div>`; };
  $("#mprac").onclick = () => Quiz($("#mzone"), { items: shuffle(authored).slice(0, 10), mode: "tutor", conf: true, title: s.n + " practice" });
  $("#mcheck").onclick = () => {
    const gen = shuffle(GEN.filter(q => q.sys.includes(k)));
    const items = shuffle([...shuffle(authored).slice(0, 7), ...gen].slice(0, 10));
    Quiz($("#mzone"), { items, mode: "exam", title: s.n + " mastery check", onDone: r => { const o = S.sysScores[k] || { best: 0 }; S.sysScores[k] = { last: r.score, best: Math.max(o.best, r.score), t: Date.now() }; save(); } });
  };
}

/* ---------- GAMES ---------- */
const GMODES = [
  ["brand", "Generic → brand", d => d.b && !/^[—(]/.test(d.b) ? d.b.split(",")[0].trim() : null],
  ["class", "Drug → class", d => d.cls],
  ["mech", "Class → mechanism", d => d.moa, d => d.cls],
  ["ind", "Drug → indication", d => firstClause(d.ind)],
  ["ae", "Drug → serious adverse effect", d => firstClause(d.sae)],
  ["anti", "Drug → antidote", d => d.anti && !/^No antidote/.test(d.anti) ? firstClause(d.anti) : null],
  ["lab", "Drug → lab or monitoring", d => firstClause(d.mon)]
];
const GAME = { mode: "anti", pairs: [], left: [], right: [], selL: null, selR: null, done: new Set(), err: 0, start: 0, over: false };
function newGame(mode) {
  const m = GMODES.find(x => x[0] === mode); GAME.mode = mode;
  const L = m[3] || (d => d.g);
  const pool = shuffle(DRUGS.filter(d => m[2](d)));
  const pairs = [], seenR = new Set(), seenL = new Set();
  for (const d of pool) { const r = m[2](d), l = L(d); if (seenR.has(r) || seenL.has(l)) continue; seenR.add(r); seenL.add(l); pairs.push({ id: d.id, l, r }); if (pairs.length === 5) break; }
  Object.assign(GAME, { pairs, left: shuffle(pairs.map(p => p.id)), right: shuffle(pairs.map(p => p.id)), selL: null, selR: null, done: new Set(), err: 0, start: Date.now(), over: false });
}
function vGames(el) {
  if (!GAME.pairs.length) newGame(GAME.mode);
  const P0 = Object.fromEntries(GAME.pairs.map(p => [p.id, p]));
  const secs = Math.round((Date.now() - GAME.start) / 1000);
  el.innerHTML = `<div class="head"><span class="label">Matching games</span><h1>Make the pairs.</h1><p>Pick a tile on the left and its match on the right. Works with mouse, touch, or keyboard (<span class="kbd">Tab</span> to move, <span class="kbd">Enter</span> to choose).</p></div>
   <div class="seg" role="group" aria-label="Game type">${GMODES.map(m => `<button data-mode="${m[0]}" aria-pressed="${GAME.mode === m[0]}">${esc(m[1])}</button>`).join("")}</div>
   <div class="card stack">${GAME.over ? `<div class="fb ok"><h4>${ico("check")} All ${GAME.pairs.length} matched in ${secs}s with ${GAME.err} miss${GAME.err === 1 ? "" : "es"}.</h4><div class="small">Best for this game: ${S.games.best[GAME.mode] != null ? S.games.best[GAME.mode] + " misses" : "—"}</div><div class="row"><button class="btn primary" id="again">New round</button></div></div>` : `<div class="row between small"><span>${GAME.done.size}/${GAME.pairs.length} matched · ${GAME.err} miss${GAME.err === 1 ? "" : "es"}</span><button class="btn sm ghost" id="again">Shuffle new set</button></div>`}
    <div class="match"><div class="col" aria-label="Left column">${GAME.left.map(id => `<button class="tile ${GAME.done.has(id) ? "done" : ""}" data-l="${id}" aria-pressed="${GAME.selL === id}" ${GAME.done.has(id) ? "disabled" : ""}>${esc(P0[id].l)}</button>`).join("")}</div>
    <div class="col" aria-label="Right column">${GAME.right.map(id => `<button class="tile ${GAME.done.has(id) ? "done" : ""}" data-r="${id}" aria-pressed="${GAME.selR === id}" ${GAME.done.has(id) ? "disabled" : ""}>${esc(P0[id].r)}</button>`).join("")}</div></div>
    <div class="small muted" aria-live="polite" id="gmsg"></div></div>${foot()}`;
  el.onclick = e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.mode) { newGame(b.dataset.mode); return vGames(el); }
    if (b.id === "again") { newGame(GAME.mode); return vGames(el); }
    if (b.dataset.l) GAME.selL = b.dataset.l; if (b.dataset.r) GAME.selR = b.dataset.r;
    if (GAME.selL && GAME.selR) {
      if (GAME.selL === GAME.selR) { GAME.done.add(GAME.selL); const msg = `Matched: ${P0[GAME.selL].l} → ${P0[GAME.selL].r}`; GAME.selL = GAME.selR = null;
        if (GAME.done.size === GAME.pairs.length) { GAME.over = true; S.games.played++; const b0 = S.games.best[GAME.mode]; S.games.best[GAME.mode] = b0 == null ? GAME.err : Math.min(b0, GAME.err); touch(); save(); }
        vGames(el); $("#gmsg").textContent = msg; return; }
      GAME.err++; const l = GAME.selL, r = GAME.selR; GAME.selL = GAME.selR = null; vGames(el);
      [$(`[data-l="${l}"]`), $(`[data-r="${r}"]`)].forEach(x => x && x.classList.add("shake")); $("#gmsg").textContent = "Not a match — try again."; return;
    }
    vGames(el); const again = $(`[data-${b.dataset.l ? "l" : "r"}="${b.dataset.l || b.dataset.r}"]`); again && again.focus();
  };
}

/* ---------- HOLD / GIVE ---------- */
function vHold(el, arg) {
  el.innerHTML = `<div class="head"><span class="label">Hold, give, or clarify?</span><h1>Read the order. Then decide.</h1><p>Each case gives its own order and parameters — there are no universal hold numbers here. Pick the safest action and see why the others fall short.</p></div>
   <div class="grid g3" id="hlist">${SCEN_Q.map(q => { const r = S.hold[q.id]; const s = q.scen; return `<button class="card stack" style="text-align:left;cursor:pointer" data-h="${q.id}"><div class="row between"><span class="label">${esc(DRUG[s.drug] ? DRUG[s.drug].g : s.drug)}</span>${r ? `<span class="chip ${r.cor ? "badge-S" : "badge-flag"}">${r.cor}/${r.att} correct</span>` : `<span class="chip">New</span>`}</div><h4>${esc(s.title)}</h4><span class="small mono muted">${esc(s.order)}</span></button>`; }).join("")}</div>
   <div id="hzone"></div>${foot()}`;
  const open = id => { const q = QBYID[id]; Quiz($("#hzone"), { items: [q], mode: "tutor", conf: true, title: q.scen.title, onDone: () => { vHold(el); return "custom"; } }); $("#hzone").scrollIntoView({ behavior: "smooth", block: "start" }); };
  $("#hlist").onclick = e => { const b = e.target.closest("[data-h]"); if (b) open(b.dataset.h); };
  if (arg) open(arg);
}

/* ---------- RESCUE ---------- */
const RES = { id: null, shown: 1, step: 0, ans: {}, score: 0 };
function vRescue(el) {
  if (!RES.id) {
    el.innerHTML = `<div class="head"><span class="label">Toxicity &amp; antidote rescue</span><h1>Something's wrong. Find it fast.</h1><p>Cues appear one at a time. Name the problem, choose the priority action, then the antidote or treatment — and review the stabilization care.</p></div>
     <div class="grid g3">${RESCUE.map(r => { const s = S.rescue[r.id]; return `<button class="card stack" style="text-align:left;cursor:pointer" data-r="${r.id}"><div class="row between"><span class="label">${esc(DRUG[r.drug] ? DRUG[r.drug].g : "")}</span>${s ? `<span class="chip ${s.best === 3 ? "badge-S" : "badge-R"}">best ${s.best}/3</span>` : ""}</div><h4>${esc(r.title)}</h4></button>`; }).join("")}</div>${foot()}`;
    el.onclick = e => { const b = e.target.closest("[data-r]"); if (b) { Object.assign(RES, { id: b.dataset.r, shown: 1, step: 0, ans: {}, score: 0, o0: null, o1: null, o2: null }); el.onclick = null; vRescue(el); } };
    return;
  }
  const r = RESCUE.find(x => x.id === RES.id), qs = [r.q1, r.q2, r.q3];
  const allCues = RES.shown >= r.cues.length;
  let html = `<div class="row"><button class="btn sm ghost" id="back">← All cases</button></div><div class="head"><span class="label">Rescue case</span><h2>${esc(r.title)}</h2></div>
   <div class="card stack"><div class="label">Cues</div><div class="cues">${r.cues.map((c, i) => `<div class="cue ${i < RES.shown ? "" : "hidden"}">${i < RES.shown ? esc(c) : "Hidden cue"}</div>`).join("")}</div>
   ${!allCues ? `<div class="row"><button class="btn" id="more">Reveal next cue</button>${RES.step === 0 ? `<span class="small muted">Or decide now — fewer cues is the real test.</span>` : ""}</div>` : ""}</div>`;
  qs.forEach((q, qi) => {
    if (qi > RES.step) return;
    const a = RES.ans[qi], order = RES["o" + qi] || (RES["o" + qi] = shuffle(q.o.map((_, i) => i)));
    html += `<div class="card stack"><div class="label">Step ${qi + 1} of 3</div><h4>${esc(q.s)}</h4><div class="stack">${order.map(oi => { let c = "opt"; if (a != null) { if (oi === q.k) c += " correct"; else if (oi === a) c += " wrong"; } return `<button class="${c}" data-q="${qi}" data-o="${oi}" ${a != null ? "disabled" : ""}><span class="mk"></span><span>${esc(q.o[oi])}</span></button>`; }).join("")}</div></div>`;
  });
  if (RES.step >= 3) {
    html += `<div class="fb ${RES.score === 3 ? "ok" : "bad"}"><h4>${RES.score}/3 correct</h4><div><b>Assessment &amp; stabilization:</b> ${esc(r.stab)}</div>${DRUG[r.drug] ? chainHTML(DRUG[r.drug]) : ""}${srcHTML(r.src)}<div class="row"><button class="btn primary" id="nextCase">Next case</button><button class="btn" id="back2">All cases</button></div></div>`;
  }
  el.innerHTML = html + foot();
  $("#back").onclick = () => { RES.id = null; vRescue(el); };
  const more = $("#more"); if (more) more.onclick = () => { RES.shown++; vRescue(el); };
  el.onclick = e => { const b = e.target.closest("[data-q]"); if (!b || b.disabled) return; const qi = +b.dataset.q, oi = +b.dataset.o; RES.ans[qi] = oi; if (oi === qs[qi].k) RES.score++; RES.step = qi + 1;
    if (RES.step === 1) RES.shown = Math.max(RES.shown, r.cues.length);
    if (RES.step >= 3) { const s = S.rescue[r.id] || { att: 0, best: 0 }; s.att++; s.best = Math.max(s.best, RES.score); S.rescue[r.id] = s; S.applyLog.push({ t: Date.now(), ok: RES.score === 3 }); touch(); save(); }
    vRescue(el); };
  const nx = $("#nextCase"); if (nx) nx.onclick = () => { const i = RESCUE.findIndex(x => x.id === r.id); Object.assign(RES, { id: RESCUE[(i + 1) % RESCUE.length].id, shown: 1, step: 0, ans: {}, score: 0, o0: null, o1: null, o2: null }); vRescue(el); };
  const b2 = $("#back2"); if (b2) b2.onclick = () => { RES.id = null; vRescue(el); };
}

/* ---------- EXAM ---------- */
const EX = { n: 25, mode: "exam", sys: "", prefer: "new" };
function vExam(el) {
  if (PENDING_RESUME && S.resume && S.resume.key === "exam") { PENDING_RESUME = false; return startExam(el, null, S.resume.mode, S.resume); }
  const ri = resumeInfo();
  el.innerHTML = `<div class="head"><span class="label">HESI / NCLEX-PN style simulator</span><h1>Practice under pressure.</h1><p>Single best answer, select-all, ordered response, matrix and bow-tie items, plus give/hold cases. Exam mode holds rationales until you submit; tutor mode explains each one. Each exam uses one question per concept, and first attempts are scored separately from repeats.</p></div>
   ${ri ? `<div class="card row between resume"><div class="stack"><span class="label">${ico("play", 14)} Interrupted exam saved</span><b>${esc(S.resume.title)}</b><span class="small muted">${esc(ri.sub)}</span></div><div class="row"><button class="btn primary" id="exRes">Resume</button><button class="btn ghost sm" id="exDiscard">Discard</button></div></div>` : ""}
   <div class="card stack"><div class="stack"><span class="label">Length</span><div class="seg" role="group">${[10, 25, 50, 75, 100].map(n => `<button data-n="${n}" aria-pressed="${EX.n === n}">${n}</button>`).join("")}</div></div>
    <div class="stack"><span class="label">Mode</span><div class="seg" role="group"><button data-m="exam" aria-pressed="${EX.mode === "exam"}">Exam mode</button><button data-m="tutor" aria-pressed="${EX.mode === "tutor"}">Tutor mode</button></div></div>
    <div class="grid g2">${sel("exsys", "Body system", [["", "All systems (interleaved)"], ...SYSTEMS.map(s => [s.k, s.n])], EX.sys)}${sel("expref", "Question pool", [["new", "Unseen first (recommended)"], ["unseen", "Unseen only — true first attempts"], ["any", "Any questions"], ["missed", "Previously missed first"]], EX.prefer)}</div>
    <div class="small muted">Bank: ${QUESTIONS.length} authored items + ${SCEN_Q.length} give/hold cases + ${GEN.length} items generated from the medication database. You've seen ${Object.keys(S.qs).length}.</div>
    <div><button class="btn primary" id="exGo">Start ${EX.n}-question ${EX.mode === "exam" ? "exam" : "tutor session"}</button></div></div>
   ${S.exams.length ? `<div class="card stack"><div class="label">Recent exams</div>${S.exams.slice(-6).reverse().map(x => `<div class="row between small"><span>${fmtDate(x.t)} · ${x.n} questions · ${x.mode}</span><span class="mono"><b>${x.score}%</b> · first attempts ${x.fa ? pct(x.fac, x.fa) + "%" : "—"}</span></div>`).join("")}</div>` : ""}
   <div id="exzone"></div>${foot()}`;
  el.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.n) { EX.n = +b.dataset.n; vExam(el); } if (b.dataset.m) { EX.mode = b.dataset.m; vExam(el); } };
  $("#exsys").onchange = e => { EX.sys = e.target.value; }; $("#expref").onchange = e => { EX.prefer = e.target.value; };
  if (ri) { $("#exRes").onclick = () => startExam(el, null, S.resume.mode, S.resume); $("#exDiscard").onclick = () => confirmInline($("#exDiscard").closest(".card"), "Discard the saved exam? Answers already checked stay in your history.", () => { S.resume = null; save(); route(); }); }
  $("#exGo").onclick = () => { el.onclick = null; startExam(el, buildExam(EX.n, EX.sys, EX.prefer), EX.mode); };
}
function startExam(el, items, mode, resumeState) {
  el.onclick = null; el.innerHTML = `<div id="exzone"></div>`;
  const title = resumeState ? resumeState.title : `${items.length}-question ${mode === "exam" ? "exam" : "tutor session"}`;
  Quiz($("#exzone", el), { items, mode, conf: mode === "tutor", title, resumeKey: "exam", resumeState, onDone: r => { S.exams.push({ t: Date.now(), n: r.n, score: r.score, mode, fa: r.fa, fac: r.fac }); S.exams = S.exams.slice(-50); save(); }, again: () => route() });
  window.scrollTo(0, 0);
}
// v2: one item per concept (and at most 2 per drug) so an exam can't reward recognising a repeated scenario;
// "unseen first" is the default and "unseen only" measures comprehension on brand-new items.
function buildExam(n, sys, prefer) {
  const auth = [...QUESTIONS, ...SCEN_Q].filter(q => !sys || sysOf(q).includes(sys));
  const gen = GEN.filter(q => !sys || q.sys.includes(sys));
  const seen = q => !!S.qs[q.id];
  const score = q => prefer === "missed" ? (S.missed[q.id] && !S.missed[q.id].resolved ? 0 : seen(q) ? 2 : 1) : (prefer === "new" || prefer === "unseen") ? (seen(q) ? 1 : 0) : 0;
  const ok = q => prefer !== "unseen" || !seen(q);
  const ord = arr => shuffle(arr.filter(ok)).sort((a, b) => score(a) - score(b));
  const out = [], concepts = new Set(), perDrug = {};
  const add = q => { if (out.length >= n || out.includes(q)) return false; const c = q.concept || q.id; if (concepts.has(c) || (perDrug[q.drug] || 0) >= 2) return false; concepts.add(c); perDrug[q.drug] = (perDrug[q.drug] || 0) + 1; out.push(q); return true; };
  const A = ord(auth), G = ord(gen); let k = 0;
  for (const q of A) { if (out.length >= Math.ceil(n * .75)) break; add(q); }
  for (const q of G) { if (out.length >= n) break; add(q); }
  for (const q of A) { if (out.length >= n) break; add(q); }
  if (out.length < n) for (const q of [...A, ...G]) { if (out.length >= n) break; if (!out.includes(q) && (perDrug[q.drug] || 0) < 3 && !concepts.has(q.concept)) { concepts.add(q.concept); perDrug[q.drug] = (perDrug[q.drug] || 0) + 1; out.push(q); } }
  let r = shuffle(out); for (let i = 1; i < r.length; i++) { if (sysOf(r[i])[0] === sysOf(r[i - 1])[0]) { const j = r.findIndex((q, k) => k > i && sysOf(q)[0] !== sysOf(r[i - 1])[0]); if (j > 0) [r[i], r[j]] = [r[j], r[i]]; } }
  return r;
}

/* ---------- MISSED ---------- */
function vMissed(el) {
  const ents = Object.entries(S.missed).map(([id, m]) => ({ id, m, q: QBYID[id] })).filter(x => x.q).sort((a, b) => (a.m.resolved - b.m.resolved) || a.m.due - b.m.due);
  const open = ents.filter(x => !x.m.resolved), due = open.filter(x => x.m.due <= Date.now());
  const mc = missedConcepts();
  el.innerHTML = `<div class="head"><span class="label">Missed questions &amp; weakness tracker</span><h1>Turn misses into points.</h1><p>Every miss and every correct guess lands here with your answer, the misconception, the rationale and a review date. Concepts missed twice get a shorter explanation, a visual and a new patient scenario.</p></div>
   <div class="grid g3"><div class="card stat"><span class="label">Open items</span><span class="v">${open.length}</span></div><div class="card stat"><span class="label">Due now</span><span class="v">${due.length}</span></div><div class="card stat"><span class="label">Repeat-question accuracy</span><span class="v">${S.rep.att ? pct(S.rep.cor, S.rep.att) + "%" : "—"}</span></div></div>
   ${due.length ? `<div><button class="btn primary" id="revDue">Review ${Math.min(due.length, 15)} due item${due.length > 1 ? "s" : ""}</button></div>` : ""}
   ${mc.length ? `<div class="card stack"><div class="label">Weak concepts</div>${mc.map(c => `<div class="row between"><span>${esc(c.label)}</span><span class="row"><span class="chip badge-flag">${c.n}× missed</span><button class="btn sm" data-alt="${esc(c.k)}">Try it another way</button></span></div>`).join("")}</div>` : ""}
   <div id="mzone"></div>
   <div class="stack">${ents.length ? ents.map(({ id, m, q }) => `<div class="card stack ${m.resolved ? "flat" : ""}"><div class="row between"><div class="row">${sysChips(sysOf(q).slice(0, 2))}${m.guess ? `<span class="chip badge-R">Correct guess</span>` : ""}${m.resolved ? `<span class="chip badge-S">Answered correctly since</span>` : `<span class="chip ${m.due <= Date.now() ? "badge-flag" : ""}">Review ${rel(m.due)}</span>`}</div><span class="small muted">missed ${m.count || 1}× · ${fmtDate(m.when)}</span></div>
     <div>${q.scen ? `<b>${esc(q.scen.title)}:</b> ` : ""}${esc(q.stem)}</div><div class="small"><b>Your answer:</b> ${esc(m.ans || "—")}</div>${m.misc ? `<div class="small"><b>Misconception:</b> ${esc(m.misc)}</div>` : ""}
     <details><summary class="small">Correct answer &amp; rationale</summary><div class="small" style="margin-top:6px"><b>${esc(correctText(q))}</b><br>${esc(q.rat)}</div>${srcHTML(q.src, q.gen)}</details>
     <div class="row"><button class="btn sm" data-retry="${esc(id)}">Retry this question</button></div></div>`).join("") : `<div class="empty">Nothing here yet. Missed questions and lucky guesses appear automatically.</div>`}</div>${foot()}`;
  const zone = $("#mzone");
  el.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    if (b.id === "revDue") { Quiz(zone, { items: due.slice(0, 15).map(x => x.q), mode: "tutor", conf: true, title: "Due review", onDone: () => { vMissed(el); return "custom"; } }); zone.scrollIntoView({ behavior: "smooth" }); }
    if (b.dataset.retry) { Quiz(zone, { items: [QBYID[b.dataset.retry]], mode: "tutor", conf: true, title: "Retry", onDone: () => { vMissed(el); return "custom"; } }); zone.scrollIntoView({ behavior: "smooth" }); }
    if (b.dataset.alt) { const q = ALLQ.find(x => x.concept === b.dataset.alt); if (q) { zone.innerHTML = altHTML(q); const btn = $("[data-act=alt-new]", zone); if (btn) btn.onclick = ev => { ev.stopPropagation(); const nq = altQuestion(q); if (nq) Quiz(zone, { items: [nq], mode: "tutor", conf: true, title: "New scenario", onDone: () => { vMissed(el); return "custom"; } }); }; zone.scrollIntoView({ behavior: "smooth" }); } }
  };
}

/* ---------- COMPARE ---------- */
let CMP = "anticoag";
function compareTable(c) { return `<div class="tbl" tabindex="0" role="region" aria-label="${esc(c.t)} comparison table"><table><thead><tr><th scope="col"><span class="sr">Feature</span></th>${c.cols.map(x => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${c.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
function vCompare(el) {
  const c = COMPARE.find(x => x.id === CMP);
  el.innerHTML = `<div class="head"><span class="label">Compare medications</span><h1>Tell the look-alikes apart.</h1><p>Side by side on the differences that change what you do at the bedside.</p></div>
   ${sel("cmpSel", "Comparison", COMPARE.map(x => [x.id, x.t]), CMP)}
   <div class="card stack"><h2>${esc(c.t)}</h2>${compareTable(c)}<div class="panel"><b>The difference that matters:</b> ${esc(c.point)}</div>${c.flag ? `<div class="flagbox">Insulin timing numbers are flagged: your Med-Surg slide and standard references disagree on NPH onset and duration. Check the flag in the library.</div>` : ""}<div class="small muted">† = supplementary reference content.</div></div>${foot()}`;
  $("#cmpSel").onchange = e => { CMP = e.target.value; vCompare(el); };
}

/* ---------- PROGRESS ---------- */
function vProgress(el) {
  const lv = Object.fromEntries(LEVELS.map(l => [l, 0])); DRUGS.forEach(d => lv[drugLevel(d)]++);
  const fa = firstAcc(400);
  el.innerHTML = `<div class="head"><span class="label">Progress &amp; data</span><h1>Your record.</h1><p>${cloud.ref ? "Progress saves to your account automatically and on this device." : "Progress saves on this device. Export a backup to move it elsewhere."}</p></div>
   ${(() => { const R = readiness(), mo = mmOverall(), ov = Math.round(0.7 * R.score + 0.3 * mo), st = sysStats().filter(x => x.score != null).sort((a, b) => a.score - b.score);
     const bar = (n, v, sub) => `<div class="stack"><div class="row between"><b>${n}</b><span class="mono">${v}%</span></div><div class="bar ${v >= 80 ? "ok" : ""}"><i style="width:${v}%"></i></div><span class="xs muted">${sub}</span></div>`;
     return `<div class="card stack"><div class="label">Readiness · one number, two parts</div><div class="grid g3">${bar("Overall", ov, "70% pharmacology + 30% med math · goal 80%")}${bar("Pharmacology", R.score, `First-attempt accuracy ${R.fa.n ? Math.round(R.fa.p * 100) + "%" : "—"} (60%) · P1 drugs at Reviewing+ ${Math.round(R.cov * 100)}% (25%) · clinical application ${R.apn ? Math.round(R.app * 100) + "%" : "—"} (15%)`)}${bar("Med math", mo, "Average mastery across foundation skills")}</div>
      ${st.length ? `<details><summary class="small"><b>By body system</b> (weakest first)</summary><div class="stack" style="margin-top:8px">${st.map(x => sysRow(x, x.score >= .8 ? "ok" : "bad")).join("")}</div></details>` : ""}</div>`; })()}
   <div class="card stack"><div class="label">Drug mastery (${DRUGS.length} drugs)</div>${LEVELS.map(l => `<div class="sysrow"><span><span class="lvl lvl-${l}">${l}</span></span><div class="bar"><i style="width:${pct(lv[l], DRUGS.length)}%"></i></div><span class="mono">${lv[l]}</span></div>`).join("")}</div>
   <div class="grid g4"><div class="card stat"><span class="label">First-attempt accuracy</span><span class="v">${fa.n ? Math.round(fa.p * 100) + "%" : "—"}</span><span class="small muted">${fa.c}/${fa.n}</span></div><div class="card stat"><span class="label">Repeat accuracy</span><span class="v">${S.rep.att ? pct(S.rep.cor, S.rep.att) + "%" : "—"}</span></div><div class="card stat"><span class="label">Sessions</span><span class="v">${S.sessions.length}</span></div><div class="card stat"><span class="label">Matching games</span><span class="v">${S.games.played}</span></div></div>
   <div class="card stack"><div class="label">Settings</div><div class="grid g2"><div class="field"><label for="tgt">Daily study target (minutes)</label><select id="tgt">${[10, 20, 30, 45, 60].map(m => `<option ${S.target === m ? "selected" : ""}>${m}</option>`).join("")}</select></div><div class="field"><label for="exd">Exam date</label><input type="date" id="exd" value="${esc(S.examDate)}"></div></div></div>
   <div class="card stack"><div class="label">Bookmarked &amp; flagged drugs</div>${[...new Set([...S.bookmarks, ...S.flags])].length ? `<div class="row">${[...new Set([...S.bookmarks, ...S.flags])].map(id => DRUG[id] ? `<button class="btn sm" data-nav="library" data-arg="${id}">${esc(DRUG[id].g)}${S.flags.includes(id) ? " ⚑" : ""}</button>` : "").join("")}</div>` : `<div class="small muted">Use Bookmark or Flag on any drug's deep dive.</div>`}</div>
   <div class="card stack"><div class="label">Your explanations</div>${S.journal.length ? S.journal.slice(-6).reverse().map(j => `<div class="panel small"><b>${esc(DRUG[j.drug] ? DRUG[j.drug].g : "")}</b> · ${fmtDate(j.t)}<br>${esc(j.txt)}</div>`).join("") : `<div class="small muted">Self-explanations from sessions and deep dives appear here.</div>`}</div>
   <div class="card stack"><div class="label">Backup</div><p class="small muted">Export saves a JSON file of your progress. Import replaces current progress with a file or pasted JSON.</p>
    <div class="row"><button class="btn" id="exp">Export progress (.json)</button><button class="btn" id="cpy">Copy progress JSON</button><label class="btn" for="impf">Import from file</label><input type="file" id="impf" accept="application/json,.json" hidden></div>
    <div class="field"><label for="impt">Or paste JSON to import</label><textarea id="impt" rows="3" placeholder='{"v":1, ...}'></textarea></div><div class="row"><button class="btn" id="impgo">Import pasted JSON</button><button class="btn danger" id="reset">Reset all progress</button></div><div class="stack"><span class="label">Automatic safety copies (this device)</span><div id="bkz" class="stack"></div></div><div id="pmsg" class="small" aria-live="polite"></div></div>${foot()}`;
  $("#tgt").onchange = e => { S.target = +e.target.value; save(); toast("Daily target updated"); };
  $("#exd").onchange = e => { S.examDate = e.target.value; save(); toast("Exam date saved"); };
  const msg = t => $("#pmsg").textContent = t;
  $("#exp").onclick = async () => { const data = JSON.stringify(S, null, 1); try { const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; if (dl) { const r = await dl.save({ filename: `pharm-master-progress-${dstr()}.json`, data }); msg(r === "saved" || (r && r.status === "saved") ? "Export saved." : "Export sent to your device's save dialog."); return; } } catch (e) { if (e && e.code === "declined") return msg("Export canceled."); }
    $("#impt").value = data; $("#impt").select(); msg("Downloads aren't available here — your progress JSON is in the box above. Copy it and keep it somewhere safe."); };
  $("#cpy").onclick = async () => { const data = JSON.stringify(S); try { await navigator.clipboard.writeText(data); msg("Copied progress JSON to the clipboard."); } catch (e) { $("#impt").value = data; $("#impt").select(); msg("Clipboard blocked — the JSON is selected in the box; copy it manually."); } };
  const doImport = txt => { try { const o = JSON.parse(txt); if (!o || typeof o !== "object" || o.v !== 1 || !o.cards) throw new Error("This doesn't look like a PHARM MASTER progress file."); backupProgress("before import"); S = migrate(o); S.updatedAt = Date.now(); save(); flush(true); toast("Progress imported — your previous progress was backed up first"); route(); } catch (e) { msg("Import failed: " + e.message + " Check that you pasted the whole export."); } };
  $("#impgo").onclick = () => doImport($("#impt").value.trim());
  $("#impf").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImport(String(r.result)); r.onerror = () => msg("Couldn't read that file."); r.readAsText(f); };
  const bl = listBackups(), bz = $("#bkz"); if (bz) { bz.innerHTML = bl.length ? bl.map((b, i) => `<div class="row between small"><span>${fmtDate(b.at)} · ${esc(b.reason)}</span><button class="btn sm" data-bk="${i}">Restore</button></div>`).join("") : `<div class="small muted">No automatic safety copies yet. One is made before every import or reset.</div>`;
    bz.onclick = e => { const b = e.target.closest("[data-bk]"); if (!b) return; confirmInline(bz, "Restore this safety copy? Your current progress is backed up first.", () => { const c = bl[+b.dataset.bk]; backupProgress("before restore"); S = migrate(JSON.parse(c.json)); S.updatedAt = Date.now(); save(); flush(true); toast("Safety copy restored"); route(); }); }; }
  $("#reset").onclick = () => confirmInline(el, "Erase all progress, cards and history? This can't be undone unless you exported a backup.", () => { backupProgress("before reset"); const keep = { examDate: S.examDate, target: S.target }; S = Object.assign(DEF(), keep); S.updatedAt = Date.now(); save(); flush(true); toast("Progress reset — a safety copy was kept on this device"); route(); });
}

/* ---------- boot ---------- */
shell();
window.addEventListener("hashchange", () => { NAV_DEPTH++; route(); });
route();
setSync(false);
initCloud();
window.addEventListener("error", e => { console.error(e.error || e.message); });
