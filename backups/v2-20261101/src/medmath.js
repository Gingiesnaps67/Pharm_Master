/* ================= MED MATH LAB — UI (uses MM engine + app helpers) ================= */
const MMDEF = () => ({ mode: "beginner", method: "da", target: 80, cats: {}, errs: {}, fa: { att: 0, cor: 0 }, solved: 0, hist: [], games: {}, exams: [], iv: [4 / 24, 1, 3, 7, 14], calc: true, seenLesson: {}, recall: {} });
function mmS() { if (!S.mm) S.mm = MMDEF(); const d = MMDEF(); for (const k in d) if (S.mm[k] === undefined) S.mm[k] = d[k]; return S.mm; }
function catSt(cat) { const m = mmS(); return m.cats[cat] || (m.cats[cat] = { att: 0, cor: 0, ua: 0, uc: 0, recent: [], lvl: 1, streak: 0, wstreak: 0, box: 0, due: 0, errs: {} }); }
const FOUND = Object.keys(MM.CAT).filter(k => MM.CAT[k].lesson < 10);
const seedNow = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
const cancelHTML = s => esc(s).replace(/~([^~]+)~/g, '<s class="cancel" title="cancels">$1</s>');
const ERRICON = { UNIT: "Units", CONV: "Conversion", FORM: "Setup", DAYDOSE: "Day vs dose", DIVIDE: "Divided doses", ARITH: "Arithmetic", TIME: "Time", DEC: "Decimal", ROUND: "Rounding", SAFE: "Safety", CONC: "Concentration", DF: "Drop factor" };

function mmMastery(cat) { const st = (mmS().cats[cat]); if (!st || !st.recent.length) return 0; const r = st.recent.slice(-10), n = r.length, ok = r.filter(x => x).length; return Math.round(100 * (ok / n) * Math.min(1, n / 5)); }
function mmMastered(cat) { const st = mmS().cats[cat]; return !!st && mmMastery(cat) >= 80 && st.recent.length >= 5 && st.lvl >= 2; }
function mmOverall() { return Math.round(FOUND.reduce((a, c) => a + mmMastery(c), 0) / FOUND.length); }
function mmDue() { const now = Date.now(); return Object.entries(mmS().cats).filter(([, s]) => s.att && s.due && s.due <= now).map(([k]) => k); }
function mmRecord(p, ok, o) {
  const m = mmS(), st = catSt(p.cat), now = Date.now(), assisted = !!o.assisted;
  st.att++; if (ok) { st.cor++; m.solved++; }
  if (o.first) { m.fa.att++; if (ok) m.fa.cor++; }
  if (!assisted) { st.ua++; if (ok) st.uc++; st.recent.push(ok); st.recent = st.recent.slice(-12); }
  if (ok && !assisted && o.conf !== "guess") { st.box = Math.min(5, st.box + 1); st.due = now + m.iv[Math.min(m.iv.length - 1, st.box - 1)] * DAY * (o.conf === "unsure" ? .5 : 1); }
  else if (ok) { st.due = now + m.iv[0] * DAY; }
  else { st.box = Math.max(0, st.box - 1); st.due = now + m.iv[0] * DAY; }
  if (ok) { st.streak++; st.wstreak = 0; if (st.streak >= 3 && !assisted) { if (st.lvl < 3) { st.lvl++; toast(`${MM.CAT[p.cat].n}: level ${st.lvl} unlocked — fewer clean numbers now`); } st.streak = 0; } }
  else { st.wstreak++; st.streak = 0; if (st.wstreak >= 2 && st.lvl > 1) { st.lvl--; st.wstreak = 0; } }
  if (!ok && o.err) { m.errs[o.err] = (m.errs[o.err] || 0) + 1; st.errs[o.err] = (st.errs[o.err] || 0) + 1; }
  m.hist.push({ t: now, cat: p.cat, ok, ua: !assisted, err: ok ? null : o.err, secs: o.secs || 0, lvl: p.level }); m.hist = m.hist.slice(-400);
  touch(); save();
}
function mmPickNext(prev, opts = {}) {
  const m = mmS(), pool = opts.pool || FOUND.concat(m.mode === "advanced" ? Object.keys(MM.CAT).filter(k => MM.CAT[k].lesson === 10) : []);
  const due = mmDue().filter(c => pool.includes(c) && c !== prev);
  if (due.length && Math.random() < .6) return pick(due);
  const weak = pool.filter(c => m.cats[c] && m.cats[c].att && mmMastery(c) < 80 && c !== prev);
  if (weak.length && Math.random() < .55) return pick(weak);
  const next = pool.filter(c => !mmMastered(c) && c !== prev);
  if (next.length) { next.sort((a, b) => MM.CAT[a].lesson - MM.CAT[b].lesson); return Math.random() < .6 ? next[0] : pick(next.slice(0, 6)); }
  return pick(pool.filter(c => c !== prev));
}
function mmGen(cat, lvl, mustInclude) {
  const L = lvl || catSt(cat).lvl;
  if (mustInclude) { for (let i = 0; i < 400; i++) { const p = MM.generate(cat, L, seedNow() + i); if (p.text.toLowerCase().includes(mustInclude)) return p; } }
  return MM.generate(cat, L, seedNow());
}
function mmRecommend() {
  const due = mmDue(); if (due.length) return { t: `Spaced review: ${MM.CAT[due[0]].n}`, lesson: MM.CAT[due[0]].lesson, cat: due[0] };
  for (const L of MM.LESSONS) { const c = L.cats.find(k => !mmMastered(k)); if (c && !L.adv) return { t: `Level ${L.n}: ${L.t} — ${MM.CAT[c].n}`, lesson: L.n, cat: c }; }
  return { t: "Level 10: Advanced medication math", lesson: 10, cat: "multistep" };
}

