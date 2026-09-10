'use client'
import {useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Row=Record<string,any>
type Props={role:string;students:Row[];exams:Row[];areas:Row[];classes:Row[];streams:Row[];assignments:Row[];marks:Row[]}

export default function ResultsEntry({role,students,exams,areas,classes,streams,assignments,marks}:Props){
 const s=createClient(); const teacherRole=role==='class_teacher'||role==='subject_teacher'
 const unrestricted=['super_admin','admin','academic'].includes(role)
 const [form,setForm]=useState({student_id:'',exam_id:'',learning_area_id:'',marks:'',achievement_level:'',remarks:'',status:'published'})
 const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('')
 const classMap=useMemo(()=>new Map(classes.map(x=>[x.id,x.name])),[classes])
 const streamMap=useMemo(()=>new Map(streams.map(x=>[x.id,x.name])),[streams])
 const assignmentKeys=useMemo(()=>assignments.filter(x=>x.active!==false),[assignments])
 const allowedAreas=useMemo(()=>unrestricted?areas:areas.filter(a=>assignmentKeys.some(x=>x.learning_area_id===a.id)),[unrestricted,areas,assignmentKeys])
 const selectedArea=form.learning_area_id
 const allowedAssignments=useMemo(()=>unrestricted?[]:assignmentKeys.filter(x=>!selectedArea||x.learning_area_id===selectedArea),[unrestricted,assignmentKeys,selectedArea])
 const visibleStudents=useMemo(()=>{
  if(unrestricted)return students
  const keys=new Set(allowedAssignments.map(x=>`${x.class_id}|${x.stream_id||'*'}`))
  return students.filter(x=>Array.from(keys).some(k=>{const [c,st]=k.split('|');return c===x.class_id&&(st==='*'||st===String(x.stream_id||''))}))
 },[unrestricted,students,allowedAssignments])
 const visibleExams=useMemo(()=>{
  if(unrestricted)return exams
  const pairs=new Set(allowedAssignments.map(x=>`${x.academic_year_id}|${x.term_id||'*'}`))
  return exams.filter(x=>Array.from(pairs).some(k=>{const [y,t]=k.split('|');return y===x.academic_year_id&&(t==='*'||t===String(x.term_id||''))}))
 },[unrestricted,exams,allowedAssignments])
 const selectedExam=exams.find(x=>x.id===form.exam_id)
 const selectedStudent=students.find(x=>x.id===form.student_id)
 const allowed=unrestricted||allowedAssignments.some(x=>x.learning_area_id===form.learning_area_id&&x.class_id===selectedStudent?.class_id&&(x.stream_id===null||x.stream_id===selectedStudent?.stream_id)&&x.academic_year_id===selectedExam?.academic_year_id&&(x.term_id===null||x.term_id===selectedExam?.term_id))
 const set=(key:string,value:string)=>setForm(f=>({...f,[key]:value}))
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();setBusy(true);setMsg('')
  const max=Number(selectedExam?.max_marks||100);const value=Number(form.marks)
  if(!selectedStudent||!selectedExam||!form.learning_area_id||!Number.isFinite(value)||value<0||value>max){setMsg(`Enter a mark from 0 to ${max} and select learner, exam and learning area.`);setBusy(false);return}
  if(!allowed){setMsg('This teacher is not assigned to that class, stream, learning area and term.');setBusy(false);return}
  const existing=marks.find(x=>x.student_id===selectedStudent.id&&x.exam_id===selectedExam.id&&x.learning_area_id===form.learning_area_id)
  const teacherId=(await s.auth.getUser()).data.user?.id
  if(!teacherId){setMsg('Your session has expired. Please sign in again.');setBusy(false);return}
  const payload={student_id:selectedStudent.id,exam_id:selectedExam.id,class_id:selectedStudent.class_id,learning_area_id:form.learning_area_id,teacher_id:teacherId,marks:value,max_marks:max,achievement_level:form.achievement_level||null,remarks:form.remarks||null,status:form.status}
  const result=existing?await s.from('marks').update(payload).eq('id',existing.id):await s.from('marks').insert(payload)
  if(result.error)setMsg(result.error.message);else{setMsg(existing?'Result updated successfully.':'Result saved successfully.');setForm({...form,marks:'',achievement_level:'',remarks:''})}
  setBusy(false)
 }
 return <section className="card" style={{marginBottom:16}}><h2>Enter learner results</h2><p className="muted">{teacherRole?'Your choices are limited to the classes, streams, learning areas and terms assigned to your teacher account.':'Academic management can enter and update results across the school.'}</p><form onSubmit={save} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:14}}>
  <select value={form.learning_area_id} onChange={e=>{set('learning_area_id',e.target.value);set('student_id','');set('exam_id','')}} required><option value="">Learning area</option>{allowedAreas.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={form.exam_id} onChange={e=>set('exam_id',e.target.value)} required><option value="">Exam</option>{visibleExams.map(x=><option key={x.id} value={x.id}>{x.name} — /{x.max_marks}</option>)}</select>
  <select value={form.student_id} onChange={e=>set('student_id',e.target.value)} required><option value="">Learner</option>{visibleStudents.map(x=><option key={x.id} value={x.id}>{[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')} — {x.admission_number}{classMap.get(x.class_id)?` — ${classMap.get(x.class_id)}`:''}{x.stream_id&&streamMap.get(x.stream_id)?` ${streamMap.get(x.stream_id)}`:''}</option>)}</select>
  <input type="number" min="0" max={selectedExam?.max_marks||100} step="0.01" value={form.marks} onChange={e=>set('marks',e.target.value)} placeholder={`Mark / ${selectedExam?.max_marks||100}`} required/>
  <input value={form.achievement_level} onChange={e=>set('achievement_level',e.target.value)} placeholder="Achievement level (optional)"/>
  <input value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Teacher remarks (optional)"/>
  <select value={form.status} onChange={e=>set('status',e.target.value)}><option value="published">Published</option><option value="draft">Draft</option></select>
  <button className="btn" disabled={busy}>{busy?'Saving…':'Save result'}</button>
 </form>{msg&&<p style={{color:msg.includes('successfully')?'#18794e':'#b42318',fontSize:13}}>{msg}</p>}</section>
}
