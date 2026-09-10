import {createClient} from '../../../lib/supabase/server'
import ResultsEntry from './results-entry'

export default async function Page(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 const [{data:profile},{data:students},{data:exams},{data:areas},{data:classes},{data:streams},{data:marks}]=await Promise.all([
  s.from('profiles').select('role').eq('id',user?.id||'').maybeSingle(),
  s.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id,status').eq('status','active').order('last_name'),
  s.from('exams').select('id,name,academic_year_id,term_id,max_marks,status').neq('status','archived').order('start_date',{ascending:false}),
  s.from('learning_areas').select('id,name').eq('active',true).order('name'),
  s.from('classes').select('id,name').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
  s.from('marks').select('id,student_id,exam_id,class_id,learning_area_id,teacher_id,marks,max_marks,achievement_level,remarks,status').order('created_at',{ascending:false}).limit(500)
 ])
 let assignments:any[]=[]
 if(['class_teacher','subject_teacher'].includes(profile?.role||'')){
  const {data:staff}=await s.from('staff').select('id').eq('profile_id',user?.id||'').maybeSingle()
  if(staff?.id){const {data}=await s.from('teacher_assignments').select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').eq('teacher_id',staff.id).eq('active',true);assignments=data||[]}
 }
 return <main className="main"><header className="top"><div><h1>Results & Report Forms</h1><p className="muted">Live learner marks, achievement levels and report-form preparation.</p></div></header><ResultsEntry role={profile?.role||''} students={students||[]} exams={exams||[]} areas={areas||[]} classes={classes||[]} streams={streams||[]} assignments={assignments} marks={marks||[]}/><section className="card"><h2>Results Centre</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Student','Exam','Learning area','Marks','Max','Achievement','Remarks','Status'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{marks?.length?marks.map((x:any)=><tr key={x.id}><td style={{padding:10}}>{students?.find(s=>s.id===x.student_id)?[students.find(s=>s.id===x.student_id)?.first_name,students.find(s=>s.id===x.student_id)?.middle_name,students.find(s=>s.id===x.student_id)?.last_name].filter(Boolean).join(' '):'—'}</td><td style={{padding:10}}>{exams?.find(e=>e.id===x.exam_id)?.name||'—'}</td><td style={{padding:10}}>{areas?.find(a=>a.id===x.learning_area_id)?.name||'—'}</td><td style={{padding:10}}>{x.marks}</td><td style={{padding:10}}>{x.max_marks}</td><td style={{padding:10}}>{x.achievement_level||'—'}</td><td style={{padding:10}}>{x.remarks||'—'}</td><td style={{padding:10}}>{x.status}</td></tr>):<tr><td colSpan={8} className="muted" style={{padding:35,textAlign:'center'}}>No results entered yet.</td></tr>}</tbody></table></div></section></main>
}
