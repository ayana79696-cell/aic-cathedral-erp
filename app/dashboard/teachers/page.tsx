import Link from 'next/link'
import {createClient} from '../../../lib/supabase/server'
import TeacherAssignmentManager from '../staff/teacher-assignment-manager'

export default async function Page(){
 const s=await createClient()
 const [{data:staff},{data:classes},{data:streams},{data:learningAreas},{data:years},{data:terms},{data:assignments}]=await Promise.all([
  s.from('staff').select('id,first_name,middle_name,last_name,job_title,profile_id,employee_number,academic_uuid').in('job_title',['Class Teacher','Subject Teacher']).order('first_name'),
  s.from('classes').select('id,name').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('learning_areas').select('id,name').eq('active',true).order('name'),
  s.from('academic_years').select('id,year').eq('status','active').order('year',{ascending:false}),
  s.from('terms').select('id,academic_year_id,name').eq('status','active').order('start_date'),
  s.from('teacher_assignments').select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').eq('active',true).order('id')
 ])
 const teacherOptions=(staff||[]).map(x=>({id:x.profile_id||x.id,name:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' '),label:`${x.employee_number||'No Staff ID'}${x.academic_uuid?` — Academic UUID ${x.academic_uuid}`:''}`}))
 return <main className="main"><header className="top"><div><h1>Teachers</h1><p className="muted">Teacher accounts, Staff IDs, Academic UUIDs and CBC learning-area assignments.</p></div><Link className="site-btn" href="/dashboard/users">Create teacher login</Link></header>
 <section className="card"><h2>Teaching staff</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Teacher','Staff ID','Academic UUID','Teaching role'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{(staff||[]).length?(staff||[]).map(x=><tr key={x.id}><td style={{padding:10}}>{[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')}</td><td style={{padding:10}}>{x.employee_number||'—'}</td><td style={{padding:10,fontSize:12}}>{x.academic_uuid||'—'}</td><td style={{padding:10}}>{x.job_title||'Teacher'}</td></tr>):<tr><td colSpan={4} className="muted" style={{padding:30,textAlign:'center'}}>No teachers created yet.</td></tr>}</tbody></table></div></section>
 <TeacherAssignmentManager staff={teacherOptions} classes={(classes||[]).map(x=>({id:x.id,name:x.name}))} streams={(streams||[]).map(x=>({id:x.id,name:x.name,class_id:x.class_id}))} learningAreas={(learningAreas||[]).map(x=>({id:x.id,name:x.name}))} years={(years||[]).map(x=>({id:x.id,name:String(x.year)}))} terms={(terms||[]).map(x=>({id:x.id,name:x.name,class_id:x.academic_year_id}))} initial={assignments||[]} />
 </main>
}