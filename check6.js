
(function(){
  'use strict';
  function getState(){
    try{return JSON.parse(sessionStorage.getItem('vidoEngineV2')||'{}')}catch{return {}}
  }
  function api(path,opts){
    const st=getState();
    const headers=Object.assign({'content-type':'application/json'},(opts&&opts.headers)||{});
    if(st.token) headers.authorization='Bearer '+st.token;
    return fetch('/api'+path,Object.assign({},opts||{},{headers}));
  }
  function status(msg){
    const e=document.getElementById('accountStatus');
    if(e)e.textContent=msg;
  }
  async function syncNow(){
    const st=getState();
    if(!st.token){status('Bitte zuerst anmelden.');return}
    const btn=document.getElementById('accountSync');
    if(btn)btn.disabled=true;
    status('Synchronisierung läuft …');
    try{
      const get=await api('/state');
      if(!get.ok) throw new Error('GET /state '+get.status);
      const remote=await get.json();
      if(remote && window.vidoCore){
        Object.assign(window.vidoCore.state,remote);
        try{window.vidoCore.save()}catch{}
        try{window.vidoCore.renderStats()}catch{}
        try{window.vidoCore.renderQuestion()}catch{}
        try{window.vidoCore.renderLists()}catch{}
        try{window.vidoCore.renderProgress()}catch{}
      }
      const put=await api('/state',{method:'PUT',body:JSON.stringify({state:window.vidoCore?window.vidoCore.state:{}})});
      if(!put.ok) throw new Error('PUT /state '+put.status);
      status('Cloud sync completed.');
    }catch(e){
      console.error('[VIDO] Sync failed',e);
      status('Synchronisierung fehlgeschlagen. Backend prüfen.');
    }finally{
      if(btn)btn.disabled=false;
    }
  }
  function bindSync(){
    const b=document.getElementById('accountSync');
    if(!b || b.dataset.v17Bound)return;
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();syncNow()});
    b.dataset.v17Bound='1';
  }
  function auditButtons(){
    const buttons=[...document.querySelectorAll('button')];
    const missing=buttons.filter(b=>{
      if(b.dataset.route||b.dataset.go||b.hasAttribute('data-back'))return false;
      return typeof b.onclick!=='function' && !b.id.match(/^accountSync$/);
    });
    window.vidoButtonAudit={total:buttons.length,unwired:missing.map(b=>b.id||b.textContent.trim().slice(0,40))};
    console.info('[VIDO] Button audit',window.vidoButtonAudit);
  }
  function boot(){bindSync();auditButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