/* ---------- visuals ---------- */
function syringeSVG(ml) {
  const caps = [1, 3, 5, 10, 20, 60], cap = caps.find(x => x >= ml) || 60;
  const minor = cap === 1 ? .05 : cap === 3 ? .1 : cap <= 10 ? .2 : cap === 20 ? 1 : 5, major = cap === 1 ? .1 : cap === 3 ? .5 : cap <= 10 ? 1 : cap === 20 ? 5 : 10;
  const x0 = 60, len = 380, y = 30, h = 46, fill = Math.max(0, Math.min(1, ml / cap)) * len;
  let ticks = ""; for (let v = 0; v <= cap + 1e-9; v = Math.round((v + minor) * 1000) / 1000) { const x = x0 + v / cap * len, maj = Math.abs(v / major - Math.round(v / major)) < 1e-6; ticks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + (maj ? 18 : 9)}" stroke="var(--ink)" stroke-width="${maj ? 1.6 : .8}"/>` + (maj ? `<text x="${x}" y="${y + h + 16}" text-anchor="middle" font-size="11" fill="var(--muted)">${MM.fmt(v)}</text>` : ""); }
  return `<svg class="mm-svg" viewBox="0 0 520 110" role="img" aria-label="Oral syringe filled to ${MM.fmt(ml)} mL on a ${cap} mL syringe"><rect x="${x0 - 30}" y="${y + 18}" width="30" height="10" rx="3" fill="var(--muted)"/><rect x="${x0}" y="${y}" width="${len}" height="${h}" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
   <rect x="${x0}" y="${y + 1}" width="${fill}" height="${h - 2}" rx="5" fill="var(--mm-purple)" opacity=".55"/><rect x="${x0 + fill}" y="${y - 6}" width="8" height="${h + 12}" rx="2" fill="var(--ink)"/><rect x="${x0 + fill + 8}" y="${y + h / 2 - 4}" width="${len - fill + 30}" height="8" fill="var(--muted)"/><rect x="${x0 + len + 38}" y="${y - 8}" width="10" height="${h + 16}" rx="3" fill="var(--muted)"/>${ticks}
   <text x="${x0 + Math.max(fill, 60) / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-weight="800" font-size="15" fill="var(--ink)">${MM.fmt(ml)} mL</text></svg><div class="xs muted">Read the volume at the plunger's front edge. ${cap}-mL syringe.</div>`;
}
function tabletsSVG(n) {
  const whole = Math.floor(n + 1e-9), half = Math.abs(n - whole - .5) < 1e-6; let s = "", x = 30;
  for (let i = 0; i < Math.min(whole, 8); i++) { s += `<circle cx="${x}" cy="40" r="24" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><line x1="${x - 18}" y1="40" x2="${x + 18}" y2="40" stroke="var(--muted)" stroke-width="2"/>`; x += 60; }
  if (half) s += `<path d="M ${x - 24} 40 A 24 24 0 0 1 ${x + 24} 40 Z" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>`;
  return `<svg class="mm-svg" viewBox="0 0 ${Math.max(120, x + 30)} 80" role="img" aria-label="${MM.fmt(n)} tablets">${s}</svg>`;
}
function pumpSVG(rate, state = "idle", label = "mL/hr") {
  const col = state === "run" ? "var(--ok)" : state === "alarm" ? "var(--danger)" : "var(--mm-blue)";
  const txt = state === "run" ? "INFUSING" : state === "alarm" ? "CHECK RATE" : "READY";
  return `<svg class="mm-svg pump ${state === "run" ? "running" : ""}" viewBox="0 0 360 220" role="img" aria-label="Infusion pump ${txt.toLowerCase()} at ${rate === "" || rate == null ? "no rate" : MM.fmt(+rate) + " " + label}">
   <line x1="40" y1="8" x2="40" y2="210" stroke="var(--muted)" stroke-width="4"/><rect x="14" y="16" width="52" height="70" rx="10" fill="var(--mm-blue-soft)" stroke="var(--ink)" stroke-width="1.5"/><text x="40" y="56" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">IV</text>
   <rect x="34" y="86" width="12" height="28" rx="4" fill="var(--surface)" stroke="var(--ink)"/><circle class="drop" cx="40" cy="92" r="3" fill="var(--mm-blue)"/>
   <path d="M40 114 C 40 150, 110 150, 120 120" fill="none" stroke="var(--ink)" stroke-width="2"/>
   <rect x="110" y="40" width="230" height="150" rx="16" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="2"/>
   <rect x="128" y="58" width="194" height="72" rx="8" fill="var(--ink)"/><text x="225" y="104" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="32" font-weight="700" fill="var(--surface)">${rate === "" || rate == null ? "– – –" : esc(MM.fmt(+rate))}</text><text x="308" y="124" text-anchor="end" font-size="11" fill="var(--surface)">${label}</text>
   <rect x="128" y="142" width="194" height="32" rx="8" fill="${col}"/><text x="225" y="163" text-anchor="middle" font-size="13" font-weight="800" fill="var(--surface)">${txt}</text></svg>`;
}
function dripSVG(gtt) {
  const dur = gtt > 0 ? (60 / gtt).toFixed(3) : 0;
  return `<svg class="mm-svg drip" viewBox="0 0 140 200" role="img" aria-label="Drip chamber dripping at ${gtt} drops per minute"><rect x="50" y="10" width="40" height="20" rx="4" fill="var(--muted)"/><rect x="40" y="30" width="60" height="120" rx="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><rect x="42" y="118" width="56" height="30" rx="10" fill="var(--mm-blue)" opacity=".35"/>
   ${gtt > 0 ? `<circle cx="70" cy="42" r="5" fill="var(--mm-blue)" class="falling" style="animation-duration:${dur}s"/>` : ""}<line x1="70" y1="150" x2="70" y2="196" stroke="var(--ink)" stroke-width="3"/></svg>`;
}
function insulinSVG(u) {
  const cap = u > 50 ? 100 : 50, x0 = 50, len = 380, y = 34, h = 34; let t = "";
  for (let v = 0; v <= cap; v += (cap === 50 ? 1 : 2)) { const x = x0 + v / cap * len, maj = v % (cap === 50 ? 5 : 10) === 0; t += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + (maj ? 14 : 7)}" stroke="var(--ink)" stroke-width="${maj ? 1.4 : .7}"/>` + (v % 10 === 0 ? `<text x="${x}" y="${y + h + 14}" text-anchor="middle" font-size="11" fill="var(--muted)">${v}</text>` : ""); }
  const fill = u / cap * len;
  return `<svg class="mm-svg" viewBox="0 0 500 96" role="img" aria-label="U-100 insulin syringe filled to ${u} units"><line x1="${x0 - 36}" y1="${y + h / 2}" x2="${x0}" y2="${y + h / 2}" stroke="var(--muted)" stroke-width="2"/><rect x="${x0}" y="${y}" width="${len}" height="${h}" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/><rect x="${x0}" y="${y + 1}" width="${fill}" height="${h - 2}" fill="var(--mm-amber)" opacity=".5"/><rect x="${x0 + fill}" y="${y - 5}" width="6" height="${h + 10}" fill="var(--ink)"/>${t}<text x="${x0 + len + 8}" y="${y + 22}" font-size="11" font-weight="700" fill="var(--ink)">U-100</text><text x="${x0}" y="${y - 8}" font-size="12" font-weight="800" fill="var(--ink)">${u} units</text></svg><div class="xs muted">Insulin syringes are marked in UNITS for U-100 insulin. ${cap}-unit syringe.</div>`;
}
function convChartHTML() {
  return `<div class="mm-conv"><svg class="mm-svg" viewBox="0 0 640 170" role="img" aria-label="Metric ladder: grams to milligrams to micrograms, each step multiply by 1,000 going down">
   ${[["g", 40], ["mg", 260], ["mcg", 480]].map(([u, x]) => `<rect x="${x}" y="40" width="120" height="56" rx="12" fill="var(--mm-purple-soft)" stroke="var(--mm-purple)" stroke-width="2"/><text x="${x + 60}" y="76" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)">${u}</text>`).join("")}
   ${[160, 380].map(x => `<path d="M${x + 6} 56 H${x + 94}" stroke="var(--mm-purple)" stroke-width="3" marker-end="url(#ah)"/><text x="${x + 50}" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">× 1,000</text><path d="M${x + 94} 84 H${x + 6}" stroke="var(--muted)" stroke-width="2" marker-end="url(#ah2)"/><text x="${x + 50}" y="108" text-anchor="middle" font-size="12" fill="var(--muted)">÷ 1,000</text>`).join("")}
   <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mm-purple)"/></marker><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>
   <text x="320" y="150" text-anchor="middle" font-size="13" fill="var(--muted)">Going to a smaller unit → bigger number (multiply). Going to a bigger unit → smaller number (divide).</text></svg>
   <div class="tbl"><table><thead><tr><th>From</th><th>To</th><th>Do this</th><th>Example</th></tr></thead><tbody>
   ${[["lb", "kg", "÷ 2.2", "154 lb → 70 kg"], ["kg", "lb", "× 2.2", "25 kg → 55 lb"], ["g", "mg", "× 1,000", "0.5 g → 500 mg"], ["mg", "mcg", "× 1,000", "0.125 mg → 125 mcg"], ["L", "mL", "× 1,000", "1.5 L → 1,500 mL"], ["hr", "min", "× 60", "8 hr → 480 min"], ["min", "hr", "÷ 60", "90 min → 1.5 hr"], ["tsp", "mL", "× 5", "2 tsp → 10 mL"], ["tbsp", "mL", "× 15", "1 tbsp → 15 mL"], ["oz", "mL", "× 30", "8 oz → 240 mL"]].map(r => `<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono"><b>${r[2]}</b></td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function visualHTML(p) {
  if (!p) return "";
  if (p.cat === "tabs" && p.kind === "num") return `<div class="mm-visual">${tabletsSVG(p.ans)}</div>`;
  const v = p.visual; if (!v) return "";
  if (v.type === "syringe") return `<div class="mm-visual">${syringeSVG(v.ml)}</div>`;
  if (v.type === "pump") return `<div class="mm-visual">${pumpSVG(v.rate, "run")}</div>`;
  if (v.type === "drip") return `<div class="mm-visual row">${dripSVG(v.gtt)}<div class="small">Each falling drop = 1 drop. At ${v.gtt} gtt/min that's about ${MM.fmt(MM.round(v.gtt / 4, 1))} drops every 15 seconds — nurses count for 15 s and multiply by 4.</div></div>`;
  if (v.type === "insulin") return `<div class="mm-visual">${insulinSVG(v.units)}</div>`;
  return "";
}

/* ---------- 6-step worked solution ---------- */
function sixHTML(p, method, opts = {}) {
  const F = MM.FORMULAS[p.formula] || MM.FORMULAS.dh;
  const ml = (p.methods && p.methods[method]) || p.solve || [];
  const has = k => p.methods && p.methods[k];
  const tabs = ["da", "dh", "rp"].filter(has);
  const final = p.kind === "choice" ? p.choices[p.ans] : `${MM.fmt(p.ans)} ${p.unit}`;
  return `<div class="mm-steps">
   <div class="mm-step setup"><span class="sn">1</span><div><b>What is the question asking?</b><div>${p.kind === "choice" ? "A decision: " + esc(p.text.split("?")[0].split(". ").pop()) + "?" : `An answer in <b>${esc(p.unit)}</b>.`}</div></div></div>
   <div class="mm-step setup"><span class="sn">2</span><div><b>What information are you given?</b><div class="row">${p.given.map(([k, v]) => `<span class="gchip"><span class="xs muted">${esc(k)}</span> ${esc(v)}</span>`).join("")}</div></div></div>
   <div class="mm-step setup"><span class="sn">3</span><div><b>Which formula?</b> <span class="small">${esc(F.n)}</span><div class="formula-box">${esc(F.eq)}</div></div></div>
   ${p.sub ? `<div class="mm-step setup"><span class="sn">4</span><div><b>Substitute the numbers</b><div class="mono">${cancelHTML(p.sub)}</div></div></div>` : ""}
   <div class="mm-step"><span class="sn">5</span><div><b>Solve</b>${tabs.length > 1 && !opts.noTabs ? `<div class="seg mm-method" role="group" aria-label="Method">${tabs.map(k => `<button data-meth="${k}" aria-pressed="${k === method}">${{ da: "Dimensional analysis", dh: "Desired ÷ Have × Q", rp: "Ratio & proportion" }[k]}</button>`).join("")}</div>` : ""}
     <div class="stack mono small" style="margin-top:6px">${ml.map(l => `<div>${cancelHTML(l)}</div>`).join("")}</div>${tabs.length > 1 ? `<div class="xs muted">Every method reaches the same answer — use the one you trust.</div>` : ""}</div></div>
   <div class="mm-step ok"><span class="sn">6</span><div><b>Check your answer</b> <span class="chip badge-S chip-wrap">${ico("check", 12)} ${esc(final)}</span><ul class="small">${[...(p.check || []), p.round && p.round !== "none" ? MM.ROUND_RULES[p.round] : null].filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
   ${p.high ? `<div class="mm-caution">${ico("flag", 14)} <b>High-alert medication.</b> Independent double-check by a second nurse before giving (your Cardiovascular and PEDS files require this for heparin and pediatric doses).</div>` : ""}
   <div class="srcline">${ico("src", 14)}<span>${esc(p.src)}${p.adv ? " · <b>Advanced</b> — beyond the LVN foundation" : ""}</span></div></div>`;
}

/* ---------- calculator ---------- */
function calcEval(expr) {
  const toks = String(expr).replace(/×/g, "*").replace(/÷/g, "/").match(/\d*\.?\d+|[-+*/()]/g); if (!toks) return NaN;
  const out = [], ops = [], prec = { "+": 1, "-": 1, "*": 2, "/": 2 }; let prev = null;
  for (let t of toks) {
    if (/\d/.test(t)) out.push(parseFloat(t));
    else if (t === "(") ops.push(t);
    else if (t === ")") { while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()); ops.pop(); }
    else { if (t === "-" && (prev === null || /[-+*/(]/.test(prev))) { out.push(0); } while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) out.push(ops.pop()); ops.push(t); }
    prev = t;
  }
  while (ops.length) out.push(ops.pop());
  const st = []; for (const x of out) { if (typeof x === "number") st.push(x); else { const b = st.pop(), a = st.pop(); if (a === undefined || b === undefined) return NaN; st.push(x === "+" ? a + b : x === "-" ? a - b : x === "*" ? a * b : a / b); } }
  return st.length === 1 ? st[0] : NaN;
}
function calcHTML() { return `<div class="keypad" role="group" aria-label="Calculator"><input type="text" class="calc-disp mono" aria-label="Calculator display" readonly value=""><div class="keys">${["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "(", "+", ")", "C", "⌫", "="].map(k => `<button class="btn sm" data-key="${k}">${k}</button>`).join("")}</div><div class="xs muted">Calculator follows order of operations. Turn it off in settings if your instructor's test doesn't allow one.</div></div>`; }
function bindCalc(root) { root.addEventListener("click", e => { const b = e.target.closest("[data-key]"); if (!b) return; const d = $(".calc-disp", b.closest(".keypad")); const k = b.dataset.key; if (k === "C") d.value = ""; else if (k === "⌫") d.value = d.value.slice(0, -1); else if (k === "=") { const v = calcEval(d.value); d.value = isFinite(v) ? String(MM.round(v, 6)) : "Error"; } else d.value = (d.value === "Error" ? "" : d.value) + k; }); }

