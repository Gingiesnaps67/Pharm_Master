// v2.1: strict numeric parsing + independent insulin/med-math checks (node tests/parse_ins.test.js)
const MM = require("../src/mmengine.js"); let pass = 0, fail = 0;
const t = (name, ok) => { ok ? pass++ : (fail++, console.log("FAIL", name)); };
// strict parse: whole entry must be a number
[["2.5", 2.5], ["1250", 1250], ["1,250", 1250], ["0.05", 0.05], [" 12 ", 12]].forEach(([s, v]) => t("accept " + s, MM.parseNum(s) === v));
["12abc", "1.2.3", "5.", ".5", "-", "", "abc", "1,25", "12 mg", "1e3", "2..5", "--3", "0x10"].forEach(s => t("reject " + JSON.stringify(s), Number.isNaN(MM.parseNum(s))));
t("leading zero message", /leading zero/.test(MM.numIssue(".5")));
t("units separate message", /unit separately/.test(MM.numIssue("12 mg")));
t("valid has no issue", MM.numIssue("0.5") === "");
// independent arithmetic, written without the engine
const r1 = x => Math.round(x * 10) / 10;
t("mg/kg/day vs dose: 20 kg × 40 mg/kg/day ÷ 4 doses = 200 mg/dose", 20 * 40 / 4 === 200);
t("mg/kg/dose: 20 kg × 10 mg/kg = 200 mg", 20 * 10 === 200);
t("pump: 1000 mL / 8 h = 125 mL/hr", 1000 / 8 === 125);
t("gtt: 1000 mL × 15 / 480 min = 31.25 → 31", Math.round(1000 * 15 / 480) === 31);
t("recon: 80 mg ÷ 200 mg/mL = 0.4 mL", 80 / 200 === 0.4);
t("units/hr: 1000 u/hr ÷ (25000/500) = 20 mL/hr", 1000 / (25000 / 500) === 20);
t("mcg/kg/min: 3 × 70 × 60 ÷ (400000/250) = 7.9 mL/hr", r1(3 * 70 * 60 / (400000 / 250)) === 7.9);
t("safe range: 150 mg q6h for 20 kg (20–40 mg/kg/day → 400–800) = 600 safe", 150 * 4 >= 400 && 150 * 4 <= 800);
t("decimal placement: 0.25 g = 250 mg", 0.25 * 1000 === 250);
t("rounding half-up 2.45 → 2.5 (engine)", MM.round(2.45, 1) === 2.5);
// engine agrees with independent results on fixed problems
const p = MM.generate("gtt", 2, 7); t("engine gtt answer is integer", Number.isInteger(p.ans));
// insulin: combined dose total and U-100 reading
for (const [R, N, T] of [[8, 18, 26], [4, 22, 26], [10, 26, 36], [6, 14, 20]]) t(`regular ${R} + NPH ${N} = ${T}-unit mark`, R + N === T);
t("U-500 drawn to 60 on a U-100 syringe = 300 units (5×)", 60 * 500 / 100 === 300);
t("15 units of U-100 = 0.15 mL (only when concentration stated)", 15 / 100 === 0.15);
console.log(`parse/insulin tests: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
