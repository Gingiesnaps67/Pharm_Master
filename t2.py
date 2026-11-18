from playwright.sync_api import sync_playwright
html=open('pharm-master.html').read()
open('/tmp/claude-0/t.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>')
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(); pg.on('pageerror',lambda e: print('ERR',e))
  pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  pg.goto('file:///tmp/claude-0/t.html#home'); pg.click('[data-nav=session][data-arg="20"] >> nth=0'); pg.wait_for_timeout(200)
  print(pg.locator('#view').inner_text()[:600])
  print(pg.evaluate('location.hash'), pg.evaluate('SESSION && SESSION.phase'))
