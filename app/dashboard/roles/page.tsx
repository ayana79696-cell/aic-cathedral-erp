import {createClient} from '../../../lib/supabase/server'

const roles=[
 ['super_admin','Super Admin','Everything: all modules, all records, all users, settings, approvals and audit visibility.'],
 ['admin','Admin','School administration across students, academics, finance, HR, procurement/inventory, transport and communications.'],
 ['headteacher','Head Teacher','Academic oversight, student records, results review, attendance, HR visibility, reports and school intelligence.'],
 ['deputy_headteacher','Deputy Head Teacher','Academic and school operations, student records, results, attendance, teacher/timetable oversight and reports.'],
 ['academic','Academic','Academics, exams/CBC, results, teacher assignments/workload, timetable and academic reports.'],
 ['class_teacher','Class Teacher','Assigned class and stream, learner records, attendance, marks/results, timetable and class-result publishing.'],
 ['subject_teacher','Subject Teacher','Assigned learners/learning areas, marks/results, attendance and timetable.'],
 ['finance','Finance','Fees, payments, receipts, pending fees, finance reports and finance intelligence/anomaly review.'],
 ['bursar','Bursar','Fees, payments, receipts, pending fees and finance reports.'],
 ['accountant','Accountant','Fees, payments, receipts, pending fees, finance intelligence/anomaly review and reports.'],
 ['petty_cash','Petty Cash','Standalone petty-cash vouchers, transactions, balances and reports.'],
 ['hr_admin','HR Admin','Staff/HR records, payroll, leave requests and approvals, attendance and HR reports.'],
 ['hr','HR / Staff','Staff/HR records, payroll viewing, leave requests, attendance and reports.'],
 ['operations','Operations','Procurement/inventory, transport, teacher/timetable operations, communications and intelligence.'],
 ['procurement_officer','Procurement Officer','Procurement and inventory workflows, stock/intelligence and reports.'],
 ['procurement','Procurement','Procurement and inventory workflows, stock/intelligence and reports.'],
 ['storekeeper','Storekeeper','Inventory/stock control, procurement intelligence and reports.'],
 ['inventory','Inventory','Inventory/stock control, procurement intelligence and reports.'],
 ['transport_manager','Transport Manager','Transport, vehicle/route operations, transport safety controls and reports.'],
 ['board','Board','Dashboard, board view and reports.']
] as const

const areas=[
 ['Dashboard','School dashboard and role-based overview'],
 ['Students','Student admissions, class/stream records, parent details, health field and student passport'],
 ['Academics','Academic workspace including Exams & CBC and Results'],
 ['Results & Exams','EE / ME / AE / BE grading, points, X/Y exam status, automatic remarks, merit list, stream position, overall class position and class-teacher publishing'],
 ['Finance & Fees','Fees/payments, receipts, pending fees, statements, money in/out, invoices, balances/fee hold, budget/planning and finance intelligence'],
 ['Petty Cash','Standalone petty cash: Week 1–4, opening balance, money in/out, vouchers, requisition/LPO/invoice/receipt/driver fields, suppliers, payment methods, M-Pesa code, cheque number, received by, running balance and branded weekly reports'],
 ['HR / Payroll','Staff, contracts, attendance, disciplinary, leave/off and payroll'],
 ['Leave & Payroll Rules','Paid/unpaid leave, approved/rejected/unapproved status, manual payroll number, approved unpaid-day deduction, optional NSSF 6%, optional SHA 2.75%, other deduction and automatic net pay'],
 ['Procurement & Inventory','One workspace containing procurement and inventory/stock control, requisitions, LPO/job card, invoice/delivery, supplier and approval workflow'],
 ['Transport','Trips, buses/routes, insurance, fueling, mileage, service/maintenance and route payment controls'],
 ['Timetable & Teacher Assignments','Class/stream teacher assignment, teacher workload and timetable operations'],
 ['Communications','Parent broadcast through configured communication channels, including WhatsApp/SMS/email/in-app workflow'],
 ['Teacher Check-ins','Teacher check-in/check-out records and attendance visibility'],
 ['Check-in Locations','Approved teacher check-in locations, radius/meters and location controls'],
 ['School Intelligence','Operational and management intelligence dashboards'],
 ['Reports','School, academic, finance, HR, transport and petty-cash reporting'],
 ['School Settings','School configuration and branding/settings'],
 ['User Management','User accounts, role assignment, class/stream teacher assignment and access management'],
 ['Audit Logs','Administrative audit visibility']
]

