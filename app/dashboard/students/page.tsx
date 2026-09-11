import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import AdmissionForm from './admission-form'
import DeleteStudentButton from './delete-student-button'
import { PrototypePage, PrototypePanel, PrototypeAction, PrototypeBadge } from '../_components/prototype-workspace'

export default async function Students(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 const [{data:students},{data:classes},{data:streams},{data:profile}]=await Promise.all([
  s.from('students').select('id,portal_code,admission_number,first_name,middle_name,last_name,gender,date_of_birth,class_id,stream_id,blood_group,medical_conditions,status').order('last_name'),
  s.from('classes').select('id,name,level').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('profiles').select('role').eq('id',user?.id||'').maybeSingle()
 ])
 const isAdmin=['super_admin','admin'].includes(profile?.role||'')
 const classMap=new Map((classes||[]).map(c=>[c.id,c.name]))
 const streamMap=new Map((streams||[]).map(x=>[x.id,x.name]))
 const studentName=(x:any)=>[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')
 const total=students?.length||0, active=(students||[]).filter(x=>x.status==='active').length, holds=0, assigned=(students||[]).filter(x=>x.class_id).length
 return <PrototypePage title="Students & Administration" subtitle="Registration, profiles, class lists and parent/guardian details" action={isAdmin?<PrototypeAction href="#admission">+ Register Student</PrototypeAction>:undefined} kpis={[{label:'Total Students',value:total,note:'All learner records',tone:'navy'},{label:'Active',value:active,note:'Currently enrolled',tone:'green'},{label:'Fee Hold',value:holds,note:'Linked from finance',tone:'red'},{label:'Class Assigned',value:assigned,note:'Learners with a class',tone:'blue'}]} tabs={[["#register","Student Register"],["#admission","Register Student"],["#parents","Parents & Guardians"]]}>
  {isAdmin&&<section id="admission" className="prototype-panel"><div className="prototype-panel-head"><h2>New student admission</h2></div><div className="prototype-panel-body"><p className="muted">Capture learner, guardian, emergency and medical information. A unique Parent Portal Code is generated automatically after saving.</p><AdmissionForm classes={classes||[]}/></div></section>}
  <section id="register" className="prototype-panel"><div className="prototype-panel-head"><div><h2>Student register</h2><p className="muted">Search and manage the live learner register.</p></div><span className="muted">{total} records</span></div><div className="prototype-panel-body"><div className="prototype-table-wrap"><table className="prototype-table"><thead><tr>{['ADM NO','NAME','CLASS','STREAM','GENDER','ATTENDANCE','FEES','STATUS',...(isAdmin?['ACTION']:[])].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{students?.length?students.map(x=><tr key={x.id}><td><strong>{x.admission_number}</strong></td><td>{studentName(x)}</td><td>{classMap.get(x.class_id)||'—'}</td><td>{streamMap.get(x.stream_id)||'—'}</td><td>{x.gender||'—'}</td><td><PrototypeBadge tone="green">Live</PrototypeBadge></td><td>{x.portal_code?'Linked':'—'}</td><td><PrototypeBadge tone={x.status==='active'?'green':'gray'}>{x.status}</PrototypeBadge></td>{isAdmin&&<td><DeleteStudentButton id={x.id} name={studentName(x)}/></td>}</tr>):<tr><td colSpan={isAdmin?9:8} className="prototype-empty">No students yet.</td></tr>}</tbody></table></div></div></section>
  <section id="parents" className="prototype-panel"><div className="prototype-panel-head"><h2>Parents & Guardians</h2></div><div className="prototype-panel-body"><p className="muted">Guardian and parent links are stored with each learner and power the secure Parent Portal.</p><Link href="/dashboard/users" className="prototype-primary-button">Manage portal accounts</Link></div></section>
 </PrototypePage>
}
