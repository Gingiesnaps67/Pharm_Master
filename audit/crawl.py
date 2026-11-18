import json, hashlib, sys
from playwright.sync_api import sync_playwright
SRC=sys.argv[1]; OUT=sys.argv[2]
html=open(SRC).read()
page='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>'
open('/tmp/claude-0/audit.html','w').write(page)
U='file:///tmp/claude-0/audit.html'
AXE=open('node_modules/axe-core/axe.min.js').read()
# screen setups: (name, hash, js to run after load)
SCREENS=[("home","home",""),("session","session",""),("library","library",""),("drug","library/digoxin",""),("drug-understand","library/digoxin","document.querySelector('#tab-understand').click()"),("drug-master","library/digoxin","document.querySelector('#tab-master').click()"),
 ("systems","systems",""),("module","systems/cardio",""),("games","games",""),("hold","hold",""),("rescue","rescue",""),
 ("rescue-case","rescue","RES.id='t1';route()"),("exam","exam",""),("missed","missed",""),("compare","compare",""),("progress","progress",""),
 ("mm-home","math",""),("mm-learn","math","MMV.tab='learn';vMedMath(document.querySelector('#view'))"),("mm-lesson7","math","MMV.tab='lesson';MMV.lesson=7;vMedMath(document.querySelector('#view'))"),
 ("mm-practice","math","MMV.tab='practice';vMedMath(document.querySelector('#view'))"),("mm-games","math","MMV.tab='games';MMG.g=null;vMedMath(document.querySelector('#view'))"),
 ("mm-exam","math","MMV.tab='exam';vMedMath(document.querySelector('#view'))"),("mm-cheat","math","MMV.tab='cheat';vMedMath(document.querySelector('#view'))"),("mm-bench","math/bench",""),("mm-build","math/build",""),("ins-home","insulin",""),("ins-timeline","insulin/timeline",""),("ins-cases","insulin/cases",""),("ins-mix","insulin/mix",""),("ins-check","insulin/check",""),("ins-syringe","insulin/syringe",""),("ins-quiz","insulin/quiz",""),("ins-play","insulin/play","")]
