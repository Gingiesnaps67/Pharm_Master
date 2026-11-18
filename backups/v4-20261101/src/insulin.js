/* ================= INSULIN LEARNING LAB (PHARM MASTER 2.1) =================
   Educational simulation only — it does not authorize real patient care and requires supervised competency validation. */
const INSDEF = () => ({ intro: 0, act: {}, cases: {}, mix: { runs: [], mastered: false }, check: {}, syr: { att: 0, cor: 0 }, exam: [], seen: {} });
function insS() { if (!S.ins) S.ins = INSDEF(); const d = INSDEF(); for (const k in d) if (S.ins[k] === undefined) S.ins[k] = d[k]; return S.ins; }
const IV_TABS = [["home", "Overview"], ["concept", "How insulin works"], ["chart", "Compare types"], ["timeline", "Timeline & clock"], ["play", "Practice games"], ["cases", "Give · Treat · Clarify"], ["mix", "Vial mixing"], ["check", "Skills checkoff"], ["syringe", "Syringe & math"], ["quiz", "Quiz & checkoff"], ["sources", "Course vs current"]];
const IVV = { tab: "home" };
const SIM_NOTE = `<div class="simnote">${"Educational simulation — not authorization for patient care. Skills require supervised competency validation and your facility's policy."}</div>`;
const refLinks = keys => keys.map(k => REFS[k]).filter(Boolean).map(r => `<a href="${r.u}" target="_blank" rel="noopener">${esc(r.t.split(" — ")[0])}</a>`).join(" · ");

function insMastery() {
  const s = insS(), last = s.exam.filter(x => x.score >= 80);
  return [
    ["Insulin Safety Checkoff ≥80% (unassisted)", last.length > 0],
    ["Delayed retention: a later checkoff (≥1 day) ≥80%", s.exam.some(x => x.delayed && x.score >= 80)],
    ["Unassisted mix-and-draw simulation with zero errors", !!s.mix.mastered],
    ["Vial + syringe administration checkoff", !!(s.check.vial && s.check.vial.pass)],
    ["Pen administration checkoff", !!(s.check.pen && s.check.pen.pass)],
    ["SC site rotation checkoff", !!(s.check.site && s.check.site.pass)]
  ];
}

function vInsulin(el, arg) {
  insS();
  if (arg) IVV.tab = IV_TABS.some(t => t[0] === arg) ? arg : "home";
  if (IVV.prev !== IVV.tab) { PLAY.g = null; ICASE.i = null; CKS.k = null; } IVV.prev = IVV.tab;
  noteRecent("ins", "lab");
  el.innerHTML = `<div class="head ins-head"><span class="label">Learn · Endocrine · Insulin</span><h1>Insulin Learning Lab</h1><p>Understand the curves, make the call at the bedside, and practice the hands-on skills.</p></div>
   <nav class="subnav inview" aria-label="Insulin Lab sections"><div class="subnav-in">${IV_TABS.map(([k, n]) => `<button data-it="${k}" aria-current="${IVV.tab === k ? "page" : "false"}">${n}</button>`).join("")}</div></nav>
   <div id="insv"></div>${foot()}`;
  el.querySelector(".subnav-in").onclick = e => { const b = e.target.closest("[data-it]"); if (b) { IVV.prev = null; } if (b) go("insulin", b.dataset.it === "home" ? null : b.dataset.it); };
  const z = $("#insv", el);
  ({ home: insHome, concept: insConcept, chart: insChart, timeline: insTimeline, play: insPlay, cases: insCases, mix: insMix, check: insCheck, syringe: insSyringe, quiz: insQuiz, sources: insSources }[IVV.tab] || insHome)(z);
  const a = $(`.subnav-in [aria-current="page"]`, el); a && a.scrollIntoView && a.scrollIntoView({ block: "nearest", inline: "center" });
}

/* ---------- Overview ---------- */
function insHome(z) {
  const s = insS(), m = insMastery(), done = m.filter(x => x[1]).length, cs = Object.values(s.cases), cOk = cs.filter(c => c.first).length;
  z.innerHTML = `<section class="ins-hero"><div class="stack"><span class="eyebrow">${done}/${m.length} mastery steps complete</span><h2>From the pancreas to the bedside.</h2><p>Start with how insulin works, then read the curves, decide what to do for real patients, and finish with the mixing and injection checkoffs.</p>
     <div class="row"><button class="btn primary" data-it2="${s.intro ? "cases" : "concept"}">${ico("play", 16)} ${s.intro ? "Today's patient case" : "Start: how insulin works"}</button><button class="btn" data-it2="mix">Vial mixing simulator</button></div></div>
     <div class="ins-hero-art" aria-hidden="true">${INS.slice(0, 4).map(c => `<span style="--c:${c.cd}">${esc(c.n.split(" ")[0])}</span>`).join("")}</div></section>
   <div class="grid g3 ins-cards">${[["concept", "bulb", "How insulin works", "90-second illustrated walkthrough: basal vs bolus, onset · peak · duration."], ["timeline", "clock", "Timeline & clock", "Drag the clock across 36 hours and watch each insulin act."], ["cases", "hold", "Give · Treat · Clarify · Withhold", `${INS_CASES.length} patient cards · ${cOk}/${INS_CASES.length} right on first try.`], ["mix", "math", "Vial mixing", "Regular + NPH, lispro + NPH, and the do-not-mix traps."], ["check", "check", "Skills checkoff", "Vial, pen and site rotation — with a printable sheet."], ["quiz", "exam", "Quiz & Safety Checkoff", `${INS_Q.length} reviewed items + the 10-question checkoff.`]].map(([k, ic, t, d]) => `<button class="ins-card" data-it2="${k}"><span class="ic">${ico(ic, 22)}</span><b>${t}</b><span class="small muted">${d}</span></button>`).join("")}</div>
   <div class="card stack"><div class="label">Mastery requirements</div>${m.map(([t, ok]) => `<div class="row mast ${ok ? "ok" : ""}"><span class="mk">${ok ? ico("check", 14) : ""}</span><span>${t}</span></div>`).join("")}<p class="xs muted">Assisted practice (guided mode, hints) is tracked but never counts toward mastery.</p></div>
   ${SIM_NOTE}`;
  z.onclick = e => { const b = e.target.closest("[data-it2]"); if (b) go("insulin", b.dataset.it2); };
}

/* ---------- Concept: ~90 s illustrated walkthrough ---------- */
const SCENES = [
  { t: "The pancreas releases insulin", d: "Beta cells in the pancreas release a small steady amount of insulin all day (basal) and a burst when you eat (bolus).", svg: () => `<g><path d="M60 120 q60-60 140-20 t140 0 q40 20 20 50 q-80 40-180 10 q-80 0-120-40z" fill="#F7B2A6" stroke="#C25B4A" stroke-width="2"/><text x="190" y="128" text-anchor="middle" font-size="14" fill="#5a2a22" font-weight="700">Pancreas</text>${[0, 1, 2, 3, 4].map(i => `<circle class="ins-dot" cx="${150 + i * 30}" cy="100" r="6" fill="#00B8A9" style="--i:${i}"/>`).join("")}</g>` },
  { t: "Insulin opens the door for glucose", d: "Insulin binds receptors on muscle and fat cells so glucose can move from the blood into the cell. Blood glucose falls.", svg: () => `<g><rect x="200" y="50" width="170" height="130" rx="30" fill="#ECE9FC" stroke="#7765E3" stroke-width="2"/><text x="285" y="170" text-anchor="middle" font-size="13" fill="#3b2f8f" font-weight="700">Muscle / fat cell</text><rect x="196" y="100" width="10" height="34" rx="3" fill="#7765E3"/>${[0, 1, 2].map(i => `<circle class="ins-glu" cx="${80 + i * 34}" cy="117" r="9" fill="#F5B841" style="--i:${i}"/>`).join("")}<circle cx="190" cy="98" r="8" fill="#00B8A9"/><text x="110" y="160" font-size="12" fill="#7A5300">glucose</text><text x="168" y="84" font-size="12" fill="#00776F">insulin</text></g>` },
  { t: "Insulin tells the liver to hold back", d: "Insulin also suppresses the liver's release of stored glucose. Without insulin (type 1 diabetes), the liver keeps pouring glucose out and fat breaks down into ketones.", svg: () => `<g><path d="M70 80 q120-50 240 0 q20 60-40 90 q-100 20-180-10 q-40-30-20-80z" fill="#C98A6B" stroke="#7a4a33" stroke-width="2"/><text x="190" y="130" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">Liver</text><path d="M310 120 h50" stroke="#F5B841" stroke-width="6" stroke-dasharray="6 6"/><circle cx="330" cy="80" r="16" fill="none" stroke="#00B8A9" stroke-width="4"/><path d="M318 92 l24-24" stroke="#00B8A9" stroke-width="4"/></g>` },
  { t: "Injected insulin: background or meal", d: "Basal insulin (NPH, glargine, degludec) replaces the background. Bolus insulin (rapid or regular) covers meals and correction doses. Mixing them up is a classic error.", svg: () => `<g><rect x="40" y="150" width="340" height="16" rx="8" fill="#FF7285" opacity=".7"/><text x="50" y="186" font-size="12" fill="var(--ink)">Basal — all day, all night</text>${[70, 190, 300].map(x => `<path d="M${x} 150 q25-90 50 0" fill="#00B8A9" opacity=".8"/>`).join("")}<text x="70" y="50" font-size="12" fill="var(--ink)">Bolus at each meal</text></g>` },
  { t: "Onset · Peak · Duration", d: "Onset = when it starts working. Peak = strongest glucose-lowering effect — the time of greatest hypoglycemia concern. Duration = how long it keeps acting. These vary by product, dose and person; the categories are not interchangeable.", svg: () => `<g><line x1="40" y1="170" x2="390" y2="170" stroke="var(--ink)" stroke-width="2"/><path d="M60 170 C110 168 130 60 180 60 S260 160 360 168" fill="none" stroke="#7765E3" stroke-width="5"/><line x1="96" y1="178" x2="96" y2="150" stroke="#00776F" stroke-width="2"/><text x="96" y="194" text-anchor="middle" font-size="12" fill="#00776F" font-weight="700">onset</text><circle cx="180" cy="60" r="7" fill="#FF7285"/><text x="180" y="44" text-anchor="middle" font-size="12" fill="#C2334A" font-weight="700">peak</text><text x="360" y="194" text-anchor="end" font-size="12" fill="var(--ink)" font-weight="700">duration →</text></g>` }
];
function insConcept(z) {
  let i = 0, playing = !matchMedia("(prefers-reduced-motion: reduce)").matches, tm = null;
  const draw = () => {
    clearTimeout(tm); const sc = SCENES[i];
    z.innerHTML = `<div class="card stack concept"><div class="row between"><span class="label">Scene ${i + 1} of ${SCENES.length} · about 90 seconds</span><button class="btn sm ghost" id="cplay" aria-pressed="${playing}">${playing ? "Pause" : "Auto-play"}</button></div>
     <div class="progress-line"><i style="width:${pct(i + 1, SCENES.length)}%"></i></div>
     <svg class="scene" viewBox="0 0 420 210" role="img" aria-label="${esc(sc.t)}: ${esc(sc.d)}">${sc.svg()}</svg>
     <h2 class="h3" aria-live="polite">${esc(sc.t)}</h2><p>${esc(sc.d)}</p>
     <div class="row between"><button class="btn" id="cprev" ${i === 0 ? "disabled" : ""}>${ico("back", 16)} Back</button>${i < SCENES.length - 1 ? `<button class="btn primary" id="cnext">Next ${ico("arrow", 16)}</button>` : `<button class="btn primary" id="cdone">See the real curves ${ico("arrow", 16)}</button>`}</div></div>`;
    $("#cplay", z).onclick = () => { playing = !playing; draw(); };
    $("#cprev", z).onclick = () => { i--; draw(); };
    const n = $("#cnext", z); if (n) n.onclick = () => { i++; draw(); };
    const d = $("#cdone", z); if (d) d.onclick = () => { insS().intro = Date.now(); save(); go("insulin", "timeline"); };
    if (playing && i < SCENES.length - 1) tm = setTimeout(() => { if (z.isConnected && $(".concept", z)) { i++; draw(); } }, 18000);
    if (i === SCENES.length - 1) { insS().intro = insS().intro || Date.now(); save(); }
  };
  draw();
}

