import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const { Pool } = pg;
const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.static('.'));
const pool = process.env.DATABASE_URL ? new Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false}) : null;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const AI_URL = process.env.AI_API_URL || '';
const AI_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

function token(user){ return jwt.sign({sub:user.id,email:user.email},JWT_SECRET,{expiresIn:'7d'}); }
function auth(req,res,next){ try { const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) throw new Error(); req.user=jwt.verify(h.slice(7),JWT_SECRET); next(); } catch { res.status(401).json({error:'unauthorized'}); } }
function requireDb(res){ if(!pool){res.status(503).json({error:'DATABASE_URL is not configured'}); return false;} return true; }

app.get('/api/health', async (_req,res)=>res.json({ok:true,backend:true,database:!!pool,ai:!!(AI_URL&&AI_KEY)}));
app.post('/api/auth/register', async (req,res)=>{
  if(!requireDb(res)) return; const {email,password}=req.body||{};
  if(!email||!password||password.length<8) return res.status(400).json({error:'email and password (8+ chars) required'});
  try { const hash=await bcrypt.hash(password,12); const r=await pool.query('INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email',[email.toLowerCase().trim(),hash]); res.status(201).json({token:token(r.rows[0]),user:r.rows[0]}); }
  catch(e){res.status(409).json({error:e.code==='23505'?'email already registered':'registration failed'});}
});
app.post('/api/auth/login', async (req,res)=>{
  if(!requireDb(res)) return; const {email,password}=req.body||{};
  const r=await pool.query('SELECT id,email,password_hash FROM users WHERE email=$1',[String(email||'').toLowerCase().trim()]);
  if(!r.rowCount||!(await bcrypt.compare(String(password||''),r.rows[0].password_hash))) return res.status(401).json({error:'invalid credentials'});
  res.json({token:token(r.rows[0]),user:{id:r.rows[0].id,email:r.rows[0].email}});
});
app.get('/api/state',auth,async(req,res)=>{if(!requireDb(res))return; const r=await pool.query('SELECT state FROM app_state WHERE user_id=$1',[req.user.sub]);res.json(r.rowCount?r.rows[0].state:null);});
app.put('/api/state',auth,async(req,res)=>{if(!requireDb(res))return; const state=req.body?.state; if(!state)return res.status(400).json({error:'state required'}); await pool.query(`INSERT INTO app_state(user_id,state) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET state=EXCLUDED.state,updated_at=NOW()`,[req.user.sub,state]);res.json({ok:true});});
app.post('/api/events',auth,async(req,res)=>{if(!requireDb(res))return; const e=req.body||{}; await pool.query('INSERT INTO learning_events(user_id,question_id,skill,correct,answer_time_ms,hints_used) VALUES($1,$2,$3,$4,$5,$6)',[req.user.sub,e.questionId,e.skill,!!e.correct,Number(e.answerTimeMs)||0,Number(e.hintsUsed)||0]);res.json({ok:true});});
app.get('/api/mastery',auth,async(req,res)=>{if(!requireDb(res))return; const r=await pool.query('SELECT skill,score,next_review,interval_days,repetitions FROM mastery WHERE user_id=$1',[req.user.sub]);res.json(r.rows);});
app.post('/api/tutor',auth,async(req,res)=>{
  if(!AI_URL||!AI_KEY) return res.status(503).json({error:'AI integration is not configured. Set AI_API_URL and AI_API_KEY on the server.'});
  const {question,answer,skill,level,hintsUsed,language}=req.body||{};
  const system=`You are VIDO Tutor for an IT/IHK learning platform. Respond in ${language||'de'}. Use Socratic guidance. Do not reveal the final answer unless explicitly requested. Explain the next reasoning step, rule, or diagnostic check. Keep technical terms precise.`;
  try { const r=await fetch(AI_URL,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${AI_KEY}`},body:JSON.stringify({model:AI_MODEL,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({question,answer,skill,level,hintsUsed})}]})}); const data=await r.json(); if(!r.ok) return res.status(502).json({error:'AI provider error',detail:data}); res.json({reply:data.choices?.[0]?.message?.content||data.output_text||'No tutor response.'}); }
  catch(e){res.status(502).json({error:'AI request failed'});}
});

const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`VIDO backend listening on http://localhost:${port}`));
