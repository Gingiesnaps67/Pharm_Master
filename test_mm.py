import json
from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
open('/tmp/claude-0/t.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>')
U='file:///tmp/claude-0/t.html'
errs=[]; R=[]
def ok(k,v,info=''):
  R.append(v); print(('PASS ' if v else 'FAIL ')+k+(' '+str(info) if (info and not v) else ''))
OLD={"v":1,"updatedAt":1793200000000,"cards":{"digoxin:core":{"box":3,"reps":3,"lapses":0,"due":1893200000000,"last":1793200000000,"lastRes":"got"}},"qs":{"c1":{"att":1,"cor":1,"first":True,"last":1793200000000}},"conceptMiss":{},"missed":{},"journal":[],"sessions":[{"t":1793200000000,"min":20,"rev":6,"learned":2,"applied":5,"appliedOk":4}],"days":{"2026-10-27":1},"mins":{},"examDate":"2026-12-10","target":20,"bookmarks":["heparin"],"flags":[],"math":{"att":5,"cor":4,"recent":[True],"byType":{}},"hold":{},"rescue":{},"games":{"played":2,"best":{}},"sysScores":{},"exams":[],"firstLog":[{"t":1,"ok":True,"sys":["cardio"]}],"rep":{"att":0,"cor":0},"applyLog":[],"seenDrugs":{}}
def ans_num(pg, p):
  if pg.locator('#mmunit').count() and pg.locator('#mmunit').is_enabled():
    pg.select_option('#mmunit', p['unit']); pg.click('[data-act=unitgo]')
  if pg.locator('[data-form]').count() and pg.locator(f'[data-form="{p["formula"]}"]').is_enabled():
    pg.click(f'[data-form="{p["formula"]}"]')