/* ---------- Comparison chart ---------- */
function insChart(z) {
  z.innerHTML = `<div class="card stack"><div class="head"><span class="label">Compare insulin types</span><h2 class="h3">Six categories, side by side</h2><p class="small muted">Times are category teaching approximations from the CDC table (ADA ranges in parentheses). The product label and the ordered meal schedule always take precedence.</p></div>
   <div class="inschart">${INS.map(c => `<article class="insrow" style="--c:${c.c}"><header><span class="swatch"></span><h3 class="h4">${esc(c.n)}</h3><span class="chip">${esc(c.look)}</span></header>
     <dl><dt>Examples</dt><dd>${esc(c.ex)}</dd><dt>Purpose</dt><dd>${esc(c.role)}</dd><dt>With meals</dt><dd>${esc(c.meal)}</dd><dt>Onset · peak · duration</dt><dd class="mono small">${esc(c.onT)} · ${esc(c.pkT)} · ${esc(c.durT)}</dd><dt>Nursing checks</dt><dd>${esc(c.check)}</dd><dt>Mixing</dt><dd>${esc(c.mix)}</dd></dl>
     <p class="xs muted">${esc(c.note)}</p><div class="xs">Sources: ${refLinks(c.refs)}</div></article>`).join("")}</div></div>`;
}

/* ---------- Timeline with movable clock ---------- */
const TL = { on: { rapid: 1, short: 1, nph: 1, long: 1 }, h: 3, inj: 7 };
const clockStr = h => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60)).padStart(2, "0") + String(m % 60).padStart(2, "0"); };
function curvePath(c, W, H, X, max = 36) { let d = ""; for (let t = 0; t <= max; t += .1) { const y = H - 20 - insAct(c, t) * (H - 50); d += (t ? "L" : "M") + X(t).toFixed(1) + " " + y.toFixed(1); } return d; }
function insTimeline(z) {
  const W = 720, H = 260, X = t => 40 + t / 36 * (W - 60);
  const draw = () => {
    const sel = INS.filter(c => TL.on[c.k]), t = TL.h;
    z.innerHTML = `<div class="card stack"><div class="head"><span class="label">Timeline & clock</span><h2 class="h3">Drag the clock — watch each insulin act</h2><p class="small muted">Shapes are approximate category teaching curves (CDC/ADA ranges). Real action varies by product, dose, site and person.</p></div>
     <div class="chips-scroll" role="group" aria-label="Insulins on the chart">${INS.map(c => `<button class="chip-btn ${TL.on[c.k] ? "on" : ""}" data-tk="${c.k}" aria-pressed="${!!TL.on[c.k]}" style="${TL.on[c.k] ? `background:${c.cd};border-color:${c.cd};color:#fff` : `border-left:5px solid ${c.c}`}">${esc(c.n)}</button>`).join("")}</div>
     <div class="row"><div class="field" style="min-width:150px"><label for="tinj">Injection time</label><select id="tinj">${[6, 7, 8, 12, 17, 21].map(h => `<option value="${h}" ${TL.inj === h ? "selected" : ""}>${clockStr(h)}</option>`).join("")}</select></div>
      <div class="field" style="flex:1;min-width:220px"><label for="tclock">Time since injection: <b>${t.toFixed(1)} h</b> → clock <b class="mono">${clockStr(TL.inj + t)}</b>${TL.inj + t >= 24 ? " (next day)" : ""}</label><input type="range" id="tclock" min="0" max="36" step="0.5" value="${t}" aria-valuetext="${t} hours after injection, clock time ${clockStr(TL.inj + t)}"></div></div>
     <div class="tl-wrap" tabindex="0" role="region" aria-label="Insulin timeline chart (scrolls sideways)"><svg viewBox="0 0 ${W} ${H}" class="tl" role="img" aria-label="Insulin action curves over 36 hours; current time ${t} hours after injection">
      ${[0, 6, 12, 18, 24, 30, 36].map(h => `<line x1="${X(h)}" y1="20" x2="${X(h)}" y2="${H - 20}" stroke="var(--line)"/><text x="${X(h)}" y="${H - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${h}h · ${clockStr(TL.inj + h)}</text>`).join("")}
      <line x1="40" y1="${H - 20}" x2="${W - 20}" y2="${H - 20}" stroke="var(--ink)"/>
      ${sel.map(c => `<path d="${curvePath(c, W, H, X)}" fill="none" stroke="${c.c}" stroke-width="4" stroke-linejoin="round" ${c.k === "premix" ? `stroke-dasharray="8 6"` : ""}/>${c.pk ? `<rect x="${X(c.pk[0])}" y="20" width="${X(c.pk[1]) - X(c.pk[0])}" height="${H - 40}" fill="${c.c}" opacity=".07"/>` : ""}`).join("")}
      <line x1="${X(t)}" y1="14" x2="${X(t)}" y2="${H - 20}" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="4 3"/><circle cx="${X(t)}" cy="14" r="6" fill="var(--ink)"/>
     </svg></div>
     <div class="tl-read" aria-live="polite">${sel.map(c => { const ph = insPhase(c, t); return `<div class="tlr ${/PEAK/.test(ph) ? "peak" : ""}" style="--c:${c.c}"><b>${esc(c.n)}</b><span>${esc(ph)}</span><span class="xs muted">onset ${esc(c.onT)} · peak ${esc(c.pkT)} · lasts ${esc(c.durT)}</span></div>`; }).join("") || `<div class="empty small">Choose at least one insulin above.</div>`}</div>
     <p class="xs muted">Premix (dashed) peaks vary by product. Sources: ${refLinks(["cdcIns", "adaIns"])}</p></div>
     <div class="card stack" id="tlq"></div>`;
    $$("[data-tk]", z).forEach(b => b.onclick = () => { TL.on[b.dataset.tk] = !TL.on[b.dataset.tk]; draw(); });
    $("#tinj", z).onchange = e => { TL.inj = +e.target.value; draw(); };
    const r = $("#tclock", z); r.oninput = e => { TL.h = +e.target.value; draw(); const nr = $("#tclock", z); nr && nr.focus(); };
    tlQuestion($("#tlq", z));
  };
  draw();
}
/* "Read the timeline" question generated from the same curve data (deterministic answer) */
function tlQuestion(box) {
  const pool = INS.filter(c => c.pk && c.k !== "premix"), inj = pick([7, 8, 17]);
  const target = pick(pool), t = (target.pk[0] + target.pk[1]) / 2, others = pool.filter(c => c !== target && !(t >= c.pk[0] && t <= c.pk[1]));
  if (others.length < 2) return box.remove();
  const opts = shuffle([target, ...others.slice(0, 2), INSK.long]);
  box.innerHTML = `<div class="label">Read the timeline</div><p>All four were injected at <b class="mono">${clockStr(inj)}</b>. At <b class="mono">${clockStr(inj + t)}</b>, which one is in its peak window (highest hypoglycemia concern)?</p><div class="stack">${opts.map(c => `<button class="opt" data-tq="${c.k}"><span class="mk"></span><span>${esc(c.n)}</span></button>`).join("")}</div><div id="tqfb"></div>`;
  box.onclick = e => { const b = e.target.closest("[data-tq]"); if (!b || box.dataset.done) return; box.dataset.done = 1; const ok = b.dataset.tq === target.k; b.classList.add(ok ? "correct" : "wrong"); $(`[data-tq="${target.k}"]`, box).classList.add("correct"); const a = insS().act.tl = insS().act.tl || { n: 0, c: 0 }; a.n++; if (ok) a.c++; save(); $("#tqfb", box).innerHTML = `<div class="fb ${ok ? "ok" : "bad"}" role="status"><b>${ok ? "Correct." : "Not quite."}</b> ${esc(target.n)} peaks ${esc(target.pkT)} after injection: ${clockStr(inj + target.pk[0])}–${clockStr(inj + target.pk[1])}. Long-acting glargine has no pronounced peak. <button class="btn sm" id="tqn">Another</button></div>`; $("#tqn", box).onclick = () => { delete box.dataset.done; tlQuestion(box); }; };
}

/* ---------- Practice games ---------- */
const PLAY = { g: null };
function insPlay(z) {
  if (!PLAY.g) {
    const a = insS().act;
    z.innerHTML = `<div class="grid g2">${[["curve", "Guess the curve", "An unlabeled action curve — which insulin made it?"], ["match", "Match the insulin", "Brand ↔ category, by tap or keyboard."], ["aft", "Which one peaks this afternoon?", "Read injection times against peak windows."], ["rvr", "Rapid vs Regular", "Sort statements: rapid, regular, or both."]].map(([k, t, d]) => `<button class="ins-card" data-g="${k}"><b>${t}</b><span class="small muted">${d}</span><span class="xs muted">${a[k] ? `${a[k].c}/${a[k].n} correct so far` : "Not started"}</span></button>`).join("")}</div>`;
    z.onclick = e => { const b = e.target.closest("[data-g]"); if (b) { PLAY.g = b.dataset.g; z.onclick = null; insPlay(z); } };
    return;
  }
  const back = `<button class="btn sm ghost" id="pgback">${ico("back", 16)} All games</button>`;
  const rec = ok => { const a = insS().act[PLAY.g] = insS().act[PLAY.g] || { n: 0, c: 0 }; a.n++; if (ok) a.c++; save(); };
  delete z.dataset.lock;
  if (PLAY.g === "curve") {
    const pool = INS.filter(c => c.k !== "premix"), c = pick(pool), W = 520, H = 200, X = t => 30 + t / 36 * (W - 50);
    const opts = shuffle(pool).slice(0, 4); if (!opts.includes(c)) opts[0] = c;
    z.innerHTML = `<div class="card stack">${back}<div class="label">Guess the curve</div><svg viewBox="0 0 ${W} ${H}" class="tl" role="img" aria-label="Unlabeled curve: onset about ${c.on} hours, ${c.pk ? `peak window ${c.pk[0]} to ${c.pk[1]} hours` : "no pronounced peak"}, lasting about ${c.dur[1]} hours">${[0, 6, 12, 18, 24, 30, 36].map(h => `<text x="${X(h)}" y="${H - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${h}h</text>`).join("")}<line x1="30" y1="${H - 20}" x2="${W - 20}" y2="${H - 20}" stroke="var(--ink)"/><path d="${curvePath(c, W, H, X)}" fill="none" stroke="var(--violet-ink)" stroke-width="4"/></svg>
      <div class="stack">${shuffle(opts).map(o => `<button class="opt" data-a="${o.k}"><span class="mk"></span><span>${esc(o.n)}</span></button>`).join("")}</div><div id="gfb"></div></div>`;
    z.onclick = e => { if (e.target.closest("#pgback")) { PLAY.g = null; return insPlay(z); } const b = e.target.closest("[data-a]"); if (!b || z.dataset.lock) return; z.dataset.lock = 1; const ok = b.dataset.a === c.k; rec(ok); b.classList.add(ok ? "correct" : "wrong"); $(`[data-a="${c.k}"]`, z).classList.add("correct"); $("#gfb", z).innerHTML = `<div class="fb ${ok ? "ok" : "bad"}" role="status"><b>${ok ? "Yes" : "It was " + esc(c.n)}.</b> Onset ${esc(c.onT)}, peak ${esc(c.pkT)}, duration ${esc(c.durT)}. <button class="btn sm" id="gn">Next curve</button></div>`; $("#gn", z).onclick = () => { delete z.dataset.lock; insPlay(z); }; };
  } else if (PLAY.g === "match") {
    const pairs = shuffle([["Humalog", "rapid"], ["NovoLog", "rapid"], ["Apidra", "rapid"], ["Humulin R", "short"], ["Novolin N", "nph"], ["Humulin N", "nph"], ["Lantus", "long"], ["Basaglar", "long"], ["Tresiba", "ultra"], ["Humulin 70/30", "premix"]]).slice(0, 6);
    const st = { sel: null, done: new Set(), err: 0 };
    const draw = () => { z.innerHTML = `<div class="card stack">${back}<div class="label">Match the insulin · tap a brand, then its category</div><div class="grid g2"><div class="stack">${pairs.map(([b], i) => `<button class="tile ${st.done.has(i) ? "done" : ""} ${st.sel === i ? "sel" : ""}" data-ml="${i}" ${st.done.has(i) ? "disabled" : ""} aria-pressed="${st.sel === i}">${esc(b)}</button>`).join("")}</div><div class="stack">${INS.map(c => `<button class="tile" data-mr="${c.k}" style="border-left:5px solid ${c.c}">${esc(c.n)}</button>`).join("")}</div></div><div id="gfb" aria-live="polite">${st.done.size === pairs.length ? `<div class="fb ok"><b>All matched</b> with ${st.err} miss${st.err === 1 ? "" : "es"}. <button class="btn sm" id="gn">New set</button></div>` : ""}</div></div>`; };
    draw();
    z.onclick = e => { if (e.target.closest("#pgback")) { PLAY.g = null; return insPlay(z); } if (e.target.closest("#gn")) return insPlay(z); const l = e.target.closest("[data-ml]"), r = e.target.closest("[data-mr]"); if (l) { st.sel = +l.dataset.ml; draw(); $(`[data-ml="${st.sel}"]`, z).focus(); } else if (r && st.sel != null) { const ok = pairs[st.sel][1] === r.dataset.mr; if (ok) st.done.add(st.sel); else { st.err++; toast(`${pairs[st.sel][0]} isn't ${INSK[r.dataset.mr].n}`); } rec(ok); st.sel = null; draw(); } };
  } else if (PLAY.g === "aft") {
    const inj = pick([6, 7, 8]), at = pick([13, 14, 15, 16]), dt = at - inj;
    const cands = INS.filter(c => c.pk && c.k !== "premix"), right = cands.filter(c => dt >= c.pk[0] && dt <= c.pk[1]);
    z.innerHTML = `<div class="card stack">${back}<div class="label">Which one peaks this afternoon?</div><p>Each insulin was injected at <b class="mono">${clockStr(inj)}</b>. Which is in its usual peak window at <b class="mono">${clockStr(at)}</b> (${dt} h later)? Select all that apply.</p><div class="stack">${cands.map(c => `<button class="opt sq" data-s="${c.k}" aria-pressed="false"><span class="mk"></span><span>${esc(c.n)} <span class="xs muted">(peak ${esc(c.pkT)})</span></span></button>`).join("")}<button class="opt sq" data-s="none" aria-pressed="false"><span class="mk"></span><span>None of these</span></button></div><button class="btn primary" id="achk">Check</button><div id="gfb"></div></div>`;
    const picked = new Set();
    z.onclick = e => { if (e.target.closest("#pgback")) { PLAY.g = null; return insPlay(z); } if (e.target.closest("#gn")) return insPlay(z); const b = e.target.closest("[data-s]"); if (b && !z.dataset.lock) { const k = b.dataset.s; picked.has(k) ? picked.delete(k) : picked.add(k); b.setAttribute("aria-pressed", picked.has(k)); $(".mk", b).textContent = picked.has(k) ? "✓" : ""; } if (e.target.closest("#achk") && !z.dataset.lock) { z.dataset.lock = 1; const want = new Set(right.length ? right.map(c => c.k) : ["none"]); const ok = want.size === picked.size && [...want].every(k => picked.has(k)); rec(ok); $("#gfb", z).innerHTML = `<div class="fb ${ok ? "ok" : "bad"}" role="status"><b>${ok ? "Correct." : "Not quite."}</b> ${cands.map(c => `${esc(c.n)}: peak ${clockStr(inj + c.pk[0])}–${clockStr(inj + c.pk[1])}`).join(" · ")}. ${right.length ? "In the window: " + right.map(c => esc(c.n)).join(", ") + "." : "None is in its peak window."} <button class="btn sm" id="gn">Another</button></div>`; delete z.dataset.lockx; } if (e.target.closest("#gn")) delete z.dataset.lock; };
    delete z.dataset.lock;
  } else if (PLAY.g === "rvr") {
    const items = shuffle([["Onset about 15 minutes (CDC)", "rapid"], ["Usually given 30–60 minutes before a meal", "short"], ["Clear solution", "both"], ["The classic insulin for supervised IV infusions", "short"], ["Label: within 15 minutes before or right after a meal (Humalog)", "rapid"], ["Peak about 2–3 hours", "short"], ["Peak about 1 hour (CDC)", "rapid"], ["May be drawn up with NPH when the label permits — drawn first", "both"], ["Humulin R / Novolin R", "short"], ["Lispro, aspart, glulisine", "rapid"]]).slice(0, 6);
    let i = 0, sc = 0;
    const draw = () => { if (i >= items.length) { z.innerHTML = `<div class="card stack">${back}<div class="fb ${sc >= 5 ? "ok" : "bad"}"><b>${sc}/${items.length}</b> sorted correctly. Rapid analogs act sooner and shorter; regular needs a longer lead time before meals.</div><button class="btn primary" id="gn">Play again</button></div>`; return; } z.innerHTML = `<div class="card stack">${back}<div class="label">Rapid vs Regular · ${i + 1} of ${items.length}</div><p class="lead">${esc(items[i][0])}</p><div class="row">${[["rapid", "Rapid-acting"], ["short", "Regular"], ["both", "Both"]].map(([k, n]) => `<button class="btn" data-r="${k}">${n}</button>`).join("")}</div><div id="gfb"></div></div>`; };
    draw();
    z.onclick = e => { if (e.target.closest("#pgback")) { PLAY.g = null; return insPlay(z); } if (e.target.closest("#gn")) return insPlay(z); if (e.target.closest("#rn")) { i++; return draw(); } const b = e.target.closest("[data-r]"); if (!b || $("#rn", z)) return; const ok = b.dataset.r === items[i][1]; if (ok) sc++; rec(ok); $("#gfb", z).innerHTML = `<div class="fb ${ok ? "ok" : "bad"}" role="status"><b>${ok ? "Right" : "Answer: " + { rapid: "Rapid-acting", short: "Regular", both: "Both" }[items[i][1]]}.</b> <button class="btn sm" id="rn">Next</button></div>`; $("#rn", z).focus(); };
  }
}

