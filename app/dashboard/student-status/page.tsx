'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;admission_number:string;first_name:string;middle_name?:string|null;last_name:string;class_id?:string|null;stream_id?:string|null}
type RequestRow={id:string;student_id:string;start_date:string;end_date:string;reason:string;status:string;leave_type?:string;suspension_type?:string;requested_by:string;decision_note?:string|null;created_at:string}

export default function StudentStatus(){
 const db=createClient()
 const[role,setRole]=useState('');const[userId,setUserId]=useState('')
 const[students,setStudents]=useState<Student[]>([]);const[leave,setLeave]=useState<RequestRow[]>([]);const[susp,setSusp]=useState<RequestRow[]>([])
 const[approvalRoles,setApprovalRoles]=useState<any[]>([]);const[tab,setTab]=useState<'leave'|'suspension'>('leave')
 const[form,setForm]=useState({studentId:'',type:'medical',start:'',end:'',reason:''})
 const[msg,setMsg]=useState('');const[loading,setLoading]=useState(false);const[decision,setDecision]=useState<{kind:'leave'|'suspension';id:string}|null>(null);const[note,setNote]=useState('')
 const load=async()=>{
  const{data:{user}}=await db.auth.getUser();if(!user)return
  setUserId(user.id)
  const{data:p}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();setRole(p?.role||'')
  const{data:st}=await db.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id').eq('status','active').order('last_name');setStudents(st||[])
  const[{data:l},{data:s},{data:ar}]=await Promise.all([
   db.from('student_leave_requests').select('*').order('created_at',{ascending:false}),
   db.from('student_suspension_requests').select('*').order('created_at',{ascending:false}),
   db.from('student_approval_roles').select('id,request_type,role,enabled').eq('enabled',true).order('request_type').order('role')
  ])
  setLeave(l||[]);setSusp(s||[]);setApprovalRoles(ar||[])
 }
 useEffect(()=>{load()},[])
 const studentMap=useMemo(()=>Object.fromEntries(students.map(s=>[s.id,`${s.first_name} ${s.middle_name||''} ${s.last_name}`.replace(/\s+/g,' ').trim()])),[students])
 const approverFor=(kind:'leave'|'suspension')=>role==='super_admin'||role==='admin'||approvalRoles.some(x=>x.request_type===kind&&x.role===role&&x.enabled)
 const pending=tab==='leave'?leave.filter(x=>x.status==='pending'):susp.filter(x=>x.status==='pending')
 const activeLeave=leave.filter(x=>x.status==='approved'&&x.start_date<=new Date().toISOString().slice(0,10)&&x.end_date>=new Date().toISOString().slice(0,10))
 const activeSusp=susp.filter(x=>x.status==='approved'&&x.start_date<=new Date().toISOString().slice(0,10)&&x.end_date>=new Date().toISOString().slice(0,10))
 const submit=async()=>{
  setMsg('');if(!form.studentId||!form.start||!form.end||!form.reason.trim()){setMsg('Select a student, dates and reason.');return}
  setLoading(true);const payload:any={student_id:form.studentId,start_date:form.start,end_date:form.end,reason:form.reason.trim(),requested_by:userId,status:'pending'};payload[tab==='leave'?'leave_type':'suspension_type']=form.type
  const{error}=tab==='leave'?await db.from('student_leave_requests').insert(payload):await db.from('student_suspension_requests').insert(payload)
  setLoading(false);if(error)setMsg(error.message);else{setMsg(`${tab==='leave'?'Leave':'Suspension'} request submitted for approval.`);setForm({studentId:'',type:tab==='leave'?'medical':'disciplinary',start:'',end:'',reason:''});await load()}
 }
 const decide=async(kind:'leave'|'suspension',id:string,status:'approved'|'rejected')=>{
  if(!approverFor(kind)){setMsg('You are not an authorized approver for this request.');return}
  setLoading(true);const table=kind==='leave'?'student_leave_requests':'student_suspension_requests'
  const{error}=await db.from(table).update({status,approved_by:userId,decided_at:new Date().toISOString(),decision_note:note.trim()||null}).eq('id',id).eq('status','pending')
  setLoading(false);if(error)setMsg(error.message);else{setDecision(null);setNote('');setMsg(`${kind==='leave'?'Leave':'Suspension'} ${status}.`);await load()}
 }
 const isApprover=approverFor(tab)
 return <main className="main">
  <header className="top"><div><h1>Student Leave & Suspension</h1><p className="muted">Request, approve and track official learner leave and suspensions. Approval authority is controlled by Super Admin role settings.</p></div></header>
  <section className="prototype-kpis">
   <div className="prototype-kpi navy"><div><div className="prototype-kpi-label">Pending leave</div><div className="prototype-kpi-value">{leave.filter(x=>x.status==='pending').length}</div></div></div>
   <div className="prototype-kpi yellow"><div><div className="prototype-kpi-label">Pending suspension</div><div className="prototype-kpi-value">{susp.filter(x=>x.status==='pending').length}</div></div></div>
   <div className="prototype-kpi green"><div><div className="prototype-kpi-label">Currently on leave</div><div className="prototype-kpi-value">{activeLeave.length}</div></div></div>
   <div className="prototype-kpi red"><div><div className="prototype-kpi-label">Currently suspended</div><div className="prototype-kpi-value">{activeSusp.length}</div></div></div>
  </section>
  <section className="card">
   <div style={{display:'flex',gap:8,marginBottom:16}}><button className={tab==='leave'?'btn':'btn secondary'} onClick={()=>{setTab('leave');setForm(x=>({...x,type:'medical'}))}}>Student Leave</button><button className={tab==='suspension'?'btn':'btn secondary'} onClick={()=>{setTab('suspension');setForm(x=>({...x,type:'disciplinary'}))}}>Student Suspension</button></div>
   <h2>{tab==='leave'?'New Student Leave Request':'New Student Suspension Request'}</h2>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
    <select value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})}><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.admission_number} — {studentMap[s.id]}</option>)}</select>
    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{tab==='leave'?<><option value="medical">Medical</option><option value="family">Family / Personal</option><option value="emergency">Emergency</option><option value="bereavement">Bereavement</option><option value="other">Other</option></>:<><option value="disciplinary">Disciplinary</option><option value="temporary">Temporary</option><option value="other">Other</option></>}</select>
    <input type="date" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/><input type="date" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/>
    <textarea style={{gridColumn:'1/-1'}} placeholder={tab==='leave'?'Reason for leave':'Reason / disciplinary grounds'} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
   </div>
   <button className="btn" style={{marginTop:12}} disabled={loading} onClick={submit}>{loading?'Submitting…':'Submit for Approval'}</button>{msg&&<p className="muted">{msg}</p>}
  </section>
  <section className="card" style={{marginTop:16}}>
   <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><div><h2 style={{marginBottom:4}}>{tab==='leave'?'Leave Approval Queue':'Suspension Approval Queue'}</h2><p className="muted">Authorized roles configured by Super Admin can approve or reject.</p></div>{isApprover&&<span className="prototype-badge green">You can approve</span>}</div>
   <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>STUDENT</th><th>DATES</th><th>TYPE</th><th>REASON</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{pending.map(r=><tr key={r.id}><td><strong>{studentMap[r.student_id]||'Student'}</strong></td><td>{r.start_date} → {r.end_date}</td><td>{r.leave_type||r.suspension_type}</td><td>{r.reason}</td><td>{r.status}</td><td>{isApprover?<button className="btn" onClick={()=>{setDecision({kind:tab,id:r.id});setNote('')}}>Review</button>:<span className="muted">Awaiting approver</span>}</td></tr>)}{pending.length===0&&<tr><td colSpan={6} className="prototype-empty">No pending requests.</td></tr>}</tbody></table></div>
  </section>
  <section className="card" style={{marginTop:16}}><h2>History</h2><div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>STUDENT</th><th>TYPE</th><th>DATES</th><th>STATUS</th><th>DECISION</th></tr></thead><tbody>{[...leave.map(x=>({...x,_kind:'Leave'})),...susp.map(x=>({...x,_kind:'Suspension'}))].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100).map(r=><tr key={`${r._kind}-${r.id}`}><td>{studentMap[r.student_id]||'Student'}</td><td>{r._kind}</td><td>{r.start_date} → {r.end_date}</td><td><strong>{r.status}</strong></td><td>{r.decision_note||'—'}</td></tr>)}</tbody></table></div></section>
  {decision&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',zIndex:1000,padding:20}}><div className="card" style={{maxWidth:560,width:'100%'}}><h2>Review request</h2><textarea rows={4} placeholder="Decision note (optional)" value={note} onChange={e=>setNote(e.target.value)} style={{width:'100%'}}/><div style={{display:'flex',gap:10,marginTop:14}}><button className="btn" disabled={loading} onClick={()=>decide(decision.kind,decision.id,'approved')}>Approve</button><button className="btn secondary" disabled={loading} onClick={()=>decide(decision.kind,decision.id,'rejected')}>Reject</button><button className="btn secondary" onClick={()=>setDecision(null)}>Cancel</button></div></div></div>}
 </main>
}