/* ================= GUIDED PRACTICE RUNNER ================= */
function mmPractice(el, cfg) {
  const m = mmS(); const mode = cfg.mode || m.mode; const formulaFree = !!cfg.formulaFree;
  let p = null, st = null, count = 0, correct = 0, prevCat = null; const t0 = Date.now(); let timer = null; const sessionErrs = {};
  const endAt = cfg.minutes ? t0 + cfg.minutes * MIN : null;
  function fresh(force) {
    const cat = force?.cat || cfg.next(prevCat); prevCat = cat;
    p = force?.p || mmGen(cat, force?.lvl || (cfg.lvlFn ? cfg.lvlFn(count) : cfg.lvl), cfg.mustInclude); window.__mmP = p;
    st = { step: mode === "advanced" ? "answer" : "unit", unit: "", formSel: null, formTries: 0, hints: 0, ans: "", choice: null, conf: null, tries: 0, res: null, start: Date.now(), method: m.method, calc: false };
    st.formOpts = shuffle([p.formula, ...shuffle(Object.keys(MM.FORMULAS).filter(f => f !== p.formula && f !== "round")).slice(0, 2)]);
    render();
  }
  function assisted() { return mode === "beginner" || st.hints > 0 || st.formTries > 0 || st.unitWrong; }
  function hintLines() { const F = MM.FORMULAS[p.formula]; const lines = [`Formula: ${F.eq}`]; if (p.sub) lines.push(`Set it up: ${p.sub}`); (p.solve || []).slice(0, -1).forEach(l => lines.push(l)); return lines; }
  function render() {
    clearInterval(timer);
    if (endAt && Date.now() >= endAt && !st.res) return done();
    const F = MM.FORMULAS[p.formula];
    const lvlTag = `<span class="chip">Level ${p.level}</span>${p.adv ? `<span class="chip badge-R">Advanced</span>` : ""}${p.high ? `<span class="chip badge-flag">High-alert</span>` : ""}`;
    const showGiven = mode !== "advanced";
    const unitPicked = st.unit && st.unit === p.unit;
    let h = `<div class="card stack mm-prob"><div class="row between"><div class="row">${lvlTag}<span class="label">${esc(MM.CAT[p.cat].n)}</span></div><div class="row small">${endAt ? `<span class="mono" id="mmclock"></span>` : ""}${cfg.title ? `<span class="muted">${esc(cfg.title)} · ${count} done</span>` : ""}</div></div>
      <div class="q-stem">${esc(p.text)}</div>`;
    if (showGiven) h += `<div class="row">${p.given.map(([k, v]) => `<span class="gchip"><span class="xs muted">${esc(k)}</span> ${esc(v)}</span>`).join("")}</div>`;
    if (p.kind === "num" && mode !== "advanced") {
      h += `<div class="mm-step setup"><span class="sn">1</span><div class="stack"><b>What is the question asking for?</b><div class="row"><select id="mmunit" aria-label="Answer unit" ${st.res ? "disabled" : ""}><option value="">Choose the answer unit…</option>${p.unitOpts.map(u => `<option ${st.unit === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>${st.unitMsg ? `<span class="small ${unitPicked ? "" : "err-text"}">${esc(st.unitMsg)}</span>` : ""}</div></div></div>`;
      if (st.step !== "unit") {
        h += `<div class="mm-step setup"><span class="sn">3</span><div class="stack"><b>Which formula fits?</b><div class="row">${st.formOpts.map(f => { const sel = st.formSel === f; const right = f === p.formula; return `<button class="btn sm ${sel ? (right ? "primary" : "danger") : ""}" data-form="${f}" ${st.formSel === p.formula || st.res ? "disabled" : ""}>${esc(MM.FORMULAS[f].n)}</button>`; }).join("")}</div>${st.formMsg ? `<div class="small ${st.formSel === p.formula ? "" : "err-text"}">${esc(st.formMsg)}</div>` : ""}${st.formSel === p.formula && !formulaFree ? `<div class="formula-box">${esc(F.eq)}</div>` : ""}</div></div>`;
      }
      if (st.step === "answer" && mode === "beginner") {
        const lines = (p.solve || []); h += `<div class="mm-step"><span class="sn">4</span><div class="stack"><b>Substitute & work it through</b>${p.sub ? `<div class="mono">${cancelHTML(p.sub)}</div>` : ""}${lines.slice(0, -1).map(l => `<div class="mono small">${cancelHTML(l)}</div>`).join("")}<div class="small muted">Now finish the last step yourself.</div></div></div>`;
      }
    }
    if (p.kind === "choice" && mode === "beginner" && !st.res) h += `<div class="small muted">Work it out on paper first: ${esc(p.sub || "compare the numbers")}.</div>`;
    if (st.hints && !st.res) h += `<div class="mm-step setup"><span class="sn">?</span><div class="stack small"><b>Hints</b>${hintLines().slice(0, st.hints).map(l => `<div class="mono">${cancelHTML(l)}</div>`).join("")}</div></div>`;
    if (st.step === "answer" || p.kind === "choice") {
      if (p.kind === "choice") h += `<div class="stack">${p.choices.map((c, i) => { let cls = "opt"; if (st.res) { if (i === p.ans) cls += " correct"; else if (i === st.choice) cls += " wrong"; } return `<button class="${cls}" data-ch="${i}" aria-pressed="${st.choice === i}" ${st.res ? "disabled" : ""}><span class="mk">${"ABCD"[i]}</span><span>${esc(c)}</span></button>`; }).join("")}</div>`;
      else h += `<div class="mm-answer"><div class="field"><label for="mmans">Your answer</label><input id="mmans" type="text" inputmode="decimal" autocomplete="off" value="${esc(st.ans)}" ${st.res ? "disabled" : ""} placeholder="e.g. 2.5"></div><div class="field"><label for="mmunit2">Unit</label><select id="mmunit2" ${st.res ? "disabled" : ""}><option value="">Unit…</option>${p.unitOpts.map(u => `<option ${st.unit === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></div></div>`;
      if (!st.res) h += `<div class="conf"><span class="label">How sure are you?</span>${["sure", "unsure", "guess"].map(c => `<button class="btn sm ${st.conf === c ? "primary" : ""}" data-conf="${c}" aria-pressed="${st.conf === c}">${{ sure: "Sure", unsure: "Unsure", guess: "Guessing" }[c]}</button>`).join("")}<span class="xs muted">Optional — low confidence schedules review sooner.</span></div>`;
    }
    const canHint = !st.res && mode === "intermediate" && !formulaFree && st.step === "answer" && st.hints < hintLines().length;
    const canSubmit = !st.res && (p.kind === "choice" ? st.choice != null : (st.step === "answer" && st.ans.trim() !== "" && st.unit));
    h += `<div class="row between"><div class="row">${canHint ? `<button class="btn sm" data-act="hint">${ico("missed", 14)} Hint (${st.hints}/${hintLines().length})</button>` : ""}${m.calc && !cfg.noCalc ? `<button class="btn sm ghost" data-act="calc" aria-pressed="${st.calc}">Calculator</button>` : ""}</div>
      <div class="row">${st.res ? `${!st.res.ok && st.tries < 2 && p.kind === "num" ? `<button class="btn" data-act="retry">Try again</button>` : ""}<button class="btn" data-act="similar">Similar problem</button><button class="btn primary" data-act="next">${cfg.max && count >= cfg.max ? "Finish" : "Next problem"}</button>`
        : st.step === "unit" && p.kind === "num" ? `<button class="btn primary" data-act="unitgo" ${st.unit ? "" : "disabled"}>Continue</button>` : `<button class="btn primary" data-act="submit" ${canSubmit ? "" : "disabled"}>Submit</button>`}${cfg.onExit ? `<button class="btn ghost sm" data-act="exit">End</button>` : ""}</div></div>`;
    if (st.calc) h += calcHTML();
    if (st.res) h += feedbackHTML();
    h += `</div>`;
    el.innerHTML = h;
    if (st.calc) bindCalc(el);
    const a = $("#mmans", el); if (a) { a.oninput = () => { st.ans = a.value; const sb = $("[data-act=submit]", el); if (sb) sb.disabled = !(st.ans.trim() && st.unit); }; a.onkeydown = e => { if (e.key === "Enter" && st.ans.trim() && st.unit) submit(); }; if (!st.res && document.activeElement !== a && st.step === "answer" && !st.calc) a.focus({ preventScroll: true }); }
    const u1 = $("#mmunit", el); if (u1) u1.onchange = () => { st.unit = u1.value; st.unitMsg = ""; const b = $("[data-act=unitgo]", el); if (b) b.disabled = !st.unit; const u2 = $("#mmunit2", el); if (u2) u2.value = st.unit; const sb = $("[data-act=submit]", el); if (sb) sb.disabled = !(st.ans.trim() && st.unit); };
    const u2 = $("#mmunit2", el); if (u2) u2.onchange = () => { st.unit = u2.value; const sb = $("[data-act=submit]", el); if (sb) sb.disabled = !(st.ans.trim() && st.unit); };
    if (endAt) { const ck = $("#mmclock", el); const tick = () => { if (!ck.isConnected) return clearInterval(timer); const s = Math.max(0, Math.round((endAt - Date.now()) / 1000)); ck.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`; if (s <= 0 && !st.res) { clearInterval(timer); done(); } }; tick(); timer = setInterval(tick, 1000); }
  }
  function feedbackHTML() {
    const r = st.res, stc = catSt(p.cat);
    const alt = !r.ok && (stc.errs[r.code] || 0) >= 2 ? `<div class="mm-caution"><b>Another way to see it.</b> ${esc(MM.LESSONS[MM.CAT[p.cat].lesson - 1].why)}${p.methods && p.methods.rp ? `<div class="mono small" style="margin-top:6px">${p.methods.rp.map(cancelHTML).join("<br>")}</div>` : ""} <div class="small">Try the ${p.methods && p.methods.rp ? "ratio method above" : "worked example in the lesson"}, then do the similar problem below.</div><div><button class="btn sm" data-nav="math" data-arg="lesson:${MM.CAT[p.cat].lesson}">Open the lesson</button></div></div>` : "";
    return `<div class="fb ${r.ok ? "ok" : "bad"}" role="status"><h4>${ico(r.ok ? "check" : "x")} ${r.ok ? (assisted() ? "Correct — with help (counts as practice, not mastery yet)" : st.conf === "guess" ? "Correct — but you guessed; review comes back sooner" : "Correct") : `Not quite · <span class="err-tag">${esc(ERRICON[r.code] || r.code)}</span>`}</h4>
      ${!r.ok ? `<div><b>${esc(MM.ERR[r.code])}.</b> ${esc(r.msg)}${r.unitWrong ? " Also check the unit." : ""}</div><div class="small">Your answer: <b>${p.kind === "choice" ? esc(p.choices[st.choice]) : esc(st.ans + " " + st.unit)}</b>${st.tries >= 2 || p.kind === "choice" ? ` · Correct: <b>${p.kind === "choice" ? esc(p.choices[p.ans]) : MM.fmt(p.ans) + " " + esc(p.unit)}</b>` : ""}</div>` : ""}</div>
      ${alt}${(r.ok || st.tries >= 2 || p.kind === "choice" || st.showSol) ? sixHTML(p, st.method) + visualHTML(p) : `<button class="btn sm" data-act="showsol">Show the full worked solution</button>`}`;
  }
  function submit() {
    if (st.res) return;
    st.tries++;
    let r;
    if (p.kind === "choice") r = MM.diagnose(p, st.choice);
    else { const v = parseFloat(String(st.ans).replace(/,/g, "")); if (!isFinite(v)) { toast("Enter a number, like 2.5"); st.tries--; return; } r = MM.diagnose(p, v, st.unit); }
    st.res = r;
    if (st.tries === 1) { count++; if (r.ok) correct++; else sessionErrs[r.code] = (sessionErrs[r.code] || 0) + 1; mmRecord(p, r.ok, { assisted: assisted(), conf: st.conf, err: r.code, secs: Math.round((Date.now() - st.start) / 1000), first: true }); }
    render();
    const fb = $(".fb", el); fb && fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function done() {
    clearInterval(timer);
    const secs = Math.round((Date.now() - t0) / 1000);
    if (cfg.onDone && cfg.onDone({ count, correct, secs, errs: sessionErrs }) === "custom") return;
    el.innerHTML = `<div class="card stack"><div class="label">${esc(cfg.title || "Practice")} complete</div><h2>${correct}/${count} correct ${count ? `(${pct(correct, count)}%)` : ""}</h2><div class="small muted">${Math.round(secs / 60)} min · ${Object.keys(sessionErrs).length ? "Mistakes: " + Object.entries(sessionErrs).map(([k, n]) => `${ERRICON[k]} ×${n}`).join(", ") : "No mistake patterns this round."}</div><div class="row"><button class="btn primary" data-nav="math">Back to MED MATH</button></div></div>`;
  }
  el.onclick = e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.key) return;
    if (b.dataset.meth) { st.method = b.dataset.meth; mmS().method = b.dataset.meth; save(); return render(); }
    if (b.dataset.conf) { st.conf = st.conf === b.dataset.conf ? null : b.dataset.conf; return render(); }
    if (b.dataset.ch != null) { st.choice = +b.dataset.ch; return render(); }
    if (b.dataset.form) { st.formSel = b.dataset.form; if (b.dataset.form === p.formula) { st.formMsg = "Right formula."; st.step = "answer"; } else { st.formTries++; st.formMsg = `Not this one — ${MM.FORMULAS[b.dataset.form].n} answers a different kind of question. Look at the unit you need and what you're given.`; } return render(); }
    const a = b.dataset.act;
    if (a === "unitgo") { if (st.unit === p.unit) { st.unitMsg = "Yes — that's the unit to aim for."; st.step = "formula"; } else { st.unitWrong = true; st.unitMsg = `Look again: the question asks "${p.text.split("?")[0].split(". ").pop()}?" — that's measured in ${p.unit}.`; st.unit = p.unit; st.step = "formula"; } return render(); }
    if (a === "hint") { st.hints++; return render(); }
    if (a === "calc") { st.calc = !st.calc; return render(); }
    if (a === "submit") return submit();
    if (a === "retry") { st.res = null; st.ans = ""; return render(); }
    if (a === "showsol") { st.showSol = true; return render(); }
    if (a === "similar") return fresh({ cat: p.cat, lvl: p.level });
    if (a === "next") { if (cfg.max && count >= cfg.max) return done(); if (endAt && Date.now() >= endAt) return done(); return fresh(); }
    if (a === "exit") { done(); }
  };
  fresh(cfg.first);
  return { done };
}

/* ================= VIEW ================= */
const MMV = { tab: "home", lesson: null };
function vMedMath(el, arg) {
  mmS();
  if (arg) { if (arg.startsWith("lesson:")) { MMV.tab = "lesson"; MMV.lesson = +arg.split(":")[1]; } else if (arg.startsWith("drug:")) { MMV.tab = "drug"; MMV.drug = arg.split(":")[1]; } else if (arg.startsWith("timed:")) { MMV.tab = "timed"; MMV.min = +arg.split(":")[1]; } else MMV.tab = arg; }
  const sub = `<div class="row mm-subnav" role="navigation" aria-label="MED MATH sections">${[["home", "MED MATH home"], ["learn", "Learn formulas"], ["practice", "Practice with me"], ["games", "Math games"], ["exam", "MED math exam"], ["cheat", "Formula cheat sheet"]].map(([k, n]) => `<button class="btn sm ${MMV.tab === k || (k === "learn" && MMV.tab === "lesson") ? "primary" : ""}" data-mt="${k}">${n}</button>`).join("")}</div>`;
  el.innerHTML = `<div class="head"><span class="label">MED MATH LAB</span><h1>Learn it. Calculate it. Master it.</h1></div>${sub}<div id="mmv"></div>${foot()}`;
  el.querySelector(".mm-subnav").onclick = e => { const b = e.target.closest("[data-mt]"); if (b) { MMV.tab = b.dataset.mt; vMedMath(el); } };
  const z = $("#mmv", el);
  ({ home: mmHome, learn: mmLearn, lesson: mmLesson, practice: mmPracticeView, games: mmGames, exam: mmExam, cheat: mmCheat, drug: mmDrug, timed: mmTimed, review: mmReview }[MMV.tab] || mmHome)(z);
}
function mmHome(z) {
  const m = mmS(), overall = mmOverall(), mastered = FOUND.filter(mmMastered).length, due = mmDue();
  const att = Object.entries(m.cats).filter(([k, s]) => s.att && MM.CAT[k]).map(([k]) => k).sort((a, b) => mmMastery(a) - mmMastery(b));
  const errs = Object.entries(m.errs).sort((a, b) => b[1] - a[1]).slice(0, 4), rec = mmRecommend();
  z.innerHTML = `<div class="grid g2">
   <div class="card stack"><div class="label">Dosage calculation mastery</div><div class="row" style="align-items:flex-end"><span class="stat"><span class="v">${overall}%</span></span><span class="small muted">target ${m.target}%</span></div><div class="bar ${overall >= m.target ? "ok" : ""}"><i style="width:${overall}%"></i></div>
     <div class="grid g3"><div class="stat"><span class="label">Formulas mastered</span><span class="v">${mastered}<span class="small muted">/${FOUND.length}</span></span></div><div class="stat"><span class="label">Problems solved</span><span class="v">${m.solved}</span></div><div class="stat"><span class="label">First-attempt</span><span class="v">${m.fa.att ? pct(m.fa.cor, m.fa.att) + "%" : "—"}</span></div></div>
     <div class="row"><label class="small" for="mmtarget">Readiness target</label><input id="mmtarget" type="number" min="50" max="100" step="1" value="${m.target}" style="width:90px"><span class="small muted">% — raise it if your competency exam requires more.</span></div></div>
   <div class="card stack"><div class="label">Recommended next</div><h3>${esc(rec.t)}</h3><div class="row"><button class="btn primary" data-go-lesson="${rec.lesson}">Open lesson</button><button class="btn" data-practice-cat="${rec.cat}">Practice it</button></div>
     <div class="stack"><div class="label">Spaced review due</div>${due.length ? `<div class="small">${due.map(c => esc(MM.CAT[c].n)).join(" · ")}</div><button class="btn sm" data-mt2="review">Review ${due.length} due categor${due.length === 1 ? "y" : "ies"}</button>` : `<div class="small muted">Nothing due. Missed or low-confidence problems come back later today; correct ones space out to 1, 3, 7 and 14 days.</div>`}</div></div></div>
  <div class="grid g4 mm-big">${[["learn", "Learn formulas", "All formulas with worked examples, visuals and step-by-step pages.", "library"], ["practice", "Practice with me", "Guided calculations that identify your exact mistake.", "session"], ["games", "Math games", "Formula Match, Conversion Sprint, Fix the Nurse, IV Pump, Safe or Unsafe.", "games"], ["exam", "MED math exam", "Tutor, exam, formula-free, weakness and mixed modes.", "exam"]].map(([k, t, d, i]) => `<button class="card stack mm-bigcard" data-mt2="${k}">${ico(i, 28)}<h3>${t}</h3><span class="small muted">${d}</span></button>`).join("")}</div>
  <div class="card stack"><div class="label">Timed practice</div><div class="row">${[5, 10, 15, 20, 30].map(n => `<button class="btn" data-timed="${n}">${n} min</button>`).join("")}</div><div class="small muted">Mixes due reviews, weak spots and your next new formula. Ends when time runs out.</div></div>
  <div class="grid g2"><div class="card stack"><div class="label">Weakest categories</div>${att.length ? att.slice(0, 5).map(k => `<div class="sysrow"><span>${esc(MM.CAT[k].n)}</span><div class="bar ${mmMastery(k) >= 80 ? "ok" : "bad"}"><i style="width:${mmMastery(k)}%"></i></div><span class="mono">${mmMastery(k)}%</span></div>`).join("") : `<div class="empty">Solve a few problems and your weak spots show up here.</div>`}</div>
   <div class="card stack"><div class="label">Most common mistakes</div>${errs.length ? errs.map(([k, n]) => `<div class="row between small"><span><span class="err-tag">${esc(ERRICON[k])}</span> ${esc(MM.ERR[k])}</span><span class="chip badge-flag">${n}×</span></div>`).join("") : `<div class="empty">No mistakes logged yet.</div>`}${S.math && S.math.att ? `<div class="xs muted">Earlier quick-practice record kept: ${S.math.cor}/${S.math.att} correct.</div>` : ""}</div></div>
  <div class="card stack"><div class="label">Settings</div><div class="grid g3">
    <div class="field"><label>Learning mode</label><div class="seg" role="group">${["beginner", "intermediate", "advanced"].map(x => `<button data-mode="${x}" aria-pressed="${m.mode === x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join("")}</div><span class="xs muted">${{ beginner: "All steps and visual hints shown. Counts as practice, not mastery.", intermediate: "You pick the unit and formula; hints on request.", advanced: "Solve independently, then get detailed feedback." }[m.mode]}</span></div>
    <div class="field"><label>Preferred method</label><div class="seg" role="group">${[["da", "Dimensional"], ["dh", "D÷H×Q"], ["rp", "Ratio"]].map(([k, n]) => `<button data-meth2="${k}" aria-pressed="${m.method === k}">${n}</button>`).join("")}</div></div>
    <div class="field"><label>Calculator</label><div class="seg" role="group"><button data-calc="1" aria-pressed="${m.calc}">Allowed</button><button data-calc="0" aria-pressed="${!m.calc}">Not allowed</button></div></div></div>
    <details><summary class="small">Spaced review schedule (days)</summary><div class="row" style="margin-top:8px">${m.iv.map((v, i) => `<label class="small">Review ${i + 1} <input type="number" step="0.01" min="0.01" data-iv="${i}" value="${MM.round(v, 2)}" style="width:80px"></label>`).join("")}</div><div class="xs muted">Default: later today (0.17 day ≈ 4 h), 1, 3, 7, 14 days.</div></details></div>`;
  z.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mt2) { MMV.tab = b.dataset.mt2; return vMedMath($("#view")); }
    if (b.dataset.goLesson) { MMV.tab = "lesson"; MMV.lesson = +b.dataset.goLesson; return vMedMath($("#view")); }
    if (b.dataset.practiceCat) { MMV.tab = "practice"; MMV.pcat = b.dataset.practiceCat; return vMedMath($("#view")); }
    if (b.dataset.timed) { MMV.tab = "timed"; MMV.min = +b.dataset.timed; return vMedMath($("#view")); }
    if (b.dataset.mode) { m.mode = b.dataset.mode; save(); return mmHome(z); }
    if (b.dataset.meth2) { m.method = b.dataset.meth2; save(); return mmHome(z); }
    if (b.dataset.calc) { m.calc = b.dataset.calc === "1"; save(); return mmHome(z); }
  };
  $("#mmtarget", z).onchange = e => { m.target = clamp(+e.target.value || 80, 50, 100); save(); mmHome(z); };
  $$("[data-iv]", z).forEach(inp => inp.onchange = () => { const v = parseFloat(inp.value); if (v > 0) { m.iv[+inp.dataset.iv] = v; save(); } });
}
function mmLearn(z) {
  z.innerHTML = `<div class="stack"><p class="muted" style="max-width:65ch">Ten levels, easiest first. Each formula has its own page: the six-step pattern, a worked example you can solve with three different methods, and practice that adapts to you.</p>
   <div class="grid g2">${MM.LESSONS.map(L => { const ms = Math.round(L.cats.reduce((a, c) => a + mmMastery(c), 0) / L.cats.length); return `<button class="card stack mm-lessoncard" data-lesson="${L.n}"><div class="row between"><span class="label">Level ${L.n}${L.adv ? " · Advanced" : ""}</span><span class="mono small">${ms}%</span></div><h3>${esc(L.t)}</h3><span class="small muted">${L.cats.map(c => esc(MM.CAT[c].n)).join(" · ")}</span><div class="bar ${ms >= 80 ? "ok" : ""}"><i style="width:${ms}%"></i></div></button>`; }).join("")}</div></div>`;
  z.onclick = e => { const b = e.target.closest("[data-lesson]"); if (b) { MMV.tab = "lesson"; MMV.lesson = +b.dataset.lesson; vMedMath($("#view")); } };
}
const FIXSEED = { lbkg: 1, kglb: 2, gmg: 3, mgmcg: 4, lml: 5, time: 6, household: 7, round: 8, tabs: 9, liquid: 10, wtdose: 11, wtday: 12, safe: 13, ivrate: 14, gtt: 15, heparin: 16, insulin: 17, mcgkgmin: 18, titrate: 19, check: 20, recon: 21, multistep: 22, fromrate: 23, bolus: 24, bsa: 25, dilution: 26, clarify: 27 };
function workedFixed(cat) {
  // use the prompt's exact examples where specified; otherwise a seeded level-1 example
  const P = MM.generate(cat, 1, FIXSEED[cat] * 101);
  const ex = {
    lbkg: () => Object.assign(MM.generate("lbkg", 1, 1), { text: "A patient weighs 154 lb. What is the weight in kilograms?", ans: 70, given: [["Weight", "154 lb"], ["Conversion", "1 kg = 2.2 lb"]], sub: "154 ÷ 2.2", solve: ["154 ~lb~ × (1 kg ÷ 2.2 ~lb~) = 70 kg"], methods: { da: ["154 ~lb~ × 1 kg/2.2 ~lb~ = 70 kg"], dh: ["Divide by 2.2: 154 ÷ 2.2 = 70"], rp: ["1 kg : 2.2 lb = x kg : 154 lb", "2.2x = 154 → x = 70 kg"] }, check: ["A kg value is always smaller than the lb value.", "Unit: kg."] }),
    tabs: () => Object.assign(MM.generate("tabs", 1, 1), { text: "Order: 750 mg PO. Available: 250 mg per tablet. How many tablets?", ans: 3, given: [["Ordered (D)", "750 mg"], ["Have (H)", "250 mg per tablet"], ["Quantity (Q)", "1 tablet"]], sub: "(750 mg ÷ 250 mg) × 1 tablet", solve: ["750 ~mg~ × (1 tablet ÷ 250 ~mg~) = 3 tablets"], methods: { da: ["750 ~mg~ × 1 tablet/250 ~mg~ = 3 tablets"], dh: ["D = 750 mg, H = 250 mg, Q = 1 tablet", "(750 ÷ 250) × 1 = 3 tablets"], rp: ["250 mg : 1 tablet = 750 mg : x tablets", "250x = 750 → x = 3 tablets"] }, check: ["3 tablets is a reasonable number.", "Unit: tablets."] }),
    liquid: () => Object.assign(MM.generate("liquid", 1, 1), { text: "Order: 375 mg PO. Available: 125 mg per 5 mL. How many mL?", ans: 15, given: [["Ordered (D)", "375 mg"], ["Have (H)", "125 mg"], ["Quantity (Q)", "5 mL"]], sub: "(375 mg ÷ 125 mg) × 5 mL", solve: ["375 ~mg~ × (5 mL ÷ 125 ~mg~) = 15 mL"], methods: { da: ["375 ~mg~ × 5 mL/125 ~mg~ = 15 mL"], dh: ["(375 ÷ 125) × 5 mL = 3 × 5 = 15 mL"], rp: ["125 mg : 5 mL = 375 mg : x mL", "125x = 1,875 → x = 15 mL"] }, visual: { type: "syringe", ml: 15 } }),
    wtdose: () => Object.assign(MM.generate("wtdose", 1, 1), { text: "A child weighs 20 kg. The fictional practice order is 10 mg/kg/dose. How many mg per dose?", ans: 200, unit: "mg", given: [["Weight", "20 kg"], ["Order", "10 mg/kg/dose (per DOSE)"]], sub: "20 kg × 10 mg/kg", solve: ["20 ~kg~ × 10 mg/~kg~/dose = 200 mg per dose"], methods: { da: ["20 ~kg~ × 10 mg/~kg~ = 200 mg per dose"] }, visual: null }),
    safe: () => Object.assign(MM.generate("safe", 1, 1), { text: "A child weighs 20 kg. Fictional safe range: 15–25 mg/kg/day. The order is 180 mg every 12 hours. Is it within range?", ans: 0, given: [["Weight", "20 kg"], ["Range", "15–25 mg/kg/day"], ["Order", "180 mg q12h = 2 doses/day"]], sub: "20 × 15 and 20 × 25; compare 180 × 2", solve: ["Minimum: 20 × 15 = 300 mg/day", "Maximum: 20 × 25 = 500 mg/day", "Ordered: 180 mg × 2 = 360 mg/day", "360 is within 300–500 → the math check passes"], methods: { da: ["Min 300 · Max 500 · Ordered 360 mg/day → within range"] } }),
    ivrate: () => Object.assign(MM.generate("ivrate", 1, 1), { text: "Infuse 1,000 mL over 8 hours on a pump. What rate?", ans: 125, given: [["Volume", "1,000 mL"], ["Time", "8 hr"]], sub: "1,000 ÷ 8", solve: ["1,000 mL ÷ 8 hr = 125 mL/hr"], methods: { da: ["1,000 mL ÷ 8 hr = 125 mL/hr"], dh: ["Volume ÷ hours = 125"], rp: ["1,000 mL : 8 hr = x mL : 1 hr", "x = 125 mL/hr"] }, visual: { type: "pump", rate: 125 } }),
    gtt: () => Object.assign(MM.generate("gtt", 1, 1), { text: "Infuse 1,000 mL over 8 hours by gravity. Drop factor 15 gtt/mL. Drops per minute?", ans: 31, given: [["Volume", "1,000 mL"], ["Time", "8 hr"], ["Drop factor", "15 gtt/mL"]], sub: "(1,000 × 15) ÷ 480", solve: ["8 ~hr~ × 60 = 480 min", "(1,000 ~mL~ × 15 gtt/~mL~) ÷ 480 min = 31.25 gtt/min", "Round to a whole drop: 31 gtt/min"], methods: { da: ["1,000 ~mL~/480 min × 15 gtt/~mL~ = 31.25 → 31 gtt/min"] }, visual: { type: "drip", gtt: 31 } }),
    recon: () => Object.assign(MM.generate("recon", 1, 1), { text: "A fictional vial contains 1,000 mg. After reconstitution the label says the final concentration is 200 mg/mL. The order is 500 mg. How many mL?", ans: 2.5, given: [["Vial", "1,000 mg"], ["Final concentration", "200 mg/mL"], ["Order", "500 mg"]], sub: "500 mg ÷ 200 mg/mL", solve: ["Use the FINAL concentration: 200 mg/mL", "500 ~mg~ ÷ 200 ~mg~/mL = 2.5 mL"], methods: { da: ["500 ~mg~ × 1 mL/200 ~mg~ = 2.5 mL"], dh: ["(500 ÷ 200) × 1 mL = 2.5 mL"], rp: ["200 mg : 1 mL = 500 mg : x mL", "x = 2.5 mL"] }, visual: { type: "syringe", ml: 2.5 } })
  }[cat];
  return ex ? ex() : P;
}
function mmLesson(z) {
  const L = MM.LESSONS[(MMV.lesson || 1) - 1]; mmS().seenLesson[L.n] = Date.now(); save();
  const ladder = cat => `<button class="btn sm" data-ladder="${cat}">15-problem ladder</button>`;
  let extra = "";
  if (L.n === 1) extra = `<div class="card stack"><div class="label">Visual conversion chart</div>${convChartHTML()}</div><div class="card stack"><div class="label">Matching exercise — conversions</div><div id="convmatch"></div></div>`;
  if (L.n === 6) extra = `<div class="card stack"><div class="label">Try the pump</div><div class="grid g2"><div class="stack"><div class="field"><label for="pv">Volume (mL)</label><input id="pv" type="number" value="1000" min="1"></div><div class="field"><label for="ph">Time (hours)</label><input id="ph" type="number" value="8" min="0.1" step="0.25"></div><div class="field"><label for="pg">Your predicted rate (mL/hr)</label><input id="pg" type="text" inputmode="decimal"></div><button class="btn primary" id="pcheck">Check &amp; start pump</button><div id="pmsg" class="small"></div></div><div id="pumpbox">${pumpSVG("", "idle")}</div></div></div>`;
  if (L.n === 7) extra = `<div class="card stack"><div class="label">Drop-counting practice</div><p class="small">Count the drops for 15 seconds, then multiply by 4. Start when you're ready.</p><div class="row"><div id="dripbox">${dripSVG(0)}</div><div class="stack"><button class="btn primary" id="dstart">Start 15-second count</button><div id="dclock" class="mono"></div><div class="field"><label for="dcount">Drops you counted</label><input id="dcount" type="number" min="0"></div><button class="btn" id="dcheck" disabled>Check</button><div id="dmsg" class="small" aria-live="polite"></div></div></div></div>`;
  if (L.n === 8) extra = `<div class="card stack"><div class="label">Recognize high-alert medications</div><p class="small">Select every medication that needs an independent double-check before you give it.</p><div class="stack" id="hal">${[["Heparin IV infusion", 1], ["Insulin (any)", 1], ["Potassium chloride IV", 1], ["Magnesium sulfate IV (obstetrics)", 1], ["Acetaminophen 650 mg PO", 0], ["Pediatric weight-based doses", 1]].map(([n, k], i) => `<button class="opt sq" data-hal="${i}" data-k="${k}" aria-pressed="false"><span class="mk"></span><span>${n}</span></button>`).join("")}</div><button class="btn primary" id="halgo">Check</button><div id="halmsg" class="small"></div><div class="xs muted">Heparin double-checks and pediatric second-nurse checks come from your Cardiovascular and PEDS files; the rest follow the ISMP high-alert list (broader HESI/NCLEX prep). Follow your facility's policy.</div></div>`;
  z.innerHTML = `<div class="row"><button class="btn sm ghost" id="lback">← All levels</button></div>
   <div class="card stack" style="border-top:6px solid var(--mm-blue)"><span class="label">Level ${L.n}${L.adv ? " · Advanced" : ""}</span><h2>${esc(L.t)}</h2><p style="max-width:65ch">${esc(L.why)}</p></div>${extra}
   ${L.cats.map(cat => { const p = workedFixed(cat); const F = MM.FORMULAS[MM.CAT[cat].formula] || MM.FORMULAS.dh; return `<div class="card stack" data-cat="${cat}"><div class="row between"><div class="head"><span class="label">${esc(MM.CAT[cat].n)} · mastery ${mmMastery(cat)}%</span><h3>${esc(F.n)}</h3></div><div class="row"><button class="btn sm primary" data-pcat="${cat}">Practice (adaptive)</button>${ladder(cat)}</div></div>
     <div class="formula-box big">${esc(F.eq)}</div><div class="panel"><b>Worked example.</b> ${esc(p.text)}</div><div class="mm-work" data-work="${cat}">${sixHTML(p, mmS().method)}${visualHTML(p)}</div></div>`; }).join("")}<div id="lzone"></div>`;
  $("#lback", z).onclick = () => { MMV.tab = "learn"; vMedMath($("#view")); };
  z.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.meth) { const box = b.closest("[data-work]"); const cat = box.dataset.work; mmS().method = b.dataset.meth; box.innerHTML = sixHTML(workedFixed(cat), b.dataset.meth) + visualHTML(workedFixed(cat)); return; }
    if (b.dataset.pcat) { MMV.tab = "practice"; MMV.pcat = b.dataset.pcat; return vMedMath($("#view")); }
    if (b.dataset.ladder) { const cat = b.dataset.ladder; const zone = $("#lzone", z); mmPractice(zone, { next: () => cat, lvlFn: n => 1 + Math.min(2, Math.floor(n / 5)), max: 15, title: `${MM.CAT[cat].n} ladder (levels 1→3)`, onDone: r => { zone.innerHTML = `<div class="card stack"><h3>Ladder complete: ${r.correct}/${r.count}</h3><p class="small muted">Problems 1–5 were level 1, 6–10 level 2, 11–15 level 3.</p></div>`; return "custom"; } }); zone.scrollIntoView({ behavior: "smooth" }); return; }
    if (b.dataset.hal != null) { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); b.querySelector(".mk").textContent = b.getAttribute("aria-pressed") === "true" ? "✓" : ""; return; }
    if (b.id === "halgo") { const bs = $$("[data-hal]", z); let ok = true; bs.forEach(x => { const sel = x.getAttribute("aria-pressed") === "true", k = x.dataset.k === "1"; x.classList.remove("correct", "wrong"); x.classList.add(k ? "correct" : sel ? "wrong" : "x"); if (sel !== k) ok = false; }); $("#halmsg", z).innerHTML = ok ? `<span class="ok-text">${ico("check", 14)} Right — heparin, insulin, IV potassium, IV magnesium and pediatric weight-based doses all get an independent double-check.</span>` : `<span class="err-text">${ico("x", 14)} Not quite. Highlighted in green are the ones that need a second nurse; oral acetaminophen at a standard adult dose does not.</span>`; return; }
    if (b.id === "pcheck") { const v = +$("#pv", z).value, h = +$("#ph", z).value, g = parseFloat($("#pg", z).value); if (!(v > 0 && h > 0)) { $("#pmsg", z).textContent = "Enter a volume and a time greater than zero."; return; } const r = MM.round(v / h, 1); const ok = Math.abs(g - r) < 1e-6; $("#pumpbox", z).innerHTML = pumpSVG(isFinite(g) ? g : "", ok ? "run" : "alarm"); $("#pmsg", z).innerHTML = ok ? `<span class="ok-text">${ico("check", 14)} ${MM.fmt(v)} ÷ ${MM.fmt(h)} = ${MM.fmt(r)} mL/hr — pump running.</span>` : `<span class="err-text">${ico("x", 14)} The pump alarms: ${MM.fmt(v)} mL ÷ ${MM.fmt(h)} hr = ${MM.fmt(r)} mL/hr (rounded to the tenth).</span>`; return; }
    if (b.id === "dstart") { const gtt = pick([20, 24, 28, 32, 36, 40]); z.dataset.gtt = gtt; $("#dripbox", z).innerHTML = dripSVG(gtt); let s = 15; $("#dclock", z).textContent = "15 s"; b.disabled = true; const iv = setInterval(() => { s--; const ck = $("#dclock", z); if (!ck) return clearInterval(iv); ck.textContent = s + " s"; if (s <= 0) { clearInterval(iv); $("#dripbox", z).innerHTML = dripSVG(0); ck.textContent = "Time! Enter your count."; $("#dcheck", z).disabled = false; b.disabled = false; } }, 1000); return; }
    if (b.id === "dcheck") { const gtt = +z.dataset.gtt, n = +$("#dcount", z).value, exp = gtt / 4; $("#dmsg", z).innerHTML = `The drip was set to <b>${gtt} gtt/min</b> = ${MM.fmt(exp)} drops per 15 s. Your count × 4 = <b>${n * 4} gtt/min</b>. ${Math.abs(n - exp) <= 1 ? `<span class="ok-text">${ico("check", 14)} Within one drop — well counted.</span>` : `<span class="err-text">Off by ${MM.fmt(Math.abs(n - exp))} drops — try again and count every drop as it falls.</span>`}`; return; }
  };
  if (L.n === 1) convMatch($("#convmatch", z));
}
function convMatch(box) {
  const pairs = shuffle([["154 lb", "70 kg"], ["0.5 g", "500 mg"], ["0.125 mg", "125 mcg"], ["2 tsp", "10 mL"], ["90 min", "1.5 hr"], ["1.5 L", "1,500 mL"], ["8 oz", "240 mL"], ["25 kg", "55 lb"]]).slice(0, 5).map((p, i) => ({ id: "c" + i, l: p[0], r: p[1] }));
  const st = { L: shuffle(pairs.map(p => p.id)), R: shuffle(pairs.map(p => p.id)), sl: null, sr: null, done: new Set(), err: 0 };
  const P0 = Object.fromEntries(pairs.map(p => [p.id, p]));
  const draw = () => { box.innerHTML = `<div class="match"><div class="col">${st.L.map(id => `<button class="tile ${st.done.has(id) ? "done" : ""}" data-cl="${id}" aria-pressed="${st.sl === id}" ${st.done.has(id) ? "disabled" : ""}>${P0[id].l}</button>`).join("")}</div><div class="col">${st.R.map(id => `<button class="tile ${st.done.has(id) ? "done" : ""}" data-cr="${id}" aria-pressed="${st.sr === id}" ${st.done.has(id) ? "disabled" : ""}>${P0[id].r}</button>`).join("")}</div></div><div class="small" aria-live="polite">${st.done.size === pairs.length ? `${ico("check", 14)} All matched with ${st.err} miss${st.err === 1 ? "" : "es"}. <button class="btn sm" id="cmagain">New set</button>` : `${st.done.size}/${pairs.length} matched`}</div>`; };
  box.onclick = e => { e.stopPropagation(); const b = e.target.closest("button"); if (!b || b.disabled) return; if (b.id === "cmagain") return convMatch(box); if (b.dataset.cl) st.sl = b.dataset.cl; if (b.dataset.cr) st.sr = b.dataset.cr; if (st.sl && st.sr) { if (st.sl === st.sr) st.done.add(st.sl); else st.err++; st.sl = st.sr = null; } draw(); };
  draw();
}
function mmPracticeView(z) {
  const m = mmS(); const pc = MMV.pcat; MMV.pcat = null;
  const cats = Object.keys(MM.CAT);
  z.innerHTML = `<div class="card stack"><div class="row between"><div class="head"><span class="label">Practice with me · ${esc(m.mode)} mode</span><p class="small muted">${{ beginner: "Every step is laid out — finish the last one yourself.", intermediate: "Pick the unit and formula; ask for hints when stuck.", advanced: "Solve it cold. Feedback afterward." }[m.mode]}</p></div>
    <div class="row"><div class="field"><label for="pcsel">Topic</label><select id="pcsel"><option value="">Adaptive mix (recommended)</option>${MM.LESSONS.map(L => `<optgroup label="Level ${L.n}: ${esc(L.t)}">${L.cats.map(c => `<option value="${c}" ${pc === c ? "selected" : ""}>${esc(MM.CAT[c].n)} — L${catSt(c).lvl}</option>`).join("")}</optgroup>`).join("")}</select></div></div></div></div><div id="pzone"></div>`;
  const start = cat => mmPractice($("#pzone", z), { next: prev => cat || mmPickNext(prev), title: cat ? MM.CAT[cat].n : "Adaptive practice" });
  $("#pcsel", z).onchange = e => start(e.target.value || null);
  start(pc || null);
}
function mmTimed(z) {
  const min = MMV.min || 10;
  z.innerHTML = `<div class="card stack"><div class="label">${min}-minute timed practice</div><p class="small muted">Accuracy beats speed — there's no bonus for rushing.</p></div><div id="tz"></div>`;
  mmPractice($("#tz", z), { next: prev => mmPickNext(prev), minutes: min, title: `${min}-minute practice`, onExit: true });
}
function mmReview(z) {
  const due = mmDue(); if (!due.length) { z.innerHTML = `<div class="empty">Nothing is due right now.</div>`; return; }
  z.innerHTML = `<div class="card stack"><div class="label">Spaced review · ${due.length} categories</div><p class="small muted">Fresh, unseen problems for each due category — that's how real mastery is measured.</p></div><div id="rz"></div>`;
  let i = 0; mmPractice($("#rz", z), { next: () => due[i++ % due.length], max: due.length * 2, title: "Spaced review" });
}
const DRUGMATH = { heparin: ["heparin", "heparin"], lispro: ["insulin", ""], regular: ["insulin", ""], nph: ["insulin", ""], glargine: ["insulin", ""], magsulfate: ["ivrate", "magnesium"], digoxin: ["liquid", "digoxin"], acetaminophen: ["liquid", "acetaminophen"], nitrofurantoin: ["multistep", "nitrofurantoin"], amoxicillin: ["wtday", ""], ferrous: ["wtdose", ""], kcl: ["ivrate", ""], levothyroxine: ["tabs", "levothyroxine"], vancomycin: ["recon", ""], enoxaparin: ["wtdose", ""], methylphenidate: ["wtdose", ""] };
function drugMathFor(d) { if (DRUGMATH[d.id]) return DRUGMATH[d.id]; if (d.sys.includes("peds")) return ["wtdose", ""]; return null; }
function mmDrug(z) {
  const d = DRUG[MMV.drug]; const dm = d && drugMathFor(d); if (!dm) { MMV.tab = "home"; return mmHome(z); }
  const lvl = dm[1] ? 3 : catSt(dm[0]).lvl;
  z.innerHTML = `<div class="card stack"><div class="label">Med math for ${esc(d.g)}</div><p class="small muted">${dm[1] ? "Problems use concentrations or doses named in your course files where available; everything else is a practice value." : "Practice values — the arithmetic pattern you'd use with this drug."}</p><div class="row"><button class="btn sm ghost" data-nav="library" data-arg="${d.id}">← Back to ${esc(d.g)}</button></div></div><div id="dz"></div>`;
  const level = dm[0] === "liquid" && dm[1] === "acetaminophen" ? 2 : dm[0] === "ivrate" && dm[1] === "magnesium" ? 3 : lvl;
  mmPractice($("#dz", z), { next: () => dm[0], lvl: level, mustInclude: dm[1] || null, title: `${d.g} math`, first: { cat: dm[0], lvl: level } });
}

/* ================= GAMES ================= */
const MMG = { g: null };
function mmGames(z) {
  const m = mmS(); const best = id => (m.games[id] && m.games[id].best != null) ? m.games[id].best : "—";
  if (!MMG.g) {
    z.innerHTML = `<div class="grid g3">${[["fmatch", "Formula Match", "Match each scenario to the formula you'd use."], ["sprint", "Conversion Sprint", "60 seconds of conversions. Wrong answers cost a point — accuracy first."], ["fix", "Fix the Nurse's Calculation", "Find the wrong step and fix the answer."], ["pump", "IV Pump Challenge", "Program the pump for each order."], ["safe", "Safe or Unsafe?", "Is the order within the stated range — or does it need clarification?"]].map(([id, t, d]) => `<button class="card stack mm-bigcard" data-game="${id}"><h3>${t}</h3><span class="small muted">${d}</span><span class="chip">Personal best: ${best(id)}</span></button>`).join("")}</div>`;
    z.onclick = e => { const b = e.target.closest("[data-game]"); if (b) { MMG.g = b.dataset.game; mmGames(z); } };
    return;
  }
  z.onclick = null;
  const back = `<div class="row"><button class="btn sm ghost" id="gback">← All games</button></div>`;
  z.innerHTML = back + `<div id="gz"></div>`; $("#gback", z).onclick = () => { MMG.g = null; mmGames(z); };
  ({ fmatch: gFormulaMatch, sprint: gSprint, fix: gFix, pump: gPump, safe: gSafe })[MMG.g]($("#gz", z));
}
function gameScore(id, score, higherBetter = true) { const m = mmS(); const g = m.games[id] || (m.games[id] = { best: null, plays: 0 }); g.plays++; g.last = score; const nb = g.best == null || (higherBetter ? score > g.best : score < g.best); if (nb) g.best = score; touch(); save(); return nb; }
function gFormulaMatch(z) {
  const scen = { lbkg: "A 66-lb child needs a weight in kg", dh: "Order 500 mg; tablets are 250 mg", wtday: "40 mg/kg/day divided q8h", gtt: "1,000 mL over 8 h, 20 gtt/mL tubing", mlhr: "500 mL over 4 h on a pump", unitshr: "Heparin 1,200 units/hr; bag 100 units/mL", recon: "Vial says 'yields 250 mg/mL'; order 500 mg", mcgkgmin: "3 mcg/kg/min, 70 kg, 400 mg/250 mL", safe: "Is 150 mg q6h within 20–40 mg/kg/day?", metric: "Convert 0.25 g to mg", fromrate: "Running at 15 mL/hr — how many units/hr?", wtdose: "15 mg/kg/dose for a 12-kg toddler" };
  const ids = shuffle(Object.keys(scen)).slice(0, 5); const st = { L: shuffle(ids), R: shuffle(ids), sl: null, sr: null, done: new Set(), err: 0 };
  const draw = () => {
    const fin = st.done.size === ids.length;
    z.innerHTML = `<div class="card stack"><div class="label">Formula Match</div><div class="match"><div class="col">${st.L.map(id => `<button class="tile ${st.done.has(id) ? "done" : ""}" data-l="${id}" aria-pressed="${st.sl === id}" ${st.done.has(id) ? "disabled" : ""}>${esc(scen[id])}</button>`).join("")}</div><div class="col">${st.R.map(id => `<button class="tile ${st.done.has(id) ? "done" : ""}" data-r="${id}" aria-pressed="${st.sr === id}" ${st.done.has(id) ? "disabled" : ""}><b>${esc(MM.FORMULAS[id].n)}</b><br><span class="mono xs">${esc(MM.FORMULAS[id].eq)}</span></button>`).join("")}</div></div>
     <div class="small" aria-live="polite">${fin ? `${ico("check", 14)} Done with ${st.err} miss${st.err === 1 ? "" : "es"}. ${st.err === 0 ? "<b>Perfect round!</b>" : ""} <button class="btn sm primary" id="again">Play again</button>` : `${st.done.size}/5 · ${st.err} misses`}</div></div>`;
  };
  z.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return; if (b.id === "again") return gFormulaMatch(z); if (b.dataset.l) st.sl = b.dataset.l; if (b.dataset.r) st.sr = b.dataset.r;
    if (st.sl && st.sr) { if (st.sl === st.sr) { st.done.add(st.sl); if (st.done.size === ids.length) { const nb = gameScore("fmatch", st.err, false); if (nb) toast("New personal best (fewest misses)"); } } else st.err++; st.sl = st.sr = null; } draw(); };
  draw();
}
function gSprint(z) {
  const cats = ["lbkg", "kglb", "gmg", "mgmcg", "lml", "time", "household"]; let p, score = 0, right = 0, wrong = 0, end = 0, iv = null, running = false;
  const next = () => { p = MM.generate(pick(cats), pick([1, 2]), seedNow()); window.__mmSprint = p; };
  const draw = (msg) => {
    if (!running) { const acc = right + wrong ? pct(right, right + wrong) : 0; z.innerHTML = `<div class="card stack"><div class="label">Conversion Sprint</div><p class="small">60 seconds. Correct = +1, wrong = −1. Your best only counts when accuracy is at least 80% with 5+ answers — no reward for reckless speed.</p>${end ? `<div class="fb ${acc >= 80 ? "ok" : "bad"}"><h4>Score ${score} · ${right} right, ${wrong} wrong · ${acc}% accuracy</h4>${acc >= 80 && right + wrong >= 5 ? "" : "<div class='small'>Not eligible for a personal best — accuracy first.</div>"}</div>` : ""}<button class="btn primary" id="go">${end ? "Sprint again" : "Start sprint"}</button></div>`; return; }
    z.innerHTML = `<div class="card stack"><div class="row between"><span class="label">Conversion Sprint</span><span class="mono" id="sclock"></span></div><div class="q-stem">${esc(p.text)}</div><div class="mm-answer"><div class="field"><label for="sans">Answer (${esc(p.unit)})</label><input id="sans" type="text" inputmode="decimal" autocomplete="off"></div></div><div class="row between small"><span>Score ${score} · ✓${right} ✗${wrong}</span><span aria-live="polite">${msg || ""}</span></div></div>`;
    const a = $("#sans", z); a.focus(); a.onkeydown = e => { if (e.key !== "Enter" || a.value.trim() === "") return; const v = parseFloat(a.value.replace(/,/g, "")); const r = MM.diagnose(p, v, p.unit); if (r.ok) { score++; right++; } else { score--; wrong++; } const prev = p; next(); draw(r.ok ? "✓ correct" : `✗ ${prev.text.split("?")[0].slice(0, 40)}… = ${MM.fmt(prev.ans)} ${prev.unit}`); };
    tickC();
  };
  const tickC = () => { const c = $("#sclock", z); if (c) c.textContent = Math.max(0, Math.ceil((end - Date.now()) / 1000)) + " s"; };
  z.onclick = e => { const b = e.target.closest("#go"); if (!b) return; score = right = wrong = 0; running = true; end = Date.now() + 60000; next(); draw(); clearInterval(iv); iv = setInterval(() => { if (!$("#sclock", z)) { clearInterval(iv); return; } tickC(); if (Date.now() >= end) { clearInterval(iv); running = false; const acc = right + wrong ? pct(right, right + wrong) : 0; if (acc >= 80 && right + wrong >= 5) { if (gameScore("sprint", score)) toast("New sprint personal best"); } else gameScore("sprint", -999); draw(); } }, 250); };
  draw();
}
function fixGen(R) {
  const k = R.pick(["CONV", "DAYDOSE", "TIME", "FORM", "DEC", "CONC", "ROUND"]);
  if (k === "CONV") { const lb = R.pick([22, 33, 44, 55, 66]), per = R.pick([5, 10, 15]); const kg = lb / 2.2; return { k, text: `A child weighs ${lb} lb. Practice order: ${per} mg/kg/dose. How many mg?`, lines: [`Weight = ${lb}`, `${lb} × ${per} = ${lb * per} mg`, `Answer: ${lb * per} mg`], bad: 0, ans: MM.round(kg * per, 1), unit: "mg", why: `The weight was never converted: ${lb} lb ÷ 2.2 = ${MM.fmt(kg)} kg, then × ${per} = ${MM.fmt(MM.round(kg * per, 1))} mg.` }; }
  if (k === "DAYDOSE") { const kg = R.pick([10, 15, 20, 25]), per = R.pick([30, 60, 90]), q = R.pick([8, 6]); const n = 24 / q; return { k, text: `A ${kg}-kg child: practice order ${per} mg/kg/day divided every ${q} hours. How many mg per dose?`, lines: [`${kg} kg × ${per} mg/kg/day = ${kg * per} mg/day`, `Per dose = ${kg * per} mg`, `Answer: ${kg * per} mg per dose`], bad: 1, ans: MM.round(kg * per / n, 1), unit: "mg", why: `mg/kg/DAY must be divided: every ${q} h = ${n} doses, so ${kg * per} ÷ ${n} = ${MM.fmt(MM.round(kg * per / n, 1))} mg per dose.` }; }
  if (k === "TIME") { const ml = R.pick([1000, 500]), h = R.pick([8, 4, 6]), df = R.pick([15, 20, 10]); const ans = MM.round(ml * df / (h * 60), 0); return { k, text: `Infuse ${ml} mL over ${h} hours; drop factor ${df} gtt/mL. Drops per minute?`, lines: [`Time = ${h}`, `(${ml} × ${df}) ÷ ${h} = ${MM.fmt(ml * df / h)}`, `Answer: ${MM.fmt(Math.round(ml * df / h))} gtt/min`], bad: 0, ans, unit: "gtt/min", why: `Time must be in minutes: ${h} × 60 = ${h * 60} min → (${ml} × ${df}) ÷ ${h * 60} = ${MM.fmt(ml * df / (h * 60))} → ${ans} gtt/min.` }; }
  if (k === "FORM") { const have = R.pick([250, 125, 50]), m = R.pick([2, 3]); const d = have * m; return { k, text: `Order: ${d} mg. Available: ${have} mg tablets. How many tablets?`, lines: [`D = ${d} mg, H = ${have} mg`, `${have} ÷ ${d} = ${MM.fmt(MM.round(have / d, 2))}`, `Answer: ${MM.fmt(MM.round(have / d, 2))} tablet`], bad: 1, ans: m, unit: "tablet(s)", why: `Desired goes on top: ${d} ÷ ${have} = ${m} tablets.` }; }
  if (k === "DEC") { const g = R.pick([0.25, 0.5, 0.125, 0.75]); return { k, text: `Convert ${g} g to mg.`, lines: [`1 g = 1,000 mg`, `${g} × 100 = ${MM.fmt(g * 100)}`, `Answer: ${MM.fmt(g * 100)} mg`], bad: 1, ans: g * 1000, unit: "mg", why: `The metric step is 1,000: ${g} × 1,000 = ${MM.fmt(g * 1000)} mg.` }; }
  if (k === "CONC") { const vial = [1000, 200], order = R.pick([500, 300, 400]), dil = 4.8; return { k, text: `Vial 1,000 mg. Label: add 4.8 mL to yield 200 mg/mL. Order: ${order} mg. How many mL?`, lines: [`Concentration = 1,000 mg in 4.8 mL`, `${order} ÷ 1,000 × 4.8 = ${MM.fmt(MM.round(order / 1000 * dil, 2))}`, `Answer: ${MM.fmt(MM.roundML(order / 1000 * dil))} mL`], bad: 0, ans: MM.roundML(order / 200), unit: "mL", why: `Use the FINAL concentration on the label (200 mg/mL), not the diluent volume: ${order} ÷ 200 = ${MM.fmt(MM.roundML(order / 200))} mL.` }; }
  const ml = R.pick([1000, 500]), h = 8, df = 15; const raw = ml * df / (h * 60); return { k, text: `Infuse ${ml} mL over ${h} hours; drop factor ${df}. Drops per minute?`, lines: [`${h} hr × 60 = ${h * 60} min`, `(${ml} × ${df}) ÷ ${h * 60} = ${MM.fmt(raw)}`, `Answer: ${MM.fmt(MM.round(raw, 1))} gtt/min`], bad: 2, ans: MM.round(raw, 0), unit: "gtt/min", why: `You can't give part of a drop — round to a whole number: ${MM.fmt(MM.round(raw, 0))} gtt/min.` };
}
function gFix(z) {
  let round = 0, pts = 0, cur = fixGen(MM.rng(seedNow())), sel = null, ans = "", res = null; const N = 5; window.__mmFix = () => cur;
  const draw = () => {
    if (round >= N) { const nb = gameScore("fix", pts); z.innerHTML = `<div class="card stack"><div class="label">Fix the Nurse's Calculation</div><h2>${pts}/${N * 2} points</h2>${nb ? "<div class='chip badge-S'>New personal best</div>" : ""}<button class="btn primary" id="again">Play again</button></div>`; $("#again", z).onclick = () => gFix(z); return; }
    z.innerHTML = `<div class="card stack"><div class="row between"><span class="label">Fix the Nurse's Calculation · ${round + 1}/${N}</span><span class="small">${pts} pts</span></div><div class="q-stem">${esc(cur.text)}</div><div class="label">The nurse's work — tap the step with the error</div>
      <div class="stack">${cur.lines.map((l, i) => { let c = "opt"; if (res) { if (i === cur.bad) c += " wrong"; else if (i === sel) c += " x"; } return `<button class="${c}" data-ln="${i}" aria-pressed="${sel === i}" ${res ? "disabled" : ""}><span class="mk">${i + 1}</span><span class="mono">${esc(l)}</span></button>`; }).join("")}</div>
      <div class="mm-answer"><div class="field"><label for="fxa">Corrected answer (${esc(cur.unit)})</label><input id="fxa" type="text" inputmode="decimal" value="${esc(ans)}" ${res ? "disabled" : ""}></div></div>
      ${res ? `<div class="fb ${res.both ? "ok" : "bad"}"><h4>${res.step ? "✓" : "✗"} Step · ${res.val ? "✓" : "✗"} Corrected answer</h4><div><span class="err-tag">${esc(ERRICON[cur.k])}</span> ${esc(cur.why)}</div><div class="small">Correct answer: <b>${MM.fmt(cur.ans)} ${esc(cur.unit)}</b></div></div><button class="btn primary" id="fnext">Next</button>` : `<button class="btn primary" id="fcheck" ${sel != null && ans.trim() ? "" : "disabled"}>Check</button>`}</div>`;
    const a = $("#fxa", z); if (a) a.oninput = () => { ans = a.value; const b = $("#fcheck", z); if (b) b.disabled = !(sel != null && ans.trim()); };
  };
  z.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.ln != null) { sel = +b.dataset.ln; return draw(); }
    if (b.id === "fcheck") { const v = parseFloat(ans.replace(/,/g, "")); const step = sel === cur.bad, val = Math.abs(v - cur.ans) < 1e-6; pts += (step ? 1 : 0) + (val ? 1 : 0); res = { step, val, both: step && val }; return draw(); }
    if (b.id === "fnext") { round++; cur = fixGen(MM.rng(seedNow())); sel = null; ans = ""; res = null; return draw(); } };
  draw();
}
function gPump(z) {
  let round = 0, pts = 0, p, val = "", state = "idle", res = null; const N = 5;
  const gen = () => { const c = pick(["ivrate", "heparin", "insulin", "ivrate"]); p = MM.generate(c, c === "insulin" ? 2 : pick([1, 2]), seedNow()); window.__mmPump = p; };
  gen();
  const draw = () => {
    if (round >= N) { const nb = gameScore("pump", pts); z.innerHTML = `<div class="card stack"><div class="label">IV Pump Challenge</div><h2>${pts}/${N} pumps programmed correctly</h2>${nb ? "<div class='chip badge-S'>New personal best</div>" : ""}<button class="btn primary" id="again">Play again</button></div>`; $("#again", z).onclick = () => gPump(z); return; }
    z.innerHTML = `<div class="card stack"><div class="row between"><span class="label">IV Pump Challenge · ${round + 1}/${N}</span><span class="small">${pts} correct</span></div><div class="q-stem">${esc(p.text)}</div>
     <div class="grid g2"><div id="pumpv">${pumpSVG(val === "" ? "" : parseFloat(val), state)}</div><div class="stack"><div class="field"><label for="prate">Rate (mL/hr)</label><div class="row" style="flex-wrap:nowrap"><button class="iconbtn" data-step="-1" aria-label="Decrease by 1">−</button><input id="prate" type="text" inputmode="decimal" value="${esc(val)}" ${res ? "disabled" : ""}><button class="iconbtn" data-step="1" aria-label="Increase by 1">+</button></div></div>
     ${res ? `<div class="fb ${res.ok ? "ok" : "bad"}"><h4>${res.ok ? "✓ Pump running" : "✗ Pump alarm — rate doesn't match the order"}</h4>${res.ok ? "" : `<div class="small">${esc(res.msg)}</div>`}<div class="small mono">${(p.solve || []).map(cancelHTML).join("<br>")}</div>${p.high ? `<div class="small"><b>High-alert:</b> a second nurse independently double-checks.</div>` : ""}</div><button class="btn primary" id="pnext">Next order</button>` : `<button class="btn primary" id="pstart" ${val.trim() ? "" : "disabled"}>Start infusion</button>`}</div></div></div>`;
    const inp = $("#prate", z); if (inp && !res) { inp.oninput = () => { val = inp.value; $("#pstart", z).disabled = !val.trim(); $("#pumpv", z).innerHTML = pumpSVG(val === "" ? "" : parseFloat(val), "idle"); }; inp.onkeydown = e => { if (e.key === "Enter" && val.trim()) $("#pstart", z).click(); }; }
  };
  z.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.step) { const v = (parseFloat(val) || 0) + +b.dataset.step; val = String(MM.round(Math.max(0, v), 1)); state = "idle"; return draw(); }
    if (b.id === "pstart") { const v = parseFloat(val); const r = MM.diagnose(p, v, "mL/hr"); res = { ok: r.ok, msg: r.msg || "" }; state = r.ok ? "run" : "alarm"; if (r.ok) pts++; mmRecord(p, r.ok, { assisted: false, err: r.code, first: true }); return draw(); }
    if (b.id === "pnext") { round++; gen(); val = ""; state = "idle"; res = null; return draw(); } };
  draw();
}
function gSafe(z) {
  let round = 0, pts = 0, p, sel = null, res = null; const N = 8;
  const gen = () => { p = MM.generate(pick(["safe", "safe", "safe", "check"]), pick([1, 2, 3]), seedNow()); window.__mmSafe = p; };
  gen();
  const draw = () => {
    if (round >= N) { const nb = gameScore("safe", pts); z.innerHTML = `<div class="card stack"><div class="label">Safe or Unsafe?</div><h2>${pts}/${N} correct calls</h2>${nb ? "<div class='chip badge-S'>New personal best</div>" : ""}<p class="small muted">Remember: a passing range check is arithmetic only — never proof by itself that a medication is safe to give.</p><button class="btn primary" id="again">Play again</button></div>`; $("#again", z).onclick = () => gSafe(z); return; }
    z.innerHTML = `<div class="card stack"><div class="row between"><span class="label">Safe or Unsafe? · ${round + 1}/${N}</span><span class="small">${pts} correct</span></div><div class="q-stem">${esc(p.text)}</div>
     <div class="stack">${p.choices.map((c, i) => { let cl = "opt"; if (res) { if (i === p.ans) cl += " correct"; else if (i === sel) cl += " wrong"; } return `<button class="${cl}" data-c="${i}" ${res ? "disabled" : ""}><span class="mk">${"ABCD"[i]}</span><span>${esc(c)}</span></button>`; }).join("")}</div>
     ${res ? `<div class="fb ${res ? (sel === p.ans ? "ok" : "bad") : ""}"><div class="mono small">${(p.solve || []).map(cancelHTML).join("<br>")}</div><div class="xs muted">${esc(p.src)}</div></div><button class="btn primary" id="snext">Next</button>` : ""}</div>`;
  };
  z.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.c != null && !res) { sel = +b.dataset.c; res = true; const ok = sel === p.ans; if (ok) pts++; mmRecord(p, ok, { assisted: false, err: ok ? null : "SAFE", first: true }); return draw(); }
    if (b.id === "snext") { round++; sel = null; res = null; gen(); return draw(); } };
  draw();
}

