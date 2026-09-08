'use client'
import {useEffect,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Report={name:string;description:string;table:string;columns:string[]}
const reports:Report[]=[
 {name:'Student Register',description:'Current learner register with admission, class and portal information.',table:'students',columns:['admission_number','first_name','middle_name','last_name','gender','date_of_birth','class_id','stream_id','portal_code','status']},
 {name:'Staff Register',description:'Employee directory and employment details.',table:'staff',columns:['employee_number','first_name','middle_name','last_name','department','job_title','employment_type','phone','email','status']},
 {name:'Attendance Report',description:'Learner attendance records for the school year.',table:'attendance_records',columns:['student_id','attendance_date','status','note']},
 {name:'Fee Payments',description:'Recorded learner payments and references.',table:'fee_payments',columns:['student_id','fee_account_id','amount','payment_method','reference_no','paid_at']},
 {name:'Payroll Report',description:'Payroll records including gross, deductions and net pay.',table:'payroll_records',columns:['staff_id','payroll_month','gross_pay','deductions','net_pay','status']},
 {name:'Procurement Report',description:'Purchase requests and workflow status.',table:'procurement_requests',columns:['item_name','quantity','estimated_cost','status','created_at']},
 {name:'Inventory Report',description:'Current stock levels and reorder points.',table:'inventory_items',columns:['item_name','category','quantity','unit','reorder_level','updated_at']}
]
export default function Page(){
 const [stats,setStats]=useState<Record<string,number>>({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState('')
 useEffect(()=>{(async()=>{const s=createClient();const pairs=await Promise.all(reports.map(async r=>{const {count}=await s.from(r.table).select('*',{count:'exact',head:true});return [r.table,count||0] as const}));setStats(Object.fromEntries(pairs));setLoading(false)})()},[])
 const download=async(r:Report)=>{setBusy(r.table);const {data,error}=await createClient().from(r.table).select(r.columns.join(','));if(error){alert(error.message);setBusy('');return}const rows=(data||[]).map((row:any)=>r.columns.map(c=>JSON.stringify(row[c]??'')).join(','));const csv=[r.columns.join(','),...rows].join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=r.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv';a.click();URL.revokeObjectURL(url);setBusy('')}
 return <main className="main"><header className="top"><div><h1 style={{margin:0}}>Reports Centre</h1><p className="muted">Live operational, academic and administrative reports from Supabase.</p></div></header><section className="cards" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>{reports.map(r=><div className="card" key={r.table}><div className="muted">{r.name}</div><div className="number">{loading?'…':stats[r.table]??0}</div><div className="muted">records</div></div>)}</section><section className="card" style={{marginTop:18}}><h2 style={{marginTop:0}}>Export reports</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>{reports.map(r=><article key={r.table} style={{border:'1px solid #e7eaf0',borderRadius:12,padding:16}}><h3 style={{margin:'0 0 6px'}}>{r.name}</h3><p className="muted" style={{minHeight:38}}>{r.description}</p><button className="btn" disabled={busy===r.table} onClick={()=>download(r)}>{busy===r.table?'Preparing…':'Export CSV'}</button></article>)}</div></section></main>
}