with sync_playwright() as pw:
  b=pw.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
  pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  pg.goto(U); pg.evaluate('o=>localStorage.setItem("pharm-master-v1", JSON.stringify(o))', OLD); pg.reload(); pg.wait_for_selector('#view')
  ok('old saved progress preserved after update', pg.evaluate('S.sessions.length')==1 and pg.evaluate('S.bookmarks[0]')=='heparin' and pg.evaluate('S.cards["digoxin:core"].box')==3 and pg.evaluate('S.math.att')==5)
  ok('MED MATH LAB in navigation', pg.locator('.nav a[data-k=math]').inner_text().strip()=='MED Math')
  ok('home shows overall readiness', 'overall readiness' in pg.locator('#view').inner_text().lower())
  pg.click('.nav a[data-k=math]'); pg.wait_for_selector('.mm-subnav')
  ok('dashboard 4 big cards + timed options', pg.locator('.mm-bigcard').count()==4 and pg.locator('[data-timed]').count()==5)
  ok('legacy math record shown', 'Earlier quick-practice record kept: 4/5' in pg.locator('#view').inner_text())
  # lessons
  pg.click('[data-mt=learn]'); pg.wait_for_selector('.mm-lessoncard'); ok('10 levels listed', pg.locator('.mm-lessoncard').count()==10)
  pg.click('[data-lesson="1"]'); t=pg.locator('#view').inner_text()
  ok('lesson 1 worked example 154 lb -> 70 kg', '154 lb' in t and '70 kg' in t)
  ok('conversion chart + matching', pg.locator('.mm-conv').count()==1 and pg.locator('#convmatch .tile').count()==10)
  for i in range(5):
    lid=pg.locator('#convmatch [data-cl]:not([disabled])').first.get_attribute('data-cl'); pg.click(f'#convmatch [data-cl="{lid}"]'); pg.click(f'#convmatch [data-cr="{lid}"]')
  ok('conversion matching completes', 'All matched' in pg.locator('#convmatch').inner_text())
  for n in range(1,11):
    pg.evaluate(f'MMV.tab="lesson";MMV.lesson={n};vMedMath(document.querySelector("#view"))')
    cats=pg.evaluate(f'MM.LESSONS[{n-1}].cats'); works=pg.locator('[data-work]').count()
    ok(f'lesson {n}: every formula has a worked 6-step example ({len(cats)})', works==len(cats) and pg.locator('.mm-step .sn').count()>=5*len(cats))
  pg.evaluate('MMV.tab="lesson";MMV.lesson=3;vMedMath(document.querySelector("#view"))')
  ok('oral syringe illustration', pg.locator('svg[aria-label^="Oral syringe filled to 15 mL"]').count()>=1)
  before=pg.locator('[data-work=liquid]').inner_text(); pg.click('[data-work=liquid] [data-meth=rp]'); after=pg.locator('[data-work=liquid]').inner_text()
  ok('method switch shows ratio method, same answer', 'Ratio' in after and '15 mL' in after and before!=after)
  # lesson 2 ladder
  pg.evaluate('MMV.tab="lesson";MMV.lesson=2;vMedMath(document.querySelector("#view"))')
  pg.click('[data-ladder=tabs]'); levels=[]
  pg.evaluate('S.mm.mode="exam"'); pg.click('[data-ladder=tabs]')
  for i in range(15):
    p=pg.evaluate('window.__mmP'); levels.append(p['level'])
    pg.fill('#mmans', str(p['ans'])); pg.select_option('#mmunit2', p['unit']); pg.click('#lzone [data-act=submit]'); pg.click('#lzone [data-act=next]')
  ok('15-problem ladder ramps levels 1→3', levels==[1]*5+[2]*5+[3]*5, levels)
  ok('ladder completion screen', 'Ladder complete: 15/15' in pg.locator('#lzone').inner_text())
  # lesson 6 pump & lesson 7 drops & lesson 8 high alert
  pg.evaluate('MMV.tab="lesson";MMV.lesson=6;vMedMath(document.querySelector("#view"))'); pg.fill('#pg','125'); pg.click('#pcheck'); ok('pump lesson runs at 125', pg.locator('#pumpbox svg.running').count()==1)
  pg.evaluate('MMV.tab="lesson";MMV.lesson=8;vMedMath(document.querySelector("#view"))')
  for i in [0,1,2,3,5]: pg.click(f'[data-hal="{i}"]')
  pg.click('#halgo'); ok('high-alert recognition check', 'Right' in pg.locator('#halmsg').inner_text())
  # guided practice beginner: wrong formula, wrong answer w/ diagnosis, retry
  pg.evaluate('S.mm.mode="beginner"'); pg.evaluate('MMV.tab="practice";MMV.pcat="wtday";vMedMath(document.querySelector("#view"))')
  p=pg.evaluate('window.__mmP'); pg.select_option('#mmunit', p['unit']); pg.click('[data-act=unitgo]')
  wrongF=[f for f in pg.evaluate('Array.from(document.querySelectorAll("[data-form]")).map(b=>b.dataset.form)') if f!=p['formula']][0]
  pg.click(f'[data-form="{wrongF}"]'); ok('wrong formula explained', 'Not this one' in pg.locator('.mm-prob').inner_text())
  pg.click(f'[data-form="{p["formula"]}"]'); ok('beginner shows substitution steps', pg.locator('.mm-step .sn:text("4")').count()==1)
  trap=[t for t in p['traps'] if t['code']=='DAYDOSE'][0]
  pg.fill('#mmans', str(trap['v'])); pg.click('[data-act=submit]')
  ok('specific error: mg/kg/day vs dose', 'day vs dose' in pg.locator('.fb').inner_text().lower() and 'confused mg/kg/day' in pg.locator('.fb').inner_text().lower())
  ok('similar problem offered', pg.locator('[data-act=similar]').count()==1)
  pg.click('[data-act=retry]'); pg.fill('#mmans', str(p['ans'])); pg.click('[data-act=submit]')
  ok('retry correct shows worked solution', pg.locator('.fb.ok').count()==1 and pg.locator('.mm-step.ok').count()==1)
  # wrong unit diagnosis
  pg.click('[data-act=similar]'); p=pg.evaluate('window.__mmP'); pg.select_option('#mmunit', p['unit']); pg.click('[data-act=unitgo]'); pg.click(f'[data-form="{p["formula"]}"]')
  other=[u for u in p['unitOpts'] if u!=p['unit']][0]; pg.fill('#mmans', str(p['ans'])); pg.select_option('#mmunit2', other); pg.click('[data-act=submit]')
  ok('wrong unit diagnosed', 'Missing or incorrect units' in pg.locator('.fb').inner_text())
  # intermediate hints
  pg.evaluate('S.mm.mode="intermediate"'); pg.evaluate('MMV.tab="practice";MMV.pcat="gtt";vMedMath(document.querySelector("#view"))')
  p=pg.evaluate('window.__mmP'); ans_num(pg,p); pg.click('[data-act=hint]'); pg.click('[data-act=hint]')
  ok('step-by-step hints reveal progressively', pg.locator('.mm-step .sn:text("?")').count()==1 and 'Formula' in pg.locator('.mm-prob').inner_text())
  tt=[t for t in p['traps'] if t['code'] in ('TIME','DF')][0]; pg.fill('#mmans', str(tt['v'])); pg.click('[data-act=submit]')
  ok('time/drop-factor error identified', tt['code'] in ('TIME','DF') and ('time' in pg.locator('.fb').inner_text().lower() or 'drop factor' in pg.locator('.fb').inner_text().lower()))
  # advanced adaptive difficulty
  pg.evaluate('S.mm.mode="exam"'); pg.evaluate('S.mm.cats.ivrate && (S.mm.cats.ivrate.lvl=1)'); pg.evaluate('MMV.tab="practice";MMV.pcat="ivrate";vMedMath(document.querySelector("#view"))')
  lv=[]
  for i in range(7):
    p=pg.evaluate('window.__mmP'); lv.append(p['level']); pg.fill('#mmans', str(p['ans'])); pg.select_option('#mmunit2', p['unit']); pg.click('[data-act=submit]')
    if i==0: ok('advanced correct counts toward mastery', 'with help' not in pg.locator('.fb').inner_text())
    pg.click('[data-act=next]')
  ok('difficulty increases with success', lv[0]==1 and lv[-1]==3, lv)
  st=pg.evaluate('S.mm.cats.ivrate'); ok('spaced review scheduled after correct', st['box']>=3 and st['due']>pg.evaluate('Date.now()'))
  # choice problem (safe) in practice
  pg.evaluate('MMV.tab="practice";MMV.pcat="safe";vMedMath(document.querySelector("#view"))'); p=pg.evaluate('window.__mmP')
  pg.click(f'[data-ch="{(p["ans"]+1)%4}"]'); pg.click('[data-act=submit]'); ok('unsafe/incomplete order miss flagged', 'Missed an unsafe' in pg.locator('.fb').inner_text())
  # games
  pg.evaluate('MMV.tab="games";MMG.g=null;vMedMath(document.querySelector("#view"))'); ok('5 games', pg.locator('[data-game]').count()==5)
  pg.click('[data-game=fmatch]')
  for i in range(5):
    l=pg.locator('#gz [data-l]:not([disabled])').first.get_attribute('data-l'); pg.click(f'#gz [data-l="{l}"]'); pg.click(f'#gz [data-r="{l}"]')
  ok('Formula Match completes', 'Done with 0 misses' in pg.locator('#gz').inner_text())
  pg.click('#gback'); pg.click('[data-game=fix]')
  for i in range(5):
    cur=pg.evaluate('window.__mmFix()'); pg.click(f'#gz [data-ln="{cur["bad"]}"]'); pg.fill('#fxa', str(cur['ans'])); pg.click('#fcheck'); pg.click('#fnext')
  ok('Fix the Nurse 10/10', '10/10 points' in pg.locator('#gz').inner_text())
  pg.click('#gback'); pg.click('[data-game=pump]')
  for i in range(5):
    p=pg.evaluate('window.__mmPump'); pg.fill('#prate', str(p['ans'])); pg.click('#pstart')
    if i==0: ok('pump animates when correct', pg.locator('#gz svg.running').count()==1)
    pg.click('#pnext')
  ok('IV Pump 5/5', '5/5 pumps' in pg.locator('#gz').inner_text())
  pg.click('#gback'); pg.click('[data-game=safe]')
  for i in range(8):
    p=pg.evaluate('window.__mmSafe'); pg.click(f'#gz [data-c="{p["ans"]}"]'); pg.click('#snext')
  ok('Safe or Unsafe 8/8', '8/8 correct' in pg.locator('#gz').inner_text())
  pg.click('#gback'); pg.click('[data-game=sprint]'); pg.click('#go')
  for i in range(6):
    p=pg.evaluate('window.__mmSprint'); pg.fill('#sans', str(p['ans'])); pg.press('#sans','Enter')
  ok('Conversion Sprint scores accuracy', 'Score 6' in pg.locator('#gz').inner_text())
  # exam mode 10, all correct
  pg.evaluate('MMV.tab="exam";vMedMath(document.querySelector("#view"))'); pg.click('[data-xn="10"]'); pg.click('#xgo')
  for i in range(10):
    it=pg.evaluate(f'(()=>{{const x=window.__mmExam[{i}];return {{kind:x.p.kind,ans:x.p.ans,unit:x.p.unit,mc:x.p.mc||null}}}})()')
    if it['kind']=='choice': pg.click(f'[data-xc="{it["ans"]}"]')
    elif it['mc']: pg.click(f'[data-xc="{it["mc"]["ans"]}"]')
    else: pg.fill('#xans', str(it['ans'])); pg.select_option('#xunit', it['unit'])
    if i<9: pg.click('[data-xa=next]')
  ok('exam hides explanations until submit', pg.locator('.fb').count()==0)
  pg.click('[data-xa=submit]'); pg.click('#xyes'); t=pg.locator('#view').inner_text()
  ok('exam scores 100%', '100%' in t and 'Met your 80% target' in t, t[:200])
  ok('exam reports category + time per question', 'by category' in t.lower() and 'avg per question' in t.lower())
  # exam with wrong answers + tutor + formula-free + timer
  pg.evaluate('MMV.tab="exam";vMedMath(document.querySelector("#view"))'); pg.click('[data-xn="10"]'); pg.click('[data-xfb="tutor"]'); pg.check('#xff'); pg.fill('#xtimer','5'); pg.dispatch_event('#xtimer','change'); pg.click('#xgo')
  ok('formula-free tutor has no formula hint', pg.locator('details summary:text("Show the formula")').count()==0 and 'left' in pg.locator('#xclock').inner_text())
  for i in range(10):
    it=pg.evaluate(f'(()=>{{const x=window.__mmExam[{i}];return {{kind:x.p.kind,ans:x.p.ans,unit:x.p.unit,mc:x.p.mc||null,n:(x.p.choices||[]).length}}}})()')
    if it['kind']=='choice': pg.click(f'[data-xc="{(it["ans"]+1)%it["n"]}"]')
    elif it['mc']: pg.click(f'[data-xc="{(it["mc"]["ans"]+1)%4}"]')
    else: pg.fill('#xans', str(it['ans']*10)); pg.select_option('#xunit', it['unit'])
    pg.click('[data-xa=check]')
    if i==0: ok('tutor gives immediate feedback', pg.locator('.fb.bad').count()==1)
    pg.click('[data-xa=next]')
  t=pg.locator('#view').inner_text(); ok('wrong answers scored 0% with mistake types', '0%' in t and 'Below your 80% target' in t)
  ok('mistake types tracked', len(pg.evaluate('S.mm.errs'))>=2)
  # cheat sheet
  pg.evaluate('MMV.tab="cheat";vMedMath(document.querySelector("#view"))'); ok('cheat sheet has all formulas', pg.locator('.cheat-card').count()>=13)
  pg.click('#chide'); ok('recall mode hides formulas', pg.locator('[data-reveal]').count()>=13); pg.locator('[data-reveal]').first.click(); ok('reveal one', pg.locator('.cheat-eq').count()==1)
  pg.click('#crev'); pg.click('#cprint'); ok('printer-friendly view', pg.evaluate('document.body.classList.contains("printing")') and pg.locator('.print-sheet').count()==1); pg.click('#cprint')
  # library integration
  pg.goto(U+'#library'); pg.click('[data-drug=heparin]'); pg.click('#tab-master'); pg.click('[data-arg="drug:heparin"]'); pg.wait_for_selector('.mm-prob')
  ok('heparin deep dive → heparin calculation', 'heparin' in pg.evaluate('window.__mmP.text').lower())
  pg.goto(U+'#library'); pg.click('[data-drug=acetaminophen]'); pg.click('#tab-master'); pg.click('[data-arg="drug:acetaminophen"]'); pg.wait_for_selector('.mm-prob')
  ok('acetaminophen → course concentration problem', 'acetaminophen' in pg.evaluate('window.__mmP.text').lower())
  # timed practice
  pg.evaluate('MMV.tab="timed";MMV.min=5;vMedMath(document.querySelector("#view"))'); ok('timed practice clock', 'left' in pg.locator('#mmclock').inner_text())
  pg.click('[data-act=exit]'); ok('timed practice summary', 'complete' in pg.locator('#view').inner_text().lower())
  pg.wait_for_timeout(1500)
  solved=pg.evaluate('S.mm.solved'); pg.reload(); pg.wait_for_selector('#view'); ok('med math progress persists', pg.evaluate('S.mm.solved')==solved and solved>20, solved)
  ok('pharm progress still intact', pg.evaluate('S.sessions.length')==1 and pg.evaluate('S.cards["digoxin:core"].box')==3)
  # mobile
  m=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark'); mp=m.new_page(); mp.on('pageerror',lambda e: errs.append(str(e))); mp.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  mp.goto(U+'#math'); mp.wait_for_selector('.mm-subnav'); bad=[]
  def chk(name):
    w=mp.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]')
    if w[0]>w[1]: bad.append((name,w))
  chk('home')
  for tab in ['learn','practice','games','exam','cheat']:
    mp.evaluate(f'MMV.tab="{tab}";MMG.g=null;vMedMath(document.querySelector("#view"))'); chk(tab)
  for n in range(1,11): mp.evaluate(f'MMV.tab="lesson";MMV.lesson={n};vMedMath(document.querySelector("#view"))'); chk('lesson'+str(n))
  mp.evaluate('MMV.tab="lesson";MMV.lesson=3;vMedMath(document.querySelector("#view"))'); mp.screenshot(path='/tmp/claude-0/mm-mob-lesson.png', full_page=False)
  mp.evaluate('MMV.tab="practice";MMV.pcat="heparin";vMedMath(document.querySelector("#view"))'); chk('practice-heparin'); mp.screenshot(path='/tmp/claude-0/mm-mob-prac.png')
  ok('mobile: no horizontal scroll on any MED MATH screen', not bad, bad)
  pg.goto(U+'#math'); pg.screenshot(path='/tmp/claude-0/mm-desk-home.png'); pg.evaluate('MMV.tab="lesson";MMV.lesson=7;vMedMath(document.querySelector("#view"))'); pg.screenshot(path='/tmp/claude-0/mm-desk-l7.png', full_page=True)
  b.close()
print('PAGE ERRORS:', errs[:8]); print(f'{sum(R)}/{len(R)} passed')
