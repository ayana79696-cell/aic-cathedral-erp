'use client'
import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;admission_number:string;first_name:string;middle_name?:string|null;last_name:string;class_name:string;stream_name:string}
type Account={student_id:string;amount_due:number;amount_paid:number;status:string}
type Props={students:Student[];accounts:Account[]}
const otherOptions=['Graduation','Interview','Admission'] as const
const otherFee:Record<string,number>={Graduation:1500,Interview:500,Admission:1000}
const nameOf=(s:Student)=>[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' ')
const money=(n:number)=>Number(n||0).toLocaleString('en-KE')

export default function FeeAccountRecord({students,accounts}:Props){
 const [studentId,setStudentId]=useState(''),[type,setType]=useState<'school_fees'|'other'>('school_fees'),[other,setOther]=useState<typeof otherOptions[number]>('Admission'),[due,setDue]=useState(''),[paid,setPaid]=useState(''),[method,setMethod]=useState('mpesa'),[reference,setReference]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState('')
 const selected=useMemo(()=>students.find(s=>s.id===studentId)||null,[students,studentId])
 const existing=useMemo(()=>studentId?accounts.filter(a=>a.student_id===studentId):[],[accounts,studentId])
 const currentBalance=useMemo(()=>{const d=existing.reduce((n,a)=>n+Number(a.amount_due||0),0);const p=existing.reduce((n,a)=>n+Number(a.amount_paid||0),0);return Math.max(d-p,0)},[existing])

 useEffect(()=>{if(!selected){setDue('');return}if(type==='other'){setDue(String(otherFee[other]));return}(async()=>{const db=createClient();const{data}=await db.rpc('school_term_fee',{p_class_name:selected.class_name});setDue(data?String(Number(data)):'' )})()},[selected,type,other])

 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!selected){setMessage('Select a learner first.');return}const amountDue=Number(due||0),amountPaid=Number(paid||0);if(!amountDue){setMessage('No fee structure was found for this class.');return}if(amountPaid<0||amountPaid>amountDue){setMessage('Amount paid cannot be greater than the amount due.');return}if(type==='other'&&other==='Graduation'&&selected.class_name!=='PP2'){setMessage('Graduation Fee is only for PP2.');return}if(type==='other'&&other==='Interview'&&!/^Grade [1-9]$/.test(selected.class_name)){setMessage('Interview Fee is for Grades 1–9 new learners.');return}
  setSaving(true);setMessage('');const db=createClient();const[{data:term},{data:year}]=await Promise.all([db.from('terms').select('id,name').eq('is_current',true).eq('status','active').order('start_date',{ascending:false}).limit(1).maybeSingle(),db.from('academic_years').select('id').eq('is_current',true).eq('status','active').order('year',{ascending:false}).limit(1).maybeSingle()]);
  const termNumber=Number(String(term?.name||'').match(/\d+/)?.[0]||0);if(type==='other'&&other==='Graduation'&&termNumber!==3){setMessage('Graduation Fee is payable in 3rd Term.');setSaving(false);return}
  const chargeType=type==='school_fees'?'term_fee':other.toLowerCase();const chargeLabel=type==='school_fees'?'Termly school fees':`${other} Fee`;const status=amountPaid<=0?'unpaid':amountPaid>=amountDue?'paid':'partial';
  const created=await db.from('fee_accounts').insert({student_id:selected.id,academic_year_id:year?.id||null,term_id:term?.id||null,amount_due:amountDue,amount_paid:amountPaid,status,charge_type:chargeType,charge_label:chargeLabel}).select('id').single();if(created.error||!created.data?.id){setMessage(created.error?.message||'Could not add the fee record.');setSaving(false);return}
  if(amountPaid>0){const payment=await db.from('fee_payments').insert({student_id:selected.id,fee_account_id:created.data.id,amount:amountPaid,payment_method:method,reference_no:reference||null,payment_category:type==='school_fees'?'school_fees':other.toLowerCase()}).select('id').single();if(payment.error){await db.from('fee_accounts').delete().eq('id',created.data.id);setMessage(payment.error.message);setSaving(false);return}}
  setMessage(`Fee record added for ${nameOf(selected)}. Fees Total: KES ${money(amountDue)} · Paid: KES ${money(amountPaid)} · Balance: KES ${money(Math.max(amountDue-amountPaid,0))}.`);setStudentId('');setPaid('');setReference('');setSaving(false)
 }
 return <section className="card" style={{marginBottom:16}}><div style={{marginBottom:12}}><h2 style={{margin:0}}>Add fee record</h2><p className="muted" style={{margin:'5px 0 0'}}>Use this form when a new learner is added. The fee total is pulled from the class fee structure, and the unpaid balance is calculated automatically.</p></div>
  <form onSubmit={save} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
   <div><label>Learner</label><select value={studentId} onChange={e=>setStudentId(e.target.value)} required><option value="">Select learner…</option>{students.map(s=><option key={s.id} value={s.id}>{s.admission_number} — {nameOf(s)} — {s.class_name} {s.stream_name}</option>)}</select></div>
   <div><label>Payment type</label><select value={type} onChange={e=>setType(e.target.value as 'school_fees'|'other')}><option value="school_fees">School fees</option><option value="other">Other payment</option></select></div>
   {type==='other'&&<div><label>Other payment</label><select value={other} onChange={e=>setOther(e.target.value as typeof otherOptions[number])}>{otherOptions.map(x=><option key={x} value={x}>{x} — KES {money(otherFee[x])}</option>)}</select></div>}
   <div><label>Fees Total (KES)</label><input type="number" value={due} onChange={e=>setDue(e.target.value)} min="0" required/></div>
   <div><label>Amount Paid (KES)</label><input type="number" value={paid} onChange={e=>setPaid(e.target.value)} min="0" placeholder="0"/></div>
   <div><label>Payment Method</label><select value={method} onChange={e=>setMethod(e.target.value)}><option value="mpesa">M-Pesa</option><option value="cash">Cash</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select></div>
   <div><label>Reference / Transaction No.</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Optional"/></div>
   <div style={{display:'flex',alignItems:'end'}}><button className="btn" type="submit" disabled={saving}>{saving?'Saving…':'Add record'}</button></div>
  </form>
  {selected&&<div style={{marginTop:12,padding:12,borderRadius:9,background:'#f5f8fc'}}><strong>{nameOf(selected)}</strong> · {selected.class_name} · {selected.stream_name}<br/><span className="muted">Existing unpaid balance: KES {money(currentBalance)} · New balance after this record: KES {money(Math.max(Number(due||0)-Number(paid||0),0))}</span></div>}
  {message&&<p style={{color:message.startsWith('Fee record added')?'#18794e':'#b42318',fontSize:13}}>{message}</p>}
 </section>
}