/* ================= EXAM ================= */
const MMX = { n: 20, custom: 15, fb: "exam", pool: "mixed", cat: "", ff: false, adv: false, timer: 0, calc: true };
function mmExam(z) {
  const m = mmS();
  z.innerHTML = `<div class="card stack"><div class="label">MED math exam</div>
   <div class="stack"><span class="label">Questions</span><div class="row"><div class="seg" role="group">${[10, 20, 25, 50].map(n => `<button data-xn="${n}" aria-pressed="${MMX.n === n}">${n}</button>`).join("")}<button data-xn="custom" aria-pressed="${MMX.n === "custom"}">Custom</button></div>${MMX.n === "custom" ? `<input id="xcust" type="number" min="1" max="100" value="${MMX.custom}" style="width:90px" aria-label="Custom question count">` : ""}</div></div>
   <div class="grid g2"><div class="stack"><span class="label">Feedback</span><div class="seg" role="group"><button data-xfb="exam" aria-pressed="${MMX.fb === "exam"}">Exam mode</button><button data-xfb="tutor" aria-pressed="${MMX.fb === "tutor"}">Tutor mode</button></div></div>
    <div class="stack"><span class="label">Question pool</span><div class="seg" role="group"><button data-xp="mixed" aria-pressed="${MMX.pool === "mixed"}">Mixed</button><button data-xp="weak" aria-pressed="${MMX.pool === "weak"}">Weakness</button><button data-xp="cat" aria-pressed="${MMX.pool === "cat"}">One topic</button></div>${MMX.pool === "cat" ? `<select id="xcat" aria-label="Topic">${Object.keys(MM.CAT).map(c => `<option value="${c}" ${MMX.cat === c ? "selected" : ""}>${esc(MM.CAT[c].n)}</option>`).join("")}</select>` : ""}</div></div>
   <div class="grid g3"><label class="row small"><input type="checkbox" id="xff" ${MMX.ff ? "checked" : ""}> Formula-free (no formula hints)</label><label class="row small"><input type="checkbox" id="xadv" ${MMX.adv ? "checked" : ""}> Include Advanced (Level 10)</label><label class="row small"><input type="checkbox" id="xcalc" ${MMX.calc ? "checked" : ""}> Calculator allowed</label></div>
   <div class="field" style="max-width:280px"><label for="xtimer">Time limit (minutes, 0 = untimed)</label><input id="xtimer" type="number" min="0" max="240" value="${MMX.timer}"></div>
   <div class="small muted">Target score: ${m.target}% (change it on the MED MATH home). Mix of numeric-entry, multiple-choice and decision questions; original practice items, not copies of licensed exam questions.</div>
   <button class="btn primary" id="xgo">Start exam</button></div>
   ${m.exams.length ? `<div class="card stack"><div class="label">Recent exams</div>${m.exams.slice(-6).reverse().map(x => `<div class="row between small"><span>${fmtDate(x.t)} · ${x.n} questions · ${x.mode}${x.ff ? " · formula-free" : ""}</span><span class="mono"><b>${x.score}%</b> · ${x.avg}s/question</span></div>`).join("")}</div>` : ""}<div id="xz"></div>`;
  z.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.xn) { MMX.n = b.dataset.xn === "custom" ? "custom" : +b.dataset.xn; mmExam(z); } if (b.dataset.xfb) { MMX.fb = b.dataset.xfb; mmExam(z); } if (b.dataset.xp) { MMX.pool = b.dataset.xp; mmExam(z); } };
  const c = $("#xcust", z); if (c) c.onchange = () => MMX.custom = clamp(+c.value || 10, 1, 100);
  const xc = $("#xcat", z); if (xc) { MMX.cat = xc.value; xc.onchange = () => MMX.cat = xc.value; }
  $("#xff", z).onchange = e => MMX.ff = e.target.checked; $("#xadv", z).onchange = e => MMX.adv = e.target.checked; $("#xcalc", z).onchange = e => MMX.calc = e.target.checked; $("#xtimer", z).onchange = e => MMX.timer = clamp(+e.target.value || 0, 0, 240);
  $("#xgo", z).onclick = () => { z.onclick = null; runMMExam(z); };
}
function buildMMExam() {
  const n = MMX.n === "custom" ? MMX.custom : MMX.n;
  let pool = Object.keys(MM.CAT).filter(c => MMX.adv || MM.CAT[c].lesson < 10);
  if (MMX.pool === "cat" && MMX.cat) pool = [MMX.cat];
  const weights = pool.map(c => MMX.pool === "weak" ? (100 - mmMastery(c)) + 10 * Object.values((mmS().cats[c] || { errs: {} }).errs).reduce((a, b) => a + b, 0) + 5 : 1);
  const tot = weights.reduce((a, b) => a + b, 0); const items = []; let last = null;
  for (let i = 0; i < n; i++) {
    let cat; for (let k = 0; k < 6; k++) { let r = Math.random() * tot; cat = pool[pool.length - 1]; for (let j = 0; j < pool.length; j++) { r -= weights[j]; if (r <= 0) { cat = pool[j]; break; } } if (cat !== last || pool.length === 1) break; }
    last = cat; const st = catSt(cat); const p = MM.generate(cat, Math.max(st.lvl, i < n / 3 ? 1 : i < 2 * n / 3 ? 2 : 3), seedNow() + i * 31);
    if (p.kind === "num" && Math.random() < .3) { const vals = [p.ans, ...p.traps.map(t => t.v).filter(v => v != null && isFinite(v) && Math.abs(v - p.ans) > 1e-9)].map(v => MM.round(v, 4)); const uniq = [...new Set(vals)]; while (uniq.length < 4) { const f = pick([0.5, 2, 10, 0.1, 1.5]); const v = MM.round(p.ans * f, 2); if (!uniq.includes(v) && v > 0) uniq.push(v); }
      const opts = shuffle(uniq.slice(0, 4)); p.mc = { opts: opts.map(v => `${MM.fmt(v)} ${p.unit}`), ans: opts.indexOf(p.ans) }; }
    items.push(p);
  }
  return items;
}
function runMMExam(z) {
  const items = buildMMExam().map(p => ({ p, ans: "", unit: "", choice: null, done: false, ok: null, r: null, secs: 0 })); window.__mmExam = items;
  let i = 0, enter = Date.now(); const t0 = Date.now(); const endAt = MMX.timer ? t0 + MMX.timer * MIN : null; let iv = null; const tutor = MMX.fb === "tutor"; let calcOpen = false;
  const stamp = () => { items[i].secs += (Date.now() - enter) / 1000; enter = Date.now(); };
  const grade = it => { const p = it.p; let r; if (p.kind === "choice") r = MM.diagnose(p, it.choice); else if (p.mc) r = it.choice === p.mc.ans ? { ok: true } : { ok: false, code: "ARITH", msg: "Recalculate — compare with the worked solution." }; else { const v = parseFloat(String(it.ans).replace(/,/g, "")); r = isFinite(v) ? MM.diagnose(p, v, it.unit) : { ok: false, code: "ARITH", msg: "No answer entered." }; }
    if (p.mc && !r.ok && it.choice != null) { const v = parseFloat(p.mc.opts[it.choice]); const d = MM.diagnose(p, v, p.unit); if (!d.ok) r = d; }
    it.r = r; it.ok = r.ok; it.done = true; mmRecord(p, r.ok, { assisted: false, err: r.code, secs: Math.round(it.secs), first: true }); };
  const answered = it => it.p.kind === "choice" || it.p.mc ? it.choice != null : (String(it.ans).trim() !== "" && it.unit);
  const draw = () => {
    clearInterval(iv);
    const it = items[i], p = it.p;
    const showFb = tutor && it.done;
    z.innerHTML = `<div class="card stack mm-prob"><div class="row between"><span class="label">Question ${i + 1} of ${items.length}${p.adv ? " · Advanced" : ""}${p.high ? " · High-alert" : ""}</span><span class="mono small" id="xclock"></span></div><div class="progress-line"><i style="width:${pct(i, items.length)}%"></i></div>
     <div class="q-stem">${esc(p.text)}</div>
     ${p.kind === "choice" || p.mc ? `<div class="stack">${(p.mc ? p.mc.opts : p.choices).map((c, k) => { let cl = "opt"; const key = p.mc ? p.mc.ans : p.ans; if (showFb) { if (k === key) cl += " correct"; else if (k === it.choice) cl += " wrong"; } return `<button class="${cl}" data-xc="${k}" aria-pressed="${it.choice === k}" ${showFb ? "disabled" : ""}><span class="mk">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`; }).join("")}</div>`
      : `<div class="mm-answer"><div class="field"><label for="xans">Your answer</label><input id="xans" type="text" inputmode="decimal" autocomplete="off" value="${esc(it.ans)}" ${showFb ? "disabled" : ""}></div><div class="field"><label for="xunit">Unit</label><select id="xunit" ${showFb ? "disabled" : ""}><option value="">Unit…</option>${p.unitOpts.map(u => `<option ${it.unit === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></div></div>`}
     ${tutor && !MMX.ff && !it.done ? `<details><summary class="small">Show the formula (counts as a hint)</summary><div class="formula-box">${esc((MM.FORMULAS[p.formula] || MM.FORMULAS.dh).eq)}</div></details>` : ""}
     ${showFb ? `<div class="fb ${it.ok ? "ok" : "bad"}"><h4>${it.ok ? "✓ Correct" : `✗ <span class="err-tag">${esc(ERRICON[it.r.code] || "")}</span> ${esc(MM.ERR[it.r.code] || "")}`}</h4>${it.ok ? "" : `<div class="small">${esc(it.r.msg || "")}</div>`}</div>${sixHTML(p, mmS().method, { noTabs: true })}` : ""}
     <div class="row between"><div class="row">${!tutor ? `<button class="btn sm ghost" data-xa="prev" ${i === 0 ? "disabled" : ""}>Previous</button>` : ""}${MMX.calc ? `<button class="btn sm ghost" data-xa="calc">Calculator</button>` : ""}</div>
      <div class="row">${tutor ? (it.done ? `<button class="btn primary" data-xa="next">${i === items.length - 1 ? "See results" : "Next"}</button>` : `<button class="btn primary" data-xa="check" ${answered(it) ? "" : "disabled"}>Check</button>`) : (i === items.length - 1 ? `<button class="btn primary" data-xa="submit">Submit exam</button>` : `<button class="btn primary" data-xa="next">Next</button>`)}</div></div>
     ${calcOpen ? calcHTML() : ""}</div>`;
    if (calcOpen) bindCalc(z);
    const a = $("#xans", z); if (a) { a.oninput = () => { it.ans = a.value; const c = $("[data-xa=check]", z); if (c) c.disabled = !answered(it); }; a.onkeydown = e => { if (e.key === "Enter") { const c = $("[data-xa=check]", z) || $("[data-xa=next]", z); c && !c.disabled && c.click(); } }; }
    const u = $("#xunit", z); if (u) u.onchange = () => { it.unit = u.value; const c = $("[data-xa=check]", z); if (c) c.disabled = !answered(it); };
    const ck = $("#xclock", z); const tick = () => { if (!ck.isConnected) return clearInterval(iv); const el = Math.round((Date.now() - t0) / 1000); if (endAt) { const s = Math.max(0, Math.round((endAt - Date.now()) / 1000)); ck.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`; if (s <= 0) { clearInterval(iv); stamp(); finish(true); } } else ck.textContent = `${Math.floor(el / 60)}:${String(el % 60).padStart(2, "0")}`; }; tick(); iv = setInterval(tick, 1000);
  };
  const finish = timeUp => {
    clearInterval(iv); items.forEach(it => { if (!it.done) grade(it); });
    const n = items.length, c = items.filter(x => x.ok).length, score = pct(c, n), secs = Math.round((Date.now() - t0) / 1000), avg = Math.round(items.reduce((a, x) => a + x.secs, 0) / n);
    const byCat = {}; items.forEach(x => { const k = x.p.cat; byCat[k] = byCat[k] || [0, 0]; byCat[k][1]++; if (x.ok) byCat[k][0]++; });
    const errs = {}; items.forEach(x => { if (!x.ok && x.r && x.r.code) errs[x.r.code] = (errs[x.r.code] || 0) + 1; });
    const m = mmS(); m.exams.push({ t: Date.now(), n, score, mode: tutor ? "tutor" : "exam", ff: MMX.ff, avg }); m.exams = m.exams.slice(-40); save();
    z.innerHTML = `<div class="card stack-lg"><div class="row between"><div class="head"><span class="label">${timeUp ? "Time's up — " : ""}MED math exam results</span><h2>${score}% <span class="small muted">(${c}/${n})</span></h2></div><span class="chip ${score >= m.target ? "badge-S" : "badge-flag"}">${score >= m.target ? `${ico("check", 12)} Met your ${m.target}% target` : `${ico("x", 12)} Below your ${m.target}% target`}</span></div>
      <div class="grid g3"><div class="stat"><span class="label">Total time</span><span class="v mono">${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</span></div><div class="stat"><span class="label">Avg per question</span><span class="v">${avg}s</span></div><div class="stat"><span class="label">Mistake types</span><span class="small">${Object.keys(errs).length ? Object.entries(errs).map(([k, v]) => `<span class="err-tag">${ERRICON[k]}</span> ×${v}`).join(" ") : "None"}</span></div></div>
      <div class="stack"><div class="label">By category</div>${Object.entries(byCat).map(([k, [a, b]]) => `<div class="sysrow"><span>${esc(MM.CAT[k].n)}</span><div class="bar ${pct(a, b) >= 80 ? "ok" : "bad"}"><i style="width:${pct(a, b)}%"></i></div><span class="mono">${a}/${b}</span></div>`).join("")}</div>
      <div class="stack"><div class="label">Review every question</div>${items.map((x, k) => `<details class="panel"><summary>${x.ok ? "✓" : "✗"} ${k + 1}. ${esc(x.p.text.slice(0, 100))}${x.p.text.length > 100 ? "…" : ""} <span class="xs muted">· ${Math.round(x.secs)}s</span></summary><div style="margin-top:8px" class="stack"><div class="small">Your answer: <b>${esc(x.p.kind === "choice" ? (x.choice != null ? x.p.choices[x.choice] : "—") : x.p.mc ? (x.choice != null ? x.p.mc.opts[x.choice] : "—") : (x.ans ? x.ans + " " + x.unit : "—"))}</b>${!x.ok && x.r ? ` · <span class="err-tag">${esc(ERRICON[x.r.code] || "")}</span> ${esc(x.r.msg || "")}` : ""}</div>${sixHTML(x.p, mmS().method, { noTabs: true })}</div></details>`).join("")}</div>
      <div class="row"><button class="btn primary" id="xagain">New exam</button><button class="btn" id="xhome">MED MATH home</button></div></div>`;
    $("#xagain", z).onclick = () => mmExam(z); $("#xhome", z).onclick = () => { MMV.tab = "home"; vMedMath($("#view")); };
  };
  const confirmSubmit = () => { const un = items.filter(x => !answered(x)).length; z.insertAdjacentHTML("beforeend", `<div class="inline-confirm" id="xsc"><b>${un ? un + " unanswered." : "All answered."}</b><div class="row"><button class="btn primary" id="xyes">Submit exam</button><button class="btn" id="xno">Keep working</button></div></div>`); $("#xyes", z).onclick = () => finish(false); $("#xno", z).onclick = () => $("#xsc", z).remove(); $("#xyes", z).focus(); };
  z.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return; if (b.dataset.key) return;
    const it = items[i];
    if (b.dataset.xc != null) { it.choice = +b.dataset.xc; return draw(); }
    const a = b.dataset.xa;
    if (a === "calc") { calcOpen = !calcOpen; return draw(); }
    if (a === "check") { stamp(); grade(it); return draw(); }
    if (a === "next") { stamp(); if (i === items.length - 1) return finish(false); i++; return draw(); }
    if (a === "prev") { stamp(); i = Math.max(0, i - 1); return draw(); }
    if (a === "submit") { stamp(); return confirmSubmit(); } };
  draw();
}

