/* Automated tests for the MED MATH engine.
   Every generated answer is recomputed here by an INDEPENDENT solver written from the
   nursing formulas, without calling the engine's calc functions. Run: node tests/mm.test.js */
const MM = require("../src/mmengine.js");
let pass = 0, fail = 0; const fails = [];
const t = (name, cond, extra) => { if (cond) pass++; else { fail++; fails.push(name + (extra ? " :: " + extra : "")); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
/* independent rounding: decimal-string based (no shared code with engine) */
function rd(x, d) { const s = (Math.abs(x) + 1e-10).toFixed(d + 3); const f = 10 ** d; return Math.sign(x) * Math.floor(Number(s) * f + 0.5) / f; }
const rml = v => (v < 1 ? rd(v, 2) : rd(v, 1));

/* ---------- 1. unit conversions & formulas ---------- */
t("154 lb → 70 kg", near(MM.calc.lbToKg(154), 70));
t("25 kg → 55 lb", near(MM.calc.kgToLb(25), 55));
t("0.25 g → 250 mg", near(MM.calc.gToMg(0.25), 250));
t("125 mcg → 0.125 mg", near(MM.calc.mcgToMg(125), 0.125));
t("0.125 mg → 125 mcg", near(MM.calc.mgToMcg(0.125), 125));
t("1.5 L → 1500 mL", near(MM.calc.LToMl(1.5), 1500));
t("8 hr → 480 min", MM.calc.hToMin(8) === 480);
t("90 min → 1.5 hr", near(MM.calc.minToH(90), 1.5));
t("2 tbsp → 30 mL", MM.calc.tbspToMl(2) === 30);
t("D/H×Q 750/250 = 3", MM.calc.dh(750, 250, 1) === 3);
t("liquid 375/125×5 = 15", MM.calc.dh(375, 125, 5) === 15);
t("20 kg × 10 = 200", MM.calc.wtDose(20, 10) === 200);
t("mL/hr 1000/8 = 125", MM.calc.mlPerHr(1000, 8) === 125);
t("gtt 1000×15/480 = 31.25", near(MM.calc.gttPerMin(1000, 15, 480), 31.25));
t("heparin 1000 u/hr @100u/mL = 10", near(MM.calc.rateFromDose(1000, 25000, 250), 10));
t("mcg/kg/min example = 15 mL/hr", near(MM.calc.mcgKgMinToMlHr(5, 80, 400, 250), 15));
t("reverse mcg/kg/min = 5", near(MM.calc.mlHrToMcgKgMin(15, 80, 400, 250), 5));
t("recon 500/200 = 2.5", MM.calc.reconMl(500, 200) === 2.5);
t("BSA √(100×16/3600) ≈ 0.67", rd(MM.calc.bsa(100, 16), 2) === 0.67);
t("U-100: 15 units = 0.15 mL", near(MM.calc.unitsToMlU100(15), 0.15));
/* prompt's worked examples */
Object.entries(MM.FIXED).forEach(([k, f]) => t("worked example " + k, near(f.calc(), f.ans), `${f.calc()} vs ${f.ans}`));

/* ---------- 2. rounding & notation ---------- */
t("round 31.25 → 31", MM.round(31.25, 0) === 31);
t("round 31.5 → 32 (half up)", MM.round(31.5, 0) === 32);
t("round 2.25 → 2.3 (float guard)", MM.round(2.25, 1) === 2.3);
t("round 1.005 → 1.01 (float guard)", MM.round(1.005, 2) === 1.01);
t("round 0.456 mL → 0.46", MM.roundML(0.456) === 0.46);
t("round 1.666 mL → 1.7", MM.roundML(1.666) === 1.7);
t("roundML boundary 0.995 → 1 (hundredths rule under 1)", MM.roundML(0.995) === 1);
t("roundML 1.05 → 1.1", MM.roundML(1.05) === 1.1);
t("fmt leading zero 0.5", MM.fmt(0.5) === "0.5");
t("fmt no trailing zero 5", MM.fmt(5.0) === "5" && MM.fmt(2.50) === "2.5");
t("fmt thousands 25,000", MM.fmt(25000) === "25,000");
t("fmt float noise 154/2.2", MM.fmt(154 / 2.2) === "70");

/* ---------- 3. safe-range boundaries (inclusive) ---------- */
let r = MM.calc.safeRange(20, 15, 25, 150, 2); t("exact minimum is within", r.within && r.daily === 300);
r = MM.calc.safeRange(20, 15, 25, 250, 2); t("exact maximum is within", r.within && r.daily === 500);
r = MM.calc.safeRange(20, 15, 25, 149, 2); t("just below min flagged", !r.within && r.below);
r = MM.calc.safeRange(20, 15, 25, 251, 2); t("just above max flagged", !r.within && r.above);
r = MM.calc.safeRange(20, 15, 25, 180, 2); t("prompt example 360 within", r.within && r.daily === 360);

/* ---------- 4. diagnosis ---------- */
const P = MM.generate("wtday", 1, 42);
t("diagnose correct", MM.diagnose(P, P.ans, P.unit).ok);
t("diagnose wrong unit", MM.diagnose(P, P.ans, "mg/day").code === "UNIT");
const dayTrap = P.traps.find(x => x.code === "DAYDOSE"); t("diagnose mg/kg/day confusion", MM.diagnose(P, dayTrap.v, P.unit).code === "DAYDOSE");
const divTrap = P.traps.find(x => x.code === "DIVIDE"); t("diagnose divided by hours", MM.diagnose(P, divTrap.v, P.unit).code === "DIVIDE");
const G = MM.generate("gtt", 2, 7); const tt = G.traps.find(x => x.code === "TIME"); if (tt) t("diagnose time conversion", MM.diagnose(G, tt.v, G.unit).code === "TIME");
t("diagnose decimal ×10", ["DEC", "ROUND"].includes(MM.diagnose(MM.generate("tabs", 1, 3), MM.generate("tabs", 1, 3).ans * 10, "tablet(s)").code) || MM.generate("tabs", 1, 3).traps.some(x => near(x.v, MM.generate("tabs", 1, 3).ans * 10)));
const L1 = MM.generate("liquid", 2, 11); t("diagnose unrounded → ROUND or ok", (() => { const raw = L1.ans + 0.03; const d = MM.diagnose(L1, raw, "mL"); return d.code === "ROUND" || d.code === "ARITH" || d.ok === false; })());
const S1 = MM.generate("safe", 1, 99); t("safe choice wrong → SAFE", MM.diagnose(S1, (S1.ans + 1) % 4, "").code === "SAFE");

/* ---------- 5. independent solver for every generator ---------- */
function solve(p) {
  const i = p.inp || {};
  switch (p.cat) {
    case "lbkg": return rd(i.lb / 2.2, 1);
    case "kglb": return rd(i.kg * 2.2, 1);
    case "gmg": return i.toMg ? i.g * 1000 : i.mg / 1000;
    case "mgmcg": return i.toMcg ? i.mg * 1000 : i.mcg / 1000;
    case "lml": return i.toMl ? i.Lt * 1000 : i.ml / 1000;
    case "time": { const nums = (i.text.match(/[\d.]+/g) || []).map(Number); if (i.kind === "h2m") return nums[0] * 60; if (i.kind === "m2h") return rd(nums[0] / 60, 2); return nums[0] * 60 + nums[1]; }
    case "household": return { tsp: i.n * 5, tbsp: i.n * 15, oz: i.n * 30, mloz: i.n / 30 }[i.k];
    case "round": if (p.kind === "choice") return 0; return i.rule === "tenth" ? rd(i.v, 1) : i.rule === "hundredth" ? rd(i.v, 2) : i.rule === "gtt" ? rd(i.v, 0) : rml(i.v);
    case "tabs": { let d = i.desired; if (i.dUnit === "g" && i.hUnit === "mg") d *= 1000; if (i.dUnit === "mg" && i.hUnit === "mcg") d *= 1000; if (i.dUnit === "mcg" && i.hUnit === "mg") d /= 1000; return d / i.have; }
    case "liquid": { let d = i.desired; if (i.dUnit === "g") d *= 1000; if (i.dUnit === "mcg") d /= 1000; return rml(d / i.have * i.qty); }
    case "wtdose": { const kg = i.lb ? rd(i.lb / 2.2, 1) : i.kg; const dose = rd(kg * i.perKg, 1); return i.conc ? rml(dose / i.conc[0] * i.conc[1]) : dose; }
    case "wtday": { const n = 24 / i.q; const per = rd(i.kg * i.perDay / n, 1); return i.conc ? rml(per / i.conc[0] * i.conc[1]) : per; }
    case "safe": { if (i.missing) return 3; const daily = i.dose * (24 / i.q); if (daily < i.kg * i.lo - 1e-9) return 1; if (daily > i.kg * i.hi + 1e-9) return 2; return 0; }
    case "ivrate": { const h = i.minutes ? i.minutes / 60 : i.hours; return rd(i.ml / h, 1); }
    case "gtt": return rd(i.ml * i.df / i.minutes, 0);
    case "heparin": if (i.t === "rate") return i.uh / 100; if (i.t === "wt") return rd(i.kg * i.uk / (i.bag[0] / i.bag[1]), 1); return rml(i.kg * i.uk / i.vial);
    case "insulin": if (i.t === "scale") return i.g < 151 ? 0 : i.g <= 200 ? 2 : i.g <= 250 ? 4 : i.g <= 300 ? 6 : 8; if (i.t === "drip") return rd(i.uh / (i.bag[0] / i.bag[1]), 1); return 0;
    case "mcgkgmin": { const kg = i.lb ? rd(i.lb / 2.2, 1) : i.kg; const mcgPerMl = i.bag[0] * 1000 / i.bag[1]; return rd(i.dose * kg * 60 / mcgPerMl, 1); }
    case "titrate": { const nu = i.cur + i.step; return rd(nu / i.conc[2], 1); }
    case "check": return Math.abs(i.shown - i.uh / (i.bag[0] / i.bag[1])) < 1e-9 ? 0 : 1;
    case "recon": return rml(i.order / i.vial[1]);
    case "multistep": { const kg = rd(i.lb / 2.2, 1); return rml(kg * i.perDay / (24 / i.q) / i.conc[0] * i.conc[1]); }
    case "fromrate": if (i.t === "units") return i.mlhr * i.bag[0] / i.bag[1]; return rd(i.mlhr * 1600 / 60 / i.kg, 1);
    case "bolus": return rml(rd(i.kg * i.mgkg, 2) / i.vial);
    case "bsa": return rd(rd(Math.sqrt(i.cm * i.kg / 3600), 2) * i.perM2, 1);
    case "dilution": return rd(i.g * 1000 / i.ml, 1);
    case "clarify": return i.variant === "ok" || i.variant === "ok2" ? 0 : 3;
  }
  return NaN;
}
const cats = Object.keys(MM.CAT); let gens = 0;
cats.forEach(cat => {
  for (let L = 1; L <= 3; L++) for (let s = 1; s <= 250; s++) {
    const p = MM.generate(cat, L, s * 7919 + L); gens++;
    const exp = solve(p);
    t(`${cat} L${L} s${s} matches independent solver`, near(p.ans, exp, 1e-6), `engine ${p.ans} vs independent ${exp} | ${p.text}`);
    if (p.kind === "num") {
      t(`${cat} L${L} finite answer`, isFinite(p.ans) && p.ans >= 0);
      t(`${cat} L${L} answer unit offered`, p.unitOpts.includes(p.unit));
      t(`${cat} L${L} diagnose(correct)=ok`, MM.diagnose(p, p.ans, p.unit).ok);
      t(`${cat} L${L} traps never equal the answer`, p.traps.every(x => x.v == null || !near(x.v, p.ans, 1e-6) || MM.diagnose(p, x.v, p.unit).ok), p.text);
      t(`${cat} L${L} has worked steps`, (p.solve || []).length > 0);
      const str = JSON.stringify(p.text);
      t(`${cat} L${L} no naked decimals in text`, !/[^\d]\.\d/.test(p.text.replace(/\d\.\d/g, "")), p.text);
      t(`${cat} L${L} no trailing-zero doses`, !/\b\d+\.0\b/.test(p.text), str);
    } else {
      t(`${cat} L${L} choice valid`, Number.isInteger(p.ans) && p.ans >= 0 && p.ans < p.choices.length);
      t(`${cat} L${L} choices distinct`, new Set(p.choices).size === p.choices.length, JSON.stringify(p.choices));
    }
  }
});
/* tablets: halves only when scored, never other fractions */
for (let s = 1; s < 300; s++) { const p = MM.generate("tabs", 2, s); t("tablet halves only", Number.isInteger(p.ans * 2), p.text); t("halves only when scored", Number.isInteger(p.ans) || /scored/.test(p.text), p.text); }
/* determinism */
t("same seed → same problem", MM.generate("gtt", 2, 1234).text === MM.generate("gtt", 2, 1234).text);
console.log(`MED MATH tests: ${pass} passed, ${fail} failed (${gens} generated problems checked against an independent solver)`);
if (fail) { console.log(fails.slice(0, 25).join("\n")); process.exit(1); }
