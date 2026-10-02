from pathlib import Path
p=Path('/mnt/data/vido_upgrade/index.html')
s=p.read_text()
# account card
marker='</div></section>\n<section class="view" data-view="search">'
if 'id="accountEmail"' not in s:
    card='''<section class="view" data-view="account"><div class="viewInner"><div class="viewHead"><button class="back" data-back="">← Zurück</button><h1 data-i18n="account_title">Account & Sync</h1></div><div class="card"><div class="grid two"><div><input id="accountEmail" type="email" placeholder="E-Mail" style="width:100%;box-sizing:border-box;background:#07111f;color:#fff;border:1px solid #31506b;border-radius:8px;padding:10px"><input id="accountPassword" type="password" placeholder="Passwort (8+ Zeichen)" style="width:100%;box-sizing:border-box;background:#07111f;color:#fff;border:1px solid #31506b;border-radius:8px;padding:10px;margin-top:8px"><div class="actions" style="margin-top:10px"><button class="primary" id="accountRegister">Registrieren</button><button class="secondary" id="accountLogin">Anmelden</button></div></div><div><div id="accountStatus" class="helpBox">Local-first. Anmeldung aktiviert Cloud-Sync.</div><button class="secondary" id="accountSync" style="margin-top:8px">Jetzt synchronisieren</button></div></div></div></div></section>'''
    s=s.replace(marker, '</div></section>\n'+card+'<section class="view" data-view="search">')
# add account nav after progress
needle='<button class="navbtn" data-i18n="nav_progress" data-route="progress">◒ Fortschritt</button>'
if 'data-route="account"' not in s:
    s=s.replace(needle, needle+'<button class="navbtn" data-i18n="nav_account" data-route="account">◉ Account & Sync</button>')
