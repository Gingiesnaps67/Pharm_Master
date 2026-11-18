import sys
from playwright.sync_api import sync_playwright
R=[]; errs=[]
def ok(k,v,i=''): R.append(v); print(('PASS ' if v else 'FAIL ')+k+(' '+str(i) if not v and i else ''))
PW='Correct-Horse-42'
with sync_playwright() as p:
  b=p.chromium.launch(); W=int(sys.argv[1]) if len(sys.argv)>1 else 390
  ctx=b.new_context(viewport={'width':W,'height':844},accept_downloads=True); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
  pg.goto('file:///home/claude/pharm/lock/pharm-master-locker.html')
  pg.fill('#p1','short'); pg.fill('#p2','short'); pg.click('#go'); pg.wait_for_timeout(500); ok('rejects <8 chars (no file made)', pg.locator('#dl').count()==0 and pg.evaluate('!document.getElementById("p1").checkValidity()'))
  pg.fill('#p1',PW); pg.fill('#p2',PW+'x'); pg.click('#go'); ok('rejects mismatch', "don't match" in pg.inner_text('#msg'))
  pg.fill('#p1',PW); pg.fill('#p2',PW)
  with pg.expect_download(timeout=60000) as d: pg.click('#go')
  d.value.save_as('/tmp/claude-0/locked.html'); html=open('/tmp/claude-0/locked.html').read()
  ok('locked file downloaded', len(html)>500000, len(html))
  ok('locked file contains no readable app content', all(s not in html for s in ['PHARM HESI','lisinopril','Insulin','vReview','QUESTIONS']))
  ok('password fields cleared after creating', pg.input_value('#p1')=='' and pg.input_value('#p2')=='')
  pg2=ctx.new_page(); pg2.on('pageerror',lambda e:errs.append(str(e))); pg2.route('**/fonts.googleapis.com/**',lambda r:r.abort())
  pg2.goto('file:///tmp/claude-0/locked.html'); pg2.fill('#pw','wrong-password'); pg2.click('#go'); pg2.wait_for_function('document.getElementById("err").textContent.length>0',timeout=30000)
  ok('wrong password refused', 'Wrong password' in pg2.inner_text('#err') and pg2.locator('#view').count()==0)
  pg2.fill('#pw',PW); pg2.click('#go'); pg2.wait_for_selector('#view h1',timeout=30000)
  ok('correct password opens the app', 'PHARM MASTER' in pg2.inner_text('body'))
  pg2.evaluate('location.hash="review/ins"'); pg2.wait_for_selector('#ipp'); ok('navigation works after unlock (HESI Review → Insulin peaks)', pg2.locator('#ipp').count()==1)
  pg2.select_option('#ipp','nph'); pg2.select_option('#ipt','16'); ok('interactive feature works (NPH 1600 → 2000–0400)', '2000–0400' in pg2.inner_text('#view'))
  pg2.evaluate('location.hash="review/thy"'); pg2.wait_for_selector('[data-tg=arrow]'); pg2.click('[data-tg=arrow]'); pg2.locator('#thyz [data-k=tsh]').first.click(); pg2.wait_for_timeout(1200)
  ok('progress saves to this browser', pg2.evaluate('!!localStorage.getItem("pharm-master-v1")'))
  ok('no page errors', not errs, errs[:3])
  b.close()
print(f'{sum(R)}/{len(R)} passed at {W}px'); sys.exit(0 if all(R) else 1)
