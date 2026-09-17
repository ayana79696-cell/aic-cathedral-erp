import{createClient}from'../../../lib/supabase/server'
import ResultsEntry from './results-entry'
import MeritList from './merit-list'

export async function ResultsWorkspace(){
 const s=await createClient();const{data:{user}}=await s.auth.getUser();const{data:profile}=await s.from('profiles').select('role').eq('id',user?.id||'').maybeSingle();
 const role=profile?.role||'';const isTeacher=['class_teacher','subject_teacher'].includes(role)
 let students:any[]=[],exams:any[]=[],areas:any[]=[],classes:any[]=[],streams:any[]=[],marks:any[]=[],assignments:any[]=[]
 if(isTeacher){
  const{data:workspace,error}=await s.rpc('get_teacher_results_workspace')
  if(!error&&workspace){students=workspace.students||[];exams=workspace.exams||[];areas=workspace.areas||[];classes=workspace.classes||[];streams=workspace.streams||[];marks=workspace.marks||[];assignments=[...(workspace.assignments||[]),...(workspace.class_assignments||[]).map((x:any)=>({...x,learning_area_id:null}))]}
 }else{
  const q=await Promise.all([
   s.from('students').select('id,admission_number,first_name,middle_name,last_name,class_id,stream_id,status').eq('status','active').order('last_name'),
   s.from('exams').select('id,name,academic_year_id,term_id,max_marks,status').neq('status','archived').order('start_date',{ascending:false}),
   s.from('learning_areas').select('id,name').eq('active',true).order('name'),
   s.from('classes').select('id,name').eq('status','active').order('name'),
   s.from('streams').select('id,class_id,name').eq('status','active').order('name'),
   s.from('marks').select('id,student_id,exam_id,class_id,learning_area_id,teacher_id,marks,max_marks,achievement_level,remarks,status').order('created_at',{ascending:false}).limit(500)
  ]);students=q[0].data||[];exams=q[1].data||[];areas=q[2].data||[];classes=q[3].data||[];streams=q[4].data||[];marks=q[5].data||[]
 }
 const effectiveAssignments=assignments.filter((x:any)=>x.active!==false)
 return <div><ResultsEntry role={role} students={students} exams={exams} areas={areas} classes={classes} streams={streams} assignments={effectiveAssignments} marks={marks}/><MeritList role={role} assignments={effectiveAssignments} students={students} marks={marks} exams={exams} areas={areas} classes={classes} streams={streams}/><section className="card"><h2>Results Centre</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Student','Exam','Learning area','Marks','Max','Achievement','Remarks','Status'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{marks.length?marks.map((x:any)=><tr key={x.id}><td style={{padding:10}}>{students.find(s=>s.id===x.student_id)?[students.find(s=>s.id===x.student_id)?.first_name,students.find(s=>s.id===x.student_id)?.middle_name,students.find(s=>s.id===x.student_id)?.last_name].filter(Boolean).join(' '):'—'}</td><td style={{padding:10}}>{exams.find(e=>e.id===x.exam_id)?.name||'—'}</td><td style={{padding:10}}>{areas.find(a=>a.id===x.learning_area_id)?.name||'—'}</td><td style={{padding:10}}>{x.achievement_level==='X'||x.achievement_level==='Y'?x.achievement_level:x.marks}</td><td style={{padding:10}}>{x.max_marks}</td><td style={{padding:10}}>{x.achievement_level||'—'}</td><td style={{padding:10}}>{x.remarks||'—'}</td><td style={{padding:10}}>{x.status}</td></tr>):<tr><td colSpan={8} className="muted" style={{padding:35,textAlign:'center'}}>No results entered yet.</td></tr>}</tbody></table></div></section></div>
}
export default async function Page(){return <main className="main"><header className="top"><div><h1>Results & Report Forms</h1><p className="muted">CBC results, full class marks, automatic remarks, points, stream and overall positions.</p></div></header><ResultsWorkspace/></main>}
