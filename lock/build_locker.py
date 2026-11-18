# Builds lock/pharm-master-locker.html: an offline tool that encrypts the app with a password YOU choose
# (PBKDF2-SHA256 600k iterations -> AES-256-GCM, WebCrypto) and downloads pharm-master-locked.html.
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
app = (root / 'pharm-master.html').read_text()
doc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHARM MASTER</title></head><body style="margin:0">' + app + '</body></html>'
b64 = base64.b64encode(doc.encode('utf-8')).decode()

LOCKED = r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHARM MASTER — locked</title>
<style>:root{color-scheme:light dark;--bg:#f4f6fb;--card:#fff;--ink:#14213a;--mut:#5a6478;--acc:#00776F;--bad:#AE2A40}
@media (prefers-color-scheme:dark){:root{--bg:#0f1624;--card:#18223a;--ink:#eef2fa;--mut:#a9b3c7;--acc:#2fd0c0;--bad:#ff8a9b}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
form{width:100%;max-width:360px;background:var(--card);border-radius:18px;padding:28px 22px;box-shadow:0 10px 30px rgba(0,0,0,.12);display:grid;gap:14px}
h1{margin:0;font-size:1.4rem}p{margin:0;color:var(--mut);font-size:.92rem}label{font-weight:600;font-size:.9rem}
input{width:100%;font:inherit;font-size:16px;padding:12px 14px;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--mut) 50%,transparent);background:transparent;color:var(--ink)}
input:focus{outline:3px solid color-mix(in srgb,var(--acc) 40%,transparent);border-color:var(--acc)}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:12px;background:var(--acc);color:#fff;cursor:pointer}button:disabled{opacity:.6}
#err{color:var(--bad);font-weight:600;min-height:1.4em}</style></head><body>
<form id="f" autocomplete="off"><h1>PHARM MASTER</h1><p>This copy is encrypted. Enter your password to open it.</p>
<div><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required autofocus></div>
<button id="go">Unlock</button><div id="err" role="alert" aria-live="assertive"></div></form>
<script id="payload" type="application/json">__PAYLOAD__</script>
<script>
(()=>{const P=JSON.parse(document.getElementById("payload").textContent);
const b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
document.getElementById("f").onsubmit=async e=>{e.preventDefault();const btn=document.getElementById("go"),err=document.getElementById("err");btn.disabled=true;btn.textContent="Unlocking…";err.textContent="";
 try{const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(document.getElementById("pw").value),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b(P.salt),iterations:P.iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
  const html=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b(P.iv)},key,b(P.ct)));
  document.open();document.write(html);document.close();
 }catch(x){err.textContent="Wrong password — try again.";btn.disabled=false;btn.textContent="Unlock";document.getElementById("pw").select();}};})();
</script></body></html>'''

LOCKER = r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHARM MASTER Locker</title>
<style>:root{color-scheme:light dark;--bg:#f4f6fb;--card:#fff;--ink:#14213a;--mut:#5a6478;--acc:#00776F;--bad:#AE2A40}
@media (prefers-color-scheme:dark){:root{--bg:#0f1624;--card:#18223a;--ink:#eef2fa;--mut:#a9b3c7;--acc:#2fd0c0;--bad:#ff8a9b}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
form{width:100%;max-width:420px;background:var(--card);border-radius:18px;padding:28px 22px;box-shadow:0 10px 30px rgba(0,0,0,.12);display:grid;gap:14px}
h1{margin:0;font-size:1.4rem}p,li{margin:0;color:var(--mut);font-size:.92rem}ul{margin:0;padding-left:18px;display:grid;gap:4px}label{font-weight:600;font-size:.9rem}
input{width:100%;font:inherit;font-size:16px;padding:12px 14px;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--mut) 50%,transparent);background:transparent;color:var(--ink)}
button,a.dl{font:inherit;font-weight:700;padding:12px;border:0;border-radius:12px;background:var(--acc);color:#fff;cursor:pointer;text-align:center;text-decoration:none}button:disabled{opacity:.6}
#msg{font-weight:600;min-height:1.4em}#msg.bad{color:var(--bad)}</style></head><body>
<form id="f" autocomplete="off"><h1>Create a password-locked PHARM MASTER</h1>
<p>Everything happens on this device — your password is never sent anywhere.</p>
<ul><li>At least 8 characters. A short phrase is easiest to remember.</li><li>There is no password reset. If you forget it, the locked copy can't be opened — make a new one from this tool.</li></ul>
<div><label for="p1">Choose a password</label><input id="p1" type="password" autocomplete="new-password" minlength="8" required></div>
<div><label for="p2">Type it again</label><input id="p2" type="password" autocomplete="new-password" minlength="8" required></div>
<button id="go">Create locked copy</button><div id="msg" role="status" aria-live="polite"></div><div id="out"></div></form>
<script id="app" type="application/octet-stream">__APP__</script>
<script id="tpl" type="text/plain">__TPL__</script>
<script>
const B=u=>{let s="";for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
document.getElementById("f").onsubmit=async e=>{e.preventDefault();const p1=document.getElementById("p1").value,p2=document.getElementById("p2").value,m=document.getElementById("msg"),btn=document.getElementById("go");
 m.className="";if(p1.length<8){m.className="bad";m.textContent="Use at least 8 characters.";return}if(p1!==p2){m.className="bad";m.textContent="The two passwords don't match.";return}
 btn.disabled=true;m.textContent="Encrypting…";
 const plain=Uint8Array.from(atob(document.getElementById("app").textContent.trim()),c=>c.charCodeAt(0));
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iter=600000;
 const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(p1),"PBKDF2",false,["deriveKey"]);
 const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt"]);
 const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,plain));
 const html=decodeURIComponent(escape(atob(document.getElementById("tpl").textContent.trim()))).replace("__PAYLOAD__",JSON.stringify({v:1,iter,salt:B(salt),iv:B(iv),ct:B(ct)}));
 const url=URL.createObjectURL(new Blob([html],{type:"text/html"}));
 document.getElementById("out").innerHTML='<a class="dl" id="dl" download="pharm-master-locked.html" href="'+url+'">Download pharm-master-locked.html</a>';
 document.getElementById("dl").click();m.textContent="Done. Keep the downloaded file and remember your password.";btn.disabled=false;
 document.getElementById("p1").value=document.getElementById("p2").value="";};
</script></body></html>'''

out = LOCKER.replace('__APP__', b64).replace('__TPL__', base64.b64encode(LOCKED.encode()).decode())
(root / 'lock' / 'pharm-master-locker.html').write_text(out)
print('locker bytes', len(out))
