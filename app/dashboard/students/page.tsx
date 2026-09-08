import { createClient } from '../../../lib/supabase/server'
import AdmissionForm from './admission-form'

export default async function Students(){
 const s=await createClient()
 const [{data:students},{data:classes},{data:streams}]=await Promise.all([
  s.from('students').select('id,portal_code,admission_number,first_name,middle_name,last_name,gender,date_of_birth,class_id,stream_id,blood_group,medical_conditions,status').order('last_name'),
  s.from('classes').select('id,name,level').eq('status','active').order('name'),
  s.from('streams').select('id,class_id,name').eq('status','active').order('name')
 ])
 const classMap=new Map((classes||[]).map(c=>[c.id,c.name]))
 const streamMap=new Map((streams||[]).map(x=>[x.id,x.name]))
 return <main className="main">
  <header className="top"><div><h1>Students</h1><p className="muted">Complete learner admission, guardian, class/stream, health and parent-portal records.</p></div></header>
  <section className="card">
   <h2>New student admission</h2>
   <p className="muted">Capture the learner's school, guardian, emergency and medical information in one record. A unique Parent Portal Code is generated automatically after saving.</p>
   <AdmissionForm classes={classes||[]}/>
  </section>
  <section className="card" style={{marginTop:16}}><h2>Student register</h2><p className="muted">The portal code is safe to give to the child's parent after the parent account is activated.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Portal Code','Admission','Student','Grade','Stream','Blood','Medical / needs','Status'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{students?.length?students.map(x=><tr key={x.id}><td style={{padding:10,fontWeight:700,color:'#0757a6',whiteSpace:'nowrap'}}>{x.portal_code||'Generating…'}</td><td style={{padding:10}}>{x.admission_number}</td><td style={{padding:10}}>{x.first_name} {x.middle_name||''} {x.last_name}</td><td style={{padding:10}}>{classMap.get(x.class_id)||'—'}</td><td style={{padding:10}}>{streamMap.get(x.stream_id)||'—'}</td><td style={{padding:10}}>{x.blood_group||'—'}</td><td style={{padding:10}}>{x.medical_conditions||'None recorded'}</td><td style={{padding:10}}>{x.status}</td></tr>):<tr><td colSpan={8} style={{padding:35,textAlign:'center'}} className="muted">No students yet.</td></tr>}</tbody></table></div></section>
 </main>
}