/* ---------- Give · Treat · Clarify · Withhold-per-order cases ---------- */
const ICASE = { i: null };
function caseCard(c) {
  const f = [["Diabetes", c.type], ["Glucose (time · trend)", c.bg], ["Insulin order", c.ins], ["Meal", c.meal], ["NPO", c.npo], ["Symptoms", c.sym], ["Hold / correction parameters", c.par], ["Recent insulin", c.recent], ["Concern", c.con]];
  return `<div class="ptcard"><div class="row between"><b>${esc(c.t)}</b><span class="chip">${esc(c.type)}</span></div><dl>${f.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>`;
}
function insCases(z) {
  const s = insS();
  if (ICASE.i == null) {
    z.innerHTML = `<div class="card stack"><div class="head"><span class="label">Give · Treat · Clarify · Withhold per order</span><h2 class="h3">Make the bedside call</h2></div>
     <details class="panel" open><summary><b>The decision path</b></summary><ol class="small dtree"><li><b>Confirm</b> the insulin, concentration, patient, route, timing, current glucose and trend, active parameters, and meal/NPO status. Assess symptoms, ability to eat, and prior doses.</li><li><b>Low glucose</b> (usually &lt;70 mg/dL or symptoms) → treat first per protocol: alert and able to swallow with PO allowed → 15–20 g fast carbohydrate, recheck (commonly about 15 minutes), repeat as needed. Can't swallow, altered, or strict NPO → ordered glucagon or IV dextrose (RN). Then clarify insulin before resuming.</li><li><b>Meal insulin</b> (rapid/regular): no tray, refusing, vomiting or NPO → don't give a full meal dose automatically; check the order. Correction insulin may still be ordered while NPO.</li><li><b>Basal insulin in type 1</b> is never simply omitted for NPO — get the adjusted plan. Type 2 basal plans also need individual orders when intake changes.</li><li><b>Clarify/escalate</b>: unexpected low/high glucose, unclear or duplicate orders, glucose outside the scale, concentration/device mismatch, ketones or illness, wrong formulation or route.</li><li>You never change a dose or invent a hold number — the safe answer can be “reassess and ask the RN/prescriber.”</li></ol></details>
     <div class="stack">${INS_CASES.map((c, i) => { const r = s.cases[c.id]; return `<button class="caserow" data-ci="${i}"><span><b>${esc(c.t)}</b><span class="xs muted"> · ${esc(c.type)} · ${esc(c.bg.split(" at")[0])}</span></span><span class="chip ${r ? (r.first ? "badge-S" : "badge-flag") : ""}">${r ? (r.first ? "First try ✓" : "Review") : "New"}</span></button>`; }).join("")}</div>
     <p class="xs muted">Sources: course Med-Surg endocrine slides; ${refLinks(["humalog", "lantus", "u500", "adaHosp"])}</p></div>${SIM_NOTE}`;
    z.onclick = e => { const b = e.target.closest("[data-ci]"); if (b) { ICASE.i = +b.dataset.ci; z.onclick = null; insCases(z); } };
    return;
  }
  const c = INS_CASES[ICASE.i]; let ans = null;
  const perm = shuffle(c.o.map((_, k) => k));
  const draw = () => {
    z.innerHTML = `<div class="card stack"><button class="btn sm ghost" id="cback">${ico("back", 16)} All cases</button><span class="label">Case ${ICASE.i + 1} of ${INS_CASES.length}</span>${caseCard(c)}<p class="q-stem">${esc(c.q)}</p>
     <div class="stack">${perm.map((k, j) => `<button class="opt ${ans != null ? (k === c.k ? "correct" : k === ans ? "wrong" : "") : ""}" data-o="${k}" ${ans != null ? "disabled" : ""}><span class="mk">${"ABCD"[j]}</span><span>${esc(c.o[k])}</span></button>`).join("")}</div>
     ${ans != null ? `<div class="fb ${ans === c.k ? "ok" : "bad"}" role="status"><h4>${ans === c.k ? "Correct" : "Not the safest choice"} · <span class="chip">${esc(c.cat)}</span></h4><div><b>Why:</b> ${esc(c.o[c.k])}</div><div class="why"><div class="label">Why the others are less safe</div>${Object.entries(c.why).map(([k, v]) => `<div><b>${esc(c.o[k])}</b> — ${esc(v)}</div>`).join("")}</div><div><b>When to escalate:</b> ${esc(c.esc)}</div><div class="xs muted">Basis: ${esc(c.src)}</div></div>
      <div class="row">${ICASE.i < INS_CASES.length - 1 ? `<button class="btn primary" id="cnext">Next case</button>` : ""}<button class="btn" id="cback2">All cases</button></div>` : ""}</div>`;
    $("#cback", z).onclick = () => { ICASE.i = null; insCases(z); };
    const b2 = $("#cback2", z); if (b2) b2.onclick = () => { ICASE.i = null; insCases(z); };
    const n = $("#cnext", z); if (n) n.onclick = () => { ICASE.i++; insCases(z); };
  };
  draw();
  z.onclick = e => { const b = e.target.closest("[data-o]"); if (!b || ans != null) return; ans = +b.dataset.o; const r = insS().cases[c.id]; insS().cases[c.id] = { att: (r ? r.att : 0) + 1, first: r ? r.first : ans === c.k, last: ans === c.k, t: Date.now() }; touch(); save(); draw(); const f = $(".fb", z); f && (f.setAttribute("tabindex", "-1"), f.focus()); };
}

