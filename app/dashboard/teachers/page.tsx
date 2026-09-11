import Link from 'next/link'
import {createClient} from '../../../lib/supabase/server'
import TeacherAssignmentManager from '../staff/teacher-assignment-manager'
import { PrototypePage } from '../_components/prototype-workspace'

export default async function Page(){
 const s=await createClient();const [{data:staff},{data:classes},{data:streams},{data:learningAreas},{data:years},{data:terms},{data:assignments}]=await Promise.all([
  s.from('staff').select('id,first_name,middle_name,last_name,job_title,profile_id').in('job_title',['Class Teacher','Subject Teacher']).order('first_name'),
  s.from('classes').select('id,name').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('learning_areas').select('id,name').eq('active',true).order('name'),
  s.from('academic_years').select('id,year').eq('status','active').order('year',{ascending:false}),
  s.from('terms').select('id,academic_year_id,name').eq('status','active').order('start_date'),
  s.from('teacher_assignments').select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').eq('active',true).order('id')
 ])
 const teacherOptions=(staff||[]).map(x=>({id:x.profile_id||x.id,name:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' '),label:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')}))
 return <PrototypePage title="Teachers" subtitle="Teacher profiles, CBC learning-area assignments and class responsibilities" action={<Link className="prototype-primary-button" href="/dashboard/users">Create teacher login</Link>} kpis={[{label:'Teaching Staff',value:(staff||[]).length,note:'Class + subject teachers',tone:'navy'},{label:'Assignments',value:(assignments||[]).length,note:'Active teaching assignments',tone:'green'},{label:'Learning Areas',value:(learningAreas||[]).length,note:'CBC curriculum',tone:'blue'},{label:'Active Classes',value:(classes||[]).length,note:'Current class register',tone:'yellow'}]} tabs={[["#teachers","Teaching Staff"],["#assignments","Class & Subject Assignments"],["#accounts","Teacher Accounts"]]}>
 <section id="teachers" className="prototype-panel"><div className="prototype-panel-head"><h2>Teaching staff</h2></div><div className="prototype-panel-body"><div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>TEACHER</th><th>TEACHING ROLE</th></tr></thead><tbody>{(staff||[]).length?(staff||[]).map(x=><tr key={x.id}><td><strong>{[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')}</strong></td><td>{x.job_title||'Teacher'}</td></tr>):<tr><td colSpan={2} className="prototype-empty">No teachers created yet.</td></tr>}</tbody></table></div></div></section>
 <section id="assignments"><TeacherAssignmentManager staff={teacherOptions} classes={(classes||[]).map(x=>({id:x.id,name:x.name}))} streams={(streams||[]).map(x=>({id:x.id,name:x.name,class_id:x.class_id}))} learningAreas={(learningAreas||[]).map(x=>({id:x.id,name:x.name}))} years={(years||[]).map(x=>({id:x.id,name:String(x.year)}))} terms={(terms||[]).map(x=>({id:x.id,name:x.name,class_id:x.academic_year_id}))} initial={assignments||[]} /></section>
 <section id="accounts" className="prototype-panel"><div className="prototype-panel-head"><h2>Teacher accounts</h2></div><div className="prototype-panel-body"><p className="muted">Teacher logins remain controlled by the existing Super Admin workflow.</p><Link className="prototype-primary-button" href="/dashboard/users">Open User Management</Link></div></section>
 </PrototypePage>
}