from playwright.sync_api import sync_playwright
U='file:///tmp/claude-0/audit.html'
with sync_playwright() as pw:
  b=pw.chromium.launch(); p=b.new_page(viewport={'width':390,'height':844}); p.route('**/fonts.googleapis.com/**', lambda r: r.abort())
  for name,h,js in [("home","home",""),("drug lesson digoxin","library/digoxin",""),("mm lesson 1","math","MMV.tab='lesson';MMV.lesson=1;vMedMath(document.querySelector('#view'))"),("mm lesson 8","math","MMV.tab='lesson';MMV.lesson=8;vMedMath(document.querySelector('#view'))"),("library","library",""),("module cardio","systems/cardio","")]:
    p.goto('about:blank'); p.goto(U+'#'+h); p.wait_for_selector('#view')
    if js: p.evaluate(js)
    print(name, round(p.evaluate("document.documentElement.scrollHeight")/844,1), "screens tall;", p.evaluate("document.querySelector('#view').innerText.split(/\\s+/).length"),"words")
  b.close()
