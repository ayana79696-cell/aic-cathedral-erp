import Link from 'next/link'
import {createClient} from '../../../lib/supabase/server'
import TeacherAssignmentManager from '../staff/teacher-assignment-manager'
import { PrototypePage } from '../_components/prototype-workspace'

const teacherRoles=['class_teacher','subject_teacher']
const roleLabels:Record<string,string>={class_teacher:'Class Teacher',subject_teacher:'Subject Teacher'}

export default async function Page(){
 const s=await createClient();
 const [{data:staff},{data:profiles},{data:classes},{data:streams},{data:learningAreas},{data:years},{data:terms},{data:assignments}]=await Promise.all([
  s.from('staff').select('id,profile_id,employee_number,first_name,middle_name,last_name,job_title,department,phone,email,employment_type,status').order('first_name'),
  s.from('profiles').select('id,full_name,role,status,permissions').in('role',teacherRoles).order('full_name'),
  s.from('classes').select('id,name').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('learning_areas').select('id,name').eq('active',true).order('name'),
  s.from('academic_years').select('id,year').eq('status','active').order('year',{ascending:false}),
  s.from('terms').select('id,academic_year_id,name').eq('status','active').order('start_date'),
  s.from('teacher_assignments').select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').eq('active',true).order('id')
 ])
 const staffByProfile=Object.fromEntries((staff||[]).filter(x=>x.profile_id).map(x=>[x.profile_id,x]))
 const teachers=(profiles||[]).map(p=>{const st=staffByProfile[p.id];const parts=(p.full_name||'').trim().split(/\s+/).filter(Boolean);return {profile_id:p.id,staff_id:st?.id||null,employee_number:st?.employee_number||'—',first_name:st?.first_name||parts[0]||'',middle_name:st?.middle_name||null,last_name:st?.last_name||parts.slice(1).join(' '),phone:st?.phone||'',email:st?.email||'',department:st?.department||'Academic',job_title:st?.job_title||roleLabels[p.role]||'Teacher',employment_type:st?.employment_type||'permanent',status:p.status||st?.status||'active',role:p.role}})
 const teacherOptions=teachers.map(x=>({id:x.profile_id,name:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' '),label:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')}))
 return <PrototypePage title="Teachers" subtitle="Teacher profiles, CBC learning-area assignments and class responsibilities" action={<Link className="prototype-primary-button" href="/dashboard/users">+ Add Teacher / Staff Account</Link>} kpis={[{label:'Teaching Staff',value:teachers.length,note:'Class + subject teachers',tone:'navy'},{label:'Assignments',value:(assignments||[]).length,note:'Active teaching assignments',tone:'green'},{label:'Learning Areas',value:(learningAreas||[]).length,note:'CBC curriculum',tone:'blue'},{label:'Active Classes',value:(classes||[]).length,note:'Current class register',tone:'yellow'}]} tabs={[["#teachers","Teaching Staff"],["#assignments","Class & Subject Assignments"],["#accounts","Teacher Accounts"]]}>
 <section id="teachers" className="prototype-panel"><div className="prototype-panel-head"><div><h2>Teaching staff</h2><p className="muted">All users with Class Teacher or Subject Teacher roles appear here automatically.</p></div><Link className="prototype-primary-button" href="/dashboard/users">+ Add Teacher</Link></div><div className="prototype-panel-body"><div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>TEACHER</th><th>ROLE</th><th>STAFF NO.</th><th>PHONE</th><th>EMAIL</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{teachers.length?teachers.map(x=><tr key={x.profile_id}><td><strong>{[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')||'Unnamed teacher'}</strong></td><td>{roleLabels[x.role]||x.job_title}</td><td>{x.employee_number}</td><td>{x.phone||'—'}</td><td>{x.email||'—'}</td><td>{x.status}</td><td><Link className="btn secondary" href={`/dashboard/users?edit=${x.profile_id}`}>Edit teacher</Link></td></tr>):<tr><td colSpan={7} className="prototype-empty">No Class Teacher or Subject Teacher accounts found. Add one using the button above.</td></tr>}</tbody></table></div></div></section>
 <section id="assignments"><TeacherAssignmentManager staff={teacherOptions} classes={(classes||[]).map(x=>({id:x.id,name:x.name}))} streams={(streams||[]).map(x=>({id:x.id,name:x.name,class_id:x.class_id}))} learningAreas={(learningAreas||[]).map(x=>({id:x.id,name:x.name}))} years={(years||[]).map(x=>({id:x.id,name:String(x.year)}))} terms={(terms||[]).map(x=>({id:x.id,name:x.name,class_id:x.academic_year_id}))} initial={assignments||[]} /></section>
 <section id="accounts" className="prototype-panel"><div className="prototype-panel-head"><div><h2>Teacher account management</h2><p className="muted">Super Admin can change a teacher's role, edit their details, suspend them, or delete the account.</p></div><Link className="prototype-primary-button" href="/dashboard/users">Open User Management</Link></div><div className="prototype-panel-body"><p>Teacher accounts are connected to their staff profile. Changing the role in User Management automatically updates the teacher record and keeps the staff number.</p></div></section>
 </PrototypePage>
}