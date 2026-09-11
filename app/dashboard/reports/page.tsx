'use client'
import {useEffect,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;admission_number:string;first_name:string;middle_name:string|null;last_name:string;gender:string|null;class_id:string|null;stream_id:string|null}
type Mark={id:string;marks:number;max_marks:number;achievement_level:string|null;remarks:string|null;learning_area_id:string;exams:{name:string;term_id:string|null}|null;learning_areas:{name:string}|null}
const level=(p:number)=>p>=80?'Exceeding Expectations':p>=60?'Meeting Expectations':p>=40?'Approaching Expectations':'Below Expectations'
const competencies=['Communication and collaboration','Critical thinking and problem solving','Creativity and imagination','Self-efficacy','Citizenship','Digital literacy','Learning to learn']
const participation=['Sports and games','Music / performing arts','Clubs and societies','Leadership and responsibility']

export default function Page(){
 const[students,setStudents]=useState<Student[]>([]),[classes,setClasses]=useState<any[]>([]),[streams,setStreams]=useState<any[]>([]),[selected,setSelected]=useState(''),[marks,setMarks]=useState<Mark[]>([]),[loading,setLoading]=useState(true),[loadingMarks,setLoadingMarks]=useState(false),[search,setSearch]=useState('')
 useEffect(()=>{(async()=>{const s=createClient();const[st,cl,sm]=await Promise.all([s.from('students').select('id,admission_number,first_name,middle_name,last_name,gender,class_id,stream_id').eq('status','active').order('admission_number'),s.from('classes').select('id,name').order('name'),s.from('streams').select('id,name').order('name')]);setStudents((st.data||[]) as Student[]);setClasses(cl.data||[]);setStreams(sm.data||[]);setLoading(false)})()},[])
 useEffect(()=>{if(!selected){setMarks([]);return}(async()=>{setLoadingMarks(true);const{data}=await createClient().from('marks').select('id,marks,max_marks,achievement_level,remarks,learning_area_id,exams(name,term_id),learning_areas(name)').eq('student_id',selected).order('created_at');setMarks((data||[]) as any);setLoadingMarks(false)})()},[selected])
 const student=students.find(x=>x.id===selected);const cls=classes.find(x=>x.id===student?.class_id)?.name||'—';const stream=streams.find(x=>x.id===student?.stream_id)?.name||'—';const filtered=students.filter(x=>`${x.admission_number} ${x.first_name} ${x.middle_name||''} ${x.last_name}`.toLowerCase().includes(search.toLowerCase())).slice(0,50);const total=marks.reduce((a,x)=>a+Number(x.marks||0),0);const max=marks.reduce((a,x)=>a+Number(x.max_marks||0),0);const avg=max?Math.round(total/max*100):0;const overall=level(avg)
 return <main className="main">
  <header className="top"><div><div className="eyebrow">ACADEMIC • CBC</div><h1 style={{margin:'5px 0'}}>Reports & Report Forms</h1><p className="muted">Professional learner reports built from live marks, classes and learning areas.</p></div><button className="site-btn no-print" onClick={()=>window.print()}>Print report</button></header>
  <section className="card no-print"><h2 style={{marginTop:0}}>Select learner</h2><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search admission number or learner name"/><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select learner</option>{filtered.map(x=><option key={x.id} value={x.id}>{x.admission_number} — {[x.first_name,x.middle_name,x.last_name].filter(Boolean).join(' ')}</option>)}</select></div>{loading&&<p className="muted">Loading learners…</p>}</section>
  {selected&&<section className="report-card" id="report-card"><div className="report-head"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral"/><div><h1>AIC CATHEDRAL PRIMARY SCHOOL</h1><p>P.O. Box 37, Gilgil — Education for Excellence</p><strong>CBC LEARNER PROGRESS REPORT</strong></div></div>
   <div className="student-meta"><span><b>Learner:</b> {[student?.first_name,student?.middle_name,student?.last_name].filter(Boolean).join(' ')}</span><span><b>Admission No:</b> {student?.admission_number}</span><span><b>Grade / Class:</b> {cls}</span><span><b>Stream:</b> {stream}</span></div>
   {loadingMarks?<p>Loading results…</p>:<>
    <h3>Table 1 — Learning Areas & Achievement</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>LEARNING AREA</th><th>EXAM / ASSESSMENT</th><th>MARKS</th><th>ACHIEVEMENT LEVEL</th><th>TEACHER REMARK</th></tr></thead><tbody>{marks.length?marks.map((m,i)=>{const p=m.max_marks?Number(m.marks)/Number(m.max_marks)*100:0;return <tr key={m.id}><td>{i+1}</td><td>{m.learning_areas?.name||'Learning area'}</td><td>{m.exams?.name||'—'}</td><td>{m.marks}/{m.max_marks}</td><td>{m.achievement_level||level(p)}</td><td>{m.remarks||'—'}</td></tr>}):<tr><td colSpan={6}>No marks entered yet.</td></tr>}</tbody></table></div>
    <h3>Table 2 — Core Competencies & Values</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>COMPETENCY / VALUE</th><th>LEVEL</th><th>TEACHER COMMENT</th></tr></thead><tbody>{competencies.map((x,i)=><tr key={x}><td>{i+1}</td><td>{x}</td><td>{overall}</td><td>Continue developing through classroom and practical activities.</td></tr>)}</tbody></table></div>
    <h3>Table 3 — Co-curricular & Learner Participation</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>#</th><th>AREA</th><th>PARTICIPATION</th><th>COMMENT</th></tr></thead><tbody>{participation.map((x,i)=><tr key={x}><td>{i+1}</td><td>{x}</td><td>Participating</td><td>Encouraged to participate consistently.</td></tr>)}</tbody></table></div>
    <div className="report-summary"><div><small>Total Marks</small><b>{total}</b></div><div><small>Average</small><b>{avg}%</b></div><div><small>Overall CBC Level</small><b>{overall}</b></div></div>
    <div className="cbc-scale"><b>CBC achievement scale:</b> Below Expectations · Approaching Expectations · Meeting Expectations · Exceeding Expectations</div>
    <div className="comments"><div><b>Class Teacher's Comment</b><p>________________________________________________________________________</p></div><div><b>Principal's Comment</b><p>________________________________________________________________________</p></div></div>
    <div className="signatures"><span>Class Teacher</span><span>Parent / Guardian</span><span>Principal</span></div>
   </>}
  </section>}
 </main>
}
