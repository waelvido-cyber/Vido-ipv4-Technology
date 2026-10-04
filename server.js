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

function token(user){ return jwt.sign({sub:user.id,email:user.email,role:user.role||'user'},JWT_SECRET,{expiresIn:'7d'}); }
function clientIp(req){ return (req.headers['x-forwarded-for']||req.socket.remoteAddress||'').toString().split(',')[0].trim() || null; }
function ua(req){ return req.headers['user-agent']||null; }
async function logSecurity({userId=null,email=null,eventType,req,metadata={}}){ if(!pool)return; await pool.query('INSERT INTO security_log(user_id,email,event_type,ip,user_agent,metadata) VALUES($1,$2,$3,$4,$5,$6)',[userId,email,eventType,clientIp(req),ua(req),metadata]); }
async function logActivity({userId,eventType,route=null,req,metadata={}}){ if(!pool)return; await pool.query('INSERT INTO activity_log(user_id,event_type,route,ip,user_agent,metadata) VALUES($1,$2,$3,$4,$5,$6)',[userId,eventType,route,clientIp(req),ua(req),metadata]); }
async function adminUser(req,res,next){ if(!pool)return requireDb(res); try { const r=await pool.query('SELECT id,email,role,status FROM users WHERE id=$1',[req.user.sub]); if(!r.rowCount||r.rows[0].status!=='active'||!['owner','super_admin','analyst','content_manager','video_manager','lab_manager'].includes(r.rows[0].role)) return res.status(403).json({error:'admin_forbidden'}); req.admin=r.rows[0]; next(); } catch { res.status(500).json({error:'admin_check_failed'}); } }
async function ownerOnly(req,res,next){ if(!req.admin||req.admin.role!=='owner') return res.status(403).json({error:'owner_only'}); next(); }
function auth(req,res,next){ try { const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) throw new Error(); req.user=jwt.verify(h.slice(7),JWT_SECRET); next(); } catch { res.status(401).json({error:'unauthorized'}); } }
function requireDb(res){ if(!pool){res.status(503).json({error:'DATABASE_URL is not configured'}); return false;} return true; }

app.get('/api/health', async (_req,res)=>res.json({ok:true,backend:true,database:!!pool,ai:!!(AI_URL&&AI_KEY)}));
app.post('/api/auth/register', async (req,res)=>{
  if(!requireDb(res)) return; const {email,password}=req.body||{};
  if(!email||!password||password.length<8) return res.status(400).json({error:'email and password (8+ chars) required'});
  try { const hash=await bcrypt.hash(password,12); const r=await pool.query('INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email,role,status',[email.toLowerCase().trim(),hash]); await logSecurity({userId:r.rows[0].id,email:r.rows[0].email,eventType:'register',req}); await logActivity({userId:r.rows[0].id,eventType:'register',route:'/account',req}); res.status(201).json({token:token(r.rows[0]),user:r.rows[0]}); }
  catch(e){res.status(409).json({error:e.code==='23505'?'email already registered':'registration failed'});}
});
app.post('/api/auth/login', async (req,res)=>{
  if(!requireDb(res)) return; const {email,password}=req.body||{};
  const cleanEmail=String(email||'').toLowerCase().trim(); const r=await pool.query('SELECT id,email,password_hash,role,status FROM users WHERE email=$1',[cleanEmail]);
  if(!r.rowCount||!(await bcrypt.compare(String(password||''),r.rows[0].password_hash))) { await logSecurity({email:cleanEmail,eventType:'login_failed',req}); return res.status(401).json({error:'invalid credentials'}); }
  if(r.rows[0].status!=='active'){ await logSecurity({userId:r.rows[0].id,email:cleanEmail,eventType:'login_blocked',req}); return res.status(403).json({error:'account_suspended'}); }
  await pool.query('UPDATE users SET last_login_at=NOW(),last_ip=$2,last_user_agent=$3 WHERE id=$1',[r.rows[0].id,clientIp(req),ua(req)]); await logSecurity({userId:r.rows[0].id,email:cleanEmail,eventType:'login_success',req}); await logActivity({userId:r.rows[0].id,eventType:'login',route:'/account',req});
  res.json({token:token(r.rows[0]),user:{id:r.rows[0].id,email:r.rows[0].email,role:r.rows[0].role,status:r.rows[0].status}});
});

