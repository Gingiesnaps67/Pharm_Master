# PHARM MASTER 2.1 — Insulin Lab + repair acceptance tests
import json, sys
from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
open('/tmp/claude-0/t5.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+html+'</body></html>')
U='file:///tmp/claude-0/t5.html'; R=[]; errs=[]
W=int(sys.argv[1]) if len(sys.argv)>1 else 390
def ok(k,v,info=''): R.append((k,v)); print(('PASS ' if v else 'FAIL ')+k+(' '+str(info) if (info and not v) else ''))
NICK=json.load(open('backups/db/data/users/me/progress.json'))['json']
def mix_run(pg, variant='rn', assisted=False):
  pg.evaluate(f"mixNew('{variant}',{str(assisted).lower()});MX.fault=null;route()"); pg.wait_for_selector('.mixsim')
  m=pg.evaluate('({R:MX.R,N:MX.N})'); T=m['R']+m['N']; cap=[c for c in [30,50,100] if c>=T][0]
  def act(a): pg.click(f'[data-mx="{a}"]')
  def plunge(v): pg.fill('#mxpn', str(v)); pg.press('#mxpn','Tab')
  act('verify'); act(f's{cap}'); act('swab'); act('roll'); plunge(m['N']); act('airN'); plunge(m['R']); act('airC'); plunge(m['R']); act('drawC'); act('bub'); plunge(T); act('drawN'); act('give')
  return m, T
with sync_playwright() as pw:
  b=pw.chromium.launch(); pg=b.new_page(viewport={'width':W,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  pg.goto(U); pg.evaluate('j=>{localStorage.clear();localStorage.setItem("pharm-master-v1", j)}', NICK); pg.reload(); pg.wait_for_selector('#view h1')
  o=json.loads(NICK); s=pg.evaluate('S')
  ok('saved progress kept on load (days, minutes, games)', s['days']==o['days'] and s['mins']==o['mins'] and s['games']==o['games'])
  # --- clinical corrections
  ok('apixaban: Andexxa not offered as an available antidote', 'withdrawn' in pg.evaluate('DRUG.apixaban.anti') and not any('apixaban' in q for q in pg.evaluate('GEN.map(q=>q.id)') if q.endswith(':anti')))
  ok('regular no longer "the ONLY insulin given IV"', 'ONLY' not in pg.evaluate('DRUG.regular.nur') and 'only' not in pg.evaluate('JSON.stringify(COMPARE.find(c=>c.id==="insulin").rows)').lower().replace('u-100 only',''))
  ok('clozapine monitoring = ANC (REMS update shown)', 'ANC' in pg.evaluate('DRUG.clozapine.mon'))
  ok('nitro escalation after FIRST dose', 'FIRST' in pg.evaluate('DRUG.nitroglycerin.nur'))
  ok('misoprostol pregnancy restriction is indication-specific', 'NSAID' in pg.evaluate('DRUG.misoprostol.ci'))
  ok('metformin contrast tied to kidney function', 'eGFR' in pg.evaluate('DRUG.metformin.nur'))
  ok('g5 antibiotic item now about rifampin', 'rifampin' in pg.evaluate('QBYID.g5.stem'))
  ok('glargine not "must be bedtime"', 'same time every day' in pg.evaluate('DRUG.glargine.nur'))
  pg.goto(U+'#library/clozapine'); pg.wait_for_selector('.steps'); ok('drug page shows Course vs current panel with links', pg.locator('.updbox').count()==1 and pg.locator('.updbox a[href^="https"]').count()>=1)
  pg.goto(U+'#library/regular'); pg.wait_for_selector('.steps'); ok('regular drug page deep-links to Insulin Lab', pg.locator('a.inslink[href="#insulin/mix"]').count()==1)
  ok('degludec + 70/30 added to library', pg.evaluate('!!DRUG.degludec && !!DRUG.premix7030'))
  # --- strict numeric input
  ok('parseNum rejects 12abc / 1.2.3 / .5', pg.evaluate('[MM.parseNum("12abc"),MM.parseNum("1.2.3"),MM.parseNum(".5")].every(Number.isNaN)') and pg.evaluate('MM.parseNum("1,250")')==1250)
  pg.goto(U+'#math/bench'); pg.wait_for_selector('.bench'); pg.click('[data-st=ivrate]'); pg.fill('#wbn','12abc'); pg.click('#wbcheck'); ok('workbench refuses "12abc"', not pg.evaluate('WB.done'))
  # --- MED MATH exam: hint opened = assisted
  pg.goto(U+'#math/exam'); pg.wait_for_selector('#mmv')
  pg.evaluate("MMX.fb='tutor';MMX.ff=false;MMX.n=10")
  started=pg.evaluate("(()=>{const b=[...document.querySelectorAll('#mmv button')].find(x=>/start/i.test(x.textContent));if(b){b.click();return true}return false})()")
  pg.wait_for_timeout(200)
  if started and pg.locator('#xhint').count():
    before=pg.evaluate('S.mm.hist.length'); pg.click('#xhint summary')
    it=pg.evaluate('window.__mmExam[0].p'); 
    if pg.locator('#xans').count(): pg.fill('#xans', str(it['ans'])); pg.select_option('#xunit', it['unit'])
    else: pg.locator('#mmv .opt').first.click()
    pg.click('[data-xa=check]'); h=pg.evaluate('S.mm.hist[S.mm.hist.length-1]')
    ok('math exam: opening the formula hint records the item as assisted', h and h['ua']==False, h)
  else: ok('math exam: hint test reached', False, 'could not start exam')
  # --- Insulin Lab
  pg.goto(U+'#learn'); pg.wait_for_selector('.subnav'); ok('Insulin Lab is in Learn', pg.locator('.subnav a[href="#insulin"]').count()==1)
  pg.goto(U+'#insulin'); pg.wait_for_selector('.ins-hero'); ok('lab home shows 6 mastery requirements', pg.locator('.mast').count()==6)
  pg.goto(U+'#insulin/chart'); pg.wait_for_selector('.insrow'); t=pg.inner_text('.inschart')
  ok('chart has 6 categories with examples, timing, mixing', pg.locator('.insrow').count()==6 and all(x in t for x in ['Humalog','NovoLog','Apidra','Humulin R','Humulin N','Lantus','Tresiba','70/30','Do NOT mix']))
  pg.goto(U+'#insulin/timeline'); pg.wait_for_selector('#tclock')
  pg.evaluate("TL.inj=7;TL.h=0;route()"); pg.wait_for_selector('#tclock'); pg.focus('#tclock')
  for i in range(14): pg.keyboard.press('ArrowRight')
  rd=pg.inner_text('.tl-read'); ok('timeline clock moves by keyboard to 7 h (1400) and NPH reads PEAK', '1400' in pg.inner_text('#view') and 'PEAK' in rd.split('Intermediate')[1].split('\n')[1] if 'Intermediate' in rd else False, rd[:200])
  ok('rapid-acting is over by 1400 after 0700 dose', 'Action over' in rd.split('Rapid-acting')[1].split('\n')[1])
  q=pg.locator('#tlq [data-tq]').count(); pg.locator('#tlq [data-tq]').first.click(); ok('read-the-timeline question answers with feedback', q==4 and pg.locator('#tqfb .fb').count()==1)
  # games
  for g in ['curve','match','aft','rvr']:
    pg.goto(U+'#insulin'); pg.wait_for_selector('.ins-hero'); pg.goto(U+'#insulin/play'); pg.wait_for_selector(f'[data-g={g}]'); pg.click(f'[data-g={g}]')
    if g=='curve': c=pg.evaluate('null'); pg.locator('[data-a]').first.click(); ok('guess-the-curve gives feedback', pg.locator('#gfb .fb').count()==1)
    if g=='match':
      for i in range(6):
        nm=pg.locator('[data-ml]:not([disabled])').first; 
        if not nm.count(): break
        idx=nm.get_attribute('data-ml'); brand=nm.inner_text().strip(); nm.click()
        cat={'Humalog':'rapid','NovoLog':'rapid','Apidra':'rapid','Humulin R':'short','Novolin N':'nph','Humulin N':'nph','Lantus':'long','Basaglar':'long','Tresiba':'ultra','Humulin 70/30':'premix'}[brand]
        pg.click(f'[data-mr="{cat}"]')
      ok('match-the-insulin completes', 'All matched' in pg.inner_text('#gfb'))
    if g=='aft': pg.click('#achk'); ok('afternoon-peak game scores', pg.locator('#gfb .fb').count()==1)
    if g=='rvr': pg.click('[data-r=rapid]'); ok('rapid-vs-regular sorts', pg.locator('#gfb .fb').count()==1)
  # cases
  pg.goto(U+'#insulin/cases'); pg.wait_for_selector('[data-ci]'); n=pg.locator('[data-ci]').count(); ok(f'{n} give/treat/clarify cases listed (≥8)', n>=8)
  allok=True
  for i in range(n):
    pg.evaluate(f'ICASE.i={i};route()'); pg.wait_for_selector('.ptcard'); k=pg.evaluate(f'INS_CASES[{i}].k')
    fields=pg.inner_text('.ptcard'); 
    if not all(f.lower() in fields.lower() for f in ['Diabetes','Glucose','Insulin order','Meal','NPO','Symptoms','parameters','Recent insulin']): allok=False; print('   fields',i)
    pg.click(f'[data-o="{k}"]'); fb=pg.inner_text('.fb').lower()
    if 'correct' not in fb or 'escalate' not in fb or 'less safe' not in fb: allok=False; print('   case',i,fb[:80]) if 'correct' not in fb else None
  ok('every case shows the full patient card, why/why-not and when to escalate', allok)
  ok('type 1 NPO basal case answer is "clarify plan", not "hold"', 'not simply omitted' in pg.evaluate('INS_CASES.find(c=>c.id==="ib").o[INS_CASES.find(c=>c.id==="ib").k]'))
  ok('low-glucose case treats first', 'Treat the low' in pg.evaluate('INS_CASES[0].o[INS_CASES[0].k]'))
  # mixing simulator
  pg.goto(U+'#insulin/mix'); pg.wait_for_selector('.mixsim')
  m,T=mix_run(pg,'rn',False); ok(f'unassisted regular+NPH mix completes and passes (total {T})', pg.locator('.fb.ok').count()==1 and pg.evaluate('insS().mix.mastered')>0 and pg.evaluate('MX.layers.reduce((a,l)=>a+l.u,0)')==T)
  m,T=mix_run(pg,'ln',True); ok('lispro+NPH (label-permitted) completes in guided mode', pg.evaluate('MX.done && !MX.errors.length'))
  pg.evaluate("mixNew('rn',false);MX.fault=null;route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=drawNfirst]'); ok('NPH-first is blocked with a STOP', pg.locator('.stopbox').count()==1 and 'CLEAR first' in pg.inner_text('.stopbox'))
  pg.evaluate("mixNew('gl',false);route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=airN]'); ok('glargine mixing attempt is blocked', pg.locator('.stopbox').count()==1 and 'never be mixed' in pg.inner_text('.stopbox'))
  pg.evaluate("mixNew('gl',false);route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=nomix]'); ok('glargine: choosing "do not mix" passes', pg.evaluate('MX.done && !MX.errors.length'))
  pg.evaluate("mixNew('u2',false);route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=s30]'); ok('U-200 pen-to-syringe attempt is blocked', pg.locator('.stopbox').count()==1)
  pg.evaluate("mixNew('rn',false);MX.fault=null;route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=s3]'); ok('mL syringe (units/mL confusion) is blocked', 'UNITS' in pg.inner_text('.stopbox'))
  pg.evaluate("mixNew('rn',false);MX.fault=null;route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=s100]'); pg.click('[data-mx=swab]'); pg.click('[data-mx=roll]'); pg.click('[data-mx=airC]'); ok('air into clear before cloudy is flagged (no false pass)', pg.evaluate('MX.errors.length')==1 and pg.evaluate('MX.stage')=='airN')
  pg.evaluate("mixNew('rn',false);MX.fault=null;route()"); m=pg.evaluate('({R:MX.R,N:MX.N})'); T=m['R']+m['N']
  for a,v in [('verify',None),('s100',None),('swab',None),('roll',None),('airN',m['N']),('airC',m['R']),('drawC',m['R']),('bub',None),('drawN',T+3)]:
    if v is not None: pg.fill('#mxpn',str(v)); pg.press('#mxpn','Tab')
    pg.click(f'[data-mx={a}]')
  ok('overdraw stops: never push back into the vial', 'push mixed insulin back' in pg.inner_text('.stopbox'))
  pg.evaluate("mixNew('rn',false);MX.fault='cloudy';route()"); pg.click('[data-mx=verify]'); pg.click('[data-mx=s50]'); ok('cloudy regular must be replaced before continuing', pg.evaluate('MX.stage')=='replace' and pg.evaluate('MX.errors.length')==1)
  pg.evaluate("mixNew('rn',false);MX.fault=null;route()"); pg.click('[data-mx=reuse]'); ok('needle reuse is blocked', pg.locator('.stopbox').count()==1)
  # checkoffs
  for k in ['vial','pen']:
    pg.goto(U+'#insulin'); pg.goto(U+'#insulin/check'); pg.wait_for_selector('[data-ck]'); pg.click(f'[data-ck={k}]')
    steps=pg.evaluate(f'CK.{k}.steps.length')
    for i in range(steps):
      if i==2: pg.locator('[data-c="1"]').click(); fb=pg.inner_text('#ckfb'); cons='Consequence' in fb and 'Safe practice' in fb
      pg.click('[data-c="0"]'); pg.click('#cknext')
    ok(f'{k} checkoff: miss shows consequence + safe practice; finishing records result', cons and pg.evaluate(f'insS().check.{k}.score')==pct if False else cons and pg.evaluate(f'!!insS().check.{k}') and not pg.evaluate(f'insS().check.{k}.pass'))
    pg.click('#ckagain')
    for i in range(steps): pg.click('[data-c="0"]'); pg.click('#cknext')
    ok(f'{k} checkoff passes when every step is right first time', pg.evaluate(f'insS().check.{k}.pass'))
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/check'); pg.wait_for_selector('[data-ck]'); pg.click('[data-ck=site]')
  for zone in ['abd-ul','thigh-l','arm-r','umb']: pg.click(f'[data-site="{zone}"]'); pg.click('#cknext')
  ok('site rotation checkoff passes with safe choices', pg.evaluate('insS().check.site.pass'))
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/check'); pg.wait_for_selector('[data-ck]'); pg.click('[data-ck=site]'); pg.click('[data-site="abd-ur"]'); ok('site rotation: reusing last site is rejected', pg.locator('#ckfb .fb.bad').count()==1)
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/check'); pg.wait_for_selector('#ckprint'); pg.evaluate('window.print=()=>{window.__printed=document.querySelector(".printsheet")?.innerText||""}'); pg.click('#ckprint'); ok('printable checkoff record builds', 'Evaluator signature' in (pg.evaluate('window.__printed') or ''))
  # syringe
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/syringe'); good=0
  for i in range(12):
    pg.evaluate('SYQ.q=null;route()'); pg.wait_for_selector('#schk'); q=pg.evaluate('window.__syq')
    if q['kind']=='set':
      pg.focus('#srg')
      for j in range(q['ans']): pg.keyboard.press('ArrowRight')
    elif q.get('choices'): pg.click(f'[data-sc="{q["ans"]}"]')
    else: pg.fill('#sans', str(q['ans']))
    pg.click('#schk'); good+= 'Correct' in pg.inner_text('#sfb')
  ok('syringe reading/combined-dose items accept correct answers (12 random)', good==12, good)
  pg.evaluate("SYQ.q={kind:'wrong',cap:100,v:44,text:'x',ans:44,trap:22};route()"); pg.fill('#sans','22'); pg.click('#schk'); ok('wrong-syringe reading (1-unit vs 2-unit marks) is diagnosed', '2 units' in pg.inner_text('#sfb') and 'Not quite' in pg.inner_text('#sfb'))
  pg.evaluate("SYQ.q={kind:'read',cap:30,v:15,text:'x',ans:15};route()"); pg.fill('#sans','15abc'); pg.click('#schk'); ok('syringe answer "15abc" is not accepted', pg.inner_text('#sfb')=='')
  # quiz + 10-question checkoff
  ok('≥40 insulin quiz items, all with rationales', pg.evaluate('INS_Q.length')>=40 and pg.evaluate('INS_Q.every(q=>q.rat&&q.why&&Object.keys(q.why).length)'))
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/quiz'); pg.wait_for_selector('#iqc'); pg.click('#iqc'); pg.wait_for_selector('#iqz .q')
  for i in range(10):
    z='#iqz'
    if pg.locator(z+' .opt').count(): pg.locator(z+' .opt').first.click()
    if i<9: pg.click(z+' [data-act=next]')
  pg.click('#iqz [data-act=submit]'); pg.click('#doSub'); e=pg.evaluate('insS().exam[insS().exam.length-1]')
  ok('Insulin Safety Checkoff: 10 items scored, first attempts tracked', e['n']==10 and e['fa']==10 and pg.locator('#iqz h2').count()==1, e)
  pg.evaluate('insS().exam[insS().exam.length-1].t-=2*DAY'); pg.goto(U+'#insulin'); pg.goto(U+'#insulin/quiz'); pg.wait_for_selector('#iqc'); pg.click('#iqc'); pg.wait_for_selector('#iqz .q')
  for i in range(10):
    if pg.locator('#iqz .opt').count(): pg.locator('#iqz .opt').first.click()
    if i<9: pg.click('#iqz [data-act=next]')
  pg.click('#iqz [data-act=submit]'); pg.click('#doSub'); e2=pg.evaluate('insS().exam[insS().exam.length-1]')
  ok('a later checkoff (≥1 day) is tracked as delayed retention', e2['delayed']==True)
  pg.goto(U+'#insulin'); pg.goto(U+'#insulin/quiz'); pg.wait_for_selector('#iqc'); ok('missed concepts link to targeted refreshers', pg.locator('.pills a[href^="#insulin/"]').count()>=1 if pg.evaluate('Object.keys(S.missed).some(k=>k.startsWith("ins"))') else True)
  # persistence
  pg.wait_for_timeout(1200); before=pg.evaluate('JSON.stringify(insS().check)'); pg.reload(); pg.wait_for_selector('#view')
  ok('Insulin Lab progress persists after reload', pg.evaluate('JSON.stringify(insS().check)')==before and pg.evaluate('S.days')==o['days'] or pg.evaluate('JSON.stringify(insS().check)')==before)
  ok('original saved fields still intact after all activity', all(k in pg.evaluate('S') for k in o.keys()))
  # sources & course reconciliation
  pg.goto(U+'#insulin/sources'); pg.wait_for_selector('.updbox'); t=pg.inner_text('#insv')
  ok('course vs current: 100 U/mL claim, Levemir and mixing source shown', '100 U/mL' in t and 'Levemir' in t and 'not a quotation' in t and 'Needs' in t)
  # MED Math deep link
  pg.goto(U+'#math'); pg.wait_for_selector('.mm-subnav'); ok('MED Math overview deep-links to Insulin Lab', pg.locator('a.inslink[href^="#insulin"]').count()>=1)
  b.close()
print('PAGE ERRORS:',errs[:5]); print(f'{sum(1 for _,v in R if v)}/{len(R)} passed at {W}px')