/* ---------- SVG: vial and U-100 syringe ---------- */
function vialSVG(v) {
  const fill = v.cloudy ? "#F4F1EA" : "#E3F6FB", liquid = v.cloudy ? `<rect x="14" y="58" width="72" height="88" rx="6" fill="#ffffff" opacity=".95"/><g opacity=".5">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${22 + i * 11}" cy="${80 + (i % 3) * 16}" r="3" fill="#cfc8b8"/>`).join("")}</g>` : `<rect x="14" y="58" width="72" height="88" rx="6" fill="#bfe9f5" opacity=".55"/>`;
  return `<svg viewBox="0 0 100 170" class="vial ${v.sel ? "sel" : ""} ${v.inv ? "inv" : ""}" role="img" aria-label="${esc(v.aria)}"><rect x="30" y="2" width="40" height="16" rx="3" fill="${v.cap || "#8a96a8"}"/><rect x="34" y="16" width="32" height="10" fill="#6b7686"/><path d="M20 26h60v10a10 10 0 0 1 6 9v100a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12V45a10 10 0 0 1 6-9z" fill="${fill}" stroke="#5c6b80" stroke-width="2"/>${liquid}
   <rect x="18" y="72" width="64" height="44" rx="4" fill="${v.color}"/><text x="50" y="90" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="inherit">${esc(v.label)}</text><text x="50" y="106" text-anchor="middle" font-size="8.5" fill="#fff" font-family="inherit">${esc(v.sub)}</text>
   ${v.air ? `<text x="50" y="52" text-anchor="middle" font-size="9" fill="#3b4a60" font-family="inherit">+${v.air} u air</text>` : ""}${v.bad ? `<text x="50" y="140" text-anchor="middle" font-size="9" font-weight="800" fill="#C2334A" font-family="inherit">${esc(v.bad)}</text>` : ""}</svg>`;
}
function insSyrSVG(cap, plunger, layers, label) {
  const x0 = 70, len = 400, y = 36, h = 34, step = cap === 100 ? 2 : 1, lab = cap === 100 ? 10 : 5; let t = "";
  for (let v = 0; v <= cap; v += step) { const x = x0 + v / cap * len, maj = v % lab === 0; t += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + (maj ? 14 : 7)}" stroke="#14233a" stroke-width="${maj ? 1.3 : .6}"/>` + (maj ? `<text x="${x}" y="${y + h + 14}" text-anchor="middle" font-size="11" fill="var(--ink)" font-family="inherit">${v}</text>` : ""); }
  let acc = 0; const segs = (layers || []).map(l => { const s = `<rect x="${x0 + acc / cap * len}" y="${y + 1}" width="${Math.max(0, l.u / cap * len)}" height="${h - 2}" fill="${l.cloudy ? "#f3efe6" : "#bfe9f5"}" stroke="${l.cloudy ? "#cfc8b8" : "none"}"/>`; acc += l.u; return s; }).join("");
  const px = x0 + Math.min(plunger, cap) / cap * len;
  return `<svg class="mm-svg syr" viewBox="0 0 560 104" role="img" aria-label="${esc(label || `U-100 insulin syringe, ${cap}-unit, plunger at ${plunger} units`)}"><line x1="${x0 - 50}" y1="${y + h / 2}" x2="${x0}" y2="${y + h / 2}" stroke="#7a8699" stroke-width="2"/><rect x="${x0}" y="${y}" width="${len}" height="${h}" rx="5" fill="#fff" stroke="#14233a" stroke-width="1.6"/>${segs}${t}
   <rect x="${px}" y="${y - 2}" width="6" height="${h + 4}" fill="#1c2a44"/><line x1="${px + 6}" y1="${y + h / 2}" x2="${Math.max(px + 40, x0 + len + 30)}" y2="${y + h / 2}" stroke="#1c2a44" stroke-width="6"/><rect x="${x0 + len + 30}" y="${y - 6}" width="10" height="${h + 12}" rx="3" fill="#1c2a44"/>
   <text x="${x0}" y="${y - 10}" font-size="11" font-weight="700" fill="#C2334A" font-family="inherit">U-100 INSULIN · ${cap} UNITS (${cap / 100} mL)</text></svg>`;
}

/* ---------- Vial-mixing simulator ---------- */
const MIXV = {
  rn: { n: "Regular + NPH", clear: { label: "HUMULIN R", sub: "Regular · U-100", color: "#2B5FC4" }, why: "Humulin N label: may be mixed with Humulin R; Regular drawn first; inject immediately." },
  ln: { n: "Lispro + NPH", clear: { label: "HUMALOG", sub: "lispro · U-100", color: "#00776F" }, why: "Humalog label: U-100 may be mixed with NPH only; Humalog drawn first; inject immediately." },
  gl: { n: "Trap: glargine + lispro", trap: "glargine" },
  u2: { n: "Trap: lispro U-200 pen + NPH", trap: "u200" }
};
const MX_ACT = {
  verify: "Verify the order and both labels: exact products, U-100 strength, expiry, appearance", replace: "Set the problem vial aside and get a new vial",
  syr: "Hand hygiene, then select a new sterile syringe", swab: "Clean both rubber stoppers with alcohol", roll: "Gently roll and invert the NPH (cloudy) vial", shake: "Shake the NPH vial hard to mix it",
  airN: "Inject the plunger amount of AIR into the NPH (cloudy) vial — withdraw nothing", airC: "Inject the plunger amount of AIR into the clear vial",
  drawC: "Invert the clear vial and withdraw to the plunger mark", bub: "Check for air bubbles and recheck the units", drawN: "Insert into the NPH vial and withdraw until the syringe reads the plunger mark",
  drawNfirst: "Withdraw the NPH dose first", push: "Push extra insulin back into a vial to fix the amount", reuse: "Reuse the needle from the earlier insulin dose to save supplies",
  mL: "Measure the dose in mL on a 3 mL syringe instead", give: "Verify total units against the order (second nurse if required), then give SC promptly", nomix: "Stop — do not mix these; give as separate injections per order, or clarify"
};
const MX = {};
function mixNew(variant, assisted) {
  const R = pick([2, 4, 5, 6, 8, 10, 12]), N = pick([8, 10, 12, 14, 16, 18, 20, 24, 28]);
  Object.assign(MX, { v: variant, assisted, R, N, cap: null, plunger: 0, layers: [], airN: 0, airC: 0, rolled: false, swabbed: false, stage: "verify", errors: [], log: [], stopped: null, done: false, fault: !MIXV[variant].trap && Math.random() < .3 ? pick(["cloudy", "expired"]) : null, faultFixed: false, actions: null });
  MX.actions = shuffle(Object.keys(MX_ACT));
}
const MX_STAGES = ["verify", "syr", "prep", "airN", "airC", "drawC", "bub", "drawN", "give"];
function mxHint() {
  const v = MIXV[MX.v], T = MX.R + MX.N;
  if (v.trap) return "Read both labels against the order before you touch a needle.";
  return { verify: "Start by verifying order, products, strength, expiry and appearance.", replace: "A vial failed inspection — replace it.", syr: `Choose a U-100 insulin syringe that holds the full ${T} units.`, prep: "Clean both stoppers and gently roll the NPH.", airN: `AIR into CLOUDY: set the plunger to ${MX.N} units, inject into NPH.`, airC: `AIR into CLEAR: set ${MX.R} units, inject into the clear vial.`, drawC: `DRAW CLEAR first: set ${MX.R} units and withdraw.`, bub: "Check for bubbles before going into the NPH.", drawN: `DRAW CLOUDY: set the plunger to the TOTAL, ${T} units.`, give: "Final verification, then give promptly." }[MX.stage];
}
function insMix(z) {
  if (!MX.v) mixNew("rn", true);
  const v = MIXV[MX.v], T = MX.R + MX.N;
  const clear = v.trap === "glargine" ? { label: "LANTUS", sub: "glargine · U-100", color: "#C2334A" } : v.trap === "u200" ? { label: "HUMALOG U-200", sub: "KwikPen · 200 units/mL", color: "#7A5300" } : v.clear;
  const nphV = v.trap === "glargine" ? { label: "HUMALOG", sub: "lispro · U-100", color: "#00776F", cloudy: false } : { label: "HUMULIN N", sub: "NPH · U-100", color: "#5B48C9", cloudy: true };
  const order = v.trap === "glargine" ? `Glargine ${MX.N} units + lispro ${MX.R} units SC at 0730 — “mix in one syringe”` : v.trap === "u200" ? `Lispro ${MX.R} units (U-200 KwikPen on hand) + NPH ${MX.N} units — “mix in one syringe”` : `${v.clear.label.split(" ")[0] === "HUMULIN" ? "Regular (Humulin R) U-100" : "Lispro (Humalog) U-100"} ${MX.R} units + NPH (Humulin N) U-100 ${MX.N} units SC before breakfast, in one syringe`;
  const faultTxt = MX.fault && !MX.faultFixed && MX.stage !== "verify" ? (MX.fault === "cloudy" ? "CLOUDY" : "EXPIRED") : "";
  const last = MX.log[MX.log.length - 1];
  z.innerHTML = `<div class="card stack mixsim"><div class="row between"><div class="head"><span class="label">Vial-mixing simulator · ${MX.assisted ? "Guided (assisted)" : "Unassisted — counts for mastery"}</span><h2 class="h3">${esc(v.n)}</h2></div><div class="row"><select id="mxv" aria-label="Scenario">${Object.entries(MIXV).map(([k, x]) => `<option value="${k}" ${k === MX.v ? "selected" : ""}>${esc(x.n)}</option>`).join("")}</select><button class="btn sm" id="mxmode">${MX.assisted ? "Switch to unassisted" : "Switch to guided"}</button></div></div>
   <div class="panel order"><span class="label">Provider order</span><div><b>${esc(order)}</b></div></div>
   ${MX.assisted ? `<div class="mnemo"><b>AIR into CLOUDY, AIR into CLEAR — DRAW CLEAR, DRAW CLOUDY.</b> Clear first keeps cloudy NPH out of the clear vial.</div>` : ""}
   <div class="bench-row row mixstage"><div class="vialbox">${vialSVG({ ...clear, cloudy: MX.fault === "cloudy" && !MX.faultFixed && !v.trap, air: MX.airC, inv: MX.stage === "drawC", bad: faultTxt && MX.fault === "cloudy" ? "Looks cloudy!" : "", aria: `${clear.label} ${clear.sub} vial${MX.airC ? `, ${MX.airC} units of air injected` : ""}` })}<span class="xs">Clear vial</span></div>
    <div class="vialbox">${vialSVG({ ...nphV, air: MX.airN, bad: faultTxt && MX.fault === "expired" ? "EXP: last month" : "", aria: `${nphV.label} ${nphV.sub} vial${MX.airN ? `, ${MX.airN} units of air injected` : ""}${MX.rolled ? ", resuspended" : ""}` })}<span class="xs">${nphV.cloudy ? "Cloudy vial" : "Second vial"}</span></div></div>
   ${MX.cap ? `<div class="bench-tool">${insSyrSVG(MX.cap, MX.plunger, MX.layers, `U-100 insulin syringe, ${MX.cap}-unit; contains ${MX.layers.reduce((a, l) => a + l.u, 0)} units; plunger set to ${MX.plunger} units`)}</div>
    <div class="row plunger"><label for="mxp" class="small"><b>Plunger</b></label><button class="iconbtn" data-pn="-1" aria-label="Plunger down 1 unit">−</button><input id="mxp" type="range" min="0" max="${MX.cap}" step="1" value="${MX.plunger}" aria-label="Plunger position in units" style="flex:1"><button class="iconbtn" data-pn="1" aria-label="Plunger up 1 unit">+</button><input id="mxpn" class="mono" inputmode="numeric" value="${MX.plunger}" aria-label="Plunger units (type a number)" style="width:72px"><span class="small">units</span></div>` : ""}
   ${MX.stopped ? `<div class="fb bad stopbox" role="alert"><h4>${ico("x")} Simulation stopped — unsafe step</h4><div>${esc(MX.stopped)}</div><div class="row"><button class="btn primary" id="mxre">Start over with new doses</button></div></div>`
     : MX.done ? `<div class="fb ${MX.errors.length ? "bad" : "ok"}" role="status"><h4>${MX.errors.length ? `Completed with ${MX.errors.length} correction${MX.errors.length > 1 ? "s" : ""} — not a passing checkoff` : `${ico("check")} Checkoff passed`}</h4><div class="small">${v.trap ? "You recognized a do-not-mix situation." : `Syringe holds ${MX.R} units ${v.clear.label.split(" ")[0].toLowerCase()} + ${MX.N} units NPH = ${T} units total, drawn clear first.`} ${MX.assisted ? "Guided runs are practice; do an unassisted run for mastery." : MX.errors.length ? "" : "Unassisted mastery requirement met."}</div><button class="btn primary" id="mxre">Repeat with new doses</button></div>`
     : `${MX.assisted ? `<div class="hint small">${ico("bulb", 14)} Next: ${esc(mxHint())}</div>` : ""}<div class="label">Choose your next action</div><div class="mxacts">${MX.actions.map(k => k === "syr" ? `<div class="mxsyr"><span class="small"><b>${esc(MX_ACT.syr)}:</b></span>${[["s30", "30-unit U-100 insulin"], ["s50", "50-unit U-100 insulin"], ["s100", "100-unit U-100 insulin"], ["s3", "3 mL syringe (mL marks)"], ["s500", "U-500 syringe"]].map(([id, n]) => `<button class="btn sm" data-mx="${id}">${n}</button>`).join("")}</div>` : `<button class="mxbtn" data-mx="${k}">${esc(MX_ACT[k])}</button>`).join("")}</div>`}
   <ol class="mxlog" aria-live="polite">${MX.log.map(l => `<li class="${l.ok ? "ok" : "bad"}">${l.ok ? "✓" : "✗"} ${esc(l.t)}</li>`).join("")}</ol>
   <p class="xs muted">Sequence sources: ${refLinks(["humN", "humalog", "novolog", "lantus"])}; course Med-Surg slide 52 (“First withdraw regular insulin, then the longer-acting insulin”).</p></div>${SIM_NOTE}`;
  const ok = t => MX.log.push({ ok: true, t }), err = t => { MX.errors.push(t); MX.log.push({ ok: false, t }); }, stop = t => { MX.errors.push(t); MX.stopped = t; MX.log.push({ ok: false, t }); record(); }, redraw = () => { insMix(z); };
  const record = () => { const s = insS(); s.mix.runs.push({ t: Date.now(), v: MX.v, ok: MX.done && !MX.errors.length && !MX.stopped, assisted: MX.assisted, errors: MX.errors.length }); s.mix.runs = s.mix.runs.slice(-60); if (MX.done && !MX.errors.length && !MX.assisted && !MIXV[MX.v].trap) s.mix.mastered = Date.now(); touch(); save(); };
  $("#mxv", z).onchange = e => { mixNew(e.target.value, MX.assisted); redraw(); };
  $("#mxmode", z).onclick = () => { mixNew(MX.v, !MX.assisted); redraw(); };
  const re = $("#mxre", z); if (re) re.onclick = () => { mixNew(MX.v, MX.assisted); redraw(); };
  const setP = v => { MX.plunger = clamp(Math.round(v), 0, MX.cap); redraw(); const r = $("#mxp", z); r && r.focus(); };
  const rg = $("#mxp", z); if (rg) { rg.oninput = e => { MX.plunger = +e.target.value; $("#mxpn", z).value = MX.plunger; $(".bench-tool", z).innerHTML = insSyrSVG(MX.cap, MX.plunger, MX.layers); }; }
  const pn = $("#mxpn", z); if (pn) pn.onchange = e => { const v = MM.parseNum(e.target.value); if (isNaN(v)) { toast("Type a whole number of units"); e.target.value = MX.plunger; return; } setP(v); };
  z.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.pn) return setP(MX.plunger + +b.dataset.pn);
    const a = b.dataset.mx; if (!a || MX.stopped || MX.done) return;
    // universal unsafe actions
    if (a === "shake") return stop("Shaking NPH creates foam and bubbles and makes the dose inaccurate. Safe practice: roll between the palms and invert gently (Humulin N label), until uniformly cloudy."), redraw();
    if (a === "push") return stop("Never push insulin back into a vial — it contaminates the vial and leaves an unknown ratio in the syringe. Safe practice: discard the syringe and start over."), redraw();
    if (a === "reuse") return stop("Needles and syringes are single-use. Safe practice: a new sterile syringe and needle for every preparation."), redraw();
    if (a === "mL" || a === "s3") return stop("Insulin is measured in UNITS with a U-100 insulin syringe. A mL syringe invites conversion errors (a 0.1 mL slip = 10 units). Safe practice: U-100 insulin syringe."), redraw();
    if (a === "s500") return stop("A U-500 syringe is only for U-500 insulin — with U-100 insulin its markings would give the wrong dose. Safe practice: match the syringe to the insulin concentration."), redraw();
    if (MIXV[MX.v].trap) {
      if (a === "verify" && MX.stage === "verify") { ok(MIXV[MX.v].trap === "glargine" ? "Verified: glargine (Lantus) is on the order — Lantus label: do not mix with any other insulin." : "Verified: lispro is a U-200 pen — label: never transfer U-200 to a syringe and never mix it."); MX.stage = "trap"; return redraw(); }
      if (a === "nomix") { if (MX.stage !== "trap") err("Verify the labels first — even a correct conclusion needs verification."); else { ok(MIXV[MX.v].trap === "glargine" ? "Stopped: glargine is never mixed. Give as separate injections per order or clarify the order." : "Stopped: U-200 is dialed and injected with its own pen; NPH is drawn separately. Clarify the order."); MX.done = true; record(); } return redraw(); }
      if (["airN", "airC", "drawC", "drawN", "drawNfirst", "give"].includes(a) || /^s\d/.test(a)) return stop(MIXV[MX.v].trap === "glargine" ? "Glargine must never be mixed with another insulin (Lantus label) — mixing changes its action. This preparation can't continue." : "Humalog U-200 must never be drawn from the pen into a syringe or mixed (label) — a syringe reading would be wrong. This preparation can't continue."), redraw();
      err(`“${MX_ACT[a]}” doesn't resolve the problem with this order.`); return redraw();
    }
    const st = MX.stage, T = MX.R + MX.N;
    if (a === "drawNfirst") return stop("Drawing NPH first and then entering the clear vial can carry cloudy NPH into the clear vial and change its action. Safe practice: draw CLEAR first, then CLOUDY."), redraw();
    if (a === "nomix") { err("These two insulins are label-permitted for mixing with this order — stopping isn't needed here."); return redraw(); }
    if (st === "verify") { if (a !== "verify") { err("Start by verifying the order and both labels before preparing anything."); return redraw(); } ok(`Verified: ${v.clear.label} U-100 and HUMULIN N U-100; combined order; ${v.why}`); MX.stage = MX.fault ? "replace" : "syr"; if (MX.fault) MX.log.push({ ok: false, t: MX.fault === "cloudy" ? "Inspection finding: the clear insulin looks cloudy — it should be clear." : "Inspection finding: the NPH vial is past its expiration date." }); return redraw(); }
    if (st === "replace") { if (a !== "replace") { err("A vial failed inspection — it can't be used. Replace it before continuing."); return redraw(); } MX.faultFixed = true; ok("Replaced the vial that failed inspection."); MX.stage = "syr"; return redraw(); }
    if (/^s\d/.test(a)) { if (st !== "syr") { err("Select the syringe right after verification."); return redraw(); } const cap = +a.slice(1); if (cap < T) { err(`A ${cap}-unit syringe can't hold the ${T}-unit total. Choose one that holds the full dose.`); return redraw(); } MX.cap = cap; MX.plunger = 0; ok(`New ${cap}-unit U-100 insulin syringe${cap === [30, 50, 100].find(c => c >= T) ? " — smallest that holds the total: most precise." : " — holds the dose (a smaller one would be more precise)."}`); MX.stage = "prep"; return redraw(); }
    if (a === "syr") return;
    if (st === "syr") { err("Hand hygiene and a new sterile U-100 insulin syringe come first."); return redraw(); }
    if (st === "prep") {
      if (a === "swab") { if (!MX.swabbed) { MX.swabbed = true; ok("Cleaned both stoppers."); } }
      else if (a === "roll") { if (!MX.rolled) { MX.rolled = true; ok("Rolled and inverted NPH gently — uniformly cloudy."); } }
      else { err(a === "airC" || a === "airN" || a === "drawC" ? "Skipped a step: clean both stoppers and resuspend the NPH before entering the vials." : `Not yet: ${MX_ACT[a]}.`); return redraw(); }
      if (MX.swabbed && MX.rolled) MX.stage = "airN"; return redraw();
    }
    if (st === "airN") { if (a !== "airN") { err(a === "airC" ? "Air goes into the CLOUDY vial first, then the clear vial." : a === "drawC" ? "Skipped the air steps — air into both vials first so you don't create a vacuum." : `Not yet: ${MX_ACT[a]}.`); return redraw(); } if (MX.plunger !== MX.N) { err(`Air into NPH should equal the NPH dose: ${MX.N} units (plunger was at ${MX.plunger}).`); return redraw(); } MX.airN = MX.N; MX.plunger = 0; ok(`Injected ${MX.N} units of air into NPH; withdrew nothing.`); MX.stage = "airC"; return redraw(); }
    if (st === "airC") { if (a !== "airC") { err(a === "drawC" ? "Skipped the air step for the clear vial." : `Not yet: ${MX_ACT[a]}.`); return redraw(); } if (MX.plunger !== MX.R) { err(`Air into the clear vial should equal its dose: ${MX.R} units (plunger was at ${MX.plunger}).`); return redraw(); } MX.airC = MX.R; ok(`Injected ${MX.R} units of air into the clear vial.`); MX.stage = "drawC"; return redraw(); }
    if (st === "drawC") { if (a !== "drawC") { err(a === "drawN" ? "Draw CLEAR first, then CLOUDY." : `Not yet: ${MX_ACT[a]}.`); return redraw(); } if (MX.plunger !== MX.R) { err(`Withdraw exactly the clear dose: ${MX.R} units (plunger at ${MX.plunger}). Set the plunger, then withdraw.`); return redraw(); } MX.layers = [{ u: MX.R, cloudy: false }]; ok(`Withdrew ${MX.R} units of clear insulin first.`); MX.stage = "bub"; return redraw(); }
    if (st === "bub") { if (a !== "bub") { err(a === "drawN" ? "Check for bubbles in the clear dose before entering the NPH vial — bubbles take the place of insulin." : `Not yet: ${MX_ACT[a]}.`); return redraw(); } ok(`No bubbles; syringe reads ${MX.R} units.`); MX.stage = "drawN"; return redraw(); }
    if (st === "drawN") { if (a !== "drawN") { err(`Not yet: ${MX_ACT[a]}.`); return redraw(); } if (MX.plunger > T) return stop(`Overdraw: the syringe would read ${MX.plunger} units, more than the ${T}-unit total. You can't push mixed insulin back. Safe practice: discard and start over with a new syringe.`), redraw(); if (MX.plunger < T) { err(`The final mark is the TOTAL: ${MX.R} + ${MX.N} = ${T} units, not ${MX.plunger}.`); return redraw(); } MX.layers = [{ u: MX.R, cloudy: false }, { u: MX.N, cloudy: true }]; ok(`Withdrew NPH until the syringe read the ${T}-unit total.`); MX.stage = "give"; return redraw(); }
    if (st === "give") { if (a !== "give") { err(`Not yet: ${MX_ACT[a]}.`); return redraw(); } ok(`Verified ${T} units total against the order; given SC promptly after mixing.`); MX.done = true; record(); return redraw(); }
  };
  window.__mx = MX;
}

