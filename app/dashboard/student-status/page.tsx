'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'
import LeaveSignature from '../hr/leave-signature'

type Student={id:string;admission_number:string;first_name:string;middle_name?:string|null;last_name:string;class_id?:string|null;stream_id?:string|null}
type RequestRow={id:string;student_id:string;start_date:string;end_date:string;reason:string;status:string;leave_type?:string;suspension_type?:string;requested_by:string;approved_by?:string|null;approver_signature?:string|null;approver_name?:string|null;decision_note?:string|null;decided_at?:string|null;created_at:string}
type Person={id:string;full_name?:string|null;role?:string|null}

export default function StudentStatus(){
 const db=createClient()
 const[role,setRole]=useState('');const[userId,setUserId]=useState('')
 const[students,setStudents]=useState<Student[]>([]);const[classes,setClasses]=useState<Record<string,string>>({});const[streams,setStreams]=useState<Record<string,string>>({})
 const[leave,setLeave]=useState<RequestRow[]>([]);const[susp,setSusp]=useState<RequestRow[]>([]);const[approvalRoles,setApprovalRoles]=useState<any[]>([]);const[people,setPeople]=useState<Record<string,Person>>({})
 const[tab,setTab]=useState<'leave'|'suspension'>('leave')
 const[form,setForm]=useState({studentId:'',type:'medical',start:'',end:'',reason:''})
 const[msg,setMsg]=useState('');const[loading,setLoading]=useState(false);const[decision,setDecision]=useState<{kind:'leave'|'suspension';id:string}|null>(null);const[note,setNote]=useState('');const[signature,setSignature]=useState('');const[printRow,setPrintRow]=useState<RequestRow|null>(null)

 const load=async()=>{
  const{data:{user}}=await db.auth.getUser();if(!user)return
  setUserId(user.id)
  const[{data:p},{data:st},{data:cl},{data:sr}]=await Promise.all([
   db.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle(),
   db.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id').eq('status','active').order('last_name'),
   db.from('classes').select('id,name').eq('status','active').order('name'),
   db.from('streams').select('id,name').eq('status','active').order('name')
  ])
  setRole(p?.role||'');setStudents(st||[])
  setClasses(Object.fromEntries((cl||[]).map((x:any)=>[x.id,x.name])))
  setStreams(Object.fromEntries((sr||[]).map((x:any)=>[x.id,x.name])))
  const[{data:l},{data:s},{data:ar}]=await Promise.all([
   db.from('student_leave_requests').select('*').order('created_at',{ascending:false}),
   db.from('student_suspension_requests').select('*').order('created_at',{ascending:false}),
   db.from('student_approval_roles').select('id,request_type,role,enabled').eq('enabled',true).order('request_type').order('role')
  ])
  setLeave(l||[]);setSusp(s||[]);setApprovalRoles(ar||[])
  const ids=Array.from(new Set([...(l||[]),...(s||[])].flatMap((x:any)=>[x.approved_by,x.requested_by]).filter(Boolean)))
  if(ids.length){const{data:pp}=await db.from('profiles').select('id,full_name,role').in('id',ids);setPeople(Object.fromEntries((pp||[]).map((x:any)=>[x.id,x])))}
 }

 useEffect(()=>{load()},[])
 const studentMap=useMemo(()=>Object.fromEntries(students.map(s=>[s.id,(s.first_name+' '+(s.middle_name||'')+' '+s.last_name).replace(/\s+/g,' ').trim()])),[students])
 const approverFor=(kind:'leave'|'suspension')=>role==='super_admin'||approvalRoles.some(x=>x.request_type===kind&&x.role===role&&x.enabled)
 const pending=tab==='leave'?leave.filter(x=>x.status==='pending'):susp.filter(x=>x.status==='pending')
 const activeLeave=leave.filter(x=>x.status==='approved'&&x.start_date<=new Date().toISOString().slice(0,10)&&x.end_date>=new Date().toISOString().slice(0,10))
 const activeSusp=susp.filter(x=>x.status==='approved'&&x.start_date<=new Date().toISOString().slice(0,10)&&x.end_date>=new Date().toISOString().slice(0,10))

 const submit=async()=>{
  setMsg('');if(!form.studentId||!form.start||!form.end||!form.reason.trim()){setMsg('Select a student, dates and reason.');return}
  if(form.end<form.start){setMsg('End date cannot be before start date.');return}
  setLoading(true);const payload:any={student_id:form.studentId,start_date:form.start,end_date:form.end,reason:form.reason.trim(),requested_by:userId,status:'pending'};payload[tab==='leave'?'leave_type':'suspension_type']=form.type
  const{error}=tab==='leave'?await db.from('student_leave_requests').insert(payload):await db.from('student_suspension_requests').insert(payload)
  setLoading(false);if(error)setMsg(error.message);else{setMsg((tab==='leave'?'Leave':'Suspension')+' request submitted for approval.');setForm({studentId:'',type:tab==='leave'?'medical':'disciplinary',start:'',end:'',reason:''});await load()}
 }

 const decide=async(kind:'leave'|'suspension',id:string,status:'approved'|'rejected')=>{
  if(!approverFor(kind)){setMsg('You are not an authorized approver for this request.');return}
  if(!signature.trim()){setMsg('Draw your signature or type your name before signing.');return}
  setLoading(true);const table=kind==='leave'?'student_leave_requests':'student_suspension_requests'
  const{error}=await db.from(table).update({status,approved_by:userId,approver_signature:signature,approver_name:people[userId]?.full_name||role,decided_at:new Date().toISOString(),decision_note:note.trim()||null}).eq('id',id).eq('status','pending')
  setLoading(false);if(error)setMsg(error.message);else{setDecision(null);setNote('');setSignature('');setMsg((kind==='leave'?'Leave':'Suspension')+' '+status+'.');await load()}
 }

 const rowKind=(r:RequestRow)=>r.leave_type?'Student Leave':'Student Suspension'
 const selectedStudent=(r:RequestRow)=>students.find(s=>s.id===r.student_id)
 const printRequest=(r:RequestRow)=>{setPrintRow(r);setTimeout(()=>window.print(),100)}
 const signer=printRow?.approved_by?people[printRow.approved_by]:null
 const savedSignature=printRow?.approver_signature||''
 const printStudent=printRow?selectedStudent(printRow):null

 return <main className="main">
   <style jsx>{`
.print-document{display:none}
@media print{
 html,body{margin:0!important;padding:0!important;background:#fff!important}
 body *{visibility:hidden!important}
 .main>*:not(.print-document){display:none!important}
 .main{margin:0!important;padding:0!important;min-height:0!important}
 .print-document,.print-document *{visibility:visible!important}
 .print-document{display:block!important;position:fixed;left:0;top:0;width:100%;min-height:100vh;box-sizing:border-box;padding:28px 38px;font-family:Arial,sans-serif;color:#111;background:#fff}
 .print-header{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:20px}
 .print-header h1{margin:0;font-size:22px}.print-header p{margin:4px 0;font-size:12px}
 .print-title{text-align:center;font-size:18px;font-weight:700;text-transform:uppercase;margin:18px 0}
 .print-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #222}
 .print-cell{padding:9px;border-right:1px solid #222;border-bottom:1px solid #222;min-height:38px}
 .print-cell:nth-child(2n){border-right:0}
 .print-cell:nth-last-child(-n+2){border-bottom:0}
 .print-label{font-size:10px;text-transform:uppercase;color:#555;font-weight:700}
 .print-value{font-size:13px;margin-top:4px}
 .print-reason{border:1px solid #222;border-top:0;padding:12px;min-height:100px}
 .print-signatures{display:block;margin-top:48px}
 .print-sign{border-top:1px solid #111;padding-top:7px;font-size:12px;min-height:125px}
 .print-sign .typed-signature{font-size:15px;font-weight:600;margin-top:12px}
 .print-sign .signature-name{font-size:13px;font-weight:700;margin-top:3px}
 .print-sign .signature-role{font-size:12px;margin-top:2px}
 .print-sign .signature-date{font-size:12px;margin-top:6px}
 .print-note{margin-top:22px;font-size:11px;border:1px solid #d8e1f0;padding:12px}
 .print-official{margin-top:45px;text-align:center;font-style:italic;font-size:13px;border-top:2px solid #111;padding-top:8px}
 .signature-image{max-width:260px;max-height:80px;display:block;margin:8px 0}
 @page{size:A4 portrait;margin:0}
}
`}</style>

  <header className="top"><div><h1>Student Leave & Suspension</h1><p className="muted">Request, approve, digitally sign and print official learner leave and suspension forms.</p></div></header>
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
   <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><div><h2 style={{marginBottom:4}}>{tab==='leave'?'Leave Approval Queue':'Suspension Approval Queue'}</h2><p className="muted">Class Teacher or Headteacher can sign/approve when enabled by Super Admin.</p></div>{approverFor(tab)&&<span className="prototype-badge green">You can approve & sign</span>}</div>
   <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>STUDENT</th><th>CLASS / STREAM</th><th>DATES</th><th>TYPE</th><th>REASON</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{pending.map(r=>{const s=students.find(x=>x.id===r.student_id);return <tr key={r.id}><td><strong>{studentMap[r.student_id]||'Student'}</strong><br/><span className="muted">{s?.admission_number||''}</span></td><td>{s?.class_id?classes[s.class_id]||'—':'—'} / {s?.stream_id?streams[s.stream_id]||'—':'—'}</td><td>{r.start_date} → {r.end_date}</td><td>{r.leave_type||r.suspension_type}</td><td>{r.reason}</td><td>{r.status}</td><td>{approverFor(tab)?<button className="btn" onClick={()=>{setDecision({kind:tab,id:r.id});setNote('')}}>Review & Sign</button>:<span className="muted">Awaiting approver</span>}</td></tr>})}{pending.length===0&&<tr><td colSpan={7} className="prototype-empty">No pending requests.</td></tr>}</tbody></table></div>
  </section>

  <section className="card" style={{marginTop:16}}><h2>History</h2><div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>STUDENT</th><th>TYPE</th><th>DATES</th><th>STATUS</th><th>SIGNED BY</th><th>PRINT</th></tr></thead><tbody>{[...leave.map(x=>({...x,_kind:'Leave'})),...susp.map(x=>({...x,_kind:'Suspension'}))].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100).map(r=>{const p=r.approved_by?people[r.approved_by]:null;return <tr key={r._kind+'-'+r.id}><td>{studentMap[r.student_id]||'Student'}</td><td>{r._kind}</td><td>{r.start_date} → {r.end_date}</td><td><strong>{r.status}</strong></td><td>{p?.full_name?p.full_name+' ('+(p.role||'Approver')+')':'—'}</td><td><button className="btn secondary" onClick={()=>printRequest(r)}>Download PDF</button></td></tr>})}</tbody></table></div></section>

  {decision&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',zIndex:1000,padding:20}}><div className="card" style={{maxWidth:700,width:'100%',maxHeight:'94vh',overflow:'auto'}}><h2>{decision.kind==='leave'?'Approve':'Review'} Student {decision.kind==='leave'?'Leave':'Suspension'}</h2><p className="muted">Class Teacher / Head Teacher signature. Sign in the box below, or switch to “Type name”.</p><LeaveSignature label="Class Teacher / Headteacher Signature" value={signature} onChange={setSignature}/><textarea rows={4} placeholder="Decision note (optional)" value={note} onChange={e=>setNote(e.target.value)} style={{width:'100%',marginTop:12}}/><div style={{display:'flex',gap:10,marginTop:14}}><button className="btn" disabled={loading||!signature.trim()} onClick={()=>decide(decision.kind,decision.id,'approved')}>Approve & Sign</button><button className="btn secondary" disabled={loading||!signature.trim()} onClick={()=>decide(decision.kind,decision.id,'rejected')}>Reject & Sign</button><button className="btn secondary" onClick={()=>{setDecision(null);setSignature('');setNote('')}}>Cancel</button></div></div></div>}

  <div className="print-document">
   <div className="print-header"><h1>AIC Cathedral Comprehensive School</h1><p>Student Leave / Suspension Official Form</p><p>Generated from the school ERP</p></div>
   <div className="print-title">{printRow?rowKind(printRow):'Student Status Form'}</div>
   <div className="print-grid">
    <div className="print-cell"><div className="print-label">Student Name</div><div className="print-value">{printStudent?studentMap[printStudent.id]:'—'}</div></div>
    <div className="print-cell"><div className="print-label">Admission Number</div><div className="print-value">{printStudent?.admission_number||'—'}</div></div>
    <div className="print-cell"><div className="print-label">Class</div><div className="print-value">{printStudent?.class_id?classes[printStudent.class_id]||'—':'—'}</div></div>
    <div className="print-cell"><div className="print-label">Stream</div><div className="print-value">{printStudent?.stream_id?streams[printStudent.stream_id]||'—':'—'}</div></div>
    <div className="print-cell"><div className="print-label">Type</div><div className="print-value">{printRow?.leave_type||printRow?.suspension_type||'—'}</div></div>
    <div className="print-cell"><div className="print-label">Status</div><div className="print-value">{printRow?.status||'—'}</div></div>
    <div className="print-cell"><div className="print-label">Start Date</div><div className="print-value">{printRow?.start_date||'—'}</div></div>
    <div className="print-cell"><div className="print-label">End Date</div><div className="print-value">{printRow?.end_date||'—'}</div></div>
   </div>
   <div className="print-reason"><div className="print-label">Reason / Grounds</div><div className="print-value">{printRow?.reason||'—'}</div></div>
   <div className="print-signatures">
    <div className="print-sign"><strong>Class Teacher / Headteacher Signature</strong>{savedSignature.startsWith('data:image/')?<img className="signature-image" src={savedSignature} alt="Approver signature"/>:<div className="typed-signature">{savedSignature||printRow?.approver_name||signer?.full_name||'________________________________'}</div>}<div className="signature-name">{printRow?.approver_name||signer?.full_name||''}</div><div className="signature-role">Class Teacher / Headteacher</div>{printRow?.decided_at&&<div className="signature-date">Date: {new Date(printRow.decided_at).toLocaleDateString()}</div>}</div>
   </div>
   <div className="print-note"><strong>Decision note:</strong> {printRow?.decision_note||'None'}<br/><br/>This form records the leave/suspension decision stored in the school ERP.</div>
   <div className="print-official">Official School Record</div>
  </div>
 </main>
}
