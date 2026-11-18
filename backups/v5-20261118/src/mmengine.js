/* ================= MED MATH engine — pure functions, no DOM =================
   Every problem's answer is computed from its own inputs by the calc functions below,
   and every generator is re-checked by an independent solver in tests/mm.test.js. */
const MM = (() => {
  const EPS = 1e-6;
  /* round half up, guarding binary float artifacts (e.g. 2.25 → 2.3) */
  const round = (v, d = 0) => { const f = 10 ** d; return Math.round(Number((v * f).toPrecision(12))) / f; };
  const roundML = v => (Math.abs(v) < 1 ? round(v, 2) : round(v, 1));
  const ROUND_RULES = {
    ml: "Round mL to the tenth (or to the hundredth when the volume is less than 1 mL).",
    tenth: "Round to the nearest tenth.", hundredth: "Round to the nearest hundredth.", whole: "Round to the nearest whole number.",
    gtt: "Round drops per minute to the nearest whole drop — you can't count part of a drop.",
    kg: "Round kilograms to the nearest tenth before using the weight in a dose calculation.",
    tab: "Tablets: give whole tablets, or halves only when the tablet is scored.", none: "No rounding needed."
  };
  /* display: leading zero, no trailing zeros, thousands separators */
  const fmt = n => (typeof n !== "number" || !isFinite(n)) ? "—" : round(n, 4).toLocaleString("en-US", { maximumFractionDigits: 4 });

  /* ---------- calculation functions ---------- */
  const calc = {
    lbToKg: lb => lb / 2.2, kgToLb: kg => kg * 2.2,
    gToMg: g => g * 1000, mgToG: mg => mg / 1000, mgToMcg: mg => mg * 1000, mcgToMg: mcg => mcg / 1000,
    LToMl: L => L * 1000, mlToL: ml => ml / 1000, hToMin: h => h * 60, minToH: m => m / 60,
    tspToMl: t => t * 5, tbspToMl: t => t * 15, ozToMl: o => o * 30, mlToOz: ml => ml / 30,
    dh: (desired, have, qty) => desired / have * qty,
    wtDose: (kg, perKg) => kg * perKg,
    daily: (kg, perKgDay) => kg * perKgDay,
    perDose: (kg, perKgDay, nDoses) => kg * perKgDay / nDoses,
    dosesPerDay: hoursInterval => 24 / hoursInterval,
    safeRange: (kg, lo, hi, doseMg, nDoses) => { const min = kg * lo, max = kg * hi, daily = doseMg * nDoses; return { min, max, daily, within: daily >= min - EPS && daily <= max + EPS, below: daily < min - EPS, above: daily > max + EPS }; },
    mlPerHr: (ml, hours) => ml / hours,
    gttPerMin: (ml, df, minutes) => ml * df / minutes,
    conc: (amount, ml) => amount / ml,
    rateFromDose: (dosePerHr, amount, ml) => dosePerHr / (amount / ml),
    doseFromRate: (mlPerHr, amount, ml) => mlPerHr * (amount / ml),
    mcgKgMinToMlHr: (mcgKgMin, kg, drugMg, ml) => mcgKgMin * kg * 60 / (drugMg * 1000 / ml),
    mlHrToMcgKgMin: (mlHr, kg, drugMg, ml) => mlHr * (drugMg * 1000 / ml) / 60 / kg,
    reconMl: (orderMg, finalConc) => orderMg / finalConc,
    bsa: (cm, kg) => Math.sqrt(cm * kg / 3600),
    unitsToMlU100: units => units / 100
  };

  /* ---------- seeded rng ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: arr => arr[Math.floor(next() * arr.length)], chance: p => next() < p };
  }

  /* ---------- error vocabulary ---------- */
  const ERR = {
    UNIT: "Missing or incorrect units", CONV: "Wrong conversion", FORM: "Incorrect formula or setup", DAYDOSE: "Confused mg/kg/day with mg/kg/dose",
    DIVIDE: "Forgot or miscounted the divided doses", ARITH: "Arithmetic slip", TIME: "Incorrect time conversion", DEC: "Wrong decimal placement",
    ROUND: "Incorrect rounding", SAFE: "Missed an unsafe or incomplete order", CONC: "Used the wrong concentration or volume", DF: "Drop factor misused"
  };

  /* ---------- formulas (cheat sheet + lessons) ---------- */
  const FORMULAS = {
    dh: { n: "Desired ÷ Have × Quantity", eq: "Amount = (D ÷ H) × Q", ex: "750 mg ÷ 250 mg × 1 tab = 3 tablets" },
    lbkg: { n: "Pounds → kilograms", eq: "kg = lb ÷ 2.2", ex: "154 lb ÷ 2.2 = 70 kg" },
    kglb: { n: "Kilograms → pounds", eq: "lb = kg × 2.2", ex: "25 kg × 2.2 = 55 lb" },
    metric: { n: "Metric ladder (g ↔ mg ↔ mcg, L ↔ mL)", eq: "Each step = × 1,000 going down, ÷ 1,000 going up", ex: "0.25 g × 1,000 = 250 mg; 125 mcg ÷ 1,000 = 0.125 mg" },
    time: { n: "Hours ↔ minutes", eq: "min = hr × 60   ·   hr = min ÷ 60", ex: "8 hr × 60 = 480 min" },
    household: { n: "Household → metric", eq: "1 tsp = 5 mL · 1 tbsp = 15 mL · 1 oz = 30 mL", ex: "2 tbsp × 15 mL = 30 mL" },
    round: { n: "Rounding & notation", eq: "Leading zero: 0.5 mg ✓ · No trailing zero: 5 mg ✓ (never 5.0 mg)", ex: "1.666 mL → 1.7 mL; 0.456 mL → 0.46 mL" },
    wtdose: { n: "mg/kg/dose", eq: "Dose (mg) = kg × mg/kg/dose", ex: "20 kg × 10 mg/kg/dose = 200 mg per dose" },
    wtday: { n: "mg/kg/day → per dose", eq: "Per dose = (kg × mg/kg/day) ÷ doses per day", ex: "20 kg × 30 mg/kg/day = 600 mg/day ÷ 3 = 200 mg per dose" },
    safe: { n: "Safe-dose range check", eq: "Min = kg × low · Max = kg × high · Compare ordered mg/day", ex: "20 kg: 300–500 mg/day; 180 mg q12h = 360 mg/day → within range" },
    mlhr: { n: "IV pump rate", eq: "mL/hr = total mL ÷ hours", ex: "1,000 mL ÷ 8 hr = 125 mL/hr" },
    gtt: { n: "Gravity drip rate", eq: "gtt/min = (mL × drop factor) ÷ minutes", ex: "(1,000 × 15) ÷ 480 = 31.25 → 31 gtt/min" },
    unitshr: { n: "Units/hr → mL/hr", eq: "mL/hr = ordered units/hr ÷ concentration (units/mL)", ex: "1,000 units/hr ÷ 100 units/mL = 10 mL/hr" },
    mcgkgmin: { n: "mcg/kg/min → mL/hr", eq: "mL/hr = (mcg/kg/min × kg × 60) ÷ concentration (mcg/mL)", ex: "(5 × 80 × 60) ÷ 1,600 mcg/mL = 15 mL/hr" },
    fromrate: { n: "Dose delivered by a running infusion", eq: "Dose/hr = mL/hr × concentration", ex: "22 mL/hr × 50 units/mL = 1,100 units/hr" },
    recon: { n: "Reconstitution", eq: "mL = ordered dose ÷ FINAL concentration on the label", ex: "500 mg ÷ 200 mg/mL = 2.5 mL" },
    insulin: { n: "Insulin units (U-100)", eq: "Draw up in UNITS on a U-100 insulin syringe · 100 units = 1 mL", ex: "15 units = 0.15 mL — but you measure 15 units, never mL" },
    bsa: { n: "Body surface area (Mosteller)", eq: "BSA (m²) = √(cm × kg ÷ 3,600)", ex: "√(100 × 16 ÷ 3,600) = 0.67 m²" },
    dilution: { n: "Concentration after mixing", eq: "Concentration = amount of drug ÷ total volume", ex: "2 g (2,000 mg) in 100 mL = 20 mg/mL" }
  };

  /* ---------- lessons (10 levels) ---------- */
  const LESSONS = [
    { n: 1, t: "Basic conversions", cats: ["lbkg", "kglb", "gmg", "mgmcg", "lml", "time", "household", "round"], why: "Every later formula assumes the units already match. Converting weight to kilograms first is what makes weight-based doses correct — using pounds would more than double the dose." },
    { n: 2, t: "Tablets and capsules", cats: ["tabs"], why: "Desired ÷ Have × Quantity is the backbone of almost every dosage problem. Split tablets only when they're scored and the order allows it." },
    { n: 3, t: "Oral liquids", cats: ["liquid"], why: "Liquids come as a concentration (mg per mL or mg per 5 mL). The quantity is the volume that holds the 'have' amount." },
    { n: 4, t: "Weight-based doses", cats: ["wtdose", "wtday"], why: "mg/kg/DOSE gives one dose. mg/kg/DAY gives the whole day's total — you must divide it by the number of doses. Mixing them up is a classic, dangerous error." },
    { n: 5, t: "Pediatric safe-dose range", cats: ["safe"], why: "You compare the ordered daily amount with the stated range. A passing range check is arithmetic only — real safety also depends on the drug, child, route and verified prescribing information." },
    { n: 6, t: "IV infusion pumps", cats: ["ivrate"], why: "Pumps are programmed in mL/hr. Convert minutes to hours when the time isn't already in hours." },
    { n: 7, t: "Gravity IV drip rates", cats: ["gtt"], why: "Without a pump, you count drops. The drop factor (gtt/mL) is printed on the tubing package; time must be in minutes." },
    { n: 8, t: "High-alert medications", cats: ["heparin", "insulin", "mcgkgmin", "titrate", "check"], why: "Heparin and insulin are high-alert drugs. Your Cardiovascular file requires two nurses to confirm heparin calculations and strength. Insulin is always measured in units with an insulin syringe." },
    { n: 9, t: "Reconstitution", cats: ["recon"], why: "After you add diluent, use the FINAL concentration on the label. The final volume can be larger than the diluent you added because the powder takes up space." },
    { n: 10, t: "Advanced medication math", cats: ["multistep", "fromrate", "bolus", "bsa", "dilution", "clarify"], why: "Multi-step and critical-care style problems. Marked Advanced — useful for HESI/NCLEX stretch practice beyond the LVN foundation.", adv: true }
  ];

  const CAT = {}; // filled below: {n, lesson, formula, gen}
  const units = (correct, others) => { const u = [correct, ...others.filter(x => x !== correct)]; return u.slice(0, 4).sort(); };
  function mk(o) {
    return Object.assign({ kind: "num", traps: [], given: [], unitOpts: [o.unit], methods: {}, check: [], adv: false, src: "Fictional practice values", round: "none" }, o);
  }
  const c = s => `~${s}~`; // cancelled unit marker → rendered as struck-through

  /* Desired/Have × Quantity family */
  function dhSetup({ desired, dUnit, conv = 1, convTxt = "", have, hUnit, qty, qUnit, ansUnit, rnd = "ml" }) {
    const raw = calc.dh(desired * conv, have, qty);
    const ans = rnd === "ml" ? roundML(raw) : rnd === "tab" ? raw : rnd === "tenth" ? round(raw, 1) : raw;
    const d2 = desired * conv;
    const methods = {
      da: [`${fmt(desired)} ${dUnit}${conv !== 1 ? ` × (${convTxt})` : ""} × (${fmt(qty)} ${qUnit} ÷ ${fmt(have)} ${c(hUnit)})`, `= ${fmt(raw)} ${ansUnit}${raw !== ans ? ` → ${fmt(ans)} ${ansUnit}` : ""}`],
      dh: [`${conv !== 1 ? `Convert first: ${fmt(desired)} ${dUnit} = ${fmt(d2)} ${hUnit}. ` : ""}D = ${fmt(d2)} ${hUnit}, H = ${fmt(have)} ${hUnit}, Q = ${fmt(qty)} ${qUnit}`, `(${fmt(d2)} ÷ ${fmt(have)}) × ${fmt(qty)} = ${fmt(raw)} ${ansUnit}${raw !== ans ? ` → ${fmt(ans)}` : ""}`],
      rp: [`${fmt(have)} ${hUnit} : ${fmt(qty)} ${qUnit} = ${fmt(d2)} ${hUnit} : x ${qUnit}`, `${fmt(have)}x = ${fmt(d2)} × ${fmt(qty)} → x = ${fmt(raw)}${raw !== ans ? ` → ${fmt(ans)}` : ""} ${ansUnit}`]
    };
    const traps = [
      { v: calc.dh(have, d2, qty), code: "FORM", msg: "You divided Have by Desired. The ordered (desired) dose goes on top." },
      { v: calc.dh(d2, have, 1), code: "FORM", msg: `You left out the quantity (${fmt(qty)} ${qUnit}). Multiply by the volume or count that holds the 'have' amount.` }
    ];
    if (conv !== 1) { traps.push({ v: calc.dh(desired, have, qty), code: "CONV", msg: `You didn't convert ${dUnit} to ${hUnit} first (${convTxt}). Units must match before you divide.` }); traps.push({ v: calc.dh(desired / conv, have, qty), code: "CONV", msg: "You converted in the wrong direction." }); }
    return { raw, ans, methods, traps };
  }

  /* ================= GENERATORS ================= */
  function G(id, n, lesson, formula, gen) { CAT[id] = { id, n, lesson, formula, gen }; }

  G("lbkg", "Pounds → kilograms", 1, "lbkg", (L, R) => {
    let lb, txtW, oz = 0;
    if (L === 1) { const kg = R.int(9, 45) * 2; lb = round(kg * 2.2, 1); txtW = `${fmt(lb)} lb`; }
    else if (L === 2) { lb = R.int(15, 260); txtW = `${lb} lb`; }
    else { const whole = R.int(5, 11); oz = R.pick([4, 8, 12]); lb = whole + oz / 16; txtW = `${whole} lb ${oz} oz`; }
    const raw = calc.lbToKg(lb), ans = round(raw, 1);
    return mk({ inp: { lb }, text: `A patient weighs ${txtW}. What is the weight in kilograms?${L > 1 ? " Round to the nearest tenth." : ""}`, unit: "kg", unitOpts: units("kg", ["lb", "g", "mg"]), ans, round: "kg", formula: "lbkg",
      given: [["Weight", txtW], ...(oz ? [["16 oz", "= 1 lb"]] : []), ["Conversion", "1 kg = 2.2 lb"]],
      sub: oz ? `${txtW} = ${fmt(lb)} lb → ${fmt(lb)} ÷ 2.2` : `${fmt(lb)} ÷ 2.2`,
      solve: [...(oz ? [`${oz} oz ÷ 16 = ${fmt(oz / 16)} lb, so ${txtW} = ${fmt(lb)} lb`] : []), `${fmt(lb)} ${c("lb")} × (1 kg ÷ 2.2 ${c("lb")}) = ${fmt(raw)} kg`, ...(raw !== ans ? [`Round to the tenth: ${fmt(ans)} kg`] : [])],
      check: ["A kg value is always smaller than the lb value (about half).", "Unit: kg."],
      methods: { da: [`${fmt(lb)} ${c("lb")} × 1 kg/2.2 ${c("lb")} = ${fmt(raw)} kg`], dh: [`Divide by 2.2: ${fmt(lb)} ÷ 2.2 = ${fmt(raw)}`], rp: [`1 kg : 2.2 lb = x kg : ${fmt(lb)} lb`, `2.2x = ${fmt(lb)} → x = ${fmt(raw)} kg`] },
      traps: [{ v: lb * 2.2, code: "CONV", msg: "You multiplied by 2.2. Going from lb to kg the number gets SMALLER, so divide." }, { v: lb, code: "CONV", msg: "You left the weight in pounds." }, ...(oz ? [{ v: (Math.floor(lb) + oz / 10) / 2.2, code: "CONV", msg: `Ounces aren't decimals of a pound: ${oz} oz = ${fmt(oz / 16)} lb (16 oz per lb).` }] : [])] });
  });
  G("kglb", "Kilograms → pounds", 1, "kglb", (L, R) => {
    const kg = L === 1 ? R.int(5, 40) * 5 : round(R.int(30, 900) / 10, 1);
    const raw = calc.kgToLb(kg), ans = round(raw, 1);
    return mk({ inp: { kg }, text: `A child weighs ${fmt(kg)} kg. Express the weight in pounds.${L > 1 ? " Round to the nearest tenth." : ""}`, unit: "lb", unitOpts: units("lb", ["kg", "oz", "g"]), ans, round: L > 1 ? "tenth" : "none", formula: "kglb",
      given: [["Weight", `${fmt(kg)} kg`], ["Conversion", "1 kg = 2.2 lb"]], sub: `${fmt(kg)} × 2.2`, solve: [`${fmt(kg)} ${c("kg")} × 2.2 lb/${c("kg")} = ${fmt(raw)} lb`],
      check: ["Pounds are always the bigger number."], methods: { da: [`${fmt(kg)} ${c("kg")} × 2.2 lb/1 ${c("kg")} = ${fmt(raw)} lb`] },
      traps: [{ v: kg / 2.2, code: "CONV", msg: "You divided. kg → lb makes the number bigger: multiply by 2.2." }] });
  });
  G("gmg", "Grams ↔ milligrams", 1, "metric", (L, R) => {
    const toMg = L === 1 ? true : L === 2 ? false : R.chance(.5);
    const g = toMg ? R.pick([0.5, 1, 1.5, 2, 0.25, 0.125, 0.75, 0.05]) : 0, mg = toMg ? 0 : R.pick([250, 500, 750, 125, 50, 1500, 2000, 62.5]);
    const ans = toMg ? calc.gToMg(g) : calc.mgToG(mg);
    return mk({ inp: { toMg, g, mg }, text: toMg ? `The order is ${fmt(g)} g. How many milligrams is this?` : `Convert ${fmt(mg)} mg to grams.`, unit: toMg ? "mg" : "g", unitOpts: units(toMg ? "mg" : "g", ["mg", "g", "mcg", "kg"]), ans, formula: "metric",
      given: [["Amount", toMg ? `${fmt(g)} g` : `${fmt(mg)} mg`], ["Conversion", "1 g = 1,000 mg"]], sub: toMg ? `${fmt(g)} × 1,000` : `${fmt(mg)} ÷ 1,000`,
      solve: [toMg ? `${fmt(g)} ${c("g")} × 1,000 mg/${c("g")} = ${fmt(ans)} mg (move the decimal 3 places right)` : `${fmt(mg)} ${c("mg")} × 1 g/1,000 ${c("mg")} = ${fmt(ans)} g (move the decimal 3 places left)`],
      check: ["Bigger unit → smaller number.", "Use a leading zero for values under 1 (0.25, never .25)."],
      methods: { da: [toMg ? `${fmt(g)} ${c("g")} × 1,000 mg/1 ${c("g")} = ${fmt(ans)} mg` : `${fmt(mg)} ${c("mg")} × 1 g/1,000 ${c("mg")} = ${fmt(ans)} g`] },
      traps: [{ v: toMg ? g / 1000 : mg * 1000, code: "CONV", msg: "You converted in the wrong direction." }, { v: toMg ? g * 100 : mg / 100, code: "DEC", msg: "The metric step is 1,000 (three decimal places), not 100." }] });
  });
  G("mgmcg", "Milligrams ↔ micrograms", 1, "metric", (L, R) => {
    const toMcg = L === 1 ? true : L === 2 ? false : R.chance(.5);
    const mg = R.pick([0.125, 0.25, 0.5, 0.075, 0.05, 0.1, 0.0625, 0.4]), mcg = R.pick([125, 250, 62.5, 75, 50, 200, 400, 25]);
    const ans = toMcg ? calc.mgToMcg(mg) : calc.mcgToMg(mcg);
    return mk({ inp: { toMcg, mg, mcg }, text: toMcg ? `Order: digoxin ${fmt(mg)} mg. Express this in micrograms.` : `Order: levothyroxine ${fmt(mcg)} mcg. Express this in milligrams.`, unit: toMcg ? "mcg" : "mg", unitOpts: units(toMcg ? "mcg" : "mg", ["mg", "mcg", "g", "units"]), ans, formula: "metric",
      given: [["Amount", toMcg ? `${fmt(mg)} mg` : `${fmt(mcg)} mcg`], ["Conversion", "1 mg = 1,000 mcg"]], sub: toMcg ? `${fmt(mg)} × 1,000` : `${fmt(mcg)} ÷ 1,000`,
      solve: [toMcg ? `${fmt(mg)} ${c("mg")} × 1,000 mcg/${c("mg")} = ${fmt(ans)} mcg` : `${fmt(mcg)} ${c("mcg")} × 1 mg/1,000 ${c("mcg")} = ${fmt(ans)} mg`],
      check: ["mcg numbers are 1,000 times bigger than mg numbers.", "Write 'mcg', never 'µg' (easily misread)."], methods: { da: [toMcg ? `${fmt(mg)} ${c("mg")} × 1,000 mcg/1 ${c("mg")} = ${fmt(ans)} mcg` : `${fmt(mcg)} ${c("mcg")} × 1 mg/1,000 ${c("mcg")} = ${fmt(ans)} mg`] },
      traps: [{ v: toMcg ? mg / 1000 : mcg * 1000, code: "CONV", msg: "Wrong direction: mg → mcg multiplies by 1,000; mcg → mg divides." }, { v: toMcg ? mg * 100 : mcg / 100, code: "DEC", msg: "Off by one decimal place — the step is 1,000." }], src: "Drug names from your course files; amounts are practice values" });
  });
  G("lml", "Liters ↔ milliliters", 1, "metric", (L, R) => {
    const toMl = L !== 2; const Lt = R.pick([0.5, 1, 1.5, 0.25, 2, 0.75]), ml = R.pick([250, 500, 750, 1500, 2000, 100]);
    const ans = toMl ? calc.LToMl(Lt) : calc.mlToL(ml);
    return mk({ inp: { toMl, Lt, ml }, text: toMl ? `A bag contains ${fmt(Lt)} L. How many mL is that?` : `The client drank ${fmt(ml)} mL. How many liters?`, unit: toMl ? "mL" : "L", unitOpts: units(toMl ? "mL" : "L", ["mL", "L", "oz", "mg"]), ans, formula: "metric",
      given: [["Volume", toMl ? `${fmt(Lt)} L` : `${fmt(ml)} mL`], ["Conversion", "1 L = 1,000 mL"]], sub: toMl ? `${fmt(Lt)} × 1,000` : `${fmt(ml)} ÷ 1,000`,
      solve: [toMl ? `${fmt(Lt)} ${c("L")} × 1,000 mL/${c("L")} = ${fmt(ans)} mL` : `${fmt(ml)} ${c("mL")} × 1 L/1,000 ${c("mL")} = ${fmt(ans)} L`], methods: { da: [toMl ? `${fmt(Lt)} ${c("L")} × 1,000 mL/1 ${c("L")} = ${fmt(ans)} mL` : `${fmt(ml)} ${c("mL")} × 1 L/1,000 ${c("mL")} = ${fmt(ans)} L`] },
      traps: [{ v: toMl ? Lt / 1000 : ml * 1000, code: "CONV", msg: "Wrong direction." }] });
  });
  G("time", "Hours ↔ minutes", 1, "time", (L, R) => {
    const kind = L === 1 ? "h2m" : L === 2 ? "m2h" : "mixed";
    let ans, text, given, sub, solve, traps;
    if (kind === "h2m") { const h = R.pick([2, 4, 6, 8, 10, 12, 0.5, 1.5]); ans = calc.hToMin(h); text = `How many minutes are in ${fmt(h)} hours?`; given = [["Time", `${fmt(h)} hr`]]; sub = `${fmt(h)} × 60`; solve = [`${fmt(h)} ${c("hr")} × 60 min/${c("hr")} = ${fmt(ans)} min`]; traps = [{ v: h / 60, code: "TIME", msg: "Hours → minutes multiplies by 60." }]; }
    else if (kind === "m2h") { const m = R.pick([30, 45, 90, 15, 20, 150]); ans = round(calc.minToH(m), 2); text = `Express ${m} minutes in hours. Round to the hundredth if needed.`; given = [["Time", `${m} min`]]; sub = `${m} ÷ 60`; solve = [`${m} ${c("min")} × 1 hr/60 ${c("min")} = ${fmt(calc.minToH(m))} hr`]; traps = [{ v: m * 60, code: "TIME", msg: "Minutes → hours divides by 60." }, { v: m / 100, code: "TIME", msg: "An hour has 60 minutes, not 100." }]; }
    else { const h = R.int(1, 3), m = R.pick([15, 30, 45, 20]); ans = h * 60 + m; text = `An infusion must run ${h} hr ${m} min. How many total minutes?`; given = [["Time", `${h} hr ${m} min`]]; sub = `(${h} × 60) + ${m}`; solve = [`${h} hr × 60 = ${h * 60} min`, `${h * 60} + ${m} = ${ans} min`]; traps = [{ v: h * 60, code: "TIME", msg: `You dropped the extra ${m} minutes.` }, { v: h * 100 + m, code: "TIME", msg: "An hour is 60 minutes, not 100." }]; }
    return mk({ inp: { kind, text }, text, unit: kind === "m2h" ? "hr" : "min", unitOpts: units(kind === "m2h" ? "hr" : "min", ["hr", "min", "sec", "days"]), ans, round: kind === "m2h" ? "hundredth" : "none", formula: "time", given: [...given, ["Conversion", "1 hr = 60 min"]], sub, solve, methods: { da: solve }, traps });
  });
  G("household", "Household → metric", 1, "household", (L, R) => {
    const k = R.pick(L === 1 ? ["tsp", "tbsp"] : L === 2 ? ["oz", "tbsp", "tsp"] : ["mloz", "oz"]);
    let n, ans, text, unit, f, tr;
    if (k === "tsp") { n = R.pick([1, 2, 0.5, 1.5, 3]); ans = calc.tspToMl(n); f = "1 tsp = 5 mL"; text = `A parent gives ${fmt(n)} teaspoon(s) of a liquid medicine. How many mL is that?`; unit = "mL"; tr = [{ v: n * 15, code: "CONV", msg: "That's the tablespoon factor (15 mL). A teaspoon is 5 mL." }]; }
    else if (k === "tbsp") { n = R.pick([1, 2, 0.5, 3]); ans = calc.tbspToMl(n); f = "1 tbsp = 15 mL"; text = `Convert ${fmt(n)} tablespoon(s) to mL.`; unit = "mL"; tr = [{ v: n * 5, code: "CONV", msg: "That's the teaspoon factor. A tablespoon is 15 mL." }]; }
    else if (k === "oz") { n = R.pick([4, 6, 8, 2.5, 12]); ans = calc.ozToMl(n); f = "1 oz = 30 mL"; text = `A client drank ${fmt(n)} oz of juice. Record the intake in mL.`; unit = "mL"; tr = [{ v: n / 30, code: "CONV", msg: "oz → mL multiplies by 30." }]; }
    else { n = R.pick([240, 120, 90, 360]); ans = calc.mlToOz(n); f = "1 oz = 30 mL"; text = `A bottle holds ${n} mL. How many ounces?`; unit = "oz"; tr = [{ v: n * 30, code: "CONV", msg: "mL → oz divides by 30." }]; }
    return mk({ inp: { k, n }, text, unit, unitOpts: units(unit, ["mL", "oz", "tsp", "L"]), ans, formula: "household", given: [["Amount", `${fmt(n)} ${k === "tsp" ? "tsp" : k === "tbsp" ? "tbsp" : k === "oz" ? "oz" : "mL"}`], ["Equivalent", f]], sub: `${fmt(n)} × or ÷ the factor`, solve: [`Using ${f}: answer = ${fmt(ans)} ${unit}`], check: ["Household measures are inexact — a dosing cup or oral syringe is safer than a kitchen spoon."], methods: { da: [`${fmt(n)} × (${f}) = ${fmt(ans)} ${unit}`] }, traps: tr, src: "Common nursing equivalents (verify with your instructor's conversion table)" });
  });
  G("round", "Rounding & safe notation", 1, "round", (L, R) => {
    if (L >= 2 && R.chance(.4)) {
      const v = R.pick([0.5, 5, 0.25, 2]); const opts = v < 1 ? [`${fmt(v)} mg`, `.${String(v).split(".")[1]} mg`, `${fmt(v)}0 mg`] : [`${v} mg`, `${v}.0 mg`, `${v}.00 mg`];
      return mk({ kind: "choice", text: `Which way of writing this dose is safe?`, choices: opts, ans: 0, formula: "round", given: [["Rule", "Leading zero before a decimal; no trailing zero after a whole number"]], solve: [`Correct: ${opts[0]}. ${v < 1 ? "A missing leading zero (.5) can be misread as 5 — a tenfold error." : "A trailing zero (5.0) can be misread as 50 — a tenfold error."}`], traps: [], unit: "", round: "none" });
    }
    const rule = R.pick(L === 1 ? ["tenth", "gtt"] : ["tenth", "hundredth", "gtt", "ml"]);
    const raw = rule === "hundredth" ? R.int(1000, 9999) / 10000 * R.pick([1, 3]) : rule === "gtt" ? R.int(1500, 5000) / 100 : R.int(1001, 9999) / 1000 * R.pick([1, 4]);
    const v = rule === "ml" ? R.pick([R.int(101, 999) / 1000, R.int(1001, 4999) / 1000]) : raw;
    const ans = rule === "tenth" ? round(v, 1) : rule === "hundredth" ? round(v, 2) : rule === "gtt" ? round(v, 0) : roundML(v);
    const u = rule === "gtt" ? "gtt/min" : "mL";
    return mk({ inp: { rule, v }, text: `Your calculation gives ${v} ${u}. ${ROUND_RULES[rule === "tenth" ? "tenth" : rule === "hundredth" ? "hundredth" : rule]} What value do you record?`, unit: u, unitOpts: units(u, ["mL", "gtt/min", "mL/hr", "mg"]), ans, round: rule === "ml" ? "ml" : rule, formula: "round",
      given: [["Calculated", `${v} ${u}`], ["Rule", ROUND_RULES[rule === "ml" ? "ml" : rule]]], sub: `Look one place past the target digit`, solve: [`${v} → ${fmt(ans)} (5 or more rounds up; 4 or less stays)`],
      methods: { da: [`${v} → ${fmt(ans)}`] }, traps: [{ v: Math.floor(v * (rule === "gtt" ? 1 : rule === "hundredth" || (rule === "ml" && v < 1) ? 100 : 10)) / (rule === "gtt" ? 1 : rule === "hundredth" || (rule === "ml" && v < 1) ? 100 : 10), code: "ROUND", msg: "You truncated instead of rounding." }, { v, code: "ROUND", msg: "You didn't round." }] });
  });

  G("tabs", "Tablets & capsules", 2, "dh", (L, R) => {
    let desired, dUnit = "mg", conv = 1, convTxt = "", have, scored = false, drugTxt = "";
    if (L === 1) { have = R.pick([5, 10, 25, 50, 100, 250, 500, 20]); desired = have * R.pick([1, 2, 3]); }
    else if (L === 2) { scored = true; have = R.pick([10, 25, 50, 100, 250, 500, 5]); desired = have * R.pick([0.5, 1.5, 2.5, 2]); }
    else { const k = R.pick(["g", "mcg", "mcg2"]); if (k === "g") { have = R.pick([250, 500]); desired = R.pick([0.5, 1, 0.25]); if (desired * 1000 < have) desired = 0.5; dUnit = "g"; conv = 1000; convTxt = "1 g = 1,000 mg"; }
      else if (k === "mcg") { have = R.pick([25, 50, 100]); dUnit = "mg"; desired = have * R.pick([1, 2]) / 1000; conv = 1000; convTxt = "1 mg = 1,000 mcg"; drugTxt = "levothyroxine "; }
      else { have = 0.125; dUnit = "mcg"; desired = R.pick([125, 250]); conv = 1 / 1000; convTxt = "1 mg = 1,000 mcg"; drugTxt = "digoxin "; } }
    const hUnit = L === 3 && dUnit === "mg" && drugTxt ? "mcg" : "mg";
    const s = dhSetup({ desired, dUnit, conv, convTxt, have, hUnit, qty: 1, qUnit: "tablet", ansUnit: "tablet(s)", rnd: "tab" });
    return mk({ inp: { desired, dUnit, have, hUnit }, text: `Order: ${drugTxt}${fmt(desired)} ${dUnit} PO. Available: ${fmt(have)} ${hUnit} ${scored ? "scored " : ""}tablets. How many tablets will you give?`, unit: "tablet(s)", unitOpts: units("tablet(s)", ["mg", "mL", "tablet(s)", "mcg"]), ans: s.ans, round: "tab", formula: "dh",
      given: [["Ordered (D)", `${fmt(desired)} ${dUnit}`], ["Have (H)", `${fmt(have)} ${hUnit} per tablet`], ["Quantity (Q)", "1 tablet"], ...(convTxt ? [["Conversion", convTxt]] : [])],
      sub: `(${fmt(desired * conv)} ${hUnit} ÷ ${fmt(have)} ${hUnit}) × 1 tablet`, solve: s.methods.da, methods: s.methods, traps: s.traps,
      check: ["Usually 1–3 tablets; more than 3 is a cue to recheck.", scored ? "Half tablets only because these are scored." : "Whole tablets only.", "Unit: tablets."], src: drugTxt ? "Drug names from your course files; amounts are practice values" : "Fictional practice values" });
  });
  G("liquid", "Oral liquids", 3, "dh", (L, R) => {
    let have, qty, desired, dUnit = "mg", conv = 1, convTxt = "", drug = "", src = "Fictional practice values";
    if (L === 1) { [have, qty] = R.pick([[125, 5], [250, 5], [100, 5], [50, 5], [10, 1], [20, 1]]); desired = have * R.pick([1, 2, 3, 0.5, 1.5]); }
    else if (L === 2) { [have, qty, drug] = R.pick([[160, 5, "acetaminophen "], [25, 5, "nitrofurantoin "], [125, 5, ""], [40, 5, ""], [80, 15, ""]]); desired = R.pick([0.4, 0.6, 0.75, 1.2, 1.3, 0.9, 1.7]) * have; desired = round(desired, 0); if (drug) src = "Concentration from your course files (Pain/Urinary); dose is a practice value"; }
    else { const k = R.pick(["dig", "g"]); if (k === "dig") { have = 0.05; qty = 1; drug = "digoxin elixir "; dUnit = "mcg"; desired = R.pick([62.5, 125, 100, 75]); conv = 1 / 1000; convTxt = "1 mg = 1,000 mcg"; src = "Digoxin pediatric elixir 0.05 mg/mL is listed in your Cardiovascular file; dose is a practice value"; }
      else { have = 250; qty = 5; dUnit = "g"; desired = R.pick([0.5, 0.375, 0.75, 0.3]); conv = 1000; convTxt = "1 g = 1,000 mg"; } }
    const s = dhSetup({ desired, dUnit, conv, convTxt, have, hUnit: "mg", qty, qUnit: "mL", ansUnit: "mL", rnd: "ml" });
    return mk({ inp: { desired, dUnit, have, qty }, text: `Order: ${drug}${fmt(desired)} ${dUnit} PO. Available: ${drug}${fmt(have)} mg/${qty === 1 ? "" : qty + " "}mL. How many mL will you give? ${ROUND_RULES.ml}`, unit: "mL", unitOpts: units("mL", ["mg", "mL", "tsp", "tablet(s)"]), ans: s.ans, round: "ml", formula: "dh",
      given: [["Ordered (D)", `${fmt(desired)} ${dUnit}`], ["Have (H)", `${fmt(have)} mg`], ["Quantity (Q)", `${qty} mL`], ...(convTxt ? [["Conversion", convTxt]] : [])],
      sub: `(${fmt(desired * conv)} mg ÷ ${fmt(have)} mg) × ${qty} mL`, solve: s.methods.da, methods: s.methods, traps: s.traps,
      check: ["Measure with an oral syringe, not a kitchen spoon.", "Label the answer in mL."], src, visual: { type: "syringe", ml: s.ans } });
  });

  G("wtdose", "mg/kg/dose", 4, "wtdose", (L, R) => {
    const perKg = R.pick([5, 10, 15, 2, 20, 0.1]);
    let kg, lb = null, kgR, conc = null;
    if (L === 1) { kg = R.int(8, 40); kgR = kg; }
    else { lb = R.int(18, 90); kg = calc.lbToKg(lb); kgR = round(kg, 1); }
    const dose = round(calc.wtDose(kgR, perKg), 1);
    if (L === 3) conc = R.pick([[100, 5], [160, 5], [125, 5], [50, 1]]);
    const ml = conc ? roundML(dose / conc[0] * conc[1]) : null;
    const ask = conc ? "mL" : "mg";
    const solve = [...(lb ? [`${lb} ${c("lb")} ÷ 2.2 = ${fmt(kg)} → ${fmt(kgR)} kg`] : []), `${fmt(kgR)} ${c("kg")} × ${perKg} mg/${c("kg")}/dose = ${fmt(dose)} mg per dose`, ...(conc ? [`${fmt(dose)} ${c("mg")} × (${conc[1]} mL ÷ ${conc[0]} ${c("mg")}) = ${fmt(ml)} mL`] : [])];
    const traps = [{ v: lb ? round(lb * perKg, 1) : null, code: "CONV", msg: "You used the weight in pounds. Convert to kg first (÷ 2.2)." }, { v: lb ? round(lb * 2.2 * perKg, 1) : null, code: "CONV", msg: "You multiplied the weight by 2.2 instead of dividing." }].filter(t => t.v != null);
    if (conc) { traps.push({ v: dose, code: "FORM", msg: "That's the dose in mg — the question asks for mL. Finish with Desired ÷ Have × Quantity." }); traps.push({ v: roundML(conc[0] / dose * conc[1]), code: "FORM", msg: "You flipped Desired and Have in the last step." }); }
    return mk({ inp: { lb, kg, perKg, conc }, text: `A child weighs ${lb ? lb + " lb" : kg + " kg"}. The practice order is ${perKg} mg/kg/dose${conc ? `. Available: ${conc[0]} mg/${conc[1] === 1 ? "" : conc[1] + " "}mL. How many mL per dose?` : ". How many mg per dose?"} ${lb ? ROUND_RULES.kg : ""} ${conc ? ROUND_RULES.ml : "Round mg to the tenth."}`,
      unit: ask, unitOpts: units(ask, ["mg", "mL", "mg/day", "kg"]), ans: conc ? ml : dose, round: conc ? "ml" : "tenth", formula: "wtdose",
      given: [["Weight", lb ? `${lb} lb` : `${kg} kg`], ["Order", `${perKg} mg/kg/dose (per DOSE)`], ...(conc ? [["Have", `${conc[0]} mg/${conc[1]} mL`]] : [])],
      sub: `${fmt(kgR)} kg × ${perKg} mg/kg`, solve, methods: { da: solve }, traps, check: ["'Per dose' means this is ONE dose — don't divide.", "Weight must be in kg."], visual: conc ? { type: "syringe", ml } : null });
  });
  G("wtday", "mg/kg/day divided", 4, "wtday", (L, R) => {
    const perDay = R.pick([20, 30, 40, 50, 60, 90, 100]); const q = R.pick([6, 8, 12]); const n = calc.dosesPerDay(q);
    let kg, lb = null, kgR;
    if (L === 1) { kg = R.int(5, 30) * (perDay % 3 === 0 && n === 3 ? 1 : 2); kgR = kg; } else { lb = R.int(20, 80); kg = calc.lbToKg(lb); kgR = round(kg, 1); }
    const daily = calc.daily(kgR, perDay), per = round(daily / n, 1);
    const conc = L === 3 ? R.pick([[250, 5], [125, 5], [200, 5]]) : null; const ml = conc ? roundML(per / conc[0] * conc[1]) : null;
    const solve = [...(lb ? [`${lb} lb ÷ 2.2 = ${fmt(kg)} → ${fmt(kgR)} kg`] : []), `Total per DAY: ${fmt(kgR)} ${c("kg")} × ${perDay} mg/${c("kg")}/day = ${fmt(daily)} mg/day`, `Every ${q} hr = 24 ÷ ${q} = ${n} doses per day`, `Per dose: ${fmt(daily)} mg ÷ ${n} = ${fmt(per)} mg`, ...(conc ? [`${fmt(per)} ${c("mg")} × ${conc[1]} mL/${conc[0]} ${c("mg")} = ${fmt(ml)} mL`] : [])];
    return mk({ inp: { lb, kg: kgR, perDay, q, conc }, text: `A child weighing ${lb ? lb + " lb" : kgR + " kg"} has a practice order for ${perDay} mg/kg/day divided every ${q} hours.${conc ? ` Available: ${conc[0]} mg/${conc[1]} mL. How many mL per dose?` : " How many mg per dose?"} ${lb ? ROUND_RULES.kg : ""} ${conc ? ROUND_RULES.ml : "Round mg to the tenth."}`,
      unit: conc ? "mL" : "mg", unitOpts: units(conc ? "mL" : "mg", ["mg", "mL", "mg/day", "kg"]), ans: conc ? ml : per, round: conc ? "ml" : "tenth", formula: "wtday",
      given: [["Weight", lb ? `${lb} lb` : `${kgR} kg`], ["Order", `${perDay} mg/kg/DAY`], ["Frequency", `every ${q} hr (${n} doses/day)`], ...(conc ? [["Have", `${conc[0]} mg/${conc[1]} mL`]] : [])],
      sub: `(${fmt(kgR)} × ${perDay}) ÷ ${n}`, solve, methods: { da: solve },
      traps: [{ v: conc ? roundML(daily / conc[0] * conc[1]) : round(daily, 1), code: "DAYDOSE", msg: "That's the whole DAY's amount. mg/kg/day must be divided by the number of doses." },
        { v: conc ? roundML(daily / q / conc[0] * conc[1]) : round(daily / q, 1), code: "DIVIDE", msg: `You divided by ${q} (the hours between doses). Every ${q} hr means ${n} doses a day — divide by ${n}.` },
        ...(lb ? [{ v: conc ? roundML(lb * perDay / n / conc[0] * conc[1]) : round(lb * perDay / n, 1), code: "CONV", msg: "You used pounds instead of kilograms." }] : [])],
      check: ["mg/kg/DAY → always divide. mg/kg/DOSE → never divide.", `Per dose × ${n} should give back the daily total.`], visual: conc ? { type: "syringe", ml } : null });
  });

  const SAFE_CHOICES = ["Within the stated range — the math check passes", "Below the stated range — clarify with the prescriber", "Above the stated range — clarify with the prescriber", "Can't determine — information is missing; clarify"];
  G("safe", "Safe-dose range", 5, "safe", (L, R) => {
    const useCourse = L >= 2 && R.chance(.3);
    let kg, lb = null, lo, hi, q, dose, drug = "", src = "Fictional practice range and order", missing = null;
    if (useCourse) { drug = "nitrofurantoin "; lo = 5; hi = 7; q = 6; lb = R.pick([33, 44, 55, 66]); kg = round(calc.lbToKg(lb), 1); dose = round(kg * R.pick([1, 1.5, 1.75, 2.2]), 0); src = "Range of 5–7 mg/kg/24 hr in four doses from your Pain/Urinary file (via your earlier question bank); order is a practice value"; }
    else { lo = R.pick([10, 15, 20, 25, 30]); hi = lo + R.pick([10, 15, 20]); q = R.pick([6, 8, 12]); if (L === 1) kg = R.int(8, 30); else { lb = R.int(22, 88); kg = round(calc.lbToKg(lb), 1); }
      const n0 = 24 / q, target = R.pick([lo * 0.7, (lo + hi) / 2, hi * 1.25, lo * 1.05, hi * 0.95]); dose = round(kg * target / n0, 0); }
    if (L === 3 && R.chance(.35)) missing = R.pick(["freq", "weight"]);
    const n = 24 / q, r = calc.safeRange(kg, lo, hi, dose, n);
    const ans = missing ? 3 : r.within ? 0 : r.below ? 1 : 2;
    const wTxt = missing === "weight" ? "(weight not documented)" : lb ? `${lb} lb` : `${kg} kg`;
    const solve = missing ? [`The ${missing === "freq" ? "frequency" : "weight"} is missing, so the daily amount (or the range) can't be calculated.`, "Never guess — clarify the order before going further."]
      : [...(lb ? [`${lb} lb ÷ 2.2 = ${fmt(kg)} kg`] : []), `Minimum: ${fmt(kg)} × ${lo} = ${fmt(r.min)} mg/day`, `Maximum: ${fmt(kg)} × ${hi} = ${fmt(r.max)} mg/day`, `Ordered: ${fmt(dose)} mg × ${n} doses = ${fmt(r.daily)} mg/day`, `${fmt(r.daily)} is ${r.within ? "within" : r.below ? "below" : "above"} ${fmt(r.min)}–${fmt(r.max)} → ${SAFE_CHOICES[ans].split(" — ")[0].toLowerCase()}`];
    return mk({ inp: { kg, lo, hi, dose, q, missing }, kind: "choice", choices: SAFE_CHOICES, ans, text: `${drug ? "Order: " + drug : "Practice order: "}${fmt(dose)} mg PO${missing === "freq" ? "" : ` every ${q} hours`}. Child's weight: ${wTxt}. Stated safe range: ${lo}–${hi} mg/kg/day. Is the order within the range?`,
      unit: "", formula: "safe", given: [["Weight", wTxt], ["Range", `${lo}–${hi} mg/kg/day`], ["Order", `${fmt(dose)} mg${missing === "freq" ? " (no frequency)" : ` q${q}h = ${n} doses/day`}`]], sub: `kg × ${lo} and kg × ${hi}; compare to mg × ${n}`, solve, methods: { da: solve },
      check: ["A passing range check is arithmetic only. Real safety also depends on the drug, child, indication, route and verified prescribing information.", "Your PEDS file: a second nurse checks all computed pediatric doses, and any order outside the usual range is checked with the prescriber before giving."], src, safeData: { min: r.min, max: r.max, daily: r.daily, missing } });
  });

  G("ivrate", "IV pump rate (mL/hr)", 6, "mlhr", (L, R) => {
    let ml, hours, minutes = null, src = "Fictional practice order", txt;
    if (L === 1) { ml = R.pick([1000, 500, 250, 100, 1200]); hours = R.pick([8, 4, 10, 12, 2, 5]); txt = `${fmt(ml)} mL over ${hours} hours`; }
    else if (L === 2) { ml = R.pick([1000, 750, 500, 250]); hours = R.pick([6, 7, 9, 3]); txt = `${fmt(ml)} mL over ${hours} hours`; }
    else { if (R.chance(.4)) { ml = 250; minutes = 30; src = "Magnesium sulfate preterm-labor loading dose (4 g in 250 mL over 30 min) from your Maternal file"; txt = "magnesium sulfate 4 g in 250 mL over 30 minutes"; } else { ml = R.pick([50, 100, 150]); minutes = R.pick([20, 30, 45, 40]); txt = `an IV piggyback of ${ml} mL over ${minutes} minutes`; } hours = calc.minToH(minutes); }
    const raw = calc.mlPerHr(ml, hours), ans = round(raw, 1);
    const solve = [...(minutes ? [`${minutes} ${c("min")} ÷ 60 = ${fmt(hours)} hr`] : []), `${fmt(ml)} mL ÷ ${fmt(hours)} hr = ${fmt(raw)} mL/hr${raw !== ans ? ` → ${fmt(ans)} mL/hr` : ""}`];
    return mk({ inp: { ml, hours, minutes }, text: `Infuse ${txt} on a pump. What rate do you program? Round to the tenth.`, unit: "mL/hr", unitOpts: units("mL/hr", ["mL/hr", "gtt/min", "mL/min", "mL"]), ans, round: "tenth", formula: "mlhr", src,
      given: [["Volume", `${fmt(ml)} mL`], ["Time", minutes ? `${minutes} min` : `${hours} hr`]], sub: `${fmt(ml)} ÷ ${fmt(hours)}`, solve,
      methods: { da: [`${fmt(ml)} mL ÷ ${minutes ? `${minutes} ${c("min")} × 60 ${c("min")}/hr` : `${hours} hr`} = ${fmt(raw)} mL/hr`], dh: [`Volume ÷ time in hours: ${fmt(ml)} ÷ ${fmt(hours)} = ${fmt(raw)}`], rp: [`${fmt(ml)} mL : ${fmt(hours)} hr = x mL : 1 hr`, `x = ${fmt(raw)} mL/hr`] },
      traps: minutes ? [{ v: round(ml / minutes, 1), code: "TIME", msg: "You divided by minutes. Pumps run in mL per HOUR — convert minutes to hours first." }, { v: round(ml * minutes / 60, 1), code: "TIME", msg: "Multiply volume by 60 ÷ minutes, not minutes ÷ 60." }] : [{ v: round(hours / ml, 4), code: "FORM", msg: "Volume goes on top: mL ÷ hours." }],
      check: ["Pumps are programmed in mL/hr. Some pumps accept only whole numbers — follow your facility's device rules (exam answers use the stated rounding).", "Reasonable? A liter over 8 hours is about 125 mL/hr."], visual: { type: "pump", rate: ans } });
  });
  G("gtt", "Gravity drip (gtt/min)", 7, "gtt", (L, R) => {
    const df = L === 1 ? R.pick([10, 15, 20]) : R.pick([10, 15, 20, 60]); let ml, minutes, hours = null;
    if (L === 3 && R.chance(.5)) { ml = R.pick([50, 100]); minutes = R.pick([30, 20, 45]); } else { ml = R.pick([1000, 500, 250, 1500]); hours = R.pick([8, 6, 4, 12, 10]); minutes = calc.hToMin(hours); }
    const raw = calc.gttPerMin(ml, df, minutes), ans = round(raw, 0);
    const solve = [...(hours ? [`${hours} ${c("hr")} × 60 = ${minutes} min`] : []), `(${fmt(ml)} ${c("mL")} × ${df} gtt/${c("mL")}) ÷ ${minutes} min = ${fmt(raw)} gtt/min`, ...(raw !== ans ? [`Round to a whole drop: ${ans} gtt/min`] : [])];
    return mk({ inp: { ml, minutes, df }, text: `Infuse ${fmt(ml)} mL over ${hours ? hours + " hours" : minutes + " minutes"} by gravity. The tubing drop factor is ${df} gtt/mL. How many drops per minute?`, unit: "gtt/min", unitOpts: units("gtt/min", ["gtt/min", "mL/hr", "gtt/hr", "mL/min"]), ans, round: "gtt", formula: "gtt",
      given: [["Volume", `${fmt(ml)} mL`], ["Time", hours ? `${hours} hr` : `${minutes} min`], ["Drop factor", `${df} gtt/mL ${df === 60 ? "(microdrip)" : "(macrodrip)"}`]], sub: `(${fmt(ml)} × ${df}) ÷ ${minutes}`, solve,
      methods: { da: [`${fmt(ml)} ${c("mL")}/${minutes} min × ${df} gtt/${c("mL")} = ${fmt(raw)} gtt/min`], dh: [`mL/hr first: ${fmt(ml)} ÷ ${fmt(minutes / 60)} = ${fmt(ml / (minutes / 60))} mL/hr`, `(mL/hr × drop factor) ÷ 60 = ${fmt(raw)} gtt/min`] },
      traps: [...(hours ? [{ v: round(ml * df / hours, 0), code: "TIME", msg: "You used hours. Drops are counted per MINUTE — convert hours to minutes (× 60)." }] : []), { v: round(ml / minutes, 0), code: "DF", msg: "You left out the drop factor." }, { v: round(ml * minutes / df, 0), code: "DF", msg: "Drop factor goes on top with the volume: (mL × gtt/mL) ÷ min." }],
      check: ["Round to whole drops.", df === 60 ? "Microdrip (60 gtt/mL): gtt/min equals mL/hr." : "Macrodrip sets: 10, 15 or 20 gtt/mL."], visual: { type: "drip", gtt: ans } });
  });

  G("heparin", "Heparin infusion (units/hr → mL/hr)", 8, "unitshr", (L, R) => {
    const src = "Standard concentration 25,000 units in 250 mL (100 units/mL), 15–25 units/kg/hr maintenance and 70–100 units/kg bolus from your Cardiovascular file; specific orders are practice values";
    if (L === 1) { const uh = R.pick([800, 1000, 1200, 1100, 1500, 900]); const ans = calc.rateFromDose(uh, 25000, 250);
      const solve = [`Concentration: 25,000 units ÷ 250 mL = 100 units/mL`, `${fmt(uh)} ${c("units")}/hr ÷ 100 ${c("units")}/mL = ${fmt(ans)} mL/hr`];
      return mk({ inp: { t: "rate", uh }, text: `Practice order: heparin infusion at ${fmt(uh)} units/hr. The bag contains heparin 25,000 units in 250 mL. What mL/hr do you program?`, unit: "mL/hr", unitOpts: units("mL/hr", ["units/hr", "mL/hr", "mL", "units"]), ans, round: "tenth", formula: "unitshr", src, high: true,
        given: [["Ordered", `${fmt(uh)} units/hr`], ["Bag", "25,000 units / 250 mL"]], sub: `${fmt(uh)} ÷ (25,000 ÷ 250)`, solve, methods: { da: [`${fmt(uh)} ${c("units")}/hr × 250 mL/25,000 ${c("units")} = ${fmt(ans)} mL/hr`], dh: [`D/H × Q: (${fmt(uh)} ÷ 25,000) × 250 mL = ${fmt(ans)} mL/hr`], rp: [`25,000 units : 250 mL = ${fmt(uh)} units : x mL`, `x = ${fmt(ans)} mL/hr`] },
        traps: [{ v: uh, code: "FORM", msg: "That's the units/hr ordered, not the pump rate in mL/hr." }, { v: round(25000 / uh * 250, 1), code: "FORM", msg: "Desired and Have are flipped." }, { v: round(uh / 250, 1), code: "CONC", msg: "You divided by the bag volume instead of the concentration (units per mL)." }],
        check: ["High-alert drug: two nurses independently confirm the calculation and heparin strength (your Cardiovascular file).", "Program a pump — never gravity."], visual: { type: "pump", rate: ans } }); }
    if (L === 2) { const kg = R.int(55, 110), uk = R.pick([15, 18, 20, 12]); const bag = R.pick([[25000, 250], [25000, 500]]); const uh = kg * uk, conc = bag[0] / bag[1], ans = round(uh / conc, 1);
      const solve = [`Units/hr: ${kg} ${c("kg")} × ${uk} units/${c("kg")}/hr = ${fmt(uh)} units/hr`, `Concentration: ${fmt(bag[0])} ÷ ${bag[1]} = ${fmt(conc)} units/mL`, `${fmt(uh)} ÷ ${fmt(conc)} = ${fmt(uh / conc)} mL/hr${uh / conc !== ans ? " → " + fmt(ans) : ""}`];
      return mk({ inp: { t: "wt", kg, uk, bag }, text: `Practice order: heparin ${uk} units/kg/hr for a client weighing ${kg} kg. Bag: heparin ${fmt(bag[0])} units in ${bag[1]} mL. What mL/hr do you program? Round to the tenth.`, unit: "mL/hr", unitOpts: units("mL/hr", ["units/hr", "mL/hr", "units/kg/hr", "mL"]), ans, round: "tenth", formula: "unitshr", src, high: true,
        given: [["Weight", `${kg} kg`], ["Ordered", `${uk} units/kg/hr`], ["Bag", `${fmt(bag[0])} units / ${bag[1]} mL`]], sub: `(${kg} × ${uk}) ÷ ${fmt(conc)}`, solve, methods: { da: [`${kg} ${c("kg")} × ${uk} ${c("units")}/${c("kg")}/hr × ${bag[1]} mL/${fmt(bag[0])} ${c("units")} = ${fmt(uh / conc)} mL/hr`] },
        traps: [{ v: uh, code: "FORM", msg: "That's units/hr — convert to mL/hr with the concentration." }, { v: round(uk / conc, 1), code: "FORM", msg: "You forgot to multiply by the weight." }, { v: round(uh / (bag[0] / 250 === conc ? 50 : 100), 1), code: "CONC", msg: "Check the concentration: this bag isn't the same as the other standard bag." }],
        check: ["Two-nurse independent double-check required.", "Recalculate the units/hr from the mL/hr to confirm."], visual: { type: "pump", rate: ans } }); }
    const kg = R.int(60, 100), uk = R.pick([70, 80]); const units_ = kg * uk, vial = R.pick([1000, 5000]); const ans = roundML(units_ / vial);
    return mk({ inp: { t: "bolus", kg, uk, vial }, text: `Practice order: heparin bolus ${uk} units/kg IV for a ${kg}-kg client. Vial: heparin ${fmt(vial)} units/mL. How many mL? ${ROUND_RULES.ml}`, unit: "mL", unitOpts: units("mL", ["units", "mL", "mL/hr", "units/hr"]), ans, round: "ml", formula: "dh", src, high: true,
      given: [["Weight", `${kg} kg`], ["Bolus", `${uk} units/kg`], ["Vial", `${fmt(vial)} units/mL`]], sub: `(${kg} × ${uk}) ÷ ${fmt(vial)}`,
      solve: [`${kg} kg × ${uk} units/kg = ${fmt(units_)} units`, `${fmt(units_)} ${c("units")} ÷ ${fmt(vial)} ${c("units")}/mL = ${fmt(units_ / vial)} mL${units_ / vial !== ans ? " → " + fmt(ans) : ""}`], methods: { da: [`${kg} ${c("kg")} × ${uk} ${c("units")}/${c("kg")} × 1 mL/${fmt(vial)} ${c("units")} = ${fmt(units_ / vial)} mL`] },
      traps: [{ v: units_, code: "FORM", msg: "That's the dose in units — the question asks for mL." }, { v: roundML(units_ / (vial === 1000 ? 10000 : 1000)), code: "CONC", msg: "Wrong vial strength. Your Cardiovascular file warns there's a drastic difference between 1,000 and 10,000 units/mL." }],
      check: ["Confirm the vial strength with a second nurse — multiple heparin strengths exist.", "Two-nurse independent double-check."], visual: { type: "syringe", ml: ans } });
  });
  G("insulin", "Insulin units & drips", 8, "insulin", (L, R) => {
    if (L === 1) { const g = R.pick([142, 168, 188, 214, 233, 262, 289, 318, 344]); const scale = [[151, 200, 2], [201, 250, 4], [251, 300, 6], [301, 350, 8]]; const row = scale.find(s => g >= s[0] && g <= s[1]) || [0, 150, 0];
      return mk({ inp: { t: "scale", g }, text: `Practice sliding scale for insulin lispro: 151–200 mg/dL = 2 units · 201–250 = 4 units · 251–300 = 6 units · 301–350 = 8 units. Blood glucose before lunch is ${g} mg/dL. How many units do you prepare?`, unit: "units", unitOpts: units("units", ["units", "mL", "mg", "mcg"]), ans: row[2], formula: "insulin", high: true,
        given: [["Glucose", `${g} mg/dL`], ["Scale", "2 / 4 / 6 / 8 units by range"]], sub: `Find the range that contains ${g}`, solve: [g < 151 ? `${g} is below 151 → 0 units (no coverage)` : `${g} falls in ${row[0]}–${row[1]} → ${row[2]} units`], methods: { da: [`Range lookup → ${row[2]} units`] },
        traps: [{ v: row[2] / 100, code: "UNIT", msg: "Insulin is measured in units on an insulin syringe, not mL." }, { v: row[2] + 2, code: "ARITH", msg: "Read the range again — that's the next row up." }, { v: Math.max(0, row[2] - 2), code: "ARITH", msg: "Read the range again — that's the row below." }],
        check: ["Use a U-100 insulin syringe marked in units.", "Rapid-acting insulin needs food available.", "Many facilities require an independent double-check for insulin."], visual: { type: "insulin", units: row[2] } }); }
    if (L === 2) { const bag = R.pick([[100, 100], [100, 250], [50, 50]]); const uh = R.pick([2, 3, 4, 5, 6, 7.5, 8]); const conc = bag[0] / bag[1], ans = round(uh / conc, 1);
      return mk({ inp: { t: "drip", bag, uh }, text: `Practice order: regular insulin infusion at ${fmt(uh)} units/hr. Bag: regular insulin ${bag[0]} units in ${bag[1]} mL NS. What mL/hr do you program? Round to the tenth.`, unit: "mL/hr", unitOpts: units("mL/hr", ["units/hr", "mL/hr", "units", "mL"]), ans, round: "tenth", formula: "unitshr", high: true, src: "Regular insulin is the only insulin given IV (your Med-Surg file); bag and rate are practice values",
        given: [["Ordered", `${fmt(uh)} units/hr`], ["Bag", `${bag[0]} units / ${bag[1]} mL`]], sub: `${fmt(uh)} ÷ (${bag[0]} ÷ ${bag[1]})`, solve: [`Concentration: ${bag[0]} ÷ ${bag[1]} = ${fmt(conc)} units/mL`, `${fmt(uh)} ${c("units")}/hr ÷ ${fmt(conc)} ${c("units")}/mL = ${fmt(uh / conc)} mL/hr`], methods: { da: [`${fmt(uh)} ${c("units")}/hr × ${bag[1]} mL/${bag[0]} ${c("units")} = ${fmt(uh / conc)} mL/hr`] },
        traps: [{ v: round(uh * conc, 1), code: "FORM", msg: "You multiplied by the concentration; divide units/hr by units/mL." }, { v: uh, code: conc === 1 ? "ARITH" : "CONC", msg: "That's only right when the bag is exactly 1 unit/mL — check this bag's concentration." }],
        check: ["Only regular insulin is given IV.", "Monitor glucose (and potassium) closely during an insulin drip."], visual: { type: "pump", rate: ans } }); }
    const u = R.pick([8, 12, 15, 25, 36, 45]); const ans = calc.unitsToMlU100(u);
    return mk({ inp: { t: "syr", u }, kind: "choice", text: `A client's dose is ${u} units of U-100 insulin. Which statement about measuring it is correct?`, choices: [`Draw up ${u} units on a U-100 insulin syringe (${fmt(ans)} mL is the volume, but you measure in units)`, `Draw up ${u} mL in a 3-mL syringe`, `Draw up ${fmt(ans)} mL in a tuberculin syringe instead of an insulin syringe`, `Draw up ${fmt(u / 10)} mL because U-100 means 10 units per mL`], ans: 0, unit: "", formula: "insulin", high: true,
      given: [["Dose", `${u} units`], ["Concentration", "U-100 = 100 units per mL"]], solve: [`${u} units ÷ 100 units/mL = ${fmt(ans)} mL — but insulin is always measured in units on an insulin syringe that matches the concentration.`], check: ["Verify the concentration (U-100) on the vial and syringe.", "Never measure insulin in a non-insulin syringe."], visual: { type: "insulin", units: u } });
  });
  G("mcgkgmin", "mcg/kg/min → mL/hr", 8, "mcgkgmin", (L, R) => {
    const bag = R.pick([[400, 250], [200, 250], [400, 500], [800, 250]]); const dose = L === 1 ? R.pick([2, 3, 5, 10]) : R.pick([2.5, 4, 6, 7.5, 8]);
    let kg, lb = null; if (L === 3) { lb = R.int(110, 240); kg = round(calc.lbToKg(lb), 1); } else kg = R.pick([50, 60, 70, 75, 80, 90, 100]);
    const concMcg = bag[0] * 1000 / bag[1], raw = calc.mcgKgMinToMlHr(dose, kg, bag[0], bag[1]), ans = round(raw, 1);
    const solve = [...(lb ? [`${lb} lb ÷ 2.2 = ${fmt(kg)} kg`] : []), `Concentration: ${bag[0]} mg × 1,000 = ${fmt(bag[0] * 1000)} mcg ÷ ${bag[1]} mL = ${fmt(concMcg)} mcg/mL`, `Dose per min: ${dose} × ${fmt(kg)} = ${fmt(dose * kg)} mcg/min`, `Per hour: × 60 = ${fmt(dose * kg * 60)} mcg/hr`, `${fmt(dose * kg * 60)} ${c("mcg")}/hr ÷ ${fmt(concMcg)} ${c("mcg")}/mL = ${fmt(raw)} mL/hr${raw !== ans ? " → " + fmt(ans) : ""}`];
    return mk({ inp: { dose, kg, lb, bag }, text: `Practice order: "Drug V" ${dose} mcg/kg/min for a client weighing ${lb ? lb + " lb" : kg + " kg"}. Bag: ${bag[0]} mg in ${bag[1]} mL. What mL/hr do you program? Round to the tenth.`, unit: "mL/hr", unitOpts: units("mL/hr", ["mcg/min", "mL/hr", "mcg/kg/min", "mg/hr"]), ans, round: "tenth", formula: "mcgkgmin", adv: L === 3, high: true,
      given: [["Order", `${dose} mcg/kg/min`], ["Weight", lb ? `${lb} lb` : `${kg} kg`], ["Bag", `${bag[0]} mg / ${bag[1]} mL`]], sub: `(${dose} × ${fmt(kg)} × 60) ÷ ${fmt(concMcg)}`, solve,
      methods: { da: [`${dose} ${c("mcg")}/${c("kg")}/${c("min")} × ${fmt(kg)} ${c("kg")} × 60 ${c("min")}/hr × ${bag[1]} mL/${bag[0]} ${c("mg")} × 1 ${c("mg")}/1,000 ${c("mcg")} = ${fmt(raw)} mL/hr`] },
      traps: [{ v: round(raw / 60, 1), code: "TIME", msg: "You forgot × 60 — the order is per MINUTE but pumps run per HOUR." }, { v: round(raw * 1000, 1), code: "CONV", msg: "You forgot to convert the bag's mg to mcg (× 1,000)." }, { v: round(raw / kg, 1), code: "FORM", msg: "You left out the patient's weight." }, ...(lb ? [{ v: round(calc.mcgKgMinToMlHr(dose, lb, bag[0], bag[1]), 1), code: "CONV", msg: "You used pounds instead of kg." }] : [])],
      check: ["Fictional drug — practice arithmetic only, not an infusion instruction.", "Critical-care titrations are usually RN/provider scope; LVNs should recognize the math."], visual: { type: "pump", rate: ans } });
  });
  G("titrate", "Titration per protocol", 8, "unitshr", (L, R) => {
    const conc = R.pick([[100, 100, 1], [50, 50, 1], [100, 250, 0.4]]); const start = R.pick([2, 4, 6]), step = R.pick([1, 2]), max = start + step * R.int(3, 5); const cur = start + step * R.int(1, 2);
    const newU = cur + step, ans = round(newU / conc[2], 1);
    return mk({ inp: { cur, step, max, conc }, text: `Fictional protocol: insulin infusion — increase by ${step} units/hr each hour while glucose stays above target, maximum ${max} units/hr. It is currently ${cur} units/hr and glucose is still above target. Bag: ${conc[0]} units in ${conc[1]} mL. What is the NEW pump rate in mL/hr?`, unit: "mL/hr", unitOpts: units("mL/hr", ["units/hr", "mL/hr", "units", "mL"]), ans, round: "tenth", formula: "unitshr", high: true,
      given: [["Current", `${cur} units/hr`], ["Change", `+${step} units/hr`], ["Max", `${max} units/hr`], ["Bag", `${conc[0]} units / ${conc[1]} mL = ${fmt(conc[2])} units/mL`]], sub: `(${cur} + ${step}) ÷ ${fmt(conc[2])}`,
      solve: [`New dose: ${cur} + ${step} = ${newU} units/hr (≤ ${max} max ✓)`, `${newU} ÷ ${fmt(conc[2])} units/mL = ${fmt(newU / conc[2])} mL/hr`], methods: { da: [`${newU} ${c("units")}/hr × ${conc[1]} mL/${conc[0]} ${c("units")} = ${fmt(newU / conc[2])} mL/hr`] },
      traps: [{ v: newU, code: "FORM", msg: "That's the new units/hr — convert to mL/hr." }, { v: round(cur / conc[2], 1), code: "FORM", msg: "That's the current rate; the protocol calls for an increase." }, { v: round(step / conc[2], 1), code: "FORM", msg: "That's only the change, not the new total rate." }],
      check: ["Every titration step must stay within the ordered maximum.", "Titration is done per written protocol and facility scope — practice math only."], visual: { type: "pump", rate: ans } });
  });
  G("check", "Is the order consistent?", 8, "unitshr", (L, R) => {
    const bag = R.pick([[25000, 500], [25000, 250]]); const conc = bag[0] / bag[1]; const uh = R.pick([1000, 1200, 1300, 900, 1500]); const right = uh / conc;
    const shown = R.chance(.5) ? right : R.pick([uh / (conc === 50 ? 100 : 50), right * 10, right + 2]);
    const ok = Math.abs(shown - right) < EPS;
    return mk({ inp: { uh, bag, shown }, kind: "choice", text: `Heparin is ordered at ${fmt(uh)} units/hr. Bag: ${fmt(bag[0])} units in ${bag[1]} mL. The pump is running at ${fmt(shown)} mL/hr. Is the pump setting consistent with the order?`, choices: ["Consistent — the rate delivers the ordered units/hr", "Not consistent — stop, recheck the setting and verify with a second nurse"], ans: ok ? 0 : 1, unit: "", formula: "fromrate", high: true,
      given: [["Order", `${fmt(uh)} units/hr`], ["Bag", `${fmt(bag[0])} / ${bag[1]} mL = ${fmt(conc)} units/mL`], ["Pump", `${fmt(shown)} mL/hr`]], sub: `${fmt(shown)} mL/hr × ${fmt(conc)} units/mL`,
      solve: [`Delivered: ${fmt(shown)} × ${fmt(conc)} = ${fmt(shown * conc)} units/hr`, `Ordered: ${fmt(uh)} units/hr → ${ok ? "they match" : "they don't match — correct rate is " + fmt(right) + " mL/hr"}`], methods: { da: [`${fmt(shown)} ${c("mL")}/hr × ${fmt(conc)} units/${c("mL")} = ${fmt(shown * conc)} units/hr`] },
      check: ["Work backward from the pump rate to the dose — that's what an independent double-check does."], src: "Heparin concentrations from your Cardiovascular file; rates are practice values" });
  });
  G("recon", "Reconstitution", 9, "recon", (L, R) => {
    const vial = R.pick([[1000, 200], [500, 100], [1000, 250], [2000, 400], [500, 125]]); const order = L === 1 ? vial[1] * R.pick([1, 2, 3]) : R.pick([0.4, 0.6, 1.5, 2.5, 0.75]) * vial[1];
    const diluent = round(vial[0] / vial[1] - R.pick([0.2, 0.3, 0.4]), 1), finalVol = vial[0] / vial[1];
    const raw = calc.reconMl(order, vial[1]), ans = roundML(raw);
    return mk({ inp: { vial, order }, text: `A practice vial contains ${fmt(vial[0])} mg of powder. The label says: add ${fmt(diluent)} mL sterile water to yield ${fmt(vial[1])} mg/mL (final volume ${fmt(finalVol)} mL). The order is ${fmt(order)} mg. How many mL will you draw up? ${ROUND_RULES.ml}`, unit: "mL", unitOpts: units("mL", ["mg", "mL", "mg/mL", "units"]), ans, round: "ml", formula: "recon",
      given: [["Vial", `${fmt(vial[0])} mg`], ["Diluent", `${fmt(diluent)} mL`], ["Final concentration", `${fmt(vial[1])} mg/mL`], ["Order", `${fmt(order)} mg`]], sub: `${fmt(order)} mg ÷ ${fmt(vial[1])} mg/mL`,
      solve: [`Use the FINAL concentration: ${fmt(vial[1])} mg/mL`, `${fmt(order)} ${c("mg")} ÷ ${fmt(vial[1])} ${c("mg")}/mL = ${fmt(raw)} mL${raw !== ans ? " → " + fmt(ans) : ""}`], methods: { da: [`${fmt(order)} ${c("mg")} × 1 mL/${fmt(vial[1])} ${c("mg")} = ${fmt(raw)} mL`], dh: [`(${fmt(order)} ÷ ${fmt(vial[1])}) × 1 mL = ${fmt(raw)} mL`], rp: [`${fmt(vial[1])} mg : 1 mL = ${fmt(order)} mg : x mL`, `x = ${fmt(raw)} mL`] },
      traps: [{ v: roundML(order / vial[0] * diluent), code: "CONC", msg: "You used the diluent volume. The powder adds volume — use the FINAL concentration on the label." }, { v: roundML(order / vial[0]), code: "CONC", msg: "You divided by the whole vial amount instead of the mg per mL." }, { v: roundML(vial[1] / order), code: "FORM", msg: "Ordered dose goes on top." }],
      check: ["Label a multi-dose reconstituted vial with date, time, concentration and your initials.", "Final volume can exceed the diluent volume."], visual: { type: "syringe", ml: ans } });
  });

  /* ---------- Level 10 advanced ---------- */
  G("multistep", "Multi-step pediatric", 10, "wtday", (L, R) => {
    const lb = R.pick([33, 44, 55, 26.4, 39.6]); const kg = round(calc.lbToKg(lb), 1); const perDay = R.pick([6, 30, 40, 50]); const q = R.pick([6, 8, 12]); const n = 24 / q; const conc = perDay === 6 ? [25, 5] : R.pick([[250, 5], [125, 5], [200, 5]]);
    const daily = kg * perDay, per = daily / n, ml = roundML(per / conc[0] * conc[1]);
    const drug = perDay === 6 ? "nitrofurantoin " : "";
    return mk({ inp: { lb, perDay, q, conc }, text: `A child weighs ${lb} lb. Practice order: ${drug}${perDay} mg/kg/day divided every ${q} hours. Available: ${conc[0]} mg/${conc[1]} mL. How many mL per dose? ${ROUND_RULES.ml}`, unit: "mL", unitOpts: units("mL", ["mg", "mL", "mg/day", "kg"]), ans: ml, round: "ml", formula: "wtday", adv: true,
      given: [["Weight", `${lb} lb`], ["Order", `${perDay} mg/kg/day`], ["Frequency", `q${q}h (${n} doses)`], ["Have", `${conc[0]} mg/${conc[1]} mL`]], sub: `kg → mg/day → mg/dose → mL`,
      solve: [`${lb} lb ÷ 2.2 = ${fmt(kg)} kg`, `${fmt(kg)} × ${perDay} = ${fmt(daily)} mg/day`, `${fmt(daily)} ÷ ${n} = ${fmt(per)} mg/dose`, `${fmt(per)} ${c("mg")} × ${conc[1]} mL/${conc[0]} ${c("mg")} = ${fmt(per / conc[0] * conc[1])} mL → ${fmt(ml)} mL`],
      methods: { da: [`${lb} ${c("lb")} × 1 ${c("kg")}/2.2 ${c("lb")} × ${perDay} ${c("mg")}/${c("kg")}/${c("day")} × 1 ${c("day")}/${n} doses × ${conc[1]} mL/${conc[0]} ${c("mg")} = ${fmt(ml)} mL/dose`] },
      traps: [{ v: roundML(daily / conc[0] * conc[1]), code: "DAYDOSE", msg: "You gave the whole day's amount — divide by the number of doses." }, { v: roundML(daily / q / conc[0] * conc[1]), code: "DIVIDE", msg: `Divide by ${n} doses, not by ${q} hours.` }, { v: roundML(lb * perDay / n / conc[0] * conc[1]), code: "CONV", msg: "You used pounds — convert to kg first." }],
      src: drug ? "Nitrofurantoin 6 mg/kg/24 hr and 25 mg/5 mL appear in your earlier course-based question; treat as practice" : "Fictional practice values", visual: { type: "syringe", ml } });
  });
  G("fromrate", "Dose from a running rate", 10, "fromrate", (L, R) => {
    if (R.chance(.5)) { const bag = R.pick([[25000, 500], [25000, 250]]); const mlhr = R.pick([18, 22, 12, 15, 9]); const ans = calc.doseFromRate(mlhr, bag[0], bag[1]);
      return mk({ inp: { t: "units", bag, mlhr }, text: `A heparin infusion (${fmt(bag[0])} units in ${bag[1]} mL) is running at ${mlhr} mL/hr. How many units per hour is the client receiving?`, unit: "units/hr", unitOpts: units("units/hr", ["units/hr", "mL/hr", "units", "mL"]), ans, formula: "fromrate", adv: true, high: true,
        given: [["Rate", `${mlhr} mL/hr`], ["Bag", `${fmt(bag[0])} units / ${bag[1]} mL`]], sub: `${mlhr} × (${fmt(bag[0])} ÷ ${bag[1]})`, solve: [`Concentration: ${fmt(bag[0] / bag[1])} units/mL`, `${mlhr} ${c("mL")}/hr × ${fmt(bag[0] / bag[1])} units/${c("mL")} = ${fmt(ans)} units/hr`], methods: { da: [`${mlhr} ${c("mL")}/hr × ${fmt(bag[0])} units/${bag[1]} ${c("mL")} = ${fmt(ans)} units/hr`] },
        traps: [{ v: round(mlhr / (bag[0] / bag[1]), 2), code: "FORM", msg: "Multiply rate × concentration to get the dose." }, { v: mlhr * bag[0], code: "CONC", msg: "Use units per mL, not the whole bag." }], src: "Heparin concentrations from your Cardiovascular file; rate is a practice value" }); }
    const bag = [400, 250], kg = R.pick([50, 64, 80, 100]), mlhr = R.pick([6, 9, 12, 15]); const raw = calc.mlHrToMcgKgMin(mlhr, kg, bag[0], bag[1]), ans = round(raw, 1);
    return mk({ inp: { t: "mcg", kg, mlhr }, text: `"Drug V" (400 mg in 250 mL) is running at ${mlhr} mL/hr for a ${kg}-kg client. What dose in mcg/kg/min is the client receiving? Round to the tenth.`, unit: "mcg/kg/min", unitOpts: units("mcg/kg/min", ["mcg/kg/min", "mcg/min", "mL/hr", "mg/hr"]), ans, round: "tenth", formula: "fromrate", adv: true,
      given: [["Rate", `${mlhr} mL/hr`], ["Bag", "400 mg / 250 mL = 1,600 mcg/mL"], ["Weight", `${kg} kg`]], sub: `(${mlhr} × 1,600) ÷ 60 ÷ ${kg}`, solve: [`${mlhr} mL/hr × 1,600 mcg/mL = ${fmt(mlhr * 1600)} mcg/hr`, `÷ 60 = ${fmt(mlhr * 1600 / 60)} mcg/min`, `÷ ${kg} kg = ${fmt(raw)} mcg/kg/min`], methods: { da: [`${mlhr} ${c("mL")}/${c("hr")} × 1,600 mcg/${c("mL")} × 1 ${c("hr")}/60 min ÷ ${kg} kg = ${fmt(raw)} mcg/kg/min`] },
      traps: [{ v: round(raw * 60, 1), code: "TIME", msg: "You forgot to divide by 60 (hours → minutes)." }, { v: round(raw * kg, 1), code: "FORM", msg: "You didn't divide by the weight." }] });
  });
  G("bolus", "IV bolus (weight-based)", 10, "wtdose", (L, R) => {
    const mgkg = R.pick([0.1, 0.05, 0.2, 0.5]), kg = R.pick([12, 18, 25, 30, 70]), vial = R.pick([2, 4, 1, 10]);
    const dose = round(kg * mgkg, 2), raw = dose / vial, ans = roundML(raw);
    return mk({ inp: { mgkg, kg, vial }, text: `Practice order: "Drug B" ${mgkg} mg/kg IV push once for a ${kg}-kg client. Vial: ${vial} mg/mL. How many mL? ${ROUND_RULES.ml}`, unit: "mL", unitOpts: units("mL", ["mg", "mL", "mg/kg", "mL/hr"]), ans, round: "ml", formula: "wtdose", adv: true,
      given: [["Weight", `${kg} kg`], ["Order", `${mgkg} mg/kg`], ["Vial", `${vial} mg/mL`]], sub: `(${kg} × ${mgkg}) ÷ ${vial}`, solve: [`${kg} × ${mgkg} = ${fmt(dose)} mg`, `${fmt(dose)} ${c("mg")} ÷ ${vial} ${c("mg")}/mL = ${fmt(raw)} mL${raw !== ans ? " → " + fmt(ans) : ""}`], methods: { da: [`${kg} ${c("kg")} × ${mgkg} ${c("mg")}/${c("kg")} × 1 mL/${vial} ${c("mg")} = ${fmt(raw)} mL`] },
      traps: [{ v: dose, code: "FORM", msg: "That's mg — convert to mL with the vial concentration." }, { v: roundML(raw * 10), code: "DEC", msg: "Decimal slip — check the 0.0 in the mg/kg." }, { v: roundML(vial / dose), code: "FORM", msg: "Flipped ratio." }], check: ["IV push administration is RN scope in many states — know the math, follow your scope."], visual: { type: "syringe", ml: ans } });
  });
  G("bsa", "Body surface area", 10, "bsa", (L, R) => {
    const cm = R.pick([90, 100, 110, 120, 135, 150]), kg = R.pick([12, 16, 20, 25, 32, 40]); const raw = calc.bsa(cm, kg), b = round(raw, 2); const perM2 = R.pick([100, 150, 250, 50]); const ans = round(b * perM2, 1);
    return mk({ inp: { cm, kg, perM2 }, text: `A child is ${cm} cm tall and weighs ${kg} kg. Using BSA = √(cm × kg ÷ 3,600) rounded to the hundredth, calculate a practice dose of ${perM2} mg/m². Round mg to the tenth.`, unit: "mg", unitOpts: units("mg", ["mg", "m²", "mg/m²", "mL"]), ans, round: "tenth", formula: "bsa", adv: true, src: "Your PEDS file lists body surface area as a pediatric dosing method; the formula and values are broader HESI/NCLEX preparation",
      given: [["Height", `${cm} cm`], ["Weight", `${kg} kg`], ["Order", `${perM2} mg/m²`]], sub: `√(${cm} × ${kg} ÷ 3,600) × ${perM2}`, solve: [`${cm} × ${kg} = ${fmt(cm * kg)}`, `÷ 3,600 = ${fmt(cm * kg / 3600)}`, `√ = ${fmt(raw)} → ${fmt(b)} m²`, `${fmt(b)} m² × ${perM2} mg/m² = ${fmt(ans)} mg`], methods: { da: [`BSA ${fmt(b)} ${c("m²")} × ${perM2} mg/${c("m²")} = ${fmt(ans)} mg`] },
      traps: [{ v: round(cm * kg / 3600 * perM2, 1), code: "FORM", msg: "You forgot the square root." }, { v: round(kg * perM2, 1), code: "FORM", msg: "You used weight instead of BSA." }] });
  });
  G("dilution", "Concentration after mixing", 10, "dilution", (L, R) => {
    const g = R.pick([1, 2, 0.5, 4]), ml = R.pick([50, 100, 250, 500]); const raw = g * 1000 / ml, ans = round(raw, 1);
    return mk({ inp: { g, ml }, text: `${fmt(g)} g of a drug is added to make a total volume of ${ml} mL. What is the concentration in mg/mL? Round to the tenth.`, unit: "mg/mL", unitOpts: units("mg/mL", ["mg/mL", "g/mL", "mL/mg", "mg"]), ans, round: "tenth", formula: "dilution", adv: true,
      given: [["Drug", `${fmt(g)} g`], ["Total volume", `${ml} mL`]], sub: `(${fmt(g)} × 1,000) ÷ ${ml}`, solve: [`${fmt(g)} g = ${fmt(g * 1000)} mg`, `${fmt(g * 1000)} mg ÷ ${ml} mL = ${fmt(raw)} mg/mL`], methods: { da: [`${fmt(g)} ${c("g")} × 1,000 mg/${c("g")} ÷ ${ml} mL = ${fmt(raw)} mg/mL`] },
      traps: [{ v: round(g / ml, 4), code: "CONV", msg: "Convert grams to mg first." }, { v: round(ml / (g * 1000), 4), code: "FORM", msg: "Concentration = drug amount ÷ volume." }] });
  });
  G("clarify", "Missing or contradictory orders", 10, "dh", (L, R) => {
    const variant = R.pick(["ok", "noweight", "units", "conflict", "ok2"]);
    if (variant === "ok" || variant === "ok2") { const have = R.pick([125, 250]), desired = have * R.pick([1, 2]); const ans = desired / have * 5;
      return mk({ inp: { variant, desired, have }, kind: "choice", text: `Order: amoxicillin ${desired} mg PO every 8 hours. Available: ${have} mg/5 mL. The order is complete. What do you do?`, choices: [`Give ${fmt(ans)} mL`, `Give ${fmt(ans * 3)} mL`, `Give ${fmt(desired / have)} mL`, "Don't calculate — clarify the order"], ans: 0, unit: "", formula: "dh", adv: true,
        given: [["Order", `${desired} mg q8h`], ["Have", `${have} mg/5 mL`]], solve: [`${desired} ÷ ${have} × 5 mL = ${fmt(ans)} mL — the order has drug, dose, route and frequency, so you can proceed with your usual checks.`] }); }
    const t = { noweight: [`Order: "Drug C" 15 mg/kg PO now for a child. Available: 100 mg/5 mL. No weight is documented today.`, "The weight is missing — you can't calculate a mg/kg dose without it."], units: [`Order: digoxin 0.125 PO daily. Available: 0.125 mg tablets.`, "The order has no unit (mg? mcg?). Never assume a unit."], conflict: [`Order: heparin 5,000 units subcut every 8 hours AND heparin infusion 1,000 units/hr IV — both active at once, no note explaining.`, "Contradictory anticoagulant orders must be clarified before giving either."] }[variant];
    return mk({ inp: { variant }, kind: "choice", text: `${t[0]} What do you do?`, choices: ["Give 1 tablet / the usual amount", "Estimate using the last known value", "Calculate it the way the previous nurse did", "Don't calculate — clarify the order with the prescriber"], ans: 3, unit: "", formula: "dh", adv: true,
      given: [["Problem", t[1]]], solve: [t[1], "Invalid, missing or contradictory information gets a clarification — never a fabricated answer."], src: "Drug names from your course files; scenario is a practice value" });
  });

  /* ---------- solve for diagnosis ---------- */
  function diagnose(p, val, unit) {
    if (p.kind === "choice") return val === p.ans ? { ok: true } : { ok: false, code: p.formula === "safe" ? "SAFE" : p.formula === "round" ? "ROUND" : "SAFE", msg: p.formula === "safe" ? (p.ans === 3 ? "Information was missing — the right move is to clarify, not to calculate." : val === 0 ? "The daily total falls outside the stated range — that order needs clarification." : "Recalculate the daily total and compare it with both ends of the range.") : "Look again at what makes the other options unsafe." };
    const tol = 1e-6 + Math.abs(p.ans) * 1e-9;
    const valueOk = Math.abs(val - p.ans) <= tol;
    const unitOk = !p.unit || unit === p.unit;
    if (valueOk && unitOk) return { ok: true };
    if (valueOk && !unitOk) return { ok: false, code: "UNIT", msg: `Your number is right, but the unit is wrong. The question asks for ${p.unit}.` };
    for (const t of p.traps) { if (t.v != null && isFinite(t.v) && Math.abs(val - t.v) <= Math.max(1e-6, Math.abs(t.v) * 0.002) && Math.abs(t.v - p.ans) > tol) return { ok: false, code: t.code, msg: t.msg, unitWrong: !unitOk }; }
    if (p.ans !== 0) { for (const f of [10, 100, 1000]) { if (Math.abs(val - p.ans * f) <= Math.abs(p.ans * f) * 0.001 || Math.abs(val - p.ans / f) <= Math.abs(p.ans / f) * 0.001) return { ok: false, code: "DEC", msg: `Your answer is off by a factor of ${f.toLocaleString()} — check decimal placement and metric conversions.`, unitWrong: !unitOk }; } }
    const near = [0, 1, 2].some(d => Math.abs(round(val, d) - p.ans) <= tol) || Math.abs(val - p.ans) <= Math.max(0.051, Math.abs(p.ans) * 0.01);
    if (near) return { ok: false, code: "ROUND", msg: `Close — check the rounding rule. ${ROUND_RULES[p.round] || ""}`, unitWrong: !unitOk };
    return { ok: false, code: "ARITH", msg: "The setup or arithmetic went off track. Compare each line of your work with the worked solution.", unitWrong: !unitOk };
  }

  function generate(cat, level, seed) {
    const R = rng(seed);
    const p = CAT[cat].gen(Math.max(1, Math.min(3, level)), R);
    p.cat = cat; p.level = level; p.seed = seed; p.lesson = CAT[cat].lesson;
    if (CAT[cat].lesson === 10) p.adv = true;
    return p;
  }
  const FIXED = { // the prompt's worked examples, validated in tests
    lbkg: { text: "A patient weighs 154 lb. What is the weight in kilograms?", calc: () => calc.lbToKg(154), ans: 70, unit: "kg" },
    tabs: { text: "Order: 750 mg. Available: 250 mg per tablet.", calc: () => calc.dh(750, 250, 1), ans: 3, unit: "tablet(s)" },
    liquid: { text: "Order: 375 mg. Available: 125 mg per 5 mL.", calc: () => calc.dh(375, 125, 5), ans: 15, unit: "mL" },
    wtdose: { text: "A child weighs 20 kg. Practice order: 10 mg/kg/dose.", calc: () => calc.wtDose(20, 10), ans: 200, unit: "mg" },
    safe: { text: "20 kg child; range 15–25 mg/kg/day; order 180 mg every 12 hours.", calc: () => calc.safeRange(20, 15, 25, 180, 2).daily, ans: 360, unit: "mg/day" },
    ivrate: { text: "Infuse 1,000 mL over 8 hours.", calc: () => calc.mlPerHr(1000, 8), ans: 125, unit: "mL/hr" },
    gtt: { text: "1,000 mL over 8 hours; drop factor 15 gtt/mL.", calc: () => round(calc.gttPerMin(1000, 15, 480), 0), ans: 31, unit: "gtt/min" },
    recon: { text: "Vial 1,000 mg; final concentration 200 mg/mL; order 500 mg.", calc: () => calc.reconMl(500, 200), ans: 2.5, unit: "mL" },
    heparin: { text: "Heparin 1,000 units/hr; bag 25,000 units/250 mL.", calc: () => calc.rateFromDose(1000, 25000, 250), ans: 10, unit: "mL/hr" },
    mcgkgmin: { text: "5 mcg/kg/min; 80 kg; 400 mg in 250 mL.", calc: () => calc.mcgKgMinToMlHr(5, 80, 400, 250), ans: 15, unit: "mL/hr" }
  };
  // v2.1: strict numeric input — the WHOLE entry must be a number. "12abc", "1.2.3", "5." , "-" and "" are rejected (NaN).
  // Accepts 1250, 1,250, 0.5, 12.75. A bare leading decimal (".5") is rejected so the app can teach the leading-zero rule.
  function parseNum(str) {
    const t = String(str == null ? "" : str).trim();
    if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(t)) return NaN;
    return Number(t.replace(/,/g, ""));
  }
  function numIssue(str) {
    const t = String(str == null ? "" : str).trim();
    if (!t) return "Enter a number.";
    if (/^\.\d+$/.test(t)) return "Use a leading zero (write 0" + t + ", not " + t + ") — a naked decimal point is a known medication-error risk.";
    if (/^\d+\.$/.test(t)) return "Finish the number — remove the trailing decimal point.";
    if (/[a-z]/i.test(t)) return "Type only the number here and choose the unit separately.";
    if (isNaN(parseNum(t))) return "That isn't a valid number. Use digits with one decimal point, like 2.5 or 1,250.";
    return "";
  }
  return { round, roundML, fmt, calc, rng, ERR, FORMULAS, LESSONS, CAT, generate, diagnose, ROUND_RULES, FIXED, SAFE_CHOICES, parseNum, numIssue };
})();
if (typeof module !== "undefined") module.exports = MM;