/* ---------- Skills checkoff: vial, pen, site rotation ---------- */
const CK = {
  vial: { n: "Vial + syringe administration", steps: [
    ["Before preparing, what do you verify?", ["The order and MAR: insulin name, formulation, U-100 strength, dose in units, route, time, and its purpose", "Only the dose", "The patient's room number"], 0, ["Missing a formulation or strength check is how regular, glargine and U-500 mix-ups happen.", "A room number isn't an identifier."]],
    ["How is the patient identified?", ["Two identifiers (e.g., name and date of birth) against the MAR/wristband", "Ask “Are you Mr. Lee?”", "Bed number"], 0, ["A yes/no question invites a wrong 'yes'.", "Beds change."]],
    ["What do you check about the patient right before insulin?", ["Current glucose and its time, allergies, symptoms, and whether the meal is here / NPO status", "Only allergies", "Yesterday's glucose"], 0, ["Glucose and meal status decide whether to give, treat or clarify.", "Old values don't reflect now."]],
    ["High-alert medication — what applies?", ["Follow the facility's independent double-check rule for insulin", "Double-checks are optional", "Ask the patient to double-check the syringe"], 0, ["Skipping a required check removes a safety barrier.", "The patient isn't the second clinician check."]],
    ["What do you look for in the vial?", ["Right product and concentration, expiration/opened date, and appearance (regular clear; NPH uniformly cloudy after rolling)", "Just the color of the cap", "Whether it's cold"], 0, ["Cap colors vary and aren't a verification.", "Temperature isn't the identity check."]],
    ["Which syringe?", ["A U-100 insulin syringe sized to the dose", "Any 1 mL syringe", "A 3 mL syringe"], 0, ["A non-insulin syringe is marked in mL — risk of a tenfold error.", "Same problem — mL markings."]],
    ["Choosing the site:", ["Inspect and palpate; avoid lumps, scars or bruises; rotate within the area", "Use the same spot as last time", "Inject into a lumpy area — it hurts less"], 0, ["Repeated use builds lipohypertrophy.", "Lumpy (lipohypertrophied) tissue absorbs erratically."]],
    ["Skin prep:", ["Clean per facility policy and let it dry", "Blow on it to dry it faster", "No preparation is ever needed"], 0, ["Not aseptic.", "Follow policy."]],
    ["Needle entry:", ["SC: angle and skin pinch based on needle length and the patient's tissue", "Always 15° like an intradermal", "IM into the deltoid"], 0, ["Too shallow — that's intradermal.", "Insulin is SC, not IM."]],
    ["During the injection:", ["Inject steadily; no routine aspiration", "Aspirate for 10 seconds first", "Massage while injecting"], 0, ["Routine aspiration isn't done for SC insulin.", "Massage can change absorption."]],
    ["After the injection:", ["Don't massage; activate the safety device and drop it in the sharps container immediately", "Recap with two hands", "Lay the syringe on the bed"], 0, ["Two-handed recapping causes needlesticks.", "A loose sharp is a hazard."]],
    ["Then:", ["Document dose, time and site; reassess glucose/symptoms per order and teach low-glucose signs", "Document at end of shift", "Leave until the next meal"], 0, ["Delayed charting risks a duplicate dose.", "Watch for hypoglycemia at onset/peak."]]
  ] },
  pen: { n: "Prefilled pen administration", steps: [
    ["Before using the pen:", ["Verify order/MAR, two identifiers, glucose and meal status — same as a vial", "Pens don't need the rights", "Check only the pen color"], 0, ["Every insulin dose needs the full checks.", "Colors aren't verification."]],
    ["Whose pen is it?", ["A pen labeled for THIS patient only — never shared, even with a new needle", "Any pen of the same insulin on the unit", "A coworker's patient's pen with a new needle"], 0, ["Blood can backflow into the cartridge — sharing transmits infection (CDC, labels).", "Never shared, even with a new needle."]],
    ["Check the pen:", ["Product name and concentration on the label, expiration/opened date, appearance; resuspend cloudy insulin per label", "Shake any pen hard", "Check only the dose window"], 0, ["Shaking creates bubbles.", "Identity and strength first."]],
    ["Needle:", ["Attach a new pen needle for this injection", "Reuse the needle from this morning", "No needle needed for the safety test"], 0, ["Reuse dulls the needle and risks contamination.", "The prime/safety test needs the needle on."]],
    ["Prime (safety test):", ["Prime as the manufacturer directs until insulin appears at the tip", "Skip priming to save insulin", "Prime into the patient"], 0, ["Without priming, air or a blocked needle can mean an underdose.", "Priming is done away from the patient."]],
    ["Dial the dose:", ["Dial the ordered units and confirm the number in the dose window", "Dial an extra unit to be safe", "Count clicks only"], 0, ["Extra insulin is an overdose.", "Confirm visually in the window."]],
    ["Concentrated pen (U-200/U-300/U-500):", ["Dial the units on that pen — never draw from it with a syringe or convert", "Draw it up in a U-100 syringe", "Convert to mL"], 0, ["A U-100 syringe reading of concentrated insulin is a multi-fold overdose.", "No unsupervised conversions."]],
    ["Inject:", ["SC at the chosen rotated site, press the button fully", "IM into the thigh", "Pinch an area with a lump"], 0, ["Insulin is SC.", "Avoid lipohypertrophy."]],
    ["Before removing:", ["Keep the needle in for the time in the pen's instructions, then withdraw", "Pull out immediately", "Massage while counting"], 0, ["Part of the dose can leak out.", "No massage."]],
    ["Finish:", ["Remove and discard the needle in sharps, cap the pen, store per label, document and reassess", "Store with the needle on", "Return the pen to stock for another patient"], 0, ["Needles left on let air and leaks in.", "Pens stay with one patient."]]
  ] }
};
const SITE_ZONES = [["abd-ul", "Abdomen upper left", 138, 172], ["abd-ur", "Abdomen upper right", 182, 172], ["abd-ll", "Abdomen lower left", 138, 210], ["abd-lr", "Abdomen lower right", 182, 210], ["arm-l", "Back of left upper arm", 92, 150], ["arm-r", "Back of right upper arm", 228, 150], ["thigh-l", "Left outer thigh", 136, 300], ["thigh-r", "Right outer thigh", 184, 300], ["umb", "Right next to the navel", 160, 192]];
const SITE_ROUNDS = [
  { q: "Last three injections were all in the abdomen upper right. Choose today's site.", ok: z => z !== "abd-ur" && z !== "umb", why: "Rotate within the area — move away from the last spot (and avoid the area right around the navel)." },
  { q: "You feel a firm, rubbery lump in the abdomen lower left (lipohypertrophy). Choose today's site.", ok: z => z !== "abd-ll" && z !== "umb", why: "Insulin absorbs erratically from lipohypertrophy — avoid the lump and report it." },
  { q: "The patient has a healing scar across the lower abdomen. Which site is appropriate?", ok: z => /^abd-u|^arm|^thigh/.test(z), why: "Avoid scars; upper abdomen, back of the upper arm or outer thigh are options (PEDS course: upper arms, thighs, hips, abdomen)." },
  { q: "Where should insulin NOT be injected?", ok: z => z === "umb", why: "Directly at the navel is avoided — choose tissue a few finger-widths away.", pickBad: true }
];
const CKS = { k: null, i: 0, miss: [], first: 0 };
function insCheck(z) {
  const s = insS();
  if (!CKS.k) {
    z.innerHTML = `<div class="card stack"><div class="head"><span class="label">Skills checkoff</span><h2 class="h3">Medication pass simulations</h2><p class="small muted">Each step gives real-time feedback; a miss shows the consequence and the safe practice. Print a record for instructor review.</p></div>
     <div class="grid g3">${[["vial", "Vial + syringe", "12 steps"], ["pen", "Prefilled pen", "10 steps"], ["site", "SC site rotation", "4 body-map rounds"]].map(([k, n, d]) => { const r = s.check[k]; return `<button class="ins-card" data-ck="${k}"><b>${n}</b><span class="small muted">${d}</span><span class="chip ${r ? (r.pass ? "badge-S" : "badge-flag") : ""}">${r ? (r.pass ? "Passed " + fmtDate(r.t) : `Last: ${r.score}%`) : "Not done"}</span></button>`; }).join("")}</div>
     <div class="row"><button class="btn" id="ckprint">${ico("src", 16)} Printable checkoff record</button></div></div>${SIM_NOTE}`;
    z.onclick = e => { const b = e.target.closest("[data-ck]"); if (b) { Object.assign(CKS, { k: b.dataset.ck, i: 0, miss: [], first: 0, tried: false }); z.onclick = null; insCheck(z); } if (e.target.closest("#ckprint")) printCheck(); };
    return;
  }
  if (CKS.k === "site") return siteCheck(z);
  const C = CK[CKS.k], step = C.steps[CKS.i];
  if (!step) {
    const score = pct(CKS.first, C.steps.length), pass = CKS.miss.length === 0;
    s.check[CKS.k] = { t: Date.now(), score, pass, miss: CKS.miss.slice() }; touch(); save();
    z.innerHTML = `<div class="card stack"><div class="fb ${pass ? "ok" : "bad"}"><h4>${pass ? `${ico("check")} ${esc(C.n)} — passed` : `${esc(C.n)} — ${score}% on first try`}</h4>${pass ? "Every step right the first time." : `<div class="small">Review: ${CKS.miss.map(m => esc(m)).join(" · ")}</div><div class="small">A passing checkoff needs every step right the first time — try again.</div>`}</div><div class="row"><button class="btn primary" id="ckagain">Repeat</button><button class="btn" id="ckback">All checkoffs</button><button class="btn" id="ckprint">Print record</button></div></div>${SIM_NOTE}`;
    $("#ckagain", z).onclick = () => { Object.assign(CKS, { i: 0, miss: [], first: 0, tried: false }); insCheck(z); };
    $("#ckback", z).onclick = () => { CKS.k = null; insCheck(z); }; $("#ckprint", z).onclick = printCheck; return;
  }
  const perm = CKS.perm && CKS.permI === CKS.i ? CKS.perm : (CKS.perm = shuffle([0, 1, 2]), CKS.permI = CKS.i, CKS.perm);
  z.innerHTML = `<div class="card stack"><div class="row between"><button class="btn sm ghost" id="ckback">${ico("back", 16)} Checkoffs</button><span class="label">${esc(C.n)} · step ${CKS.i + 1} of ${C.steps.length}</span></div><div class="progress-line"><i style="width:${pct(CKS.i, C.steps.length)}%"></i></div>
   <p class="q-stem">${esc(step[0])}</p><div class="stack">${perm.map(k => `<button class="opt" data-c="${k}"><span class="mk"></span><span>${esc(step[1][k])}</span></button>`).join("")}</div><div id="ckfb" aria-live="polite"></div></div>${SIM_NOTE}`;
  $("#ckback", z).onclick = () => { CKS.k = null; insCheck(z); };
  z.onclick = e => { const b = e.target.closest("[data-c]"); if (!b || b.disabled) return; const k = +b.dataset.c;
    if (k === step[2]) { if (!CKS.tried) CKS.first++; b.classList.add("correct"); $$("[data-c]", z).forEach(x => x.disabled = true); $("#ckfb", z).innerHTML = `<div class="fb ok" role="status"><b>${ico("check", 14)} Correct.</b> <button class="btn sm primary" id="cknext">${CKS.i === C.steps.length - 1 ? "Finish" : "Next step"}</button></div>`; $("#cknext", z).onclick = () => { CKS.i++; CKS.tried = false; insCheck(z); }; $("#cknext", z).focus(); }
    else { if (!CKS.tried) CKS.miss.push(step[0]); CKS.tried = true; b.classList.add("wrong"); b.disabled = true; const wi = [1, 2].indexOf(k); $("#ckfb", z).innerHTML = `<div class="fb bad" role="status"><b>Consequence:</b> ${esc(step[3][k === 0 ? 0 : k - 1] || "")} <b>Safe practice:</b> ${esc(step[1][step[2]])}</div>`; }
  };
}
function siteCheck(z) {
  const s = insS(), r = SITE_ROUNDS[CKS.i];
  if (!r) { const pass = CKS.miss.length === 0; s.check.site = { t: Date.now(), score: pct(CKS.first, SITE_ROUNDS.length), pass, miss: CKS.miss.slice() }; save(); z.innerHTML = `<div class="card stack"><div class="fb ${pass ? "ok" : "bad"}"><h4>${pass ? "Site rotation — passed" : "Site rotation — review needed"}</h4>${pass ? "Every choice was safe on the first try." : esc(CKS.miss.join(" · "))}</div><div class="row"><button class="btn primary" id="ckagain">Repeat</button><button class="btn" id="ckback">All checkoffs</button></div></div>`; $("#ckagain", z).onclick = () => { Object.assign(CKS, { i: 0, miss: [], first: 0, tried: false }); insCheck(z); }; $("#ckback", z).onclick = () => { CKS.k = null; insCheck(z); }; return; }
  z.innerHTML = `<div class="card stack"><div class="row between"><button class="btn sm ghost" id="ckback">${ico("back", 16)} Checkoffs</button><span class="label">Site rotation · round ${CKS.i + 1} of ${SITE_ROUNDS.length}</span></div><p class="q-stem">${esc(r.q)}</p>
   <div class="bodymap"><svg viewBox="0 0 320 380" role="img" aria-label="Body outline with injection zones; use the buttons to choose"><circle cx="160" cy="40" r="26" fill="var(--surface-2)" stroke="var(--line-strong)"/><path d="M110 75h100l30 40 10 100-24 4-12-80v80l10 150h-44l-10-120-10 120h-44l10-150v-80l-12 80-24-4 10-100z" fill="var(--surface-2)" stroke="var(--line-strong)" stroke-width="2"/>${SITE_ZONES.map(([id, n, x, y]) => `<circle cx="${x}" cy="${y}" r="${id === "umb" ? 7 : 16}" fill="${id === "umb" ? "var(--danger)" : "var(--teal)"}" opacity=".35"/>`).join("")}</svg>
    <div class="stack sitebtns">${SITE_ZONES.map(([id, n]) => `<button class="opt" data-site="${id}"><span class="mk"></span><span>${esc(n)}</span></button>`).join("")}</div></div><div id="ckfb" aria-live="polite"></div></div>`;
  $("#ckback", z).onclick = () => { CKS.k = null; insCheck(z); };
  z.onclick = e => { const b = e.target.closest("[data-site]"); if (!b || b.disabled) return; const okk = r.ok(b.dataset.site);
    if (okk) { if (!CKS.tried) CKS.first++; b.classList.add("correct"); $$("[data-site]", z).forEach(x => x.disabled = true); $("#ckfb", z).innerHTML = `<div class="fb ok"><b>Safe choice.</b> ${esc(r.why)} <button class="btn sm primary" id="cknext">Next</button></div>`; $("#cknext", z).onclick = () => { CKS.i++; CKS.tried = false; insCheck(z); }; }
    else { if (!CKS.tried) CKS.miss.push(r.q); CKS.tried = true; b.classList.add("wrong"); b.disabled = true; $("#ckfb", z).innerHTML = `<div class="fb bad"><b>Not safe here.</b> ${esc(r.why)}</div>`; } };
}
function printCheck() {
  const s = insS(), w = document.createElement("div"); w.className = "printsheet";
  const row = (n, r) => `<tr><td>${n}</td><td>${r ? (r.pass ? "Passed" : "Not passed") : "Not attempted"}</td><td>${r ? r.score + "%" : "—"}</td><td>${r ? fmtDate(r.t) : "—"}</td><td>${r && r.miss && r.miss.length ? esc(r.miss.join("; ")) : "—"}</td><td></td></tr>`;
  const mx = s.mix.runs.filter(x => !x.assisted).slice(-1)[0];
  w.innerHTML = `<h1>Insulin Skills — Practice Checkoff Record</h1><p>Student: ____________________ Date printed: ${new Date().toLocaleDateString()} · PHARM MASTER Insulin Lab (educational simulation; requires supervised competency validation)</p>
   <table><thead><tr><th>Skill</th><th>Result</th><th>First-try score</th><th>Date</th><th>Steps to review</th><th>Instructor initials</th></tr></thead><tbody>${row("Vial + syringe administration", s.check.vial)}${row("Prefilled pen administration", s.check.pen)}${row("SC site rotation", s.check.site)}<tr><td>Mix regular + NPH (unassisted)</td><td>${s.mix.mastered ? "Passed" : "Not passed"}</td><td>—</td><td>${mx ? fmtDate(mx.t) : "—"}</td><td>${mx ? mx.errors + " errors last unassisted run" : "—"}</td><td></td></tr><tr><td>Insulin Safety Checkoff (10 Q)</td><td>${s.exam.length ? s.exam[s.exam.length - 1].score + "%" : "—"}</td><td>${s.exam.length ? (s.exam[s.exam.length - 1].fa ? pct(s.exam[s.exam.length - 1].fac, s.exam[s.exam.length - 1].fa) + "% first attempts" : "—") : "—"}</td><td>${s.exam.length ? fmtDate(s.exam[s.exam.length - 1].t) : "—"}</td><td></td><td></td></tr></tbody></table><p>Instructor signature: ______________________________</p>`;
  document.body.appendChild(w); document.body.classList.add("printing");
  const done = () => { w.remove(); document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done); try { window.print(); } catch (e) { } setTimeout(() => { if (w.isConnected && !matchMedia("print").matches) done(); }, 1500);
}

