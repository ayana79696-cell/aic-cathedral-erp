'use client'
import {useEffect,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'
import LeaveSignature from '../hr/leave-signature'

const roleLabel=(r:string)=>r==='class_teacher'?'Class Teacher':r==='subject_teacher'?'Subject Teacher':r==='headteacher'?'Head Teacher':r
export default function MySignature(){
 const db=createClient()
 const [userId,setUserId]=useState('')
 const [role,setRole]=useState('')
 const [staffId,setStaffId]=useState('')
 const [name,setName]=useState('')
 const [signature,setSignature]=useState('')
 const [savedAt,setSavedAt]=useState('')
 const [msg,setMsg]=useState('')
 const [loading,setLoading]=useState(true)
 const load=async()=>{
  setLoading(true);setMsg('')
  const {data:{user}}=await db.auth.getUser()
  if(!user){setMsg('Please sign in again.');setLoading(false);return}
  setUserId(user.id)
  const {data:p}=await db.from('profiles').select('full_name,role,assigned_roles').eq('id',user.id).maybeSingle()
  const roles=[p?.role,...(Array.isArray(p?.assigned_roles)?p.assigned_roles:[])].filter(Boolean).map(String)
  const activeRole=roles.find(r=>['class_teacher','subject_teacher','headteacher'].includes(r))||p?.role||''
  setRole(activeRole)
  setName(p?.full_name||'')
  const {data:st}=await db.from('staff').select('id,first_name,middle_name,last_name').eq('profile_id',user.id).maybeSingle()
  if(!st){setMsg('Your staff profile is not linked to this account yet. Ask the administrator to link your teacher/staff profile.');setLoading(false);return}
  setStaffId(st.id)
  const {data:sig}=await db.from('staff_signatures').select('signature,updated_at').eq('profile_id',user.id).maybeSingle()
  if(sig){setSignature(sig.signature||'');setSavedAt(sig.updated_at||'')}
  if(!p?.full_name)setName([st.first_name,st.middle_name,st.last_name].filter(Boolean).join(' '))
  setLoading(false)
 }
 useEffect(()=>{load()},[])
 const save=async()=>{
  if(!userId||!staffId||!signature){setMsg('Please draw your signature or type your name before saving.');return}
  setMsg('Saving…')
  const {error}=await db.from('staff_signatures').upsert({staff_id:staffId,profile_id:userId,signature,active:true},{onConflict:'profile_id'})
  if(error){setMsg(error.message);return}
  setSavedAt(new Date().toISOString());setMsg('Signature saved successfully. It will be used automatically on eligible report cards.')
 }
 return <main className="main"><section className="card" style={{maxWidth:900,margin:'24px auto'}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
   <div><h1>My Signature</h1><p className="muted">Save your official electronic signature once. The report-card system will use it automatically when you are the assigned teacher.</p></div>
   <div className="prototype-kpi-note">Role: <strong>{roleLabel(role)}</strong></div>
  </div>
  <div style={{marginTop:18,padding:16,borderRadius:12,background:'#f7f8fa'}}><strong>{name||'Teacher / Staff'}</strong><div className="muted" style={{marginTop:4}}>Your signature is linked to your own staff account. Other teachers cannot edit it.</div></div>
  <LeaveSignature label="My official signature" value={signature} onChange={setSignature}/>
  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:14}}><button className="btn" onClick={save} disabled={loading}>{loading?'Loading…':'Save Signature'}</button>{savedAt&&<span className="muted">Last saved: {new Date(savedAt).toLocaleString()}</span>}</div>
  {msg&&<p className="muted" style={{marginTop:12}}>{msg}</p>}
  <div style={{marginTop:22,padding:16,border:'1px solid #e5e7eb',borderRadius:12}}><strong>How it works</strong><ol className="muted"><li>Save your signature here.</li><li>If you are the Class Teacher assigned to a learner's class/stream, the report card automatically finds your saved signature.</li><li>The current Head Teacher's saved signature is added separately.</li><li>When a report is finalized, the signatures used can be preserved with that report.</li></ol></div>
 </section></main>
}
