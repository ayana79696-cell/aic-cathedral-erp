'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;first_name:string;middle_name?:string|null;last_name:string;admission_number:string}
type Payment={id:string;student_id:string;amount:number;payment_method:string;reference_no:string|null;paid_at:string|null}

const nameOf=(s?:Student)=>s?[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' '):'Unknown learner'

export default function PaymentHistory(){
 const [rows,setRows]=useState<Payment[]>([]),[students,setStudents]=useState<Student[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[editing,setEditing]=useState<string|null>(null),[message,setMessage]=useState('')
 const [form,setForm]=useState({student_id:'',amount:'',payment_method:'mpesa',reference_no:''})
 const studentMap=useMemo(()=>new Map(students.map(s=>[s.id,s])),[students])
 const load=async()=>{setLoading(true);const db=createClient();const[{data:p,error:pe},{data:s,error:se}]=await Promise.all([db.from('fee_payments').select('id,student_id,amount,payment_method,reference_no,paid_at').order('created_at',{ascending:false}),db.from('students').select('id,first_name,middle_name,last_name,admission_number').order('last_name')]);if(pe||se)setMessage(pe?.message||se?.message||'Could not load payment history.');else{setRows((p||[]) as Payment[]);setStudents((s||[]) as Student[])}setLoading(false)}
 useEffect(()=>{load()},[])
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form.student_id||!form.amount)return;setSaving(true);setMessage('');const db=createClient();const payload={student_id:form.student_id,amount:Number(form.amount),payment_method:form.payment_method,reference_no:form.reference_no||null};const result=editing?await db.from('fee_payments').update(payload).eq('id',editing):await db.from('fee_payments').insert(payload);if(result.error)setMessage(result.error.message);else{setMessage(editing?'Payment updated successfully.':'Payment recorded successfully.');setForm({student_id:'',amount:'',payment_method:'mpesa',reference_no:''});setEditing(null);await load()}setSaving(false)}
 const edit=(r:Payment)=>{setEditing(r.id);setForm({student_id:r.student_id,amount:String(r.amount),payment_method:r.payment_method,reference_no:r.reference_no||''});setMessage('')}
 const remove=async(id:string)=>{if(!confirm('Delete this payment record?'))return;const{error}=await createClient().from('fee_payments').delete().eq('id',id);setMessage(error?.message||'Payment deleted.');await load()}
 const cancel=()=>{setEditing(null);setForm({student_id:'',amount:'',payment_method:'mpesa',reference_no:''});setMessage('')}
 return <section className="card"><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:16}}><div><h2 style={{margin:0}}>Fees collected & receipts</h2><p className="muted" style={{margin:'5px 0 0'}}>Every payment is shown using the learner's real name and admission number. Internal database IDs are never displayed.</p></div><span className="muted">{rows.length} records</span></div>
  <form onSubmit={save} style={{display:'grid',gridTemplateColumns:'minmax(220px,2fr) 1fr 1fr minmax(180px,1.2fr) auto',gap:10,marginBottom:20}}>
   <select value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})} required><option value="">Select learner</option>{students.map(s=><option key={s.id} value={s.id}>{nameOf(s)} — {s.admission_number}</option>)}</select>
   <input type="number" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="Amount (KES)" required/>
   <select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select>
   <input value={form.reference_no} onChange={e=>setForm({...form,reference_no:e.target.value})} placeholder="Reference / receipt no."/>
   <div style={{display:'flex',gap:8}}><button className="btn" disabled={saving}>{saving?'Saving…':editing?'Save changes':'Record payment'}</button>{editing&&<button type="button" className="btn secondary" onClick={cancel}>Cancel</button>}</div>
  </form>
  {message&&<p style={{color:message.includes('successfully')||message.includes('deleted')?'#18794e':'#b42318',fontSize:13}}>{message}</p>}
  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Learner','Admission No.','Amount (KES)','Method','Reference / receipt no.','Actions'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={6} style={{padding:25}}>Loading…</td></tr>:rows.length?rows.map(r=>{const s=studentMap.get(r.student_id);return <tr key={r.id}><td style={{padding:10}}><strong>{nameOf(s)}</strong></td><td style={{padding:10}}>{s?.admission_number||'—'}</td><td style={{padding:10}}>KES {Number(r.amount).toLocaleString('en-KE')}</td><td style={{padding:10}}>{r.payment_method.toUpperCase()}</td><td style={{padding:10}}>{r.reference_no||'—'}</td><td style={{padding:10,whiteSpace:'nowrap'}}><button type="button" onClick={()=>edit(r)} style={{background:'transparent',border:0,color:'#0757a6',cursor:'pointer',marginRight:10}}>Edit</button><button type="button" onClick={()=>remove(r.id)} style={{background:'transparent',border:0,color:'#b42318',cursor:'pointer'}}>Delete</button></td></tr>}) : <tr><td colSpan={6} className="muted" style={{padding:30,textAlign:'center'}}>No payment records yet.</td></tr>}</tbody></table></div>
 </section>
}