/* ================= CHEAT SHEET ================= */
const MMC = { hide: false, shown: {}, print: false };
function cheatCards() { return Object.entries(MM.FORMULAS); }
function mmCheat(z) {
  const cards = cheatCards();
  z.innerHTML = `<div class="card stack ${MMC.print ? "print-sheet" : ""}" id="cheat"><div class="row between"><div class="head"><span class="label">FORMULA CHEAT SHEET — QUICK GLANCE</span><p class="small muted">Every major formula on one page. Tap an example to expand it.</p></div>
    <div class="row no-print"><button class="btn sm" id="crev">Reveal all</button><button class="btn sm" id="chide">${MMC.hide ? "Recall test: on" : "Test recall (hide formulas)"}</button><button class="btn sm" id="cprint" aria-pressed="${MMC.print}">${MMC.print ? "Exit printer-friendly view" : "Printer-friendly view"}</button><button class="btn sm" id="cdl">Download printable copy</button></div></div>
    <div class="cheat-grid">${cards.map(([k, f]) => { const hidden = MMC.hide && !MMC.shown[k]; return `<div class="cheat-card"><div class="label">${esc(f.n)}</div>${hidden ? `<button class="btn sm" data-reveal="${k}">Recall it, then reveal</button>` : `<div class="cheat-eq">${esc(f.eq)}</div>`}<details><summary class="small">Example</summary><div class="mono small" style="margin-top:6px">${esc(f.ex)}</div></details></div>`; }).join("")}</div>
    <div class="mm-caution no-print">${ico("flag", 14)} Rounding: ${esc(MM.ROUND_RULES.ml)} ${esc(MM.ROUND_RULES.gtt)} Write 0.5 (leading zero), never .5; write 5, never 5.0.</div><div id="cmsg" class="small" aria-live="polite"></div></div>`;
  $("#crev", z).onclick = () => { MMC.hide = false; MMC.shown = {}; mmCheat(z); };
  $("#chide", z).onclick = () => { MMC.hide = !MMC.hide; MMC.shown = {}; mmCheat(z); };
  $("#cprint", z).onclick = () => { MMC.print = !MMC.print; document.body.classList.toggle("printing", MMC.print); mmCheat(z); };
  z.onclick = e => { const b = e.target.closest("[data-reveal]"); if (b) { MMC.shown[b.dataset.reveal] = true; mmCheat(z); } };
  $("#cdl", z).onclick = async () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Med Math Formula Cheat Sheet</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:20px}.g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c{border:1px solid #999;border-radius:8px;padding:10px;break-inside:avoid}.n{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#444;font-weight:700}.e{font-family:Consolas,monospace;font-size:17px;font-weight:700;margin:6px 0}.x{font-family:Consolas,monospace;font-size:12px;color:#333}</style></head><body><h1>MED MATH — Formula Cheat Sheet</h1><div class="g">${cards.map(([, f]) => `<div class="c"><div class="n">${esc(f.n)}</div><div class="e">${esc(f.eq)}</div><div class="x">e.g. ${esc(f.ex)}</div></div>`).join("")}</div><p style="font-size:11px">${esc(MM.ROUND_RULES.ml)} ${esc(MM.ROUND_RULES.gtt)} Leading zero (0.5), no trailing zero (5). For education only.</p></body></html>`;
    try { const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null; if (dl) { await dl.save({ filename: "med-math-cheat-sheet.html", data: html }); $("#cmsg", z).textContent = "Saved — open the file and print it from your browser."; return; } } catch (e) { if (e && e.code === "declined") { $("#cmsg", z).textContent = "Download canceled."; return; } }
    $("#cmsg", z).textContent = "Downloads aren't available here. Use the printer-friendly view and your device's screenshot or share option.";
  };
}
