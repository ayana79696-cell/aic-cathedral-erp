import SimpleCrud from '../_components/simple-crud'
import LeaveApprovalInbox from '../_components/leave-approval-inbox'
import {createClient} from '../../../lib/supabase/server'
import {PrototypePage} from '../_components/prototype-workspace'
import {ExamsWorkspace} from '../exams/page'
import {ResultsWorkspace} from '../results/page'

export default async function Academic(){
 const s=await createClient()
 const{data:classes}=await s.from('classes').select('id,name,level').eq('status','active').order('name')
 const classOptions=(classes||[]).map(c=>({value:c.id,label:`${c.name}${c.level?` — ${c.level}`:''}`}))
 return <PrototypePage title="Academics" subtitle="One simple academic workspace. Tap a section and only that section is displayed." tabs={[["#setup","Academic Setup"],["#exams","Exams & CBC"],["#results","Results"]]}>
  <section id="setup">
   <LeaveApprovalInbox/>
   <SimpleCrud table="academic_years" title="Academic years" fields={[{name:'year',label:'Year',type:'number',required:true},{name:'status',label:'Status',options:['active','inactive','archived']}]} order="year"/>
   <SimpleCrud table="terms" title="Terms" roleHint="Choose Term One, Term Two or Term Three. The current academic year is linked automatically." autoActiveAcademicYear fields={[{name:'academic_year_id',label:'Academic year'},{name:'name',label:'Term',required:true,options:['Term One','Term Two','Term Three']},{name:'start_date',label:'Start date',type:'date'},{name:'end_date',label:'End date',type:'date'},{name:'status',label:'Status',options:['active','inactive','archived']}]} />
   <SimpleCrud table="classes" title="Grades / classes" fields={[{name:'name',label:'Grade / Class name',required:true},{name:'level',label:'Level / stage'},{name:'status',label:'Status',options:['active','inactive','archived']}]} />
   <SimpleCrud table="streams" title="Streams — East / West" fields={[{name:'class_id',label:'Grade / class',required:true,options:classOptions},{name:'name',label:'Stream name',required:true,options:['East','West']}]} />
   <SimpleCrud table="learning_areas" title="CBC learning areas" fields={[{name:'name',label:'Learning area',required:true},{name:'code',label:'Code'},{name:'category',label:'Category'}]} />
  </section>
  <section id="exams"><ExamsWorkspace/></section>
  <section id="results"><div className="prototype-module-header"><div><h2>Results</h2><p>Only learner results, marks and report-form work is shown in this section.</p></div></div><ResultsWorkspace/></section>
 </PrototypePage>
}
