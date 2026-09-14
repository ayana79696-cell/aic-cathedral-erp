import { createClient } from '../../../lib/supabase/server'

export default async function BoardPage(){
 const s=await createClient()
 const [{data:school},{count:students},{count:staff},{data:fees},{data:payments},{data:inventory},{data:procurement},{data:transport}]=await Promise.all([
  s.from('school_settings').select('school_name,address,phone,email,logo_url,motto').single(),
  s.from('students').select('*',{count:'exact',head:true}).eq('status','active'),
  s.from('staff').select('*',{count:'exact',head:true}).eq('status','active'),
  s.from('fee_accounts').select('amount_due,amount_paid'),
  s.from('fee_payments').select('amount'),
  s.from('inventory_items').select('quantity,reorder_level'),
  s.from('procurement_requests').select('status'),
  s.from('transport_vehicles').select('status')
 ])
 const due=(fees||[]).reduce((n,r)=>n+Number(r.amount_due||0),0)
 const paid=(fees||[]).reduce((n,r)=>n+Number(r.amount_paid||0),0)
 const collected=(payments||[]).reduce((n,r)=>n+Number(r.amount||0),0)
 const lowStock=(inventory||[]).filter(r=>Number(r.quantity||0)<=Number(r.reorder_level||0)).length
 const pendingProc=(procurement||[]).filter(r=>String(r.status||'').toLowerCase()==='pending').length
 const activeBuses=(transport||[]).filter(r=>String(r.status||'active').toLowerCase()==='active').length
 const collection=due>0?Math.round((paid/due)*100):0
 const cards=[['Active Learners',students??0,'Student population'],['Active Staff',staff??0,'Staff establishment'],['Fee Collection',`${collection}%`,'Based on current fee accounts'],['Fees Collected',`KES ${collected.toLocaleString()}`,'Recorded payments'],['Low Stock Alerts',lowStock,'Items at/below reorder level'],['Pending Procurement',pendingProc,'Requests awaiting action'],['Active Vehicles',activeBuses,'Transport fleet']]
 return <main className="main"><header className="top"><div><p className="muted" style={{marginBottom:4}}>GOVERNANCE & OVERSIGHT</p><h1 style={{marginTop:0}}>Board Dashboard</h1><p className="muted">{school?.school_name||'AIC Cathedral Comprehensive School'} — strategic school performance at a glance.</p></div></header>
 <section className="card" style={{background:'linear-gradient(135deg,#123b67,#1d5d91)',color:'#fff',overflow:'hidden'}}><div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>{school?.logo_url?<img src={school.logo_url} alt="School logo" style={{width:78,height:78,objectFit:'contain',background:'#fff',borderRadius:14,padding:7}}/>:<div style={{width:78,height:78,borderRadius:14,background:'#fff',display:'grid',placeItems:'center',color:'#123b67',fontWeight:800}}>AIC</div>}<div><h2 style={{margin:'0 0 5px'}}>{school?.school_name||'AIC Cathedral Comprehensive School'}</h2><div style={{opacity:.9}}>{school?.address||'Gilgil, Nakuru County, Kenya'}</div>{school?.motto&&<div style={{marginTop:6,fontStyle:'italic',opacity:.9}}>{school.motto}</div>}</div></div></section>
 <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginTop:16}}>{cards.map(([title,value,note])=><div className="card" key={String(title)}><div className="muted" style={{fontSize:13}}>{title}</div><div style={{fontSize:30,fontWeight:800,margin:'8px 0'}}>{value}</div><small className="muted">{note}</small></div>)}</section>
 <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginTop:16}}><div className="card"><h2>School Health Snapshot</h2><div style={{display:'grid',gap:12,marginTop:14}}>{[['Academic','Monitor detailed performance from Academic/Results'],['Finance',`${collection}% fee collection rate`],['Operations',`${pendingProc} procurement requests pending`],['Inventory',`${lowStock} low-stock alert${lowStock===1?'':'s'}`],['Transport',`${activeBuses} active vehicle${activeBuses===1?'':'s'}`]].map(([a,b])=><div key={a} style={{display:'flex',justifyContent:'space-between',gap:15,padding:'10px 0',borderBottom:'1px solid #e5e7eb'}}><strong>{a}</strong><span className="muted" style={{textAlign:'right'}}>{b}</span></div>)}</div></div><div className="card"><h2>Board Intelligence</h2><p className="muted">This dashboard is designed for strategic oversight. Individual learner, medical, disciplinary and credential information remains outside the Board view unless explicitly granted through permissions.</p><div style={{display:'grid',gap:10,marginTop:16}}><div className="card" style={{background:'#f7f9fc'}}><strong>What needs attention?</strong><p className="muted" style={{marginBottom:0}}>Use the operational modules and School Intelligence dashboard to drill into approved areas.</p></div><div className="card" style={{background:'#f7f9fc'}}><strong>Financial position</strong><p className="muted" style={{marginBottom:0}}>Current account due: KES {due.toLocaleString()} · paid: KES {paid.toLocaleString()}.</p></div></div></div></section>
 </main>
}