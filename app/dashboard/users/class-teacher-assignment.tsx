'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Props={teacherId:string;compact?:boolean}
export default function ClassTeacherAssignment({teacherId,compact=false}:Props){
 const db=createClient(); const [classes,setClasses]=useState<any[]>([]),[streams,setStreams]=useState<any[]>([]),[years,setYears]=useState<any[]>([]),[terms,setTerms]=useState<any[]>([])
 const [classId,setClassId]=useState(''),[streamId,setStreamId]=useState(''),[yearId,setYearId]=useState(''),[termId,setTermId]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{(async()=>{
   const [c,s,y,t,a]=await Promise.all([
    db.from('classes').select('id,name,level').order('level').order('name'),
    db.from('streams').select('id,class_id,name').order('name'),
    db.from('academic_years').select('id,year,is_current,status').order('year',{ascending:false}),
    db.from('terms').select('id,name,academic_year_id,is_current,status').order('name'),
    db.from('class_teacher_assignments').select('class_id,stream_id,academic_year_id,term_id,active').eq('teacher_id',teacherId).eq('active',true).limit(1).maybeSingle()
   ]); setClasses(c.data||[]);setStreams(s.data||[]);setYears(y.data||[]);setTerms(t.data||[])
   if(a.data){setClassId(a.data.class_id||'');setStreamId(a.data.stream_id||'');setYearId(a.data.academic_year_id||'');setTermId(a.data.term_id||'')}
   else {const cy=(y.data||[]).find((x:any)=>x.is_current)||y.data?.[0];setYearId(cy?.id||'');const ct=(t.data||[]).find((x:any)=>x.is_current&&x.academic_year_id===cy?.id)|| (t.data||[]).find((x:any)=>x.academic_year_id===cy?.id);setTermId(ct?.id||'')}
 })()},[teacherId])
 const availableStreams=useMemo(()=>streams.filter(s=>s.class_id===classId),[streams,classId])
 useEffect(()=>{if(streamId&&!availableStreams.some(s=>s.id===streamId))setStreamId('')},[classId,availableStreams,streamId])
 async function save(){if(!classId||!yearId){setStatus('Select a class and academic year.');return}setBusy(true);setStatus('')
   const {error:offError}=await db.from('class_teacher_assignments').update({active:false,updated_at:new Date().toISOString()}).eq('teacher_id',teacherId).eq('active',true)
   if(offError){setStatus(offError.message);setBusy(false);return}
   const {error}=await db.from('class_teacher_assignments').insert({teacher_id:teacherId,class_id:classId,stream_id:streamId||null,academic_year_id:yearId,term_id:termId||null,active:true})
   if(error)setStatus(error.message);else setStatus('Class teacher assignment saved successfully.')
   setBusy(false)
 }
 const cls=classes.find(c=>c.id===classId),st=availableStreams.find(s=>s.id===streamId),yr=years.find(y=>y.id===yearId),tm=terms.find(t=>t.id===termId)
 return <section className="card" style={{marginTop:12,padding:compact?12:16}}><h3 style={{marginTop:0}}>Class Teacher Assignment</h3><p className="muted" style={{fontSize:13}}>Select the class and stream this teacher is responsible for. The assignment controls the teacher's class records and can be changed by the Super Admin.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
   <select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Select class / grade</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}{c.level&&c.level!==c.name?` — ${c.level}`:''}</option>)}</select>
   <select value={streamId} onChange={e=>setStreamId(e.target.value)} disabled={!classId}><option value="">Select stream</option>{availableStreams.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <select value={yearId} onChange={e=>{setYearId(e.target.value);setTermId('')}}><option value="">Academic year</option>{years.map(y=><option key={y.id} value={y.id}>{y.year}{y.is_current?' (Current)':''}</option>)}</select>
   <select value={termId} onChange={e=>setTermId(e.target.value)} disabled={!yearId}><option value="">Term</option>{terms.filter(t=>t.academic_year_id===yearId).map(t=><option key={t.id} value={t.id}>{t.name}{t.is_current?' (Current)':''}</option>)}</select>
 </div><button className="btn" type="button" disabled={busy} onClick={save} style={{marginTop:12}}>{busy?'Saving…':'Save class assignment'}</button>{status&&<p style={{fontWeight:700,color:status.includes('successfully')?'#18794e':'#b42318',marginBottom:0}}>{status}</p>}
 {classId&&<p style={{fontSize:12,marginBottom:0}}><b>Assigned:</b> {cls?.name||'—'}{st?` · ${st.name}`:''}{yr?` · ${yr.year}`:''}{tm?` · ${tm.name}`:''}</p>}
 </section>
}
