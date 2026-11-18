# PHARM MASTER 2.0 feature tests
import json
from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
open('/tmp/claude-0/t3.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+html+'</body></html>')
U='file:///tmp/claude-0/t3.html'; R=[]; errs=[]
def ok(k,v,info=''): R.append(v); print(('PASS ' if v else 'FAIL ')+k+(' '+str(info) if (info and not v) else ''))
NICK=json.load(open('backups/db/data/users/me/progress.json'))['json']
with sync_playwright() as pw:
  b=pw.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  # migration of the real saved progress
  pg.goto(U); pg.evaluate('j=>{localStorage.clear();localStorage.setItem("pharm-master-v1", j)}', NICK); pg.reload(); pg.wait_for_selector('#view h1')
  o=json.loads(NICK); s=pg.evaluate('S')
  ok('Nick progress migrated: days/minutes/games kept', s['days']==o['days'] and s['mins']==o['mins'] and s['games']==o['games'] and s['schema']==2)
  ok('pre-v2 copy stored', pg.evaluate('!!localStorage.getItem("pharm-master-v1-pre-v2")'))
  ok('html lang=en', pg.evaluate('document.documentElement.lang')=='en')
  ok('five nav areas', pg.locator('.nav a').count()==5)
  # search from home
  pg.fill('#hq','coumadin'); ok('home search finds warfarin', pg.locator('#hqres a[href="#library/warfarin"]').count()==1)
  pg.keyboard.press('Enter'); pg.wait_for_selector('.steps'); ok('enter opens drug lesson', pg.evaluate('location.hash')=='#library/warfarin')
  # 5 steps + keyboard
  pg.focus('#tab-glance'); pg.keyboard.press('ArrowRight'); ok('arrow key moves to Understand It', pg.get_attribute('#tab-understand','aria-selected')=='true' and pg.evaluate('document.activeElement.id')=='tab-understand')
  for t in ['apply','remember','master']:
    pg.click(f'#tab-{t}'); ok(f'step {t} renders content', len(pg.inner_text('#ddpanel'))>80)
  pg.click('#tab-apply'); 
  if pg.locator('#applyGo').count(): pg.click('#applyGo'); ok('apply scenario starts quiz', pg.locator('#applyz .q').count()==1)
  pg.click('#tab-master'); pg.click('#quizMe'); ok('master quiz loads', pg.locator('#ddzone .q').count()==1)
  pg.click('#tab-understand'); pg.wait_for_timeout(100)
  pg.goto(U+'#library/phenytoin'); pg.wait_for_selector('.steps'); pg.click('#tab-understand'); ok('phenytoin lab visual from its own text', pg.locator('.labvis').count()==1 and '10' in pg.inner_text('.lv-scale') and '20' in pg.inner_text('.lv-scale'))
  # back navigation
  pg.goto(U+'#library'); pg.wait_for_selector('.medrow'); pg.click('[data-drug=digoxin]'); pg.wait_for_selector('.steps'); pg.click('#back'); pg.wait_for_selector('.medrow'); ok('Back returns to library list', pg.evaluate('location.hash')=='#library')
  ok('recently studied lists drugs', pg.evaluate('S.recent.filter(r=>r.k=="drug").length')>=2)
  # exam: one per concept, resume
  pg.goto(U+'#exam'); 
  items=pg.evaluate('(()=>{const r=[];for(let k=0;k<20;k++){const e=buildExam(50,"","new");const c=e.map(q=>q.concept);r.push([e.length,new Set(c).size]);}return r})()')
  ok('50-question exams: one item per concept', all(a==b and a==50 for a,b in items), items[:3])
  per=pg.evaluate('(()=>{const e=buildExam(100,"","any");const m={};e.forEach(q=>m[q.drug]=(m[q.drug]||0)+1);return Math.max(...Object.values(m))})()')
  ok('no drug more than 3x in a 100-q exam', per<=3, per)
  pg.click('[data-n="10"]'); pg.click('[data-m=tutor]'); pg.click('#exGo')
  for i in range(3):
    pg.locator('#exzone .opt').first.click() if pg.locator('#exzone .opt').count() else None
    if pg.locator('#exzone .mx').count():
      for r in range(pg.locator('#exzone tbody tr').count()): pg.locator(f'#exzone input[data-r="{r}"][data-c="0"]').check()
    if pg.locator('#exzone [data-bt]').count():
      for q in ['c][data-o="0"','a][data-o="0"','a][data-o="1"','m][data-o="0"','m][data-o="1"']: pg.click(f'#exzone [data-bt={q}]')
    pg.click('#exzone [data-conf=sure]'); pg.click('#exzone [data-act=check]'); pg.click('#exzone [data-act=next]')
  ids=pg.evaluate('S.resume.items.map(x=>x.id)'); i0=pg.evaluate('S.resume.i')
  pg.wait_for_timeout(1000); pg.reload(); pg.wait_for_selector('#view h1')
  ok('interrupted exam survives reload', pg.evaluate('S.resume && S.resume.i')==3 and i0==3)
  pg.goto(U+'#home'); pg.wait_for_selector('#contBtn'); ok('home Continue button offers resume', 'Resume' in pg.inner_text('#contBtn'))
  pg.click('#contBtn'); pg.wait_for_selector('#exzone .q'); t=pg.inner_text('#exzone'); ok('resume restores question 4 of 10 with same items', 'question 4 of 10' in t.lower() and pg.evaluate('S.resume.items.map(x=>x.id)')==ids, t[:90])
  # finish to clear resume
  for i in range(7):
    if pg.locator('#exzone .opt').count(): pg.locator('#exzone .opt').first.click()
    if pg.locator('#exzone .mx').count():
      for r in range(pg.locator('#exzone tbody tr').count()): pg.locator(f'#exzone input[data-r="{r}"][data-c="0"]').check()
    if pg.locator('#exzone [data-bt]').count():
      for q in ['c][data-o="0"','a][data-o="0"','a][data-o="1"','m][data-o="0"','m][data-o="1"']: pg.click(f'#exzone [data-bt={q}]')
    if pg.locator('#exzone .ord').count()==0 or True:
      pg.click('#exzone [data-conf=sure]'); pg.click('#exzone [data-act=check]'); pg.click('#exzone [data-act=next]')
  ok('finished exam clears resume and is scored', pg.evaluate('S.resume')==None and pg.locator('#exzone h2').count()==1)
  # generated questions: no † and no ambiguity
  ok('no † in any generated option', pg.evaluate('GEN.every(q=>q.opts.every(o=>!o.includes("†")))'))
  ok('authored MC items all have distractor rationales', pg.evaluate('QUESTIONS.filter(q=>q.fmt==="mc").every(q=>q.why&&Object.keys(q.why).length>=1)'))
  ok('c6 no longer lists an unsourced KCl rate', pg.evaluate('!QBYID.c6.opts.join(" ").includes("over 1 hour")'))
  ok('pa2 converted to SATA with 6 options', pg.evaluate('QBYID.pa2.fmt==="sata" && QBYID.pa2.opts.length===6'))
  # workbench
  pg.goto(U+'#math/bench'); pg.wait_for_selector('.bench'); ok('workbench loads with label', pg.locator('.medlabel').count()==1)
  ok('label shows on-hand only (no order row)', 'Ordered' not in pg.inner_text('.bench .medlabel') if False else pg.evaluate('!document.querySelector(".medlabel").getAttribute("aria-label").includes("Ordered")'))
  stations=pg.evaluate('BENCH.map(b=>b.k)'); passed=0
  for st in stations:
    pg.click(f'[data-st="{st}"]'); p=pg.evaluate('window.__wb.p'); tool=pg.evaluate(f'BENCH.find(b=>b.k=="{st}").tool')
    if tool=='syringe':
      cap=[c for c in [1,3,5,10,20] if c>=p['ans']][0]; pg.click(f'[data-cap="{cap}"]'); pg.evaluate(f'WB.val={p["ans"]}')
    elif tool=='tabs': pg.evaluate(f'WB.val={p["ans"]}')
    else: pg.fill('#wbn', str(p['ans']))
    pg.click('#wbcheck'); txt=pg.inner_text('#wbfb')
    if 'Correct' in txt: passed+=1
    else: print('   station fail', st, p['ans'], txt[:120])
  ok(f'workbench: correct answer accepted at all {len(stations)} stations', passed==len(stations))
  pg.click('[data-st=liquid]'); p=pg.evaluate('window.__wb.p'); pg.click('[data-cap="20"]'); pg.evaluate(f'WB.val={p["ans"]*10 if p["ans"]*10<=20 else p["ans"]/10}'); pg.click('#wbcheck')
  ok('workbench wrong answer gets error diagnosis + steps', 'Error type' in pg.inner_text('#wbfb') and pg.locator('#wbfb details').count()==1)
  pg.click('#wbnext'); pg.click('[data-cap="10"]'); pg.focus('#wbr'); pg.keyboard.press('ArrowRight'); ok('syringe slider works by keyboard', pg.evaluate('WB.val')>0)
  # formula builder
  pg.goto(U+'#math/build'); pg.wait_for_selector('.eq')
  good=0
  for n in range(9):
    toks=pg.evaluate('window.__bld.b.t')
    for t in toks:
      k=pg.evaluate('(t)=>BLD.pool.find(p=>p.x===t && !BLD.picked.includes(p)).k', t); pg.click(f'.tok[data-k="{k}"]')
    pg.click('#bchk'); good+= 'built correctly' in pg.inner_text('#mmv'); pg.click('#bnext')
  ok('formula builder: all 9 formulas accept the correct build', good==9, good)
  pg.locator('.tok:not([disabled])').last.click(); pg.click('#bchk'); ok('wrong build rejected', 'Not quite' in pg.inner_text('#mmv'))
  # sprint bug
  pg.evaluate('S.mm.games.sprint={best:-999,plays:2}; mmS()'); ok('sprint −999 best repaired on load', pg.evaluate('S.mm.games.sprint.best')==None)
  pg.evaluate('gamePlay("sprint", -3)'); ok('low-accuracy sprint no longer sets a best', pg.evaluate('S.mm.games.sprint.best')==None and pg.evaluate('S.mm.games.sprint.plays')==3)
  ok('mode "advanced" migrates to "exam"', pg.evaluate('(S.mm.mode="advanced", mmS().mode)')=='exam')
  # backups
  pg.goto(U+'#progress'); pg.wait_for_selector('#impt'); before=pg.evaluate('JSON.stringify(S.days)')
  pg.fill('#impt', json.dumps({"v":1,"cards":{},"days":{"2020-01-01":1}})); pg.click('#impgo'); pg.wait_for_timeout(200)
  ok('import makes an automatic safety copy first', pg.evaluate('JSON.parse(localStorage.getItem("pharm-master-v1-backups"))[0].reason')=='before import')
  pg.goto(U+'#progress'); pg.wait_for_selector('[data-bk]'); pg.click('[data-bk="0"]'); pg.click('#icYes'); pg.wait_for_timeout(200)
  ok('restore safety copy brings progress back', pg.evaluate('JSON.stringify(S.days)')==before)
  # reduced motion drip alternative
  pg.emulate_media(reduced_motion='reduce'); pg.goto(U+'#math/bench'); pg.click('[data-st=gtt]'); p=pg.evaluate('window.__wb.p'); pg.fill('#wbn',str(p['ans'])); pg.click('#wbcheck')
  ok('reduced motion: drop tally shown for gravity drip', pg.locator('.tally-dots i').count()>0)
  pg.goto(U+'#library/digoxin'); pg.click('#tab-understand'); ok('reduced motion: mechanism steps visible', pg.evaluate('getComputedStyle(document.querySelector(".mech li")).opacity')=='1')
  b.close()
print('PAGE ERRORS:',errs[:5]); print(f'{sum(R)}/{len(R)} passed')
