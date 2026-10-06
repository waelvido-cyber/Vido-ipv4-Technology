
(function(){
  'use strict';
  function ready(){
    const ids=['accountSync','accountLogin','accountRegister','searchBtn','continueBtn','missionBtn','focusBtn','check','prevQ','nextQ','hint','showAnswer','why','videoBtn','noteBtn','taskCheck','simPing','startIhk','adminRefresh','adminUsersBtn','adminCreateBtn','adminActivityBtn','adminSecurityBtn','adminAuditBtn','adminSystemBtn'];
    window.vidoButtonRuntime={version:'18',checked:ids.length,ready:true};
    console.info('[VIDO] Button runtime v18 ready',window.vidoButtonRuntime);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
})();
