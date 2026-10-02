from pathlib import Path
p=Path('/mnt/data/vido_upgrade/index.html')
s=p.read_text()
# Add Tutor nav after Help
needle='<button class="navbtn" data-i18n="nav_help" data-route="help">? Hilfe</button>'
if 'data-route="tutor"' not in s:
    s=s.replace(needle, needle+'<button class="navbtn" data-i18n="nav_tutor" data-route="tutor">✦ VIDO Tutor</button>')
# Add tutor view before simulator section
marker='<section class="view" data-view="sim">'
if 'data-view="tutor"' not in s:
    tutor='''<section class="view" data-view="tutor"><div class="viewInner"><div class="viewHead"><button class="back" data-back="">← Zurück</button><h1 data-i18n="tutor_title">VIDO Tutor</h1><span class="muted" data-i18n="tutor_subtitle">Socratic IT learning assistant</span></div><div class="grid two"><div class="card"><h3 data-i18n="tutor_context">Aktuelle Aufgabe</h3><div class="muted" id="tutorQuestion">—</div><div class="tag" id="tutorSkill" style="margin-top:8px">—</div><textarea id="tutorInput" rows="5" style="width:100%;margin-top:12px;background:#07111f;color:#fff;border:1px solid #31506b;border-radius:10px;padding:12px" placeholder="Beschreibe deinen Denkweg oder Fehler..."></textarea><button class="primary" id="tutorAsk" style="margin-top:10px" data-i18n="tutor_ask">Tutor fragen</button></div><div class="card"><h3 data-i18n="tutor_response">Tutor-Antwort</h3><div id="tutorResponse" class="helpBox" aria-live="polite">—</div><div class="muted" id="tutorStatus" style="margin-top:8px"></div></div></div></div></section>'''
    s=s.replace(marker,tutor+marker)
