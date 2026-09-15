import {createClient} from '../../../lib/supabase/server'
import FinanceDesk from './finance-desk'
import PaymentHistory from './payment-history'
import Cashbook from './cashbook'
import Invoices from './invoices'
import StudentFeeStatements from './student-fee-statements'
import FeeHoldManager from './fee-hold-manager'
import Budget from './budget'
import {PrototypePage} from '../_components/prototype-workspace'

export default async function Page(){
 const s=await createClient()
 const [{data:students},{data:accounts},{data:payments},{data:budgetLines},{data:payroll}]=await Promise.all([
  s.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id').eq('status','active').order('last_name'),
  s.from('fee_accounts').select('amount_due,amount_paid,status,student_id'),
  s.from('fee_payments').select('amount,payment_category'),
  s.from('budget_lines').select('id,category,section,budget_amount,notes').order('section').order('category'),
  s.from('payroll_records').select('gross_pay,status')
 ])
 const [{data:classes},{data:streams}]=await Promise.all([
  s.from('classes').select('id,name').eq('status','active'),
  s.from('streams').select('id,class_id,name').eq('status','active')
 ])
 const cm=new Map((classes||[]).map(c=>[c.id,c.name]))
 const sm=new Map((streams||[]).map(x=>[x.id,x.name]))
 const fs=(students||[]).map(x=>({...x,class_name:cm.get(x.class_id||'')||'Unassigned',stream_name:sm.get(x.stream_id||'')||'Unassigned'}))
 const due=(accounts||[]).reduce((a,x)=>a+Number(x.amount_due||0),0)
 const paid=(accounts||[]).reduce((a,x)=>a+Number(x.amount_paid||0),0)||(payments||[]).reduce((a,x)=>a+Number(x.amount||0),0)
 const holds=(accounts||[]).filter(x=>['unpaid','partial'].includes(String(x.status))).length
 const actualByCategory=(category:string)=>{
  if(category==='Fees Income') return (payments||[]).filter(x=>['school_fees','fees','fees_income'].includes(String(x.payment_category||'').toLowerCase())).reduce((a,x)=>a+Number(x.amount||0),0)
  if(category==='Interview Fees') return (payments||[]).filter(x=>String(x.payment_category||'').toLowerCase()==='interview').reduce((a,x)=>a+Number(x.amount||0),0)
  if(category==='Admission Fees') return (payments||[]).filter(x=>String(x.payment_category||'').toLowerCase()==='admission').reduce((a,x)=>a+Number(x.amount||0),0)
  if(category==='Salaries') return (payroll||[]).reduce((a,x)=>a+Number(x.gross_pay||0),0)
  return 0
 }
 const br=(budgetLines||[]).map(x=>({id:x.id,category:x.category,section:x.section as 'income'|'expenditure',budget:Number(x.budget_amount||0),actual:actualByCategory(x.category),notes:x.notes||null}))
 return <PrototypePage title="Finance & Fees" subtitle="Fees, payments, arrears, invoices, cashbook and budget planning" action={<a href="#budget" className="prototype-primary-button">+ Budget</a>} kpis={[{label:'Total Collected',value:`KES ${paid.toLocaleString('en-KE')}`,note:'Live recorded payments',tone:'navy'},{label:'Total Arrears',value:`KES ${Math.max(due-paid,0).toLocaleString('en-KE')}`,note:'Outstanding balances',tone:'green'},{label:'Fee-Hold Students',value:holds,note:'Linked to transport/teachers',tone:'red'},{label:'Payments Recorded',value:(payments||[]).length,note:'Payment entries',tone:'yellow'}]} tabs={[["#overview","Fees & Payments"],["#budget","Budget & Planning"],["#payment-history","Payments & Receipts"],["#statements","Student Statements"],["#cashbook","Money In & Out"],["#invoices","Invoices"],["#balances","Balances & Fee Hold"]]}>
  <section id="overview"><FinanceDesk students={fs}/></section>
  <section id="budget"><Budget rows={br}/></section>
  <section id="payment-history"><PaymentHistory /></section>
  <section id="statements"><StudentFeeStatements /></section>
  <section id="cashbook"><Cashbook /></section>
  <section id="invoices"><Invoices /></section>
  <section id="balances"><FeeHoldManager students={fs} accounts={accounts||[]}/></section>
 </PrototypePage>
}
