
(function(){
  'use strict';
  function byId(id){return document.getElementById(id)}
  function getState(){try{return JSON.parse(sessionStorage.getItem('vidoEngineV2')||'{}')}catch{return {}}}
  function saveState(st){sessionStorage.setItem('vidoEngineV2',JSON.stringify(st))}
  function api(path,opts){
    const st=getState();
    const headers=Object.assign({'content-type':'application/json'},(opts&&opts.headers)||{});
    if(st.token) headers.authorization='Bearer '+st.token;
    return fetch('/api'+path,Object.assign({},opts||{},{headers}));
  }
  function status(msg){const e=byId('gateMsg');if(e)e.textContent=msg||''}
  function unlock(user,token){
    const st=getState(); st.token=token||st.token||null; st.role=user?.role||st.role||null; st.email=user?.email||st.email||null; saveState(st);
    document.body.classList.remove('authLocked');
    const gate=byId('authGate'); if(gate) gate.hidden=true;
  }
  async function login(){
    const email=(byId('gateEmail')?.value||'').trim(); const password=byId('gatePassword')?.value||'';
    if(!email||!password){status('Bitte E-Mail und Passwort eingeben.');return}
    status('Anmeldung läuft …');
    try{const r=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||'login');unlock(d.user,d.token);}
    catch(e){status('Anmeldung fehlgeschlagen.')}
  }
  async function adminLogin(){
    const username=(byId('gateEmail')?.value||'Admin').trim()||'Admin'; const password=byId('gatePassword')?.value||'';
    if(!password){status('Admin-Passwort eingeben.');return}
    status('Admin-Anmeldung läuft …');
    try{const r=await api('/auth/quick-admin',{method:'POST',body:JSON.stringify({username,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||'admin');unlock(d.user,d.token);}
    catch(e){status('Admin-Anmeldung fehlgeschlagen.')}
  }
  function bind(){
    const loginBtn=byId('gateLogin'), adminBtn=byId('gateAdmin'), pw=byId('gatePassword');
    if(loginBtn&&!loginBtn.dataset.v21Bound){loginBtn.addEventListener('click',function(e){e.preventDefault();login()});loginBtn.dataset.v21Bound='1'}
    if(adminBtn&&!adminBtn.dataset.v21Bound){adminBtn.addEventListener('click',function(e){e.preventDefault();adminLogin()});adminBtn.dataset.v21Bound='1'}
    if(pw&&!pw.dataset.v21Bound){pw.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();login()}});pw.dataset.v21Bound='1'}
  }
  function boot(){bind();if(document.body.classList.contains('authLocked')){const st=getState();if(st.token){api('/auth/me').then(async r=>{if(r.ok){const d=await r.json();unlock(d.user,st.token)}else{st.token=null;st.role=null;saveState(st)}}).catch(()=>{})}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',bind);
})();
