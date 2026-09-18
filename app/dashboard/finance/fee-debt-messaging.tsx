'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;admission_number?:string|null;first_name:string;middle_name?:string|null;last_name:string;class_name:string;stream_name:string}
type Account={student_id:string;amount_due?:number|null;amount_paid?:number|null;status?:string|null}

export default function FeeDebtMessaging({students,accounts}:{students:Student[];accounts:Account[]}){
 const db=createClient()
 const[parents,setParents]=useState<Record<string,{id:string;name:string;phone:string|null;status:string;primary:boolean}[]>>({})
 const[busy,setBusy]=useState('')
 const[notice,setNotice]=useState('')
 const[query,setQuery]=useState('')
 const[onlyDebt,setOnlyDebt]=useState(true)

 useEffect(()=>{void loadParents()},[students.length])
 async function loadParents(){
  const ids=students.map(s=>s.id); if(!ids.length){setParents({});return}
  const{data,error}=await db.from('student_parents').select('student_id,parent_id,primary_guardian,parents(id,name,phone,status)').in('student_id',ids)
  if(error){setNotice(error.message);return}
  const map:Record<string,{id:string;name:string;phone:string|null;status:string;primary:boolean}[]>={}
  ;(data||[]).forEach((x:any)=>{
   const p=x.parents?.[0]; if(!p)return
   ;(map[x.student_id] ||= []).push({id:p.id,name:p.name||'Parent/Guardian',phone:p.phone||null,status:String(p.status||'active'),primary:!!x.primary_guardian})
  })
  setParents(map)
 }
 const rows=useMemo(()=>students.map(s=>{
  const a=accounts.find(x=>x.student_id===s.id)
  const due=Number(a?.amount_due||0),paid=Number(a?.amount_paid||0),balance=Math.max(due-paid,0)
  const linked=(parents[s.id]||[]).filter(p=>p.status==='active')
  const primary=linked.find(p=>p.primary)||linked.find(p=>!!p.phone)||linked[0]
  return{...s,due,paid,balance,parent:primary||null}
 }).filter(r=>!onlyDebt||r.balance>0).filter(r=>{const q=query.toLowerCase().trim();return !q||[r.first_name,r.middle_name,r.last_name,r.admission_number,r.class_name,r.stream_name,r.parent?.name,r.parent?.phone].filter(Boolean).join(' ').toLowerCase().includes(q)}),[students,accounts,parents,query,onlyDebt])
 async function sendDebt(r:typeof rows[number]){
  if(!r.parent?.phone){setNotice('No active parent phone number is registered for '+[r.first_name,r.last_name].join(' ')+'.');return}
  setBusy(r.id);setNotice('')
  const{data:user}=await db.auth.getUser()
  const message='Dear parent, '+[r.first_name,r.last_name].join(' ')+' has an outstanding school fee balance of KES '+r.balance.toLocaleString('en-KE')+'. Kindly clear the balance with AIC Cathedral Comprehensive School. Thank you.'
  const{data:b,error}=await db.from('message_broadcasts').insert({title:'Fee Debt Reminder',message,channel:'sms',audience:'fee debt - '+r.id,status:'phone_pending',created_by:user.user?.id||null}).select('id').single()
  if(error||!b){setNotice(error?.message||'Could not queue the SMS.');setBusy('');return}
  const{error:re}=await db.from('message_recipients').insert({broadcast_id:b.id,parent_id:r.parent.id,phone:r.parent.phone,email:null,channel:'sms',status:'phone_pending'})
  setNotice(re?.message||('SMS queued for '+r.parent.name+' ('+r.parent.phone+').'))
  setBusy('')
 }
 return <section className="prototype-panel">
  <div className="prototype-panel-head"><div><h2>Fee Debts & Parent SMS</h2><p>Live outstanding balances with the active primary parent number registered for each learner.</p></div><button type="button" className="prototype-secondary-button" onClick={()=>window.print()}>Print Debt List</button></div>
  <div className="prototype-panel-body">
   <div className="prototype-form-grid">
    <div><label>Search learner / parent</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, admission number or phone"/></div>
    <div><label>View</label><select value={onlyDebt?'debts':'all'} onChange={e=>setOnlyDebt(e.target.value==='debts')}><option value="debts">Students with debts</option><option value="all">All students</option></select></div>
   </div>
   {notice&&<div className="prototype-note" style={{marginTop:10}}>{notice}</div>}
   <div className="prototype-table-wrap" style={{marginTop:14}}><table className="prototype-table"><thead><tr><th>STUDENT</th><th>GRADE / STREAM</th><th>FEES DUE</th><th>PAID</th><th>DEBT</th><th>ACTIVE PRIMARY PARENT</th><th>ACTION</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.id}><td><b>{r.first_name} {r.middle_name||''} {r.last_name}</b><br/><small>{r.admission_number||'No admission number'}</small></td><td>{r.class_name} · {r.stream_name}</td><td>KES {r.due.toLocaleString('en-KE')}</td><td>KES {r.paid.toLocaleString('en-KE')}</td><td><b>KES {r.balance.toLocaleString('en-KE')}</b></td><td>{r.parent?<><b>{r.parent.name}</b><br/><span>{r.parent.phone||'No phone'}</span></>:'No active parent linked'}</td><td><button type="button" className="prototype-primary-button" disabled={busy===r.id||!r.parent?.phone||r.balance<=0} onClick={()=>void sendDebt(r)}>{busy===r.id?'Queueing…':'✈ Send Debt SMS'}</button></td></tr>)}
   {!rows.length&&<tr><td colSpan={7} className="prototype-empty">No matching fee debts.</td></tr>}
   </tbody></table></div>
   <div className="prototype-note" style={{marginTop:10}}>Automatic sync: this list reads the student’s linked parent records from Supabase. When a new student is registered with an active primary parent phone number, that number appears here and in Communications automatically.</div>
  </div>
 </section>
}

// Live parent fee-debt SMS integration.
// Production deployment trigger: keep fee-debt messaging current.
