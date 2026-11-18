import json, sys
from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
page_html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+html+'</body></html>'
open('/tmp/claude-0/t.html','w').write(page_html)
errs=[]; res={}
def ok(k,v): res[k]=v; print(('PASS ' if v else 'FAIL ')+k)
with sync_playwright() as p:
  b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
  pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort()); 
  pg.goto('file:///tmp/claude-0/t.html'); pg.wait_for_selector('#view')
  # 2 search
  pg.goto('file:///tmp/claude-0/t.html#library'); pg.fill('#libq','Lasix'); ok('search Lasix -> furosemide', pg.locator('#libgrid [data-drug=furosemide]').count()==1 and pg.locator('#libgrid .rx').count()==1)
  pg.fill('#libq','antidote'); pg.click('#libgrid .rx >> nth=0'); ok('deep dive opens', pg.locator('.chain').count()>0)
  pg.click('#drill'); ok('flash reveal disabled before confidence', pg.locator('#fl-show').is_disabled())
  pg.click('[data-c=unsure]'); pg.click('#fl-show'); pg.click('[data-g=miss]')
  st=pg.evaluate('S'); ok('card graded+due soon', any(c['lastRes']=='miss' for c in st['cards'].values()))
  # 5 wrong answer
  pg.goto('file:///tmp/claude-0/t.html#hold'); pg.click('[data-h="hold:h1"]'); pg.click('#hzone .opt[data-o="0"]'); pg.click('#hzone [data-conf=sure]'); pg.click('#hzone [data-act=check]')
  ok('wrong answer shows rationale', pg.locator('#hzone .fb.bad').count()==1)
  st=pg.evaluate('S'); ok('missed saved w/ review date', 'hold:h1' in st['missed'] and st['missed']['hold:h1']['due']>0 and st['missed']['hold:h1']['ans']!='')
  ok('drug card scheduled after miss', 'digoxin:safety' in st['cards'])
  # 4 matching game
  pg.goto('file:///tmp/claude-0/t.html#games')
  for mode in ['anti','brand','class','mech','ind','ae','lab']:
    pg.click(f'[data-mode={mode}]')
    for i in range(6):
      ls=pg.locator('.tile[data-l]:not([disabled])')
      if ls.count()==0: break
      lid=ls.first.get_attribute('data-l'); pg.click(f'[data-l="{lid}"]'); pg.click(f'[data-r="{lid}"]')
    if pg.locator('.fb.ok').count()!=1: ok('game '+mode,False)
  ok('matching games complete (7 modes)', pg.evaluate('S.games.played')==7)
  # keyboard match
  pg.click('#again'); lid=pg.locator('.tile[data-l]').first.get_attribute('data-l'); pg.focus(f'[data-l="{lid}"]'); pg.keyboard.press('Enter'); pg.focus(f'[data-r="{lid}"]'); pg.keyboard.press('Enter')
  ok('keyboard matching', pg.locator(f'.tile.done[data-l="{lid}"]').count()==1)
  # 6 exam
  pg.goto('file:///tmp/claude-0/t.html#exam'); pg.click('[data-n="10"]'); pg.click('#exGo')
  for i in range(10):
    z='#exzone'
    if pg.locator(z+' .opt').count() and pg.locator(z+' [data-bt]').count()==0: pg.locator(z+' .opt').first.click()
    if pg.locator(z+' .mx').count():
      for r in range(pg.locator(z+' tbody tr').count()): pg.locator(f'{z} input[data-r="{r}"][data-c="0"]').check()
    if pg.locator(z+' [data-bt]').count():
      pg.click(z+' [data-bt=c][data-o="0"]'); pg.click(z+' [data-bt=a][data-o="0"]'); pg.click(z+' [data-bt=a][data-o="1"]'); pg.click(z+' [data-bt=m][data-o="0"]'); pg.click(z+' [data-bt=m][data-o="1"]')
    if i<9: pg.click(z+' [data-act=next]')
  pg.click('#exzone [data-act=submit]'); pg.click('#doSub')
  ok('exam scored', pg.locator('#exzone h2').count()==1 and '%' in pg.locator('#exzone h2').inner_text()); print('   exam:',pg.locator('#exzone h2').inner_text())
  ok('exam saved', len(pg.evaluate('S.exams'))==1)
  # 1 full 20-min session
  pg.goto('file:///tmp/claude-0/t.html#home'); pg.click('[data-nav=session][data-arg="20"] >> nth=0'); pg.wait_for_selector('.phase')
  guard=0
  while guard<80:
    guard+=1
    if pg.locator('#view .phase').count()==0: print('   EXIT at', guard, pg.evaluate('location.hash'), pg.locator('#view').inner_text()[:200].replace('\n',' | ')); break
    if pg.locator('#phaseBody .empty + button, #phaseBody > button').count(): pg.locator('#phaseBody button').first.click(); continue
    if pg.locator('#learnGo').count(): pg.click('#learnGo'); continue
    if pg.locator('#fl-show').count(): pg.click('[data-c=sure]'); pg.click('#fl-show'); pg.click('[data-g=got]'); continue
    if pg.locator('[data-g]').count(): pg.click('[data-g=got]'); continue
    if pg.locator('#phaseBody [data-act=next]').count(): pg.click('#phaseBody [data-act=next]'); continue
    if pg.locator('#phaseBody [data-act=check]').count():
      z='#phaseBody'
      if pg.locator(z+' .mx').count():
        for r in range(pg.locator(z+' tbody tr').count()): pg.locator(f'{z} input[data-r="{r}"][data-c="0"]').check()
      elif pg.locator(z+' [data-bt]').count():
        for s in ['c][data-o="0"','a][data-o="0"','a][data-o="1"','m][data-o="0"','m][data-o="1"']: pg.click(f'{z} [data-bt={s}]')
      elif pg.locator(z+' .opt').count(): pg.locator(z+' .opt').first.click()
      pg.click(z+' [data-conf=unsure]'); pg.click(z+' [data-act=check]'); continue
    if pg.locator('#expl').count(): pg.fill('#expl','It strengthens contraction; check pulse.'); pg.click('#explGo'); pg.click('#finS'); continue
    print('   STUCK:', pg.locator('#view').inner_text()[:400].replace('\n',' | ')); break
  ok('20-min session completes', len(pg.evaluate('S.sessions'))==1); print('   session:',pg.evaluate('S.sessions[0]'))
  # rescue
  pg.goto('file:///tmp/claude-0/t.html#rescue'); pg.click('[data-r=t1]'); pg.click('#more')
  for qi in range(3):
    k=pg.evaluate(f'RESCUE[0].q{qi+1}.k'); pg.click(f'[data-q="{qi}"][data-o="{k}"]')
  ok('rescue case 3/3', '3/3' in pg.locator('.fb').inner_text())
  # systems module + compare + progress
  pg.goto('file:///tmp/claude-0/t.html#systems'); pg.click('[data-sys=mat]'); ok('module sections', pg.locator('.sticker').count()>3 and pg.locator('.tbl').count()==1)
  pg.click('#mprac'); ok('module practice loads', pg.locator('#mzone .q').count()==1)
  pg.goto('file:///tmp/claude-0/t.html#compare'); pg.select_option('#cmpSel','insulin'); ok('compare insulin + flag', pg.locator('.flagbox').count()==1)
  pg.goto('file:///tmp/claude-0/t.html#progress'); pg.click('#exp'); pg.wait_for_timeout(300); ok('export fallback fills JSON', pg.input_value('#impt').startswith('{'))
  pg.goto('file:///tmp/claude-0/t.html#missed'); ok('missed list populated', pg.locator('[data-retry]').count()>=1)
  pg.wait_for_timeout(1500)
  # 7 persistence
  n_before=len(pg.evaluate('Object.keys(S.qs)')); pg.reload(); pg.wait_for_selector('#view')
  ok('progress persists after reload', len(pg.evaluate('Object.keys(S.qs)'))==n_before and len(pg.evaluate('S.sessions'))==1)
  pg.goto('file:///tmp/claude-0/t.html#home'); pg.screenshot(path='/tmp/claude-0/desk-home.png',full_page=False)
  # 8 mobile
  m=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme='dark'); mp=m.new_page(); mp.on('pageerror',lambda e: errs.append(str(e)))
  mp.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  bad=[]
  for v in ['home','session','library','systems','games','hold','rescue','math','exam','missed','compare','progress']:
    mp.goto('file:///tmp/claude-0/t.html#'+v); mp.wait_for_selector('#view'); mp.wait_for_timeout(100)
    w=mp.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]')
    if w[0]>w[1]: bad.append((v,w))
  mp.goto('file:///tmp/claude-0/t.html#library'); mp.click('[data-drug=digoxin]'); w=mp.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]'); 
  if w[0]>w[1]: bad.append(('deep',w))
  mp.screenshot(path='/tmp/claude-0/mob-deep.png')
  mp.goto('file:///tmp/claude-0/t.html#home'); mp.screenshot(path='/tmp/claude-0/mob-home.png')
  ok('mobile no horizontal scroll', not bad); print('  ',bad)
  b.close()
print('ERRORS:',errs[:10])