res={"axe":{}, "dead":[], "buttons":0, "screens":{}}
with sync_playwright() as pw:
  b=pw.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  def setup(h, js):
    pg.goto('about:blank'); pg.goto(U+'#'+h); pg.wait_for_selector('#view h1, #view h2')
    if js: pg.evaluate(js)
    pg.wait_for_timeout(80)
  for name,h,js in SCREENS:
    for theme in ['light','dark']:
      setup(h,js); pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}')")
      pg.add_script_tag(content=AXE)
      r=pg.evaluate("""async()=>{const r=await axe.run(document,{resultTypes:['violations']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,ex:v.nodes.slice(0,2).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\\n').slice(0,2).join(' '))}))}""")
      for v in r:
        k=v['id']; a=res['axe'].setdefault(k,{"impact":v['impact'],"help":v['help'],"screens":{},"ex":v['ex']})
        a['screens'][f"{name}/{theme}"]=v['n']
    # dead button crawl (light, unique texts)
    setup(h,js)
    btns=pg.evaluate("""()=>Array.from(document.querySelectorAll('#app button, #app a[href], #app [role=button]')).map((b,i)=>({i,t:(b.innerText||b.getAttribute('aria-label')||'').trim().slice(0,60),vis:!!(b.offsetWidth||b.offsetHeight),dis:b.disabled}))""")
    seen=set(); tested=0
    for bt in btns:
      if not bt['vis'] or bt['dis']: continue
      key=bt['t'] or ('#'+str(bt['i']))
      if key in seen: continue
      seen.add(key); tested+=1
      if tested>45: break
      setup(h,js)
      before=pg.evaluate("[location.hash, document.querySelector('#app').innerHTML.length, document.querySelector('#app').innerHTML]")
      try:
        el=pg.locator('#app button, #app a[href], #app [role=button]').nth(bt['i'])
        el.click(timeout=2000)
      except Exception as e:
        res['dead'].append({"screen":name,"btn":key,"why":"click failed: "+str(e)[:80]}); continue
      pg.wait_for_timeout(120)
      after=pg.evaluate("[location.hash, document.querySelector('#app').innerHTML.length, document.querySelector('#app').innerHTML, !!document.querySelector('.toast')]")
      if after[0]==before[0] and after[2]==before[2] and not after[3]:
        res['dead'].append({"screen":name,"btn":key})
    res['buttons']+=tested
    res['screens'][name]=tested
  # mobile nav
  m=b.new_context(viewport={'width':390,'height':844}); mp=m.new_page(); mp.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  mp.goto(U+'#home'); mp.wait_for_selector('#view')
  res['mobile_nav']=mp.evaluate("""()=>{const a=[...document.querySelectorAll('.nav a')];return {items:a.length,visible:a.filter(x=>{const r=x.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}).length, headerH:document.querySelector('.top').getBoundingClientRect().height}}""")
  mp.screenshot(path='/tmp/claude-0/audit-mob-home.png')
  # tablet
  t=b.new_context(viewport={'width':820,'height':1180}); tp=t.new_page(); tp.route('**/fonts.googleapis.com/**', lambda r: r.abort()); tp.goto(U+'#library'); tp.wait_for_selector('#view')
  res['tablet_overflow']=tp.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth")
  # perf
  p2=ctx.new_page(); p2.route('**/fonts.googleapis.com/**', lambda r: r.abort()); p2.goto(U+'#home'); p2.wait_for_selector('#view .card')
  res['perf']=p2.evaluate("""()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd), genQ:GEN.length, allQ:ALLQ.length}}""")
  # route switching time
  res['perf']['routeMs']=p2.evaluate("""()=>{const t=performance.now();for(const k of ['library','home','math','exam','progress','systems']){location.hash=k;route();}return Math.round((performance.now()-t)/6)}""")
  # focus after route change
  p2.evaluate("location.hash='library'"); p2.wait_for_timeout(100); res['focus_after_route']=p2.evaluate("document.activeElement.tagName+'#'+document.activeElement.id")
  # sprint best bug
  p2.evaluate("S.mm=undefined;mmS();gameScore('sprint',-999)"); res['sprint_best_after_ineligible']=p2.evaluate("S.mm.games.sprint.best")
  # rx card markup validity
  p2.goto(U+'#library'); p2.wait_for_selector('.medrow'); res['rx_button_children']=p2.evaluate("document.querySelectorAll('button.rx').length")
  # back button from deep dive
  p2.goto(U+'#home'); p2.wait_for_selector('#view'); p2.evaluate("location.hash='library'"); p2.wait_for_selector('.medrow'); p2.click('[data-drug=digoxin]'); p2.wait_for_timeout(100); h1=p2.evaluate("location.hash"); p2.go_back(); p2.wait_for_timeout(200)
  res['back_from_deepdive']={"hash_in_deepdive":h1,"after_back":p2.evaluate("location.hash"),"still_deepdive":p2.locator('.steps').count()>0}
  # interrupted exam
  p2.goto(U+'#exam'); p2.wait_for_selector('#exGo'); p2.click('[data-n="10"]'); p2.click('#exGo'); p2.wait_for_selector('#exzone .q'); (p2.locator('#exzone .opt').first.click() if p2.locator('#exzone .opt').count() else None); p2.click('#exzone [data-act=next]'); p2.evaluate("location.hash='home'"); p2.wait_for_timeout(100); p2.evaluate("location.hash='exam'"); p2.wait_for_timeout(150)
  res['exam_resume']=p2.evaluate("!!(S.resume&&S.resume.key==='exam')") and p2.locator('#exRes').count()>0
  b.close()
json.dump(res,open(OUT,'w'),indent=1)
print(json.dumps({k:v for k,v in res.items() if k!='axe'},indent=1)[:3000])
print({k:(v['impact'],sum(v['screens'].values()),len(v['screens'])) for k,v in res['axe'].items()})