app.post('/api/activity',auth,async(req,res)=>{if(!requireDb(res))return; const e=req.body||{}; await logActivity({userId:req.user.sub,eventType:String(e.eventType||'view'),route:e.route||null,req,metadata:e.metadata||{}});res.json({ok:true});});

app.get('/api/admin/overview',auth,adminUser,async(req,res)=>{if(!requireDb(res))return; const [u,a,s,active]=await Promise.all([pool.query("SELECT COUNT(*)::int count FROM users"),pool.query("SELECT COUNT(*)::int count FROM activity_log WHERE created_at>NOW()-INTERVAL '24 hours'"),pool.query("SELECT COUNT(*)::int count FROM security_log WHERE event_type='login_failed' AND created_at>NOW()-INTERVAL '24 hours'"),pool.query("SELECT COUNT(DISTINCT user_id)::int count FROM activity_log WHERE created_at>NOW()-INTERVAL '15 minutes' AND user_id IS NOT NULL")]);res.json({users:u.rows[0].count,activity24h:a.rows[0].count,failedLogins24h:s.rows[0].count,active15m:active.rows[0].count,role:req.admin.role});});
app.get('/api/admin/users',auth,adminUser,async(req,res)=>{if(!requireDb(res))return; const r=await pool.query("SELECT id,email,role,status,created_at,last_login_at,last_ip::text last_ip,last_user_agent FROM users ORDER BY created_at DESC LIMIT 500");res.json(r.rows);});
app.get('/api/admin/activity',auth,adminUser,async(req,res)=>{if(!requireDb(res))return; const r=await pool.query("SELECT a.id,a.event_type,a.route,a.ip::text ip,a.user_agent,a.country,a.city,a.created_at,u.email FROM activity_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 300");res.json(r.rows);});
app.get('/api/admin/security',auth,adminUser,async(req,res)=>{if(!requireDb(res))return; const r=await pool.query("SELECT s.id,s.email,s.event_type,s.ip::text ip,s.user_agent,s.created_at,u.email user_email FROM security_log s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.created_at DESC LIMIT 300");res.json(r.rows);});
app.post('/api/admin/users/:id/status',auth,adminUser,ownerOnly,async(req,res)=>{if(!requireDb(res))return; const status=req.body?.status; if(!['active','suspended'].includes(status))return res.status(400).json({error:'invalid_status'}); await pool.query('UPDATE users SET status=$2 WHERE id=$1',[req.params.id,status]); await pool.query('INSERT INTO audit_log(actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5)',[req.user.sub,'change_user_status','user',req.params.id,{status}]);res.json({ok:true});});
app.post('/api/admin/users/:id/role',auth,adminUser,ownerOnly,async(req,res)=>{if(!requireDb(res))return; const role=req.body?.role; const roles=['owner','super_admin','content_manager','video_manager','lab_manager','analyst','user']; if(!roles.includes(role))return res.status(400).json({error:'invalid_role'}); await pool.query('UPDATE users SET role=$2 WHERE id=$1',[req.params.id,role]); await pool.query('INSERT INTO audit_log(actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5)',[req.user.sub,'change_user_role','user',req.params.id,{role}]);res.json({ok:true});});

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

async function bootstrapOwner(){ if(!pool||!process.env.OWNER_EMAIL||!process.env.OWNER_PASSWORD)return; const email=process.env.OWNER_EMAIL.toLowerCase().trim(); const hash=await bcrypt.hash(process.env.OWNER_PASSWORD,12); await pool.query(`INSERT INTO users(email,password_hash,role,status) VALUES($1,$2,'owner','active') ON CONFLICT(email) DO UPDATE SET role='owner',status='active'`,[email,hash]); }
const port=Number(process.env.PORT||3000);
app.listen(port,async()=>{try{await bootstrapOwner();console.log(`VIDO backend listening on http://localhost:${port}`)}catch(e){console.error('Owner bootstrap failed',e.message)}});
