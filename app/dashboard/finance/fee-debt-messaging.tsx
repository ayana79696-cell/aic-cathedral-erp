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
 const[holds,setHolds]=useState<Record<string,boolean>>({})

 useEffect(()=>{void loadParents();void loadHolds()},[students.length])
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
 async function loadHolds(){
  const ids=students.map(s=>s.id); if(!ids.length){setHolds({});return}
  const{data,error}=await db.from('transport_fee_status').select('student_id,cleared').in('student_id',ids)
  if(error){setNotice(error.message);return}
  const map:Record<string,boolean>={};(data||[]).forEach((x:any)=>{map[x.student_id]=!x.cleared});setHolds(map)
 }
 const rows=useMemo(()=>students.map(s=>{
  const studentAccounts=accounts.filter(x=>x.student_id===s.id)
  const due=studentAccounts.reduce((sum,x)=>sum+Number(x.amount_due||0),0)
  const paid=studentAccounts.reduce((sum,x)=>sum+Number(x.amount_paid||0),0)
  const balance=Math.max(due-paid,0)
  const linked=(parents[s.id]||[]).filter(p=>p.status==='active')
  const primary=linked.find(p=>p.primary)||linked.find(p=>!!p.phone)||linked[0]
  return{...s,due,paid,balance,parent:primary||null,feeHold:!!holds[s.id]}
 }).filter(r=>!onlyDebt||r.balance>0).filter(r=>{const q=query.toLowerCase().trim();return !q||[r.first_name,r.middle_name,r.last_name,r.admission_number,r.class_name,r.stream_name,r.parent?.name,r.parent?.phone].filter(Boolean).join(' ').toLowerCase().includes(q)}),[students,accounts,parents,holds,query,onlyDebt])
 async function sendDebt(r:typeof rows[number]){
  if(!r.parent?.phone){setNotice('No active parent phone number is registered for '+[r.first_name,r.last_name].join(' ')+'.');return}
  setBusy(r.id);setNotice('')
  const{data:user}=await db.auth.getUser()
  const message=r.feeHold ? 'Dear Parent/Guardian, '+[r.first_name,r.last_name].join(' ')+' has an outstanding school fee balance of KSh '+r.balance.toLocaleString('en-KE')+'. Please note that the school transport service will not pick up your child until the outstanding balance is cleared. Kindly clear the balance and contact the school if you require assistance. Thank you, AIC Cathedral Comprehensive School.' : 'Dear Parent/Guardian, '+[r.first_name,r.last_name].join(' ')+' has an outstanding school fee balance of KSh '+r.balance.toLocaleString('en-KE')+'. Kindly clear the balance to keep the account up to date. Thank you, AIC Cathedral Comprehensive School.'
  const{data:b,error}=await db.from('message_broadcasts').insert({title:'Fee Debt Reminder',message,channel:'sms',audience:'fee debt - '+r.id,status:'phone_pending',created_by:user.user?.id||null}).select('id').single()
  if(error||!b){setNotice(error?.message||'Could not queue the SMS.');setBusy('');return}
  const{error:re}=await db.from('message_recipients').insert({broadcast_id:b.id,parent_id:r.parent.id,phone:r.parent.phone,email:null,channel:'sms',status:'phone_pending'})
  setNotice(re?.message||('SMS queued for '+r.parent.name+' ('+r.parent.phone+').'))
  setBusy('')
 }
 async function toggleHold(r:typeof rows[number]){
  setBusy('hold:'+r.id);setNotice('')
  const{data:as}=await db.from('transport_assignments').select('route_id').eq('student_id',r.id).limit(1)
  const{data:user}=await db.auth.getUser();const applying=!r.feeHold
  const{error}=await db.from('transport_fee_status').upsert({student_id:r.id,route_id:as?.[0]?.route_id||null,cleared:!applying,marked_by:user.user?.id||null,marked_at:new Date().toISOString()},{onConflict:'student_id'})
  if(error){setBusy('');setNotice(error.message);return}
  setHolds(prev=>({...prev,[r.id]:applying}));setBusy('');setNotice(r.first_name+' '+r.last_name+(applying?' is now on Fee Hold.':' has been released from Fee Hold.'))
 }
 return <section className="prototype-panel">
  <div className="prototype-panel-head"><div><h2>Fee Debts & Parent SMS</h2><p>Live outstanding balances with the active primary parent number registered for each learner.</p></div><button type="button" className="prototype-secondary-button" onClick={()=>window.print()}>Print Debt List</button></div>
  <div className="prototype-panel-body">
   <div className="prototype-form-grid">
    <div><label>Search learner / parent</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, admission number or phone"/></div>
    <div><label>View</label><select value={onlyDebt?'debts':'all'} onChange={e=>setOnlyDebt(e.target.value==='debts')}><option value="debts">Students with debts</option><option value="all">All students</option></select></div>
   </div>
   {notice&&<div className="prototype-note" style={{marginTop:10}}>{notice}</div>}
   <div className="prototype-table-wrap" style={{marginTop:14}}><table className="prototype-table"><thead><tr><th>STUDENT</th><th>GRADE / STREAM</th><th>FEES DUE</th><th>PAID</th><th>DEBT</th><th>ACTIVE PRIMARY PARENT</th><th>FEE HOLD</th><th>ACTION</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.id}><td><b>{r.first_name} {r.middle_name||''} {r.last_name}</b><br/><small>{r.admission_number||'No admission number'}</small></td><td>{r.class_name} · {r.stream_name}</td><td>KES {r.due.toLocaleString('en-KE')}</td><td>KES {r.paid.toLocaleString('en-KE')}</td><td><b>KES {r.balance.toLocaleString('en-KE')}</b></td><td>{r.parent?<><b>{r.parent.name}</b><br/><span>{r.parent.phone||'No phone'}</span></>:'No active parent linked'}</td><td><button type="button" className={r.feeHold?'prototype-primary-button':'prototype-secondary-button'} disabled={busy==='hold:'+r.id} onClick={()=>void toggleHold(r)}>{busy==='hold:'+r.id?'Saving…':r.feeHold?'Release Fee Hold':'Fee Hold'}</button>{r.feeHold&&<div style={{marginTop:4,fontSize:12}}>Transport pickup blocked</div>}</td><td><button type="button" className="prototype-primary-button" disabled={busy===r.id||!r.parent?.phone||r.balance<=0} onClick={()=>void sendDebt(r)}>{busy===r.id?'Queueing…':'✈ Send Debt SMS'}</button></td></tr>)}
   {!rows.length&&<tr><td colSpan={8} className="prototype-empty">No matching fee debts.</td></tr>}
   </tbody></table></div>
   <div className="prototype-note" style={{marginTop:10}}>Automatic sync: this list reads the student’s linked parent records from Supabase. When a new student is registered with an active primary parent phone number, that number appears here and in Communications automatically.</div>
  </div>
 </section>
}

// Live parent fee-debt SMS integration.
// Production deployment trigger: keep fee-debt messaging current.
