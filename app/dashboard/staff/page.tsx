import Link from 'next/link'
import SimpleCrud from '../_components/simple-crud'
import TeacherAssignmentManager from './teacher-assignment-manager'
import {createClient} from '../../../lib/supabase/server'

export default async function Page(){
 const s=await createClient()
 const [{data:staff},{data:classes},{data:streams},{data:learningAreas},{data:years},{data:terms},{data:assignments}]=await Promise.all([
  s.from('staff').select('id,first_name,middle_name,last_name,job_title,profile_id').order('first_name'),
  s.from('classes').select('id,name').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('learning_areas').select('id,name').eq('active',true).order('name'),
  s.from('academic_years').select('id,year').eq('status','active').order('year',{ascending:false}),
  s.from('terms').select('id,academic_year_id,name').eq('status','active').order('start_date'),
  s.from('teacher_assignments').select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').eq('active',true).order('id')
 ])
 const staffOptions=(staff||[]).map(x=>({id:x.id,name:[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' '),label:x.job_title||'Staff'}))
 const classOptions=(classes||[]).map(x=>({id:x.id,name:x.name}))
 const streamOptions=(streams||[]).map(x=>({id:x.id,name:x.name,class_id:x.class_id}))
 const areaOptions=(learningAreas||[]).map(x=>({id:x.id,name:x.name}))
 const yearOptions=(years||[]).map(x=>({id:x.id,name:String(x.year)}))
 const termOptions=(terms||[]).map(x=>({id:x.id,name:x.name,class_id:x.academic_year_id}))
 return <main className="main"><header className="top"><div><h1>Staff & Teachers</h1><p className="muted">Employees, teachers, class/stream assignments and location attendance.</p></div><Link className="site-btn" href="/dashboard/staff/checkin">Teacher check-in</Link></header><SimpleCrud table="staff" title="Staff directory" fields={[{name:'employee_number',label:'Employee No.',required:true},{name:'first_name',label:'First name',required:true},{name:'last_name',label:'Last name',required:true},{name:'phone',label:'Phone'},{name:'email',label:'Email',type:'email'},{name:'department',label:'Department'},{name:'job_title',label:'Job title'},{name:'employment_type',label:'Employment type',options:['permanent','contract','casual','intern']}]} /><TeacherAssignmentManager staff={staffOptions} classes={classOptions} streams={streamOptions} learningAreas={areaOptions} years={yearOptions} terms={termOptions} initial={assignments||[]} /></main>
}
