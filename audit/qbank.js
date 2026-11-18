const fs=require("fs");
const src=fs.readFileSync(process.argv[2],"utf8");
const m=src.match(/<script>([\s\S]*)<\/script>/);let code=m[1];
// stub DOM bits
global.window={addEventListener(){},claude:null};global.document={addEventListener(){},querySelector(){return null},documentElement:{setAttribute(){}},visibilityState:"hidden",body:{}};global.localStorage={getItem(){return null},setItem(){}};global.location={hash:""};global.setInterval=()=>0;global.matchMedia=()=>({matches:false});
code=code.replace(/\/\* ---------- boot ---------- \*\/[\s\S]*$/,"");
eval(code+";global.X={QUESTIONS,SCEN_Q,GEN,ALLQ,DRUGS,evaluate,DRUG};");
const {QUESTIONS,SCEN_Q,GEN,DRUGS,DRUG}=X; const out={};
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>3);
const jac=(a,b)=>{a=new Set(norm(a));b=new Set(norm(b));const i=[...a].filter(x=>b.has(x)).length;return i/(a.size+b.size-i||1)};
// 1 duplicates among authored+scenario stems
const AQ=[...QUESTIONS,...SCEN_Q.map(q=>({...q,stem:q.scen.title+" "+q.scen.order+" "+q.scen.note}))];
out.nearDupAuthored=[];for(let i=0;i<AQ.length;i++)for(let j=i+1;j<AQ.length;j++){const s=jac(AQ[i].stem+" "+AQ[i].opts?.join(" "),AQ[j].stem+" "+AQ[j].opts?.join(" "));if(s>.35)out.nearDupAuthored.push([AQ[i].id,AQ[j].id,s.toFixed(2)]);}
// same concept repeated
const byC={};AQ.forEach(q=>(byC[q.concept]=byC[q.concept]||[]).push(q.id));out.sharedConcepts=Object.entries(byC).filter(([,v])=>v.length>1);
// 2 generated duplicates of authored (same drug + same correct answer text)
out.genDupOfAuthored=GEN.filter(g=>QUESTIONS.some(q=>q.drug===g.drug&&q.fmt==="mc"&&q.opts[q.key].toLowerCase().includes(String(g.opts[g.key]).toLowerCase().slice(0,18)))).map(g=>g.id);
// 3 ambiguous generated distractors: distractor's key words appear in target drug's own text
const words=s=>norm(s).filter(w=>!["with","from","that","this","when","than","each","before","after","dose","drug","level","signs"].includes(w));
out.ambiguousGen=[];
GEN.forEach(g=>{const d=DRUG[g.drug];const own=[d.mon,d.nur,d.sae,d.ae,d.ci,d.ix,d.cls,d.moa].join(" ").toLowerCase();
 g.opts.forEach((o,i)=>{if(i===g.key)return;const w=words(o);if(!w.length)return;const hit=w.filter(x=>own.includes(x)).length/w.length;if(hit>=.6)out.ambiguousGen.push({id:g.id,stem:g.stem.slice(0,70),distractor:o,key:g.opts[g.key],overlap:+hit.toFixed(2)});});});
// 4 structural checks
out.structural=[];[...QUESTIONS,...SCEN_Q].forEach(q=>{if(q.opts&&new Set(q.opts).size!==q.opts.length)out.structural.push([q.id,"duplicate options"]);if(q.fmt==="mc"&&!q.why)out.structural.push([q.id,"no per-distractor rationale"]);if(!q.src)out.structural.push([q.id,"no course source (reference content)"]);});
// 5 order items (sequence ambiguity flagged for manual review)
out.orderItems=QUESTIONS.filter(q=>q.fmt==="order").map(q=>q.id);
// 6 difficulty distribution
out.diff={};[...QUESTIONS,...SCEN_Q].forEach(q=>out.diff[q.d]=(out.diff[q.d]||0)+1);
out.formats={};QUESTIONS.forEach(q=>out.formats[q.fmt]=(out.formats[q.fmt]||0)+1);
// 7 evaluate() unit checks
const t=[];const E=X.evaluate;
t.push(E({fmt:"mc",key:2},2)===true,E({fmt:"mc",key:2},1)===false,E({fmt:"sata",key:[0,2]},new Set([2,0]))===true,E({fmt:"sata",key:[0,2]},new Set([0,2,3]))===false,E({fmt:"order",opts:[1,2,3]},[0,1,2])===true,E({fmt:"order"},[1,0,2])===false,E({fmt:"matrix",key:[1,0]},[1,0])===true,E({fmt:"matrix",key:[1,0]},[1,1])===false,E({fmt:"bowtie",condKey:0,actKey:[0,1],monKey:[2,3]},{c:0,a:new Set([1,0]),m:new Set([3,2])})===true,E({fmt:"mc",key:0},null)===false);
out.evaluateTests=t.every(Boolean)+" ("+t.filter(Boolean).length+"/"+t.length+")";
// 8 drugs lacking source
out.drugsNoSource=DRUGS.filter(d=>!d.src).map(d=>d.g); out.flagged=DRUGS.filter(d=>d.flag).map(d=>d.g);
out.counts={authored:QUESTIONS.length,scen:SCEN_Q.length,gen:GEN.length};
fs.writeFileSync("audit/qbank.json",JSON.stringify(out,null,1));
console.log(JSON.stringify({counts:out.counts,nearDupAuthored:out.nearDupAuthored,sharedConcepts:out.sharedConcepts.length,genDup:out.genDupOfAuthored.length,ambiguous:out.ambiguousGen.length,ambiguousGenQs:new Set(out.ambiguousGen.map(a=>a.id)).size,structural:out.structural,order:out.orderItems,diff:out.diff,formats:out.formats,evaluate:out.evaluateTests,noSrc:out.drugsNoSource},null,0));
console.log(out.ambiguousGen.slice(0,12).map(a=>a.id+" | "+a.distractor+" | key: "+a.key).join("\n"));
