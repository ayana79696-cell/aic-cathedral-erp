import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

const money=(n:number)=>`KES ${Math.round(n).toLocaleString('en-KE')}`
const pct=(n:number)=>`${Math.round(Math.max(0,Math.min(100,n)))}%`
const actions=[['/dashboard/students','Register student','Admissions & learner records'],['/dashboard/finance','Record payment','Fees, balances & receipts'],['/dashboard/results','Enter results','Teacher marks & CBC'],['/dashboard/attendance','Take attendance','Daily learner attendance'],['/dashboard/procurement','New requisition','Procurement workflow'],['/dashboard/inventory','Manage stock','Stores & low-stock alerts'],['/dashboard/transport','Transport desk','Buses, routes & trips'],['/dashboard/communications','Send communication','SMS, WhatsApp & email']]

export default async function Dashboard(){
 const s=await createClient()
 const [studentsRes,staffRes,classesRes,termRes,feesRes,paymentsRes,attendanceRes,marksRes,vehiclesRes,procurementRes,inventoryRes,announcementsRes]=await Promise.all([
  s.from('students').select('id',{count:'exact',head:true}).eq('status','active'),
  s.from('staff').select('id',{count:'exact',head:true}).eq('status','active'),
  s.from('classes').select('id',{count:'exact',head:true}).eq('status','active'),
  s.from('terms').select('name').eq('status','active').maybeSingle(),
  s.from('fee_accounts').select('amount_due,amount_paid'),
  s.from('fee_payments').select('amount'),
  s.from('attendance_records').select('status'),
  s.from('marks').select('marks,max_marks,status'),
  s.from('transport_vehicles').select('id',{count:'exact',head:true}).eq('status','active'),
  s.from('procurement_requests').select('id',{count:'exact',head:true}).eq('status','pending'),
  s.from('inventory_items').select('quantity,reorder_level'),
  s.from('announcements').select('id,title,created_at').eq('published',true).order('created_at',{ascending:false}).limit(4)
 ])
 const fees=feesRes.data||[];const expected=fees.reduce((a,x)=>a+Number(x.amount_due||0),0);const accountPaid=fees.reduce((a,x)=>a+Number(x.amount_paid||0),0);const payments=(paymentsRes.data||[]).reduce((a,x)=>a+Number(x.amount||0),0);const collected=accountPaid||payments;const arrears=Math.max(expected-collected,0)
 const attendance=attendanceRes.data||[];const present=attendance.filter(x=>['present','late'].includes(String(x.status).toLowerCase())).length;const attendanceRate=attendance.length?present/attendance.length*100:0
 const marks=(marksRes.data||[]).filter(x=>x.status!=='draft'&&Number(x.max_marks)>0);const academicAverage=marks.length?marks.reduce((a,x)=>a+Number(x.marks)/Number(x.max_marks)*100,0)/marks.length:0
 const lowStock=(inventoryRes.data||[]).filter(x=>Number(x.quantity)<=Number(x.reorder_level)).length
 return <main className="main">
  <header className="top"><div><div className="eyebrow">AIC CATHEDRAL PRIMARY SCHOOL</div><h1 style={{margin:'5px 0 4px'}}>School ERP Dashboard</h1><p className="muted">One control centre for learners, academics, finance and school operations.</p></div><div style={{textAlign:'right'}}><strong style={{color:'#0757a6'}}>{termRes.data?.name||'Term not set'}</strong><div className="muted">Live Supabase data</div></div></header>
  <section className="cards">
   <div className="card"><div className="muted">Active learners</div><div className="number">{studentsRes.count??0}</div><div className="muted">Admissions & class lists</div></div>
   <div className="card"><div className="muted">Active staff</div><div className="number">{staffRes.count??0}</div><div className="muted">Teachers & support staff</div></div>
   <div className="card"><div className="muted">Fees collected</div><div className="number" style={{fontSize:24}}>{money(collected)}</div><div className="muted">Arrears: {money(arrears)}</div></div>
   <div className="card"><div className="muted">Attendance</div><div className="number">{attendance.length?pct(attendanceRate):'—'}</div><div className="muted">{attendance.length?'Present / late records':'No records yet'}</div></div>
  </section>
  <section className="card" style={{marginTop:16,background:'linear-gradient(135deg,#063b73,#0757a6)',color:'#fff',border:0}}><div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:11,letterSpacing:2,fontWeight:800,opacity:.8}}>SCHOOL INTELLIGENCE</div><h2 style={{margin:'6px 0'}}>Management at a glance</h2><p style={{margin:0,opacity:.82}}>Finance {expected?pct(collected/expected*100):'—'} collected · Academic {marks.length?pct(academicAverage):'—'} · Attendance {attendance.length?pct(attendanceRate):'—'}</p></div><Link href="/dashboard/analytics" className="site-btn" style={{background:'#fff',color:'#063b73',textDecoration:'none'}}>Open intelligence</Link></div></section>
  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(300px,.65fr)',gap:16,marginTop:16}}>
   <section className="card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h2 style={{margin:'0 0 5px'}}>Quick actions</h2><p className="muted" style={{margin:0}}>Jump directly into the work you do most often.</p></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:18}}>{actions.map(([href,title,note])=><Link key={href} href={href} style={{padding:16,border:'1px solid #e4e9f1',borderRadius:12,textDecoration:'none',background:'#fbfcfe'}}><strong style={{color:'#063b73'}}>{title}</strong><div className="muted" style={{marginTop:5}}>{note}</div></Link>)}</div></section>
   <section className="card"><h2 style={{marginTop:0}}>Operations snapshot</h2><div style={{display:'grid',gap:10}}><div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Classes</span><strong>{classesRes.count??0}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Active buses</span><strong>{vehiclesRes.count??0}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Pending requisitions</span><strong>{procurementRes.count??0}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Low-stock items</span><strong>{lowStock}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Published notices</span><strong>{announcementsRes.data?.length??0}</strong></div></div></section>
  </div>
  <section className="card" style={{marginTop:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2 style={{margin:'0 0 5px'}}>Latest school notices</h2><p className="muted" style={{margin:0}}>Communications prepared for the school community.</p></div><Link href="/dashboard/communications" style={{color:'#0757a6',fontWeight:700,textDecoration:'none'}}>Open communications →</Link></div>{announcementsRes.data?.length?<div style={{display:'grid',gap:8,marginTop:16}}>{announcementsRes.data.map(x=><div key={x.id} style={{padding:12,background:'#f6f8fb',borderRadius:10}}><strong>{x.title}</strong></div>)}</div>:<p className="muted" style={{marginTop:16}}>No published notices yet.</p>}</section>
 </main>
}
