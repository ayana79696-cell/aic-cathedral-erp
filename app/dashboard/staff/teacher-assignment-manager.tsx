'use client'
import {useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Opt={id:string;name:string;label?:string;class_id?:string;profile_id?:string|null}
type Assignment={id:string;teacher_id:string;class_id:string;stream_id:string|null;learning_area_id:string;academic_year_id:string;term_id:string|null;active:boolean}

type Props={staff:Opt[];classes:Opt[];streams:Opt[];learningAreas:Opt[];years:Opt[];terms:Opt[];initial:Assignment[]}

export default function TeacherAssignmentManager({staff,classes,streams,learningAreas,years,terms,initial}:Props){
 const s=createClient(); const [rows,setRows]=useState(initial); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 const currentYear=years[0]?.id||''
 const [form,setForm]=useState({teacher_id:'',class_id:'',stream_id:'',learning_area_id:'',academic_year_id:currentYear,term_id:''})
 const availableStreams=useMemo(()=>streams.filter(x=>x.class_id===form.class_id),[streams,form.class_id])
 const yearTerms=useMemo(()=>terms.filter(x=>x.class_id===undefined || x.class_id===form.academic_year_id),[terms,form.academic_year_id])
 const label=(list:Opt[],id:string)=>list.find(x=>x.id===id)?.label||list.find(x=>x.id===id)?.name||id
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form.teacher_id||!form.class_id||!form.learning_area_id||!form.academic_year_id){setMsg('Select teacher, class, learning area and academic year.');return}setBusy(true);setMsg('');const payload={teacher_id:form.teacher_id,class_id:form.class_id,stream_id:form.stream_id||null,learning_area_id:form.learning_area_id,academic_year_id:form.academic_year_id,term_id:form.term_id||null,active:true};const {data,error}=await s.from('teacher_assignments').insert(payload).select('id,teacher_id,class_id,stream_id,learning_area_id,academic_year_id,term_id,active').single();if(error)setMsg(error.message);else{setRows([...(rows||[]),data]);setForm({...form,teacher_id:'',class_id:'',stream_id:'',learning_area_id:'',term_id:''});setMsg('Teacher assignment saved.')}setBusy(false)}
 const remove=async(id:string)=>{if(!confirm('Remove this teacher assignment?'))return;const{error}=await s.from('teacher_assignments').delete().eq('id',id);if(error)setMsg(error.message);else{setRows(rows.filter(x=>x.id!==id));setMsg('Assignment removed.')}}
 return <section className="card" style={{marginTop:16}}><h2>Teacher subject & class assignments</h2><p className="muted">Assign each teacher to the class, stream and learning area they are allowed to assess. A blank stream means all streams in that class.</p><form onSubmit={save} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginTop:14}}>
  <select value={form.teacher_id} onChange={e=>setForm({...form,teacher_id:e.target.value})} required><option value="">Select teacher</option>{staff.map(x=><option key={x.id} value={x.id}>{x.name}{x.label?` — ${x.label}`:''}</option>)}</select>
  <select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value,stream_id:''})} required><option value="">Select class</option>{classes.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={form.stream_id} onChange={e=>setForm({...form,stream_id:e.target.value})}><option value="">All streams</option>{availableStreams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={form.learning_area_id} onChange={e=>setForm({...form,learning_area_id:e.target.value})} required><option value="">Select learning area</option>{learningAreas.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={form.academic_year_id} onChange={e=>setForm({...form,academic_year_id:e.target.value,term_id:''})} required><option value="">Academic year</option>{years.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <select value={form.term_id} onChange={e=>setForm({...form,term_id:e.target.value})}><option value="">All terms</option>{yearTerms.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  <button className="btn" disabled={busy}>{busy?'Saving…':'Assign teacher'}</button>
 </form>{msg&&<p style={{color:msg.includes('saved')||msg.includes('removed')?'#18794e':'#b42318',fontSize:13}}>{msg}</p>}
 <div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Teacher','Class','Stream','Learning area','Academic year','Term','Action'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map(x=><tr key={x.id}><td style={{padding:10}}>{label(staff,x.teacher_id)}</td><td style={{padding:10}}>{label(classes,x.class_id)}</td><td style={{padding:10}}>{x.stream_id?label(streams,x.stream_id):'All streams'}</td><td style={{padding:10}}>{label(learningAreas,x.learning_area_id)}</td><td style={{padding:10}}>{label(years,x.academic_year_id)}</td><td style={{padding:10}}>{x.term_id?label(terms,x.term_id):'All terms'}</td><td style={{padding:10}}><button type="button" onClick={()=>remove(x.id)} style={{background:'transparent',border:0,color:'#b42318',cursor:'pointer'}}>Remove</button></td></tr>):<tr><td colSpan={7} className="muted" style={{padding:28,textAlign:'center'}}>No teacher assignments yet.</td></tr>}</tbody></table></div>
 </section>
}
