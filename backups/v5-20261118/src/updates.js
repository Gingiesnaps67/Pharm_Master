/* ================= PHARM MASTER 2.1 — clinical currency layer =================
   Course text stays visible; verified current references are shown beside it ("Course taught / Current reference /
   What to remember"). Drug fields used by exams are corrected here so scored items never rely on an outdated rule.
   All references below were opened and read on 2026-11-01. */
const ACCESSED = "2026-11-01";
const REFS = {
  cdcIns: { t: "CDC — How to Use Insulin (insulin types table)", u: "https://www.cdc.gov/diabetes/about/how-to-use-insulin.html" },
  adaIns: { t: "American Diabetes Association — Insulin Basics", u: "https://diabetes.org/health-wellness/medication/insulin-basics" },
  adaHosp: { t: "ADA Standards of Care 2026 — 16. Diabetes Care in the Hospital", u: "https://diabetesjournals.org/care/article/49/Supplement_1/S339/163925/16-Diabetes-Care-in-the-Hospital-Standards-of-Care" },
  humN: { t: "DailyMed — HUMULIN N label (rev. 12/2025): mixing, resuspension, no IV", u: "https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f6edd793-440b-40c2-96b5-c16133b7a921" },
  novolog: { t: "DailyMed — NOVOLOG label (rev. 12/2023): mixing with NPH, supervised IV use", u: "https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=professional&setid=13891e5a-e57a-46e8-911c-2f680352b52b" },
  lantus: { t: "DailyMed — LANTUS label (rev. 6/2023): do not mix or dilute; same time daily", u: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=632d9f68-f184-43d5-b184-a3af23f12ad9&type=display" },
  humalog: { t: "DailyMed — HUMALOG label (rev. 1/2026): U-100 supervised IV; U-200 never IV, never mixed, never drawn from pen", u: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c8ecbd7a-0e22-4fc7-a503-faa58c1b6f3f" },
  cdcPen: { t: "CDC — Injection Safety for Healthcare Providers (pens are single-patient)", u: "https://www.cdc.gov/injection-safety/hcp/infection-control/" },
  u500: { t: "FDA label — Humulin R U-500 (concentrated insulin syringe safety)", u: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/018780s180lbl.pdf" },
  levemir: { t: "Drugs.com / University of Utah Drug Information Service — Insulin detemir (Levemir) discontinued in the U.S. at the end of 2024", u: "https://www.drugs.com/drug-shortages/insulin-detemir-injection-1006" },
  andexxa: { t: "TCTMD — Andexanet alfa pulled from US market (Dec 22, 2025; FDA safety communication)", u: "https://www.tctmd.com/news/andexanet-alfa-pulled-us-market" },
  cloz: { t: "Psychiatric Times — FDA officially eliminates clozapine REMS (June 2025); ANC monitoring still recommended", u: "https://www.psychiatrictimes.com/view/fda-officially-eliminates-clozapine-rems" },
  ntg: { t: "MedlinePlus — Nitroglycerin sublingual: when to get emergency help", u: "https://medlineplus.gov/druginfo/meds/a601086.html" },
  mec: { t: "Contraceptive Technology / Clinician.com — Antibiotics and hormonal contraception (CDC U.S. MEC: broad-spectrum antibiotics Category 1; rifamycins differ)", u: "https://www.clinician.com/articles/142314-what-effect-do-antibiotics-have-on-hormonal-contraception" },
  acr: { t: "UIC Drug Information Group — ACR and FDA guidance on metformin with iodinated contrast", u: "https://dig.pharmacy.uic.edu/faqs/2023-2/september-2023-faqs/what-are-current-best-practices-on-holding-metformin-prior-to-and-post-contrast-administration" }
};
/* d: drug id; course: what the course/app taught (with its source); now: the verified update; exam: what to remember;
   set: corrected drug fields (exam questions are generated from these); review: unresolved items shown as Needs review */
const UPDATES = [
  { d: "apixaban", topic: "Reversal agent", course: "Earlier app text listed andexanet alfa (Andexxa) as the apixaban reversal agent (reference content, not from your course files).",
    now: "Andexanet alfa was withdrawn from the U.S. market (no longer made or sold after Dec 22, 2025) after the FDA found its risks outweighed its benefits.", refs: ["andexxa"],
    exam: "Don't name Andexxa as an available U.S. antidote. Bleeding on a DOAC = stop the drug, assess, and escalate per facility protocol.",
    set: { anti: "No antidote listed in this app — andexanet alfa (Andexxa) was withdrawn from the U.S. market in Dec 2025; reversal follows facility protocol" },
    review: "Which reversal product your facility uses for factor Xa inhibitors — not in your course files." },
  { d: "coc", topic: "Antibiotics and the pill", course: "Course (Reproductive Health, oral contraceptives): antibacterials such as penicillins, tetracyclines and rifampin can make contraceptives less effective — use backup.",
    now: "The CDC U.S. MEC lists common broad-spectrum antibiotics as Category 1 (no restriction) with combined hormonal contraceptives. Rifamycins (rifampin, rifabutin) are the antibiotics that do lower hormone levels, so backup or another method is advised.", refs: ["mec"],
    exam: "If an item asks generally, follow your course. When a question names rifampin, the answer is backup contraception.",
    set: { teach: "Report severe headache, blurred vision, leg pain, shortness of breath, chest pain, abdominal pain. Use backup contraception with rifampin (or rifabutin) — ask the prescriber about any new drug. Patch: fold and discard, don't flush." } },
  { d: "regular", topic: "IV insulin", course: "Course (Med-Surg endocrine slides, Hyperglycemia treatment): \"Regular Insulin only insulin administered IV.\"",
    now: "Regular U-100 is the insulin traditionally used for IV infusions, but it is not the only one: Humalog U-100 and NovoLog labels allow IV use under medical supervision with close glucose and potassium monitoring. Concentrated products (e.g., Humalog U-200, Humulin R U-500) must NOT be given IV.", refs: ["humalog", "novolog", "u500"],
    exam: "On the exam, 'regular insulin is the IV insulin' (e.g., DKA drips) is still the expected answer — just don't say it is the only one ever used.",
    set: { nur: "Regular U-100 is the insulin classically used for IV infusions (always under close supervision with glucose and potassium checks). When mixing with NPH, draw regular (clear) FIRST.", exam: "Regular = short-acting; the classic IV insulin (DKA drips); clear before cloudy." } },
  { d: "lispro", topic: "Meal timing", course: "App text: \"tray must be present\"; \"no meal = no lispro.\"",
    now: "Humalog label: inject within 15 minutes before a meal or immediately after a meal. Meal-coverage (prandial) doses are coordinated with food; correction doses follow their own order and may still be ordered when a patient is not eating. U-100 may be given IV only under medical supervision; U-200 is never IV, never mixed, never drawn from the pen.", refs: ["humalog", "adaHosp"],
    exam: "Rapid-acting meal insulin is given when the patient can eat within minutes. Tray delayed or patient can't eat → don't give the meal dose yet; clarify the plan.",
    set: { nur: "Give within 15 minutes before a meal or right after eating (label). Confirm the meal is available and the patient can eat; correction doses follow their own order.", exam: "Rapid-acting meal insulin: coordinate with the tray. No meal yet → don't give meal coverage; clarify.", aid: "Lispro: 'Lips to the Plate' — food within about 15 minutes.", flag: "" } },
  { d: "nph", topic: "NPH timing", course: "Course (Med-Surg slide 51): intermediate-acting insulin has an onset of about 30 minutes and a 6–12 hour effect.",
    now: "CDC insulin table: intermediate-acting onset 2–4 h, peak 4–12 h, duration 12–18 h. Humulin N label: median maximum effect 6.5 h (range 2.8–13 h) in a study; times vary by person and dose. Roll and invert gently to resuspend — never shake; never IV.", refs: ["cdcIns", "humN"],
    exam: "Morning NPH → watch for hypoglycemia in the afternoon (peak). Cloudy, drawn second.",
    set: { flag: "Course slide gives NPH onset ~30 min / 6–12 h effect; CDC lists onset 2–4 h, peak 4–12 h, duration 12–18 h. Learn the peak window — that's what exams test.", nur: "Roll and invert gently to resuspend (do not shake). Uniformly cloudy is normal. Draw after regular or labeled rapid insulin. Never IV." } },
  { d: "glargine", topic: "Timing and mixing", course: "Course (PEDS insulin regimens): long-acting insulin is given once a day, usually before bedtime; formulations include glargine (Lantus) and detemir (Levemir).",
    now: "Lantus label: once daily at ANY time of day, but at the same time every day; do not dilute or mix with any other insulin; not IV. Levemir (detemir) left the U.S. market at the end of 2024.", refs: ["lantus", "levemir"],
    exam: "Glargine: clear, no pronounced peak, never mixed, same time daily (bedtime is common, not required).",
    set: { nur: "Once daily at the same time every day (often bedtime, but any consistent time per order). Never mix or dilute; never IV.", ae: "Injection-site reactions; lipodystrophy if sites not rotated" } },
  { d: "clozapine", topic: "Monitoring", course: "Course (Psychiatric packet, atypical antipsychotics): WBC/ANC — weekly monitoring necessary.",
    now: "The FDA eliminated the clozapine REMS in June 2025 (no registry participation required), but ANC monitoring is still recommended and severe neutropenia remains in the prescribing information.", refs: ["cloz"],
    exam: "Clozapine → monitor ANC (absolute neutrophil count); sore throat/fever = hold and report.",
    set: { mon: "ANC (absolute neutrophil count) per the prescribing schedule; signs of infection", exam: "Clozapine → ANC monitoring; sore throat or fever = hold and report urgently." } },
  { d: "nitroglycerin", topic: "When to escalate chest pain", course: "Course/app: sublingual every 5 minutes, up to 3 doses; notify if pain unrelieved after the third.",
    now: "MedlinePlus: up to three doses 5 minutes apart, and if symptoms don't improve much or get worse after the FIRST dose, the patient may be told to get emergency help right away; get emergency help if pain hasn't gone away completely after the third dose.", refs: ["ntg"],
    exam: "Home teaching: no better or worse 5 minutes after the first tablet → call 911. In the hospital: notify the RN/provider right away while following protocol.",
    set: { nur: "Sublingual every 5 min, up to 3 doses, BP before each. Pain not better or worse 5 min after the FIRST dose → get emergency help (home: call 911; hospital: notify RN/provider now). Patient sits or lies down.", exam: "Nitro: 1 tab q5min ×3 max; no relief after the first → emergency help." } },
  { d: "misoprostol", topic: "Pregnancy restriction depends on the indication", course: "Course (GI prostaglandin): contraindicated in pregnancy. Course (Maternal Health): misoprostol is used for cervical ripening/labor induction and serious postpartum hemorrhage from uterine atony; contraindicated for VBAC.",
    now: "Both are true for different indications: for NSAID-ulcer prevention misoprostol must not be taken in pregnancy (it causes uterine contractions); in obstetrics it is given deliberately by the provider for ripening or hemorrhage.", refs: [],
    exam: "Ulcer-prevention order + possible pregnancy → clarify. Obstetric order on L&D → expected use under provider direction.",
    set: { ind: "Prevent NSAID/aspirin gastric ulcers; obstetric uses directed by the provider (cervical ripening, postpartum hemorrhage)", ci: "Pregnancy when used for NSAID-ulcer prevention; VBAC (prior uterine scar)", nur: "Ulcer prevention: confirm not pregnant and teach contraception. Obstetric use: provider-ordered, with uterine and fetal monitoring." } },
  { d: "metformin", topic: "Iodinated contrast", course: "App text: hold around iodinated contrast per protocol.",
    now: "ACR: with eGFR ≥30 and no acute kidney injury, metformin need not be stopped for IV contrast. With eGFR <30, AKI, or arterial catheter studies, stop at the time of the procedure, hold 48 h, and restart only after kidney function is rechecked. The FDA label uses a broader eGFR 30–60 trigger, so facility protocols differ.", refs: ["acr"],
    exam: "Contrast scheduled → check kidney function and the facility protocol; rising creatinine/AKI → hold and clarify.",
    set: { ci: "Type 1 DM; eGFR <30", nur: "Give with meals to reduce GI upset. Before iodinated contrast, check kidney function and the protocol: eGFR <30 or AKI → hold and clarify; recheck kidney function before restarting.", exam: "Metformin + contrast → check kidney function; AKI or eGFR <30 → hold per protocol." } }
];
const UPD = Object.fromEntries(UPDATES.map(u => [u.d, u]));
UPDATES.forEach(u => { const d = DRUGS.find(x => x.id === u.d); if (d && u.set) Object.assign(d, u.set); });
/* question repairs (kept with their ids so history stays linked) */
(function () {
  const Q = id => QUESTIONS.find(q => q.id === id);
  const g5 = Q("g5"); if (g5) Object.assign(g5, {
    stem: "A client taking a combined oral contraceptive is started on rifampin for latent tuberculosis. What should the nurse teach?",
    rat: "Rifampin (a rifamycin) speeds hormone breakdown and lowers contraceptive effectiveness, so backup contraception is needed. Your course lists antibacterials generally; current CDC guidance says most broad-spectrum antibiotics do not reduce effectiveness — rifamycins are the exception.",
    why: { 1: "Stopping the pill removes protection; continue it and add backup.", 2: "Doubling the pill is not the teaching; backup contraception is.", 3: "Rifampin is the antibiotic that does reduce effectiveness." }, upd: "coc" });
  const m6 = Q("m6"); if (m6) m6.rat = "When misoprostol is ordered for NSAID-ulcer prevention it is contraindicated in pregnancy (it causes uterine contractions and can cause miscarriage). Obstetric uses are deliberate and provider-directed.";
  const e4 = Q("e4"); if (e4) e4.rat = "Rising creatinine before iodinated contrast suggests kidney injury — metformin needs clarification per protocol (ACR: hold with AKI or eGFR <30). A sulfonylurea given while NPO risks hypoglycemia. The statin and fasting glucose of 128 are not urgent.";
  const h10 = SCENARIOS.find(s => s.id === "h10"); if (h10) Object.assign(h10, {
    opts: ["Give the full lispro dose now per scale", "Hold the dose for now and clarify timing with the RN/prescriber — coordinate it with the delayed tray and the radiology trip", "Give regular insulin instead", "Skip insulin for the day"],
    rat: "Lispro acts within about 15 minutes, so a dose given now with no meal for ~45 minutes and the client off the unit risks hypoglycemia. Don't skip insulin in type 1 diabetes — clarify how and when to give it (correction insulin follows its own order).",
    why: { 0: "Hypoglycemia risk while the client is off the unit without food.", 2: "Substituting a different insulin needs an order.", 3: "A client with type 1 diabetes always needs insulin — skipping risks ketosis." } });
  const ins = COMPARE.find(c => c.id === "insulin"); if (ins) {
    ins.rows = ins.rows.map(r => r[0] === "IV?" ? ["IV?", "U-100 only under supervision (label)", "Yes — the classic IV insulin", "No", "No"] : r[0] === "When given" ? ["When given", "Within 15 min before or right after a meal", "30–60 min before meals; DKA drips", "Usually AM and/or PM", "Once daily, same time each day"] : r);
    ins.point = "Use the Insulin Lab timeline for onset/peak/duration (CDC table). Order of action: rapid → short → intermediate → long.";
  }
  const endo = MODULES.endo; if (endo) endo.warn = endo.warn.map(w => w === "Regular is the only IV insulin." ? "Regular is the classic IV insulin (supervised infusions); never give concentrated insulin IV." : w === "Rapid-acting insulin needs food present." ? "Rapid-acting meal insulin: food within about 15 minutes." : w);
  const ac = COMPARE.find(c => c.id === "anticoag"); if (ac) ac.rows = ac.rows.map(r => r[0] === "Reversal" ? r.map(c => c.replace("Andexanet (Xa)†", "Andexxa withdrawn from U.S. (2025)")) : r);
})();
function updHTML(d) {
  const u = UPD[d.id]; if (!u) return "";
  const refs = u.refs.map(k => REFS[k]).filter(Boolean);
  return `<div class="updbox" role="note"><div class="label">${ico("flag", 14)} Course vs. current reference · ${esc(u.topic)}</div>
   <div class="upd-grid"><div><b>Course taught</b><p class="small">${esc(u.course)}</p></div><div><b>Current reference</b><p class="small">${esc(u.now)}</p>${refs.length ? `<ul class="xs reflist">${refs.map(r => `<li><a href="${r.u}" target="_blank" rel="noopener">${esc(r.t)}</a> · accessed ${ACCESSED}</li>`).join("")}</ul>` : `<p class="xs muted">Both points come from your own course files.</p>`}</div>
   <div><b>What to remember for the exam</b><p class="small">${esc(u.exam)}</p></div></div>${u.review ? `<div class="chip badge-flag">Needs review: ${esc(u.review)}</div>` : ""}</div>`;
}
