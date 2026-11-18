import pathlib
s=pathlib.Path('src')
css=(s/'styles.css').read_text(); js='\n'.join((s/f).read_text() for f in ['drugs.js','questions.js','updates.js','ins_data.js','lq_data.js','lq_q.js','mmengine.js','medmath.js','insulin.js','review.js','app.js'])
html=f'''<title>PHARM MASTER</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
{css}</style>
<div id="app"></div>
<script>
{js}
</script>
'''
pathlib.Path('pharm-master.html').write_text(html)
pathlib.Path('bundle.js').write_text(js)
print(len(html))
# Standalone copy with a full HTML document wrapper (charset + viewport) for opening the file directly in a browser
_app = open("pharm-master.html").read()
open('pharm-master-standalone.html', 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">' + _app + '</body></html>')