/* ---------- Syringe reading & insulin math ---------- */
const SYQ = { q: null };
function syrQuestion() {
  const kind = pick(["read", "read", "set", "combo", "wrong", "conc"]);
  if (kind === "read") { const v = pick([4, 8, 15, 26, 12, 22, 7, 18]); const cap = v > 30 ? 50 : pick([30, 50]); return { kind, cap, v, text: `Read this ${cap}-unit U-100 insulin syringe. How many units?`, ans: v }; }
  if (kind === "set") { const v = pick([4, 8, 15, 26, 19, 33]); return { kind, cap: v > 30 ? 50 : 30, v, text: `Order: ${v} units of insulin lispro U-100. Set the plunger to the dose.`, ans: v }; }
  if (kind === "combo") { const R = pick([4, 6, 8, 10]), N = pick([12, 14, 18, 22, 26]); return { kind, cap: R + N > 30 ? 50 : 30, R, N, text: `Order: regular ${R} units + NPH ${N} units in one syringe. Regular is drawn first. To which mark is the syringe filled after adding the NPH?`, ans: R + N }; }
  if (kind === "wrong") { const v = pick([24, 36, 44, 52, 68]); return { kind, cap: 100, v, text: `This 100-unit U-100 syringe has small marks every 2 units. How many units are in it?`, ans: v, trap: v / 2 }; }
  const u = pick([10, 15, 20, 25]); return { kind, cap: 50, u, text: `Order: ${u} units of insulin glargine U-100. A coworker asks how many mL to draw up in a 3 mL syringe. What is the safe response?`, choices: [`Measure ${u} units with a U-100 insulin syringe — don't convert to mL on a non-insulin syringe`, `${u / 100} mL in a 3 mL syringe`, `${u / 10} mL in a 3 mL syringe`, `${u} mL`], ans: 0 };
}
function insSyringe(z) {
  const q = SYQ.q || (SYQ.q = syrQuestion()), s = insS();
  let val = q.kind === "set" ? 0 : "";
  const vis = q.kind === "read" || q.kind === "wrong" ? insSyrSVG(q.cap, q.v, [{ u: q.v }], `U-100 insulin syringe, ${q.cap}-unit, filled to an unknown mark`) : q.kind === "combo" ? insSyrSVG(q.cap, q.R, [{ u: q.R }], `Syringe with ${q.R} units of regular drawn`) : "";
  z.innerHTML = `<div class="card stack"><div class="row between"><div class="head"><span class="label">Syringe reading & insulin math · ${s.syr.cor}/${s.syr.att} correct</span><h2 class="h3">Units, not mL</h2></div></div>
   <div class="panel small"><b>U-100 = 100 units per mL</b> — a concentration, not a dose. Read the syringe in UNITS. 30- and 50-unit syringes: each line = 1 unit. 100-unit syringes: usually each line = 2 units. Concentrated insulin (U-200, U-300, U-500) is high-alert: only its own pen or dedicated syringe, never a conversion on your own.</div>
   <p class="q-stem">${esc(q.text)}</p>${vis ? `<div class="bench-tool" id="sv">${vis}</div>` : ""}
   ${q.kind === "set" ? `<div class="bench-tool" id="sv">${insSyrSVG(q.cap, 0, [], "Empty syringe")}</div><div class="row plunger"><button class="iconbtn" data-sn="-1" aria-label="Down 1 unit">−</button><input id="srg" type="range" min="0" max="${q.cap}" step="1" value="0" aria-label="Plunger in units" style="flex:1"><button class="iconbtn" data-sn="1" aria-label="Up 1 unit">+</button><output id="so" class="mono">0 units</output></div>`
     : q.choices ? `<div class="stack">${q.choices.map((c, k) => `<button class="opt" data-sc="${k}"><span class="mk">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`).join("")}</div>`
     : `<div class="mm-answer"><div class="field"><label for="sans">Units</label><input id="sans" inputmode="numeric" autocomplete="off"></div></div>`}
   <div class="row"><button class="btn primary" id="schk">Check</button></div><div id="sfb" aria-live="polite"></div></div>`;
  const set = v => { val = clamp(v, 0, q.cap); $("#srg", z).value = val; $("#so", z).textContent = val + " units"; $("#sv", z).innerHTML = insSyrSVG(q.cap, val, [{ u: val }]); };
  const rg = $("#srg", z); if (rg) rg.oninput = e => set(+e.target.value);
  let choice = null;
  z.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.sn) return set(val + +b.dataset.sn);
    if (b.dataset.sc) { choice = +b.dataset.sc; $$("[data-sc]", z).forEach(x => x.setAttribute("aria-pressed", x === b)); $$("[data-sc]", z).forEach(x => x.classList.toggle("sel", x === b)); return; }
    if (b.id === "snext") { SYQ.q = null; return insSyringe(z); }
    if (b.id === "schk") {
      let got;
      if (q.choices) { if (choice == null) return toast("Choose an answer"); got = choice; }
      else if (q.kind === "set") got = val;
      else { const t = $("#sans", z).value, iss = MM.numIssue(t); if (iss) return toast(iss); got = MM.parseNum(t); }
      const ok = got === q.ans; s.syr.att++; if (ok) s.syr.cor++; touch(); save();
      const why = q.kind === "combo" ? `Regular ${q.R} + NPH ${q.N} = ${q.ans} units — the final mark is the total.` : q.kind === "wrong" ? (got === q.trap ? `You counted each line as 1 unit. On a 100-unit syringe each small line is usually 2 units: ${q.ans} units.` : `${q.ans} units — 100-unit syringes are usually marked every 2 units.`) : q.kind === "conc" ? "Insulin is measured in units on a U-100 insulin syringe; a mL syringe invites tenfold errors." : `${q.ans} units.`;
      $("#sfb", z).innerHTML = `<div class="fb ${ok ? "ok" : "bad"}" role="status"><b>${ok ? "Correct." : "Not quite."}</b> ${esc(why)} <button class="btn sm primary" id="snext">Next</button></div>`;
      if (q.kind === "combo") $("#sv", z).innerHTML = insSyrSVG(q.cap, q.ans, [{ u: q.R }, { u: q.N, cloudy: true }], `Syringe at ${q.ans} units: regular then NPH`);
      $("#snext", z).focus();
    }
  };
  const sa = $("#sans", z); if (sa) sa.onkeydown = e => { if (e.key === "Enter") $("#schk", z).click(); };
  window.__syq = q;
}