# Replace appended V2 engine block with safer improved block by slicing from marker style id to </script> before body end
start=s.find('<style id="vido-v2-engine">')
end=s.find('</script>\n</body></html>', start)
if start<0 or end<0: raise SystemExit('engine block not found')
end += len('</script>')
engine=r'''<style id="vido-v2-engine">
.tutorStatus{font-size:12px}.engineBadge{font-size:11px;border:1px solid var(--line);border-radius:99px;padding:5px 9px;background:#0b1726;color:#b7c8d9}.healthOk{color:#4ade80}.healthWarn{color:#fbbf24}.accountGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:650px){.accountGrid{grid-template-columns:1fr}}
</style>
<script>
(function(){
  const API_BASE=window.VIDO_API_BASE||'/api';
  const engineState=JSON.parse(localStorage.getItem('vidoEngineV2')||'{}');
  engineState.review=engineState.review||{};engineState.answerStartedAt=engineState.answerStartedAt||Date.now();engineState.sessionEvents=engineState.sessionEvents||[];engineState.token=engineState.token||null;engineState.sim=engineState.sim||{devices:[],links:[],arp:{},mac:{},routes:[{network:'192.168.10.0/24',nextHop:'connected',interface:'G0/0'},{network:'0.0.0.0/0',nextHop:'192.168.10.254',interface:'G0/0'}]};
  const persist=()=>localStorage.setItem('vidoEngineV2',JSON.stringify(engineState));
  const api=(path,opts={})=>fetch(API_BASE+path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{}),...(engineState.token?{authorization:'Bearer '+engineState.token}:{})}});
  const dueDate=d=>new Date(Date.now()+d*86400000).toISOString();
  function updateReview(q,correct){let r=engineState.review[q.id]||{interval:0,reps:0,ease:2.5,next:null,mastery:0};if(correct){r.reps++;r.interval=r.reps===1?1:r.reps===2?3:Math.max(1,Math.round(r.interval*r.ease));r.ease=Math.min(3,r.ease+.1);r.mastery=Math.min(100,r.mastery+12)}else{r.interval=0;r.ease=Math.max(1.3,r.ease-.2);r.mastery=Math.max(0,r.mastery-8)}r.next=dueDate(r.interval);engineState.review[q.id]=r;persist();return r}
  function recordEvent(q,correct){const ms=Math.max(0,Date.now()-engineState.answerStartedAt),hints=(state.hints&&state.hints[q.id])||0;updateReview(q,correct);engineState.sessionEvents.push({questionId:q.id,skill:q.skill,correct,answerTimeMs:ms,hintsUsed:hints,at:new Date().toISOString()});engineState.answerStartedAt=Date.now();persist();api('/events',{method:'POST',body:JSON.stringify({questionId:q.id,skill:q.skill,correct,answerTimeMs:ms,hintsUsed:hints})}).catch(()=>{})}
  window.vidoEngine={updateReview,recordEvent,engineState,persist};
  window.vidoNextAdaptive=function(){const now=Date.now(),due=Q.filter(q=>engineState.review[q.id]?.next&&Date.parse(engineState.review[q.id].next)<=now);if(due.length)return due[Math.floor(Math.random()*due.length)];const weak=Q.slice().sort((a,b)=>(state.mastery[a.skill]||0)-(state.mastery[b.skill]||0));return weak[Math.floor(Math.random()*Math.min(12,weak.length))]||Q[0]};

  function tutorContext(){const q=Q[state.current]||Q[0];if($('tutorQuestion'))$('tutorQuestion').textContent=qTarget(q)+' · '+q.ip;if($('tutorSkill'))$('tutorSkill').textContent=qSkill(q)+' · '+levelLabel(q.level)}
  function tutorAsk(){const q=Q[state.current]||Q[0],input=$('tutorInput')?.value.trim()||'';const fallback=lang==='ar'?`ابدأ بقاعدة ${q.skill}. لا أعطيك الجواب مباشرة. حدد أول معلومة مطلوبة ثم طبق القاعدة خطوة بخطوة.`:lang==='en'?`Start with the ${q.skill} rule. I will not reveal the answer immediately. Identify the first required datum and apply the rule step by step.`:`Starte mit der Regel ${q.skill}. Ich verrate die Lösung nicht sofort. Bestimme zuerst die benötigte Information und wende die Regel Schritt für Schritt an.`;if($('tutorResponse'))$('tutorResponse').textContent=fallback;api('/tutor',{method:'POST',body:JSON.stringify({question:qTarget(q)+' | '+q.ip,answer:input,skill:q.skill,level:q.level,hintsUsed:(state.hints&&state.hints[q.id])||0,language:lang})}).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{if(d.reply)$('tutorResponse').textContent=d.reply}).catch(()=>{})}
  if($('tutorAsk'))$('tutorAsk').onclick=tutorAsk;document.querySelectorAll('[data-route="tutor"]').forEach(b=>b.addEventListener('click',()=>setTimeout(tutorContext,0)));
  if($('check'))$('check').addEventListener('click',()=>{const q=Q[state.current],a=$('answer').value.trim();if(!a)return;const key=q.id+'|'+state.attempts;if(engineState.lastRecorded!==key){engineState.lastRecorded=key;recordEvent(q,grade(q,a))}tutorContext()});

  function ip4(s){const a=String(s).trim().split('.').map(Number);return a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=255)?a:null}
  function maskBits(mask){const a=ip4(mask);if(!a)return null;const b=a.map(x=>x.toString(2).padStart(8,'0')).join('');return b.includes('01')?null:(b.match(/1/g)||[]).length}
  function net(ip,mask){const a=ip4(ip),m=ip4(mask);return a&&m?a.map((x,i)=>x&m[i]).join('.'):null}
  function sameSubnet(a,b,mask){return net(a,mask)&&net(a,mask)===net(b,mask)}
  function simPing(){const ip=$('simIp').value.trim(),mask=$('simMask').value.trim(),gw=$('simGw').value.trim(),valid=!!ip4(ip)&&!!ip4(gw)&&maskBits(mask)!==null,ok=valid&&sameSubnet(ip,gw,mask);const msg=ok?(lang==='ar'?'✓ Ping ناجح: العنوان والـGateway في نفس الـSubnet.':lang==='en'?'✓ Ping successful: host and gateway are in the same subnet.':'✓ Ping erfolgreich: Host und Gateway liegen im selben Subnetz.'):(lang==='ar'?'✗ Ping فشل: افحص IP وSubnet Mask وGateway.':lang==='en'?'✗ Ping failed: check IP, subnet mask and gateway.':'✗ Ping fehlgeschlagen: IP, Subnetzmaske und Gateway prüfen.');simLog(msg);engineState.sim.lastPing={ip,mask,gw,ok};persist()}
  if($('simPing'))$('simPing').onclick=simPing;
  document.querySelectorAll('[data-add]').forEach(b=>{b.onclick=()=>{const n=engineState.sim.devices.length+1,d={id:b.dataset.add+'-'+n,type:b.dataset.add,ip:'',mask:'',gateway:'',mac:'AA:BB:CC:'+String(n).padStart(2,'0')+':00:01'};engineState.sim.devices.push(d);persist();simLog((lang==='ar'?'تمت إضافة ':lang==='en'?'Added ':'Hinzugefügt ')+d.id)}});
  if($('cliIn'))$('cliIn').onkeydown=e=>{if(e.key!=='Enter')return;const c=e.target.value.trim(),o=$('cliOut');o.textContent+=`\nVIDO-R1# ${c}`;const known={
    'show ip interface brief':'Gig0/0  192.168.10.1  up  up\nGig0/1  10.0.0.1      up  up',
    'show ip route':'C 192.168.10.0/24 is directly connected, Gig0/0\nS* 0.0.0.0/0 via 192.168.10.254',
    'show arp':'192.168.10.10  AA:BB:CC:10:10:10  ARPA',
    'show mac address-table':'10  AA:BB:CC:10:10:10  DYNAMIC  Gi0/1',
    'no shutdown':'Interface enabled',
    'ip address 192.168.1.1 255.255.255.0':'Interface IPv4 configured'
  };o.textContent+='\n'+(known[c]||'% VIDO training mode: command not implemented. Try show ip route, show arp, show mac address-table, show ip interface brief, no shutdown.');e.target.value=''};

  // Account + cloud sync.
  function accountStatus(msg){if($('accountStatus'))$('accountStatus').textContent=msg}
  $('accountRegister')?.addEventListener('click',async()=>{const email=$('accountEmail').value.trim(),password=$('accountPassword').value;const r=await api('/auth/register',{method:'POST',body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)return accountStatus(d.error||'Registration failed');engineState.token=d.token;persist();accountStatus('Registered and signed in.');sync()});
  $('accountLogin')?.addEventListener('click',async()=>{const email=$('accountEmail').value.trim(),password=$('accountPassword').value;const r=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)return accountStatus(d.error||'Login failed');engineState.token=d.token;persist();accountStatus('Signed in.');sync()});
  async function sync(){if(!engineState.token)return accountStatus('Sign in first.');const r=await api('/state');if(r.ok){const remote=await r.json();if(remote){Object.assign(state,remote);save();renderStats();renderQuestion();renderLists();renderProgress()}}await api('/state',{method:'PUT',body:JSON.stringify({state})});accountStatus('Cloud sync completed.');}
  $('accountSync')?.addEventListener('click',sync);

  // Backend health indicator.
  const badge=document.createElement('span');badge.className='engineBadge';badge.textContent='Engine';document.querySelector('.top')?.appendChild(badge);api('/health').then(r=>r.json()).then(h=>{badge.textContent=h.database&&h.ai?'Backend + AI ✓':h.database?'Backend ✓':'Local Engine';badge.className='engineBadge '+(h.database?'healthOk':'healthWarn')}).catch(()=>{badge.textContent='Local Engine'});
  document.documentElement.dataset.vidoEngine='v2';
})();
</script>'''
s=s[:start]+engine+s[end:]
p.write_text(s)