const roleAreas:Record<string,string[]>= {
 super_admin:areas.map(a=>a[0]),
 admin:['Dashboard','Students','Academics','Finance & Fees','Petty Cash','HR / Payroll','Procurement & Inventory','Transport','Timetable & Teacher Assignments','Communications','School Intelligence','Reports','School Settings'],
 headteacher:['Dashboard','Students','Academics','Results & Exams','Finance & Fees','HR / Payroll','Timetable & Teacher Assignments','School Intelligence','Reports'],
 deputy_headteacher:['Dashboard','Students','Academics','Results & Exams','HR / Payroll','Timetable & Teacher Assignments','School Intelligence','Reports'],
 academic:['Dashboard','Students','Academics','Results & Exams','Timetable & Teacher Assignments','School Intelligence','Reports'],
 class_teacher:['Dashboard','Students','Academics','Results & Exams','Timetable & Teacher Assignments','Teacher Check-ins','Reports'],
 subject_teacher:['Dashboard','Students','Academics','Results & Exams','Timetable & Teacher Assignments','Teacher Check-ins','Reports'],
 finance:['Dashboard','Finance & Fees','Reports','School Intelligence'],
 bursar:['Dashboard','Finance & Fees','Reports'],
 accountant:['Dashboard','Finance & Fees','Reports','School Intelligence'],
 petty_cash:['Dashboard','Petty Cash','Reports'],
 hr_admin:['Dashboard','HR / Payroll','Leave & Payroll Rules','Teacher Check-ins','Check-in Locations','Reports'],
 hr:['Dashboard','HR / Payroll','Leave & Payroll Rules','Teacher Check-ins','Reports'],
 operations:['Dashboard','Procurement & Inventory','Transport','Timetable & Teacher Assignments','Communications','School Intelligence','Reports'],
 procurement_officer:['Dashboard','Procurement & Inventory','Reports'],
 procurement:['Dashboard','Procurement & Inventory','Reports'],
 storekeeper:['Dashboard','Procurement & Inventory','Reports'],
 inventory:['Dashboard','Procurement & Inventory','Reports'],
 transport_manager:['Dashboard','Transport','Reports'],
 board:['Dashboard','School Intelligence','Reports']
}

const label=(r:string)=>roles.find(x=>x[0]===r)?.[1]||r
const norm=(r:string)=>String(r||'').trim().toLowerCase().replace(/[\\s-]+/g,'_')

export default async function Roles(){
 const s=await createClient()
 const {data}=await s.from('profiles').select('id,full_name,role,status').order('full_name')
 return <main className="main">
  <header className="top"><div><h1>Roles & Access</h1><p className="muted">Complete role map for the current ERP. Access follows the same role model used by the dashboard navigation.</p></div></header>

  <section className="card">
   <h2>System roles</h2>
   <div className="cards">{roles.map(r=><div className="card" key={r[0]}><strong>{r[1]}</strong><p className="muted" style={{marginBottom:8}}>{r[2]}</p><small className="muted">Role key: {r[0]}</small></div>)}</div>
  </section>

  <section className="card" style={{marginTop:16}}>
   <h2>Module access matrix</h2>
   <p className="muted">✓ means the role is intended to see or work in that area. Class and subject teachers remain scoped to their assigned classes, streams and learning areas where applicable.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:1100}}>
    <thead><tr><th style={{textAlign:'left',padding:10,position:'sticky',left:0,background:'inherit'}}>Role</th>{areas.map(a=><th key={a[0]} style={{padding:8,fontSize:11,whiteSpace:'nowrap'}}>{a[0]}</th>)}</tr></thead>
    <tbody>{roles.map(r=>{const allowed=roleAreas[r[0]]||[];return <tr key={r[0]}><td style={{padding:10,whiteSpace:'nowrap',position:'sticky',left:0,background:'inherit'}}><strong>{r[1]}</strong></td>{areas.map(a=><td key={a[0]} style={{textAlign:'center',padding:8}}>{allowed.includes(a[0])?'✓':'—'}</td>)}</tr>})}</tbody>
   </table></div>
  </section>

  <section className="card" style={{marginTop:16}}>
   <h2>Updated access rules</h2>
   <div className="cards">
    <div className="card"><strong>Results</strong><p className="muted">Teachers use EE, ME, AE and BE. X means the learner did not do the exam and Y records an exam irregularity. Remarks, points and positions are generated automatically. Class Teachers can publish their selected class results.</p></div>
    <div className="card"><strong>HR & Payroll</strong><p className="muted">Leave approval and pay status are separate. Approved + Unpaid leave can reduce salary. Payroll has a manual payroll number, optional NSSF 6%, optional SHA 2.75%, other deduction, unpaid days and automatic Net Pay.</p></div>
    <div className="card"><strong>Petty Cash</strong><p className="muted">Petty Cash is now a standalone top-level workspace, separate from Finance & Fees. It includes Week 1–4 reporting, opening/remaining balances, vouchers and transaction details.</p></div>
    <div className="card"><strong>Procurement & Inventory</strong><p className="muted">Procurement and Inventory stay together as one workspace with requisitions, LPO/job cards, supplier workflow, invoice/delivery and stock control.</p></div>
    <div className="card"><strong>Teacher assignments</strong><p className="muted">Class Teachers are assigned by class and stream. Their timetable and learner/result access follows that assignment.</p></div>
    <div className="card"><strong>Super Admin</strong><p className="muted">Super Admin remains the unrestricted administrative role and can view/manage the full ERP, users, roles and settings.</p></div>
   </div>
  </section>

  <section className="card" style={{marginTop:16}}>
   <h2>Current users</h2>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Name</th><th style={{textAlign:'left',padding:10}}>Role</th><th style={{textAlign:'left',padding:10}}>Status</th></tr></thead>
    <tbody>{data?.length?data.map((u:any)=><tr key={u.id}><td style={{padding:10}}>{u.full_name||'—'}</td><td style={{padding:10}}>{label(norm(u.role))}</td><td style={{padding:10}}>{u.status||'—'}</td></tr>):<tr><td colSpan={3} className="muted" style={{padding:30,textAlign:'center'}}>No users yet.</td></tr>}</tbody>
   </table></div>
  </section>
 </main>
}