/* ---------- Quiz & 10-question Insulin Safety Checkoff ---------- */
function insQuiz(z) {
  const s = insS(), seen = INS_Q.filter(q => S.qs[q.id]).length, last = s.exam[s.exam.length - 1];
  const missC = {}; INS_Q.forEach(q => { const m = S.missed[q.id]; if (m && !m.resolved) missC[q.concept] = (missC[q.concept] || 0) + 1; });
  z.innerHTML = `<div class="grid g2"><div class="card stack"><span class="label">Practice bank</span><h2 class="h3">${INS_Q.length} reviewed insulin items</h2><p class="small muted">${seen} answered · unseen first · tutor mode with rationales.</p><button class="btn primary" id="iqp">Practice 10</button></div>
    <div class="card stack"><span class="label">Insulin Safety Checkoff</span><h2 class="h3">10 questions, unassisted</h2><p class="small muted">Exam mode: no hints until you submit. First-attempt and delayed-retention scores are tracked separately.</p><button class="btn primary" id="iqc">Start the checkoff</button></div></div>
   ${s.exam.length ? `<div class="card stack"><div class="label">Checkoff history</div>${s.exam.slice(-6).reverse().map(x => `<div class="row between small"><span>${fmtDate(x.t)}${x.delayed ? " · <b>delayed retention</b>" : ""}</span><span class="mono"><b>${x.score}%</b> · first attempts ${x.fa ? pct(x.fac, x.fa) + "%" : "—"}</span></div>`).join("")}</div>` : ""}
   ${Object.keys(missC).length ? `<div class="card stack"><div class="label">Refresh what you missed</div><div class="pills">${Object.entries(missC).map(([c, n]) => { const r = INS_REFRESH[c] || ["home", "Overview"]; return `<a class="pill" href="#insulin/${r[0]}">${esc(r[1])} <span class="xs muted">(${n})</span></a>`; }).join("")}</div><button class="btn sm" id="iqnew">New unseen items on these concepts</button></div>` : ""}
   <div id="iqz"></div>`;
  const run = (items, mode, title, check) => Quiz($("#iqz", z), { items, mode, conf: mode === "tutor", title, onDone: check ? (r, its) => { const prev = s.exam[s.exam.length - 1]; s.exam.push({ t: Date.now(), score: r.score, fa: r.fa, fac: r.fac, n: r.n, delayed: !!(prev && Date.now() - prev.t >= DAY) }); s.exam = s.exam.slice(-30); save(); } : null, again: () => insQuiz(z) });
  const unseenFirst = ids => [...shuffle(ids.filter(q => !S.qs[q.id])), ...shuffle(ids.filter(q => S.qs[q.id]))];
  $("#iqp", z).onclick = () => { run(unseenFirst(INS_Q).slice(0, 10), "tutor", "Insulin practice"); $("#iqz", z).scrollIntoView({ behavior: "smooth" }); };
  $("#iqc", z).onclick = () => { run(unseenFirst(INS_CHECK_POOL.map(id => QBYID[id]).filter(Boolean)).slice(0, 10), "exam", "Insulin Safety Checkoff", true); $("#iqz", z).scrollIntoView({ behavior: "smooth" }); };
  const nw = $("#iqnew", z); if (nw) nw.onclick = () => { const cs = Object.keys(missC); const items = unseenFirst(INS_Q.filter(q => cs.includes(q.concept) && !(S.missed[q.id]))).slice(0, 6); if (!items.length) return toast("No new items left on these concepts — use the refresher links"); run(items, "tutor", "Targeted refresher"); };
}

/* ---------- Course vs current (source reconciliation) ---------- */
const INS_RECON = [
  ["Insulin strength", "PEDS packet (Diabetes in children — insulin therapy; you cited PDF pp. 244–247): “All insulins are prepared in strengths of 100 U/mL.”", "Not current: concentrated products exist — lispro U-200, regular U-500, glargine U-300, degludec U-200. Humalog label: U-200 never IV, never mixed, never transferred to a syringe. U-500 needs its own pen or U-500 syringe.", "Assume U-100 unless the item states otherwise — and treat any U-200/U-300/U-500 as high-alert with its own device.", ["humalog", "u500"]],
  ["Long-acting timing & detemir", "PEDS packet: “Long-acting insulin is given once a day, usually before bedtime; formulations include glargine (Lantus) and detemir (Levemir).”", "Lantus label: once daily at any time of day, at the same time every day. Levemir (detemir) was discontinued in the U.S. at the end of 2024.", "Glargine = same time daily, no peak, never mixed. Recognize detemir as a long-acting name from older materials.", ["lantus", "levemir"]],
  ["Mixing", "PEDS packet: families must know “the proper mixing of insulin.” Med-Surg slide 52: “First withdraw regular insulin. Then withdraw longer-acting insulin.”", "The step-by-step sequence in this lab comes from product labeling (Humulin N: Regular or Humalog drawn first, inject immediately; NovoLog: mix only with NPH, NovoLog first; Lantus: never mix) — not a quotation from the PEDS file.", "Air into cloudy, air into clear, draw clear, draw cloudy. Never mix glargine.", ["humN", "novolog", "lantus"]],
  ["IV insulin", "Med-Surg slide 46: “Regular Insulin only insulin administered IV.”", "Regular U-100 is the classic IV insulin, but Humalog U-100 and NovoLog labels also allow supervised IV use; concentrated insulins are never IV.", "Exam default: regular for IV drips (DKA). Don't say 'only'.", ["humalog", "novolog"]],
  ["NPH timing", "Med-Surg slide 51: intermediate-acting “onset of about 30 minutes and a 6–12 hour effect.”", "CDC: onset 2–4 h, peak 4–12 h, duration 12–18 h. Humulin N label: median maximum effect 6.5 h (range 2.8–13 h).", "Morning NPH → afternoon peak → watch for lows and offer the ordered snack.", ["cdcIns", "humN"]],
  ["Hypoglycemia", "Med-Surg slides 44–45: glucose <70; conscious → 15–20 g quick carbs (4–6 oz juice, regular soda, hard candy, honey); IV dextrose 50% only by the RN; glucagon IM.", "Consistent with the ADA hospital standards (link below); recheck and repeat per protocol, then clarify further insulin. (The ADA page could not be opened during this update — wording kept to your course text.)", "Awake and swallowing → oral carbs. Can't swallow/NPO → glucagon or RN's IV dextrose.", ["adaHosp"]],
  ["Injection sites & storage", "PEDS packet: usual sites are the upper arms, thighs, hips and abdomen; never store insulin below 36°F or above 86°F; follow the manufacturer for opened use.", "Labels and CDC add: pens are single-patient only, a new needle each time, prime per instructions, no sharing even with a new needle.", "Rotate within an area, avoid lumps, never share pens.", ["cdcPen", "novolog"]]
];
function insSources(z) {
  z.innerHTML = `<div class="card stack"><div class="head"><span class="label">Course text vs current reference</span><h2 class="h3">What your class taught, what's current, what to remember</h2></div>
   ${INS_RECON.map(([t, c, n, x, r]) => `<div class="updbox"><div class="label">${esc(t)}</div><div class="upd-grid"><div><b>Course text</b><p class="small">${esc(c)}</p></div><div><b>Verified current reference</b><p class="small">${esc(n)}</p><p class="xs">${refLinks(r)}</p></div><div><b>Remember for the exam</b><p class="small">${esc(x)}</p></div></div></div>`).join("")}
   <div class="stack"><div class="label">References (all opened ${ACCESSED} unless marked)</div><ul class="small reflist">${Object.entries(REFS).map(([k, r]) => `<li><a href="${r.u}" target="_blank" rel="noopener">${esc(r.t)}</a>${k === "adaHosp" ? " — <span class=\"chip badge-flag\">Needs review: page did not load during this update</span>" : ` · accessed ${ACCESSED}`}</li>`).join("")}</ul></div>
   <div class="flagbox"><b>Needs clinical review:</b> degludec (Tresiba) mixing instructions were not verified against its current label in this update, so the lab never mixes it and no scored question depends on it.</div></div>`;
}
