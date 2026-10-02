import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'duplicate HTML ids');
const start=html.indexOf('const Q=['); assert(start>=0,'Q array not found'); let depth=0, end=-1, inStr=false, quote=''; for(let i=start+8;i<html.length;i++){const c=html[i],p=html[i-1]; if(inStr){if(c===quote&&p!=='\\')inStr=false; continue;} if(c==='\"'||c==="'"){inStr=true;quote=c;continue;} if(c==='[')depth++; else if(c===']'){depth--; if(depth===0){end=i+1;break;}}} assert(end>0,'Q array end not found'); const Q=Function(`return ${html.slice(start+8,end)}`)();
assert.equal(Q.length,300,'question count must be 300');
assert.deepEqual(Q.map(q=>q.id),Array.from({length:300},(_,i)=>String(i+1).padStart(4,'0')),'question IDs must be 0001..0300');
for(const q of Q){assert(q.answer!==undefined && q.answer!=='',`missing answer ${q.id}`);assert(q.skill,`missing skill ${q.id}`);}
assert(html.includes("value=\"de\"")&&html.includes("value=\"en\"")&&html.includes("value=\"ar\""),'language selector missing');
assert(html.includes('showAnswer'),'show answer missing');
assert(html.includes('VIDO Tutor'),'Tutor integration missing');
assert(html.includes('Adaptive Learning')||html.includes('Adaptives Lernen'),'adaptive learning missing');
assert(html.includes('Spaced Repetition')||html.includes('Spaced Repetition'),'spaced repetition missing');
console.log(`PASS: ${Q.length} questions, ${ids.length} unique IDs, foundation-linked features present.`);
