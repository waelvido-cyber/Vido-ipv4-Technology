
(function(){
  function el(id){return document.getElementById(id)}
  function status(msg){const e=el('accountStatus'); if(e)e.textContent=msg}
  function api(path,opts){
    const st=JSON.parse(sessionStorage.getItem('vidoEngineV2')||'{}');
    const headers=Object.assign({'content-type':'application/json'},(opts&&opts.headers)||{});
    if(st.token) headers.authorization='Bearer '+st.token;
    return fetch('/api'+path,Object.assign({},opts||{}, {headers}));
  }
  async function read(r){let d={}; try{d=await r.json()}catch{} return {r,d}}
  async function login(){
    const email=el('accountEmail')?.value.trim()||'', password=el('accountPassword')?.value||'';
    if(!email||!password)return status('E-Mail und Passwort eingeben.');
    status('Anmeldung läuft …');
    try{
      const x=await read(await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}));
      if(!x.r.ok)return status(x.d.error||'Login fehlgeschlagen.');
      const st=JSON.parse(sessionStorage.getItem('vidoEngineV2')||'{}');
      st.token=x.d.token; st.role=x.d.user?.role||null; st.email=x.d.user?.email||email;
      sessionStorage.setItem('vidoEngineV2',JSON.stringify(st));
      status('Angemeldet.');
    }catch(e){status('Verbindung zum VIDO-Backend fehlgeschlagen.');}
  }
  async function register(){
    const email=el('accountEmail')?.value.trim()||'', password=el('accountPassword')?.value||'';
    if(!email||password.length<8)return status('E-Mail und Passwort (mind. 8 Zeichen) eingeben.');
    status('Konto wird erstellt …');
    try{
      const x=await read(await api('/auth/register',{method:'POST',body:JSON.stringify({email,password})}));
      if(!x.r.ok)return status(x.d.error||'Registrierung fehlgeschlagen.');
      const st=JSON.parse(sessionStorage.getItem('vidoEngineV2')||'{}');
      st.token=x.d.token; st.role=x.d.user?.role||null; st.email=x.d.user?.email||email;
      sessionStorage.setItem('vidoEngineV2',JSON.stringify(st));
      status('Konto erstellt und angemeldet.');
    }catch(e){status('Verbindung zum VIDO-Backend fehlgeschlagen.');}
  }
  function bind(id,fn){
    const old=el(id); if(!old||old.dataset.v15Bound)return;
    const b=old.cloneNode(true); old.replaceWith(b); b.addEventListener('click',e=>{e.preventDefault();fn()}); b.dataset.v15Bound='1';
  }
  function boot(){bind('accountLogin',login);bind('accountRegister',register)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
