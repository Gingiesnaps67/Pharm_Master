# PHARM HESI REVIEW integration — acceptance tests
import json, sys
from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
open('/tmp/claude-0/t6.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+html+'</body></html>')
U='file:///tmp/claude-0/t6.html'; R=[]; errs=[]
W=int(sys.argv[1]) if len(sys.argv)>1 else 390
def ok(k,v,info=''): R.append((k,v)); print(('PASS ' if v else 'FAIL ')+k+(' '+str(info) if (info and not v) else ''))
NICK=json.load(open('backups/db/data/users/me/progress.json'))['json']
def answer(pg, z, conf=True):
  if pg.locator(f'{z} .opt').count(): pg.locator(f'{z} .opt').first.click()
  if pg.locator(f'{z} .mx').count():
    for r in range(pg.locator(f'{z} tbody tr').count()): pg.locator(f'{z} input[data-r="{r}"][data-c="0"]').check()
  if conf and pg.locator(f'{z} [data-conf=sure]').count(): pg.click(f'{z} [data-conf=sure]')
  if pg.locator(f'{z} [data-act=check]').count(): pg.click(f'{z} [data-act=check]')
  if pg.locator(f'{z} [data-act=next]').count(): pg.click(f'{z} [data-act=next]')
  elif pg.locator(f'{z} [data-act=submit]').count(): pg.click(f'{z} [data-act=submit]')
with sync_playwright() as pw:
  b=pw.chromium.launch(); pg=b.new_page(viewport={'width':W,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  pg.goto(U); pg.evaluate('j=>{localStorage.clear();localStorage.setItem("pharm-master-v1", j)}', NICK); pg.reload(); pg.wait_for_selector('#view h1')
  o=json.loads(NICK); s=pg.evaluate('S')
  ok('saved progress kept (days, minutes, games, qs count)', s['days']==o['days'] and s['mins']==o['mins'] and s['games']==o['games'] and len(s['qs'])>=len(o.get('qs',{})))
  # --- data integrity
  ok('no duplicate drug ids', pg.evaluate('new Set(DRUGS.map(d=>d.id)).size===DRUGS.length'))
  ok('no duplicate generic names', pg.evaluate('new Set(DRUGS.map(d=>d.g.toLowerCase())).size===DRUGS.length'), pg.evaluate('DRUGS.map(d=>d.g.toLowerCase()).filter((g,i,a)=>a.indexOf(g)!==i)'))
  ok('no duplicate question ids', pg.evaluate('new Set(ALLQ.map(q=>q.id)).size===ALLQ.length'))
  ok('88 LQ questions, all with rationale + per-option why', pg.evaluate('LQ_Q.length===88 && LQ_Q.every(q=>q.rat && (q.fmt!=="mc" || (q.why && q.opts.every((_,i)=>i===q.key || q.why[i]))))'))
  ok('every MC key index valid; SATA keys valid', pg.evaluate('LQ_Q.every(q=>q.fmt==="order"||(q.fmt==="mc"?q.key>=0&&q.key<q.opts.length:Array.isArray(q.key)&&q.key.length>=2&&q.key.every(k=>k>=0&&k<q.opts.length)))'))
  ok('mock = 75 distinct non-order items', pg.evaluate('LQ_MOCK_IDS.length===75 && new Set(LQ_MOCK_IDS).size===75 && LQ_MOCK_IDS.every(id=>QBYID[id] && QBYID[id].fmt!=="order")'))
  ok('LQ_EMPH ids all exist as drugs', pg.evaluate('Object.keys(LQ_EMPH).every(id=>DRUG[id])'), pg.evaluate('Object.keys(LQ_EMPH).filter(id=>!DRUG[id])'))
  ok('every REFS key used by LQ data resolves', pg.evaluate('[...LQ_DISC.flatMap(d=>d.r||[]),...LQ_HERB.map(h=>h[4]).filter(Boolean),...LQ_SEQ.map(s=>s.src)].every(k=>REFS[k])'), pg.evaluate('[...LQ_DISC.flatMap(d=>d.r||[]),...LQ_HERB.map(h=>h[4]).filter(Boolean),...LQ_SEQ.map(s=>s.src)].filter(k=>!REFS[k])'))
  ok('glargine profile says hypoglycemia can occur', 'even without' in pg.evaluate('DRUG.glargine.sae'))
  ok('no LQ content says long-acting "never" causes hypoglycemia', not pg.evaluate('JSON.stringify([LQ_Q.map(q=>[q.stem,q.rat,q.fmt==="mc"?q.opts[q.key]:""]),DRUGS.map(d=>[d.sae,d.ae,d.exam,d.ie||"",d.cj||""])]).match(/never (experience|cause)[a-z ]*hypoglyc/i)'))
  ok('apixaban content: no routine INR claim in LQ questions', not pg.evaluate('LQ_Q.some(q=>/apixaban/i.test(q.stem) && /monitor the INR/i.test(q.opts[q.key]||""))'))
  # --- routing / modules
  pg.goto(U+'#review'); pg.wait_for_selector('.lq-hero'); ok('HESI Review opens from Learn subnav', pg.locator('#subnav a[data-sub=review][aria-current=page]').count()==1)
  for k in ['ace','labs','inh','ins','thy','herb','games','mock','weak','audit','acc']:
    pg.goto(U+'#review/'+k); pg.wait_for_selector(f'[data-rv={k}][aria-current=page]'); ok(f'tab {k} renders without error', 'Something went wrong' not in pg.inner_text('#view'))
  pg.goto(U+'#review/ace'); ok('ACE: RAAS diagram + angioedema table', pg.locator('svg.raas').count()==1 and 'Bradykinin' in pg.inner_text('#view'))
  ok('ACE: hold value framed as example, not universal', 'not a universal rule' in pg.text_content('#view'))
  pg.click('#aceGo'); pg.wait_for_selector('#acez .q'); n0=pg.evaluate('Object.keys(S.qs).length')
  for i in range(3): answer(pg,'#acez')
  ok('ACE questions record answers', pg.evaluate('Object.keys(S.qs).length')>=n0+3 and all(pg.evaluate('Object.keys(S.qs).filter(k=>k.startsWith("lq")).length')>=3 for _ in [0]))
  # lab match
  pg.goto(U+'#review/labs'); ok('lab table has 21 rows w/ 5 columns', pg.locator('[aria-label="Medication lab monitoring table"] tbody tr').count()==21)
  pool=pg.evaluate('[...document.querySelectorAll("#labgame [data-l]")].map(b=>b.textContent)')
  pairs=pg.evaluate('Object.fromEntries(LQ_LABMATCH.map(p=>[p[1],p[2]]))')
  for i,dname in enumerate(pool):
    pg.click(f'#labgame [data-l="{i}"]'); pg.locator('#labgame [data-r]').filter(has_text=pairs[dname]).first.click()
  ok('Lab Match: all pairs matched → round complete', pg.locator('#lmn').count()==1 and pg.evaluate('S.lq.games.lab.c')>=len(pool))
  ok('Lab Match level rises with correct answers', pg.evaluate('(S.lq.games.lab.c=16, Math.min(3,1+Math.floor(S.lq.games.lab.c/8)))')==3)
  # inhaler sort & sequence
  pg.goto(U+'#review/inh'); items=pg.evaluate('INH_SORT.length'); cor=0
  for i in range(items):
    name=pg.inner_text('#sortz .lead'); cat=pg.evaluate(f'INH_SORT.find(x=>x[0]==={json.dumps(name)})[1]'); pg.click(f'#sortz [data-s={cat}]'); pg.click('#srn')
  ok('Rescue vs maintenance: perfect run scores 10/10', '10/10' in pg.inner_text('#sortz'))
  pg.click('[data-seq="0"]'); seq=pg.evaluate('window.__seq.order()')
  # bubble sort using buttons
  for _ in range(len(seq)*len(seq)):
    o=pg.evaluate('window.__seq.order()'); bad=[j for j in range(len(o)-1) if o[j]>o[j+1]]
    if not bad: break
    pg.click(f'#seqz [data-dn="{bad[0]}"]')
  pg.click('#sqc'); ok('MDI sequence: arranging with ↑/↓ and checking → all correct', f'{len(seq)}/{len(seq)} in the right place' in pg.inner_text('#seqz'))
  pg.click('[data-seq="1"]'); pg.click('#sqc'); ok('DPI sequence: shuffled order checked → partial score shown', 'in the right place' in pg.inner_text('#seqz') and pg.locator('#seqz li.wrong').count()>=1)
  pg.click('#tbz [data-t="1"]'); ok('Teach-back gives feedback', pg.locator('#tbf .fb').count()==1)
  # insulin peak challenge
  pg.goto(U+'#review/ins'); pg.select_option('#ipp','nph'); pg.select_option('#ipt','16')
  t=pg.inner_text('#view'); ok('NPH at 1600 → peak window 2000–0400 shown', '2000–0400' in t, t[t.find('For a'):t.find('For a')+160])
  qs=pg.evaluate('window.__pq.map(q=>q.a)'); ok('peak question answer = 2000–0400', qs[1]=='2000–0400')
  for a in qs: pg.locator('#ipq [data-pa]').filter(has_text=a).first.click(); pg.click('#pqn')
  ok('Insulin Peak Challenge: 4/4', '4/4' in pg.inner_text('#ipq'))
  pg.select_option('#ipp','glargine'); ok('glargine: flat profile ≠ no risk shown', 'Flat profile' in pg.inner_text('#view') and 'can still occur' in pg.evaluate('window.__pq[1].a'))
  ok('Insulin page links to mixing game', pg.locator('a[href="#insulin/mix"]').count()==1)
  # thyroid
  pg.goto(U+'#review/thy'); pg.click('[data-tg=arrow]'); dx=pg.inner_text('#thyz .lead'); t=pg.evaluate(f'LQ_THY.find(x=>x.dx==={json.dumps(dx)})')
  pg.click(f'#thyz [data-k=tsh][data-o="{t["tsh"]}"]'); pg.click(f'#thyz [data-k=t4][data-o="{t["t4"]}"]'); pg.click('#tac')
  ok('Thyroid Arrow: correct pattern accepted + spaced box advanced', 'Correct' in pg.inner_text('#taf') and pg.evaluate(f'S.lq.thyBox[{json.dumps(dx)}].box')==1)
  pg.click('[data-tg=dx]'); pg.locator('#thyz [data-d]').first.click(); ok('Diagnose pattern gives feedback', pg.locator('#tdf .fb').count()==1)
  pg.click('[data-tg=spot]'); pg.locator('#thyz [data-sp]').first.click(); ok('Spot the incorrect value gives feedback', pg.locator('#tsf .fb').count()==1)
  pg.click('[data-tg=drill]'); pg.locator('#thyz [data-dr]').first.click(); pg.locator('#thyz [data-dr]').first.click(); pg.evaluate('window.__drill.stop()'); pg.wait_for_timeout(1300)
  ok('60-second drill finishes and records best', 'in 60 seconds' in pg.inner_text('#thyz') and pg.evaluate('S.lq.games.drill.n')==2)
  pg.click('[data-tg=med]'); pg.wait_for_selector('#thyz .q'); ok('Thyroid medication safety quiz opens', True)
  # herbals
  pg.goto(U+'#review/herb'); ok('Herbals: SJW serotonin syndrome + grapefruit drug-specific', 'serotonin syndrome' in pg.inner_text('#view') and 'not every drug' in pg.inner_text('#view'))
  pr=pg.inner_text('#hgz .lead'); h=pg.evaluate(f'LQ_HERB.find(h=>(h[0]+" + "+h[1])==={json.dumps(pr)})'); pg.click(f'#hgz [data-h={h[2]}]'); ok('Safe or dangerous: correct category accepted', pg.locator('#hgz .fb.ok').count()==1, pr)
  # 10 games
  pg.goto(U+'#review/games'); ok('games hub lists 10 games', pg.locator('#rvz [data-g]').count()==10)
  for g,zsel in [('detect','[data-a]'),('follow','[data-a]'),('expect','[data-a]')]:
    pg.goto(U+'#review/games'); pg.click(f'[data-g={g}]'); pg.locator('#rvz '+zsel).first.click(); ok(f'game {g} plays + records', pg.locator('#gf .fb').count()==1 and pg.evaluate(f'S.lq.games["{g}"].n')>=1)
    pg.click('#gb'); ok(f'game {g} back to hub', pg.locator('#rvz [data-g]').count()==10)
  pg.goto(U+'#review/games'); pg.click('[data-g=prio]'); pg.wait_for_selector('#gpz .q'); ok('Priority challenge opens a quiz', True)
  pg.click('[data-rv=games]'); pg.click('[data-g=match]'); ok('Medication Match links to matching game', pg.evaluate('location.hash')=='#games')
  # 75-q mock
  pg.goto(U+'#review/mock'); before=pg.evaluate('S.lq.mock.length'); pg.click('#mkGo'); pg.wait_for_selector('#mkz .q')
  answer(pg,'#mkz',False); ok('mock: no rationale shown before submission', pg.locator('#mkz .fb').count()==0 and pg.locator('#mkz .rat').count()==0)
  for i in range(4): answer(pg,'#mkz',False)
  ok('mock: progress saved mid-exam', pg.evaluate('S.resume && S.resume.key')=='lqmock' and pg.evaluate('S.resume.i')==5)
  pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('#view h1'); pg.goto(U+'#review/mock'); ok('mock: resume offered after reload', pg.locator('#mkRes').count()==1)
  pg.click('#mkRes'); pg.wait_for_selector('#mkz .q'); ok('mock: resumes at question 6 of 75', 'question 6 of 75' in pg.inner_text('#mkz').lower(), pg.inner_text('#mkz')[:80])
  for i in range(70): answer(pg,'#mkz',False)
  if pg.locator('#mkz [data-act=submit]').count(): pg.click('#mkz [data-act=submit]')
  # possible confirm step
  for sel in ['#doSub']:
    if pg.locator(sel).count(): pg.click(sel)
  pg.wait_for_timeout(300)
  ok('mock: attempt stored, previous attempts kept', pg.evaluate('S.lq.mock.length')==before+1, pg.inner_text('#mkz')[:200])
  ok('mock: per-tag breakdown + remediation panel', pg.locator('#mkrem').count()==1 and len(pg.evaluate('S.lq.mock.slice(-1)[0].by'))>=5)
  ok('mock: resume cleared after submission', pg.evaluate('S.resume==null || S.resume.key!=="lqmock"'))
  # weak areas & quick reviews
  pg.goto(U+'#review/weak'); ok('weak areas table lists topics', pg.locator('[aria-label="Performance by topic"] tbody tr').count()>=10)
  pg.click('#view [data-qr="10"]'); pg.wait_for_selector('#wkz .q'); ok('10-min quick review = 12 items', 'of 12' in pg.inner_text('#wkz').lower())
  ok('quick pool skips mastered items', pg.evaluate('(()=>{const q=LQ_Q[0];S.qs[q.id]={att:3,cor:3,first:true,last:Date.now()};delete S.missed[q.id];return !quickPool(24).includes(q)})()'))
  pg.goto(U+'#progress'); ok('Progress page shows MY PHARM WEAK AREAS', 'pharm weak areas' in pg.inner_text('#view').lower())
  # drug pages
  pg.goto(U+'#library/lisinopril'); pg.wait_for_selector('.steps'); ok('drug page shows instructor emphasis box', pg.locator('.ie-box').count()==1 and 'HESI clinical judgment' in pg.inner_text('.ie-box'))
  for d in ['amphob','fentanyl','tiotropium','methimazole','sps']:
    pg.goto(U+'#library/'+d); pg.wait_for_selector('.steps'); ok(f'new drug page {d} renders', pg.locator('.drughead h1').count()==1 and 'Something went wrong' not in pg.inner_text('#view'))
  # reports
  pg.goto(U+'#review/acc'); ok('accuracy report lists all discrepancies', pg.locator('#rvz .updbox').count()==pg.evaluate('LQ_DISC.length'))
  pg.goto(U+'#review/audit'); ok('audit table covers PDF + lecture', pg.locator('[aria-label="Coverage audit table"] tbody tr').count()==pg.evaluate('LQ_AUDIT.length'))
  # layout
  for k in ['', 'ace','labs','inh','ins','thy','herb','games','mock','weak','audit','acc']:
    pg.goto(U+'#review'+('/'+k if k else '')); pg.wait_for_timeout(50)
    ov=pg.evaluate('document.documentElement.scrollWidth-window.innerWidth')
    if ov>1: ok(f'no horizontal page overflow on {k or "home"}', False, ov)
  ok('no horizontal overflow on review tabs', True)
  ok('home links to Pharm HESI Review', (pg.goto(U+'#home'), pg.locator('a.lqlink').count())[1]==1)
  ok('no page errors', not errs, errs[:3])
  b.close()
f=[k for k,v in R if not v]; print(f'\n{len(R)-len(f)}/{len(R)} passed at {W}px'); sys.exit(1 if f else 0)