# Add foundation-compatible CSS/JS before final scripts
inject='''
<style id="vido-v2-engine">
/* VIDO V2 engine layer: additive only; foundation UI remains intact. */
.tutorStatus{font-size:12px}.engineBadge{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:5px 9px;background:#0b1726;color:#b7c8d9}.simEnginePanel{margin-top:12px}.deviceConfig{display:grid;gap:8px}.deviceConfig input,.deviceConfig select{width:100%;box-sizing:border-box;background:#07111f;color:#fff;border:1px solid #31506b;border-radius:8px;padding:9px}.packetStep{padding:8px;border-bottom:1px solid #1d2d40}.healthOk{color:#4ade80}.healthWarn{color:#fbbf24}
</style>
<script>
/* VIDO V2 Learning Engine + Simulator Engine + Backend Sync */
(function(){
  const API_BASE = window.VIDO_API_BASE || '/api';
  const engineState = JSON.parse(localStorage.getItem('vidoEngineV2')||'{}');
  engineState.review = engineState.review||{};
  engineState.answerStartedAt = engineState.answerStartedAt||Date.now();
  engineState.sessionEvents = engineState.sessionEvents||[];
  engineState.token = engineState.token||null;
  engineState.sim = engineState.sim||{devices:[],links:[],arp:{},mac:{},routes:[{network:'192.168.10.0/24',nextHop:'connected',interface:'G0/0'},{network:'0.0.0.0/0',nextHop:'192.168.10.254',interface:'G0/0'}]};
  function persist(){localStorage.setItem('vidoEngineV2',JSON.stringify(engineState));}
  function engineFetch(path,opts={}){return fetch(API_BASE+path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{}),...(engineState.token?{authorization:'Bearer '+engineState.token}:{})}});}
  function utcPlus(days){return new Date(Date.now()+days*86400000).toISOString();}
  function updateReview(q,correct){
    const r=engineState.review[q.id]||{interval:0,reps:0,ease:2.5,next:null,mastery:0};
    if(correct){r.reps++;r.interval=r.reps===1?1:r.reps===2?3:Math.max(1,Math.round(r.interval*r.ease));r.ease=Math.min(3.0,r.ease+0.1);r.mastery=Math.min(100,r.mastery+12);}
    else{r.interval=0;r.ease=Math.max(1.3,r.ease-0.2);r.mastery=Math.max(0,r.mastery-8);}
    r.next=utcPlus(r.interval);engineState.review[q.id]=r;persist();
    return r;
  }
  function recordEvent(q,correct){
    const ms=Math.max(0,Date.now()-engineState.answerStartedAt); const hints=(state.hints&&state.hints[q.id])||0;
    const r=updateReview(q,correct); engineState.sessionEvents.push({questionId:q.id,skill:q.skill,correct,answerTimeMs:ms,hintsUsed:hints,at:new Date().toISOString()}); persist();
    engineFetch('/events',{method:'POST',body:JSON.stringify({questionId:q.id,skill:q.skill,correct,answerTimeMs:ms,hintsUsed:hints})}).catch(()=>{});
    engineState.answerStartedAt=Date.now();
    return r;
  }
  window.vidoEngine={updateReview,recordEvent,engineState,persist};

  // Adaptive selector: prioritizes due reviews and weak skills, then difficulty.
  window.vidoNextAdaptive=function(){
    const now=Date.now();
    const due=Q.filter(q=>{const r=engineState.review[q.id];return r?.next && Date.parse(r.next)<=now;});
    if(due.length) return due[Math.floor(Math.random()*due.length)];
    const weak=Q.slice().sort((a,b)=>((state.mastery[a.skill]||0)-(state.mastery[b.skill]||0))); 
    return weak[Math.floor(Math.random()*Math.min(12,weak.length))]||Q[0];
  };

  // Tutor view uses current question context and backend AI when configured.
  function renderTutorContext(){
    const q=Q[state.current]||Q[0];
    if($('tutorQuestion'))$('tutorQuestion').textContent=qTarget(q)+' · '+q.ip;
    if($('tutorSkill'))$('tutorSkill').textContent=qSkill(q)+' · '+levelLabel(q.level);
  }
  function tutorText(){
    const q=Q[state.current]||Q[0], input=$('tutorInput')?.value.trim()||'';
    const fallback=lang==='ar'?`ابدأ من القاعدة الخاصة بـ ${q.skill}. لا أعطيك الجواب مباشرة: حدّد أول معلومة تحتاجها، ثم طبّق القاعدة خطوة بخطوة.`:lang==='en'?`Start with the rule for ${q.skill}. I will not reveal the answer immediately: identify the first required datum, then apply the rule step by step.`:`Starte mit der Regel für ${q.skill}. Ich verrate die Lösung nicht sofort: Bestimme zuerst die benötigte Information und wende die Regel Schritt für Schritt an.`;
    if($('tutorStatus'))$('tutorStatus').textContent=input?'Context received.':'No explanation entered; using the current question context.';
    if($('tutorResponse'))$('tutorResponse').textContent=fallback;
    engineFetch('/tutor',{method:'POST',body:JSON.stringify({question:qTarget(q)+' | '+q.ip,answer:input,skill:q.skill,level:q.level,hintsUsed:(state.hints&&state.hints[q.id])||0,language:lang})}).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{if(d.reply)$('tutorResponse').textContent=d.reply; if($('tutorStatus'))$('tutorStatus').textContent=lang==='ar'?'تم الحصول على رد من Tutor.':lang==='en'?'Tutor response received.':'Tutor-Antwort erhalten.'}).catch(()=>{});
  }
  if($('tutorAsk'))$('tutorAsk').onclick=tutorText;
  document.querySelectorAll('[data-route="tutor"]').forEach(b=>b.addEventListener('click',()=>setTimeout(renderTutorContext,0)));
  const oldCheck=$('check')?.onclick;
  if($('check')){
    $('check').addEventListener('click',()=>{
      const q=Q[state.current]; if(!q)return; const a=$('answer').value.trim(); if(!a)return;
      const ok=grade(q,a); recordEvent(q,ok); renderTutorContext();
    });
  }

  // Real simulator data model: device configs, ARP/MAC, routing, subnet-aware ping.
  function ip4(s){const a=String(s).trim().split('.').map(Number);return a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=255)?a:null;}
  function maskBits(mask){const a=ip4(mask);if(!a)return null;let bits='';a.forEach(o=>bits+=(o>>>0).toString(2).padStart(8,'0')); if(bits.includes('01'))return null;return bits.split('1').length-1;}
  function net(ip,mask){const a=ip4(ip),m=ip4(mask);if(!a||!m)return null;return a.map((x,i)=>x&m[i]).join('.');}
  function sameSubnet(a,b,mask){return !!(net(a,mask)&&net(a,mask)===net(b,mask));}
  function addDevice(type){const id=type+'-'+(engineState.sim.devices.length+1);const d={id,type,ip:'',mask:'',gateway:'',mac:'AA:BB:CC:'+Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()+':00:01',ports:[]};engineState.sim.devices.push(d);persist();return d;}
  function simPingEngine(){const ip=$('simIp').value.trim(),mask=$('simMask').value.trim(),gw=$('simGw').value.trim();const ok=!!ip4(ip)&&!!ip4(gw)&&!!maskBits(mask)&&sameSubnet(ip,gw,mask);const msg=ok?(lang==='ar'?'✓ Ping ناجح: نفس الـSubnet، Gateway قابل للوصول.':lang==='en'?'✓ Ping success: same subnet; gateway is reachable.':'✓ Ping erfolgreich: gleiches Subnetz, Gateway erreichbar.'):(lang==='ar'?'✗ Ping فشل: تحقق من IP وSubnet Mask وGateway.':lang==='en'?'✗ Ping failed: check IP, subnet mask and gateway.':'✗ Ping fehlgeschlagen: IP, Subnetzmaske und Gateway prüfen.');simLog(msg);engineState.sim.lastPing={ip,mask,gw,ok,at:new Date().toISOString()};persist();}
  if($('simPing'))$('simPing').onclick=simPingEngine;
  document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{const d=addDevice(b.dataset.add);simLog(`${d.type} ${d.id} registered in simulator state.`);}));

  // Health badge in top bar.
  const health=document.createElement('span');health.className='engineBadge';health.id='engineHealth';health.textContent='Engine';document.querySelector('.top')?.appendChild(health);
  engineFetch('/health').then(r=>r.json()).then(h=>{health.textContent=h.database&&h.ai?'Backend + AI ✓':h.database?'Backend ✓':'Local Engine';health.className='engineBadge '+(h.database?'healthOk':'healthWarn')}).catch(()=>{health.textContent='Local Engine';});

  // Mobile smoke-test hooks.
  document.documentElement.dataset.vidoEngine='v2';
  window.addEventListener('resize',()=>{document.documentElement.dataset.viewport=window.innerWidth<651?'mobile':window.innerWidth<1000?'tablet':'desktop';});
  document.documentElement.dataset.viewport=window.innerWidth<651?'mobile':window.innerWidth<1000?'tablet':'desktop';
})();
</script>
'''
s=s.replace('</body></html>',inject+'</body></html>')
p.write_text(s)
