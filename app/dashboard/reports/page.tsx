'use client'
import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Student={id:string;admission_number:string;first_name:string;middle_name:string|null;last_name:string;gender:string|null;class_id:string|null;stream_id:string|null}
type Mark={id:string;marks:number;max_marks:number;achievement_level:string|null;remarks:string|null;learning_area_id:string;exams:{name:string;term_id:string|null}|null;learning_areas:{name:string}|null}

const level=(p:number)=>p>=80?'Exceeding Expectations':p>=60?'Meeting Expectations':p>=40?'Approaching Expectations':'Below Expectations'

export default function Page(){
 const [students,setStudents]=useState<Student[]>([]),[classes,setClasses]=useState<any[]>([]),[streams,setStreams]=useState<any[]>([]),[selected,setSelected]=useState(''),[marks,setMarks]=useState<Mark[]>([]),[loading,setLoading]=useState(true),[loadingMarks,setLoadingMarks]=useState(false),[search,setSearch]=useState('')
 useEffect(()=>{(async()=>{const s=createClient();const [st,cl,sm]=await Promise.all([s.from('students').select('id,admission_number,first_name,middle_name,last_name,gender,class_id,stream_id').eq('status','active').order('admission_number'),s.from('classes').select('id,name').order('name'),s.from('streams').select('id,name').order('name')]);setStudents((st.data||[]) as Student[]);setClasses(cl.data||[]);setStreams(sm.data||[]);setLoading(false)})()},[])
 useEffect(()=>{if(!selected){setMarks([]);return}(async()=>{setLoadingMarks(true);const {data}=await createClient().from('marks').select('id,marks,max_marks,achievement_level,remarks,learning_area_id,exams(name,term_id),learning_areas(name)').eq('student_id',selected).order('created_at');setMarks((data||[]) as any);setLoadingMarks(false)})()},[selected])
 const student=students.find(x=>x.id===selected); const cls=classes.find(x=>x.id===student?.class_id)?.name||''; const stream=streams.find(x=>x.id===student?.stream_id)?.name||''
 const filtered=students.filter(x=>`${x.admission_number} ${x.first_name} ${x.middle_name||''} ${x.last_name}`.toLowerCase().includes(search.toLowerCase())).slice(0,50)
 const total=marks.reduce((a,x)=>a+Number(x.marks||0),0), max=marks.reduce((a,x)=>a+Number(x.max_marks||0),0), avg=max?Math.round(total/max*100):0, overall=level(avg)
 const print=()=>window.print()
 return <main className="main">
  <header className="top"><div><h1>Reports Centre</h1><p className="muted">CBC report cards, class lists, merit lists and operational reports.</p></div></header>
  <section className="card no-print"><h2>Learner report card</h2><div className="form-grid">
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search admission number or student name" />
    <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select learner</option>{filtered.map(x=><option key={x.id} value={x.id}>{x.admission_number} — {x.first_name} {x.last_name}</option>)}</select>
  </div><p className="muted">Select a learner to generate the CBC report card. It can be printed or saved as PDF from the browser.</p></section>
  {selected && <section className="report-card" id="report-card">
    <div className="report-head"><img src="/aic-cathedral-logo.svg" alt="AIC Cathedral"/><div><h1>AIC CATHEDRAL PRIMARY SCHOOL</h1><p>P.O. Box 37, Gilgil — Education for Excellence</p><strong>CBC LEARNER REPORT FORM</strong></div></div>
    <div className="student-meta"><span><b>Name:</b> {student?.first_name} {student?.middle_name||''} {student?.last_name}</span><span><b>Admission No:</b> {student?.admission_number}</span><span><b>Class:</b> {cls}</span><span><b>Stream:</b> {stream}</span></div>
    {loadingMarks?<p>Loading results…</p>:<>
      <h3>Learning Areas</h3><table><thead><tr><th>#</th><th>LEARNING AREA</th><th>MARKS</th><th>GRADE</th><th>ACHIEVEMENT / REMARK</th></tr></thead><tbody>
       {marks.length?marks.map((m,i)=>{const p=m.max_marks?Number(m.marks)/Number(m.max_marks)*100:0;return <tr key={m.id}><td>{i+1}</td><td>{m.learning_areas?.name||'Learning area'}</td><td>{m.marks}/{m.max_marks}</td><td>{level(p)}</td><td>{m.remarks||level(p)}</td></tr>}):<tr><td colSpan={5}>No marks entered yet.</td></tr>}
      </tbody></table>
      <div className="report-summary"><div><small>Total Marks</small><b>{total}</b></div><div><small>Average</small><b>{avg}%</b></div><div><small>Overall CBC Level</small><b>{overall}</b></div></div>
      <div className="cbc-scale"><b>CBC achievement scale:</b> Below Expectations · Approaching Expectations · Meeting Expectations · Exceeding Expectations</div>
      <div className="comments"><div><b>Class Teacher's Comment</b><p>________________________________________________________________________</p></div><div><b>Principal's Comment</b><p>________________________________________________________________________</p></div></div>
      <div className="signatures"><span>Class Teacher</span><span>Parent / Guardian</span><span>Principal</span></div>
    </>}
  </section>}
  <section className="card no-print" style={{marginTop:18}}><h2>Print</h2><button className="btn" onClick={print} disabled={!selected}>Print report card</button></section>
  <style jsx>{`@media print{.no-print{display:none!important}.main{padding:0!important;background:white!important}.report-card{box-shadow:none!important;border:0!important;margin:0!important;max-width:none!important}} .report-card{background:white;border:1px solid #dfe5ee;border-radius:14px;padding:28px;max-width:900px;margin:18px auto;box-shadow:0 10px 30px rgba(15,45,85,.08)}.report-head{display:flex;align-items:center;gap:20px;border-bottom:2px solid #0b3f78;padding-bottom:16px}.report-head img{width:76px;height:76px;object-fit:contain}.report-head h1{margin:0;color:#12385d;font-size:20px}.report-head p{margin:4px 0;color:#667085}.report-head strong{color:#12385d}.student-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:16px 0}.report-card table{width:100%;border-collapse:collapse}.report-card th{background:#12385d;color:white;text-align:left;padding:9px;font-size:12px}.report-card td{border-bottom:1px solid #e8ecf2;padding:9px;font-size:13px}.report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.report-summary div{border:1px solid #e4e8ef;border-radius:8px;padding:12px;text-align:center}.report-summary small,.report-summary b{display:block}.cbc-scale{margin-top:14px;padding:12px;background:#f3f6fa;font-size:12px}.comments{margin-top:18px;display:grid;gap:12px}.comments p{color:#8a94a6}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-top:40px;text-align:center;border-top:1px solid #aaa;padding-top:8px;font-size:12px}@media(max-width:650px){.student-meta,.report-summary,.signatures{grid-template-columns:1fr}.report-card{padding:15px}.report-head h1{font-size:15px}.report-card table{font-size:11px}.report-card th,.report-card td{padding:6px}}`}</style>
 </main>
}
