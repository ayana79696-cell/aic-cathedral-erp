import {createClient} from '../../../lib/supabase/server'
import FinanceDesk from './finance-desk'
import SimpleCrud from '../_components/simple-crud'

export default async function Page(){
 const s=await createClient()
 const [{data:students},{data:academicYear}]=await Promise.all([
  s.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id').eq('status','active').order('last_name'),
  s.from('academic_years').select('id').eq('status','active').order('year',{ascending:false}).limit(1).maybeSingle()
 ])
 const [{data:classes},{data:streams}]=await Promise.all([
  s.from('classes').select('id,name').eq('status','active'),
  s.from('streams').select('id,class_id,name').eq('status','active')
 ])
 const classMap=new Map((classes||[]).map(c=>[c.id,c.name]))
 const streamMap=new Map((streams||[]).map(x=>[x.id,x.name]))
 const financeStudents=(students||[]).map(x=>({...x,class_name:classMap.get(x.class_id||'')||'Unassigned',stream_name:streamMap.get(x.stream_id||'')||'Unassigned'}))
 return <main className="main"><header className="top"><div><h1>Finance & Fees</h1><p className="muted">Find a learner by admission number, grade and East/West stream, then manage fees and payments.</p></div></header><FinanceDesk students={financeStudents} academicYearId={academicYear?.id}/><SimpleCrud table="fee_accounts" title="Fee accounts" fields={[{name:'student_id',label:'Learner ID',required:true},{name:'amount_due',label:'Amount due (KES)',type:'number',required:true},{name:'amount_paid',label:'Amount paid (KES)',type:'number'},{name:'status',label:'Status',options:['unpaid','partial','paid','waived']}]} roleHint="Use the fee collection desk above for normal admissions-based fee collection."/><SimpleCrud table="fee_payments" title="Payments & receipts" fields={[{name:'student_id',label:'Learner ID',required:true},{name:'amount',label:'Amount (KES)',type:'number',required:true},{name:'payment_method',label:'Method',options:['cash','mpesa','bank','card','other']},{name:'reference_no',label:'Reference / receipt no.'}]} /></main>
}