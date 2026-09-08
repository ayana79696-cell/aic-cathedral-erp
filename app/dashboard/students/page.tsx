import { createClient } from '../../../lib/supabase/server'
import { addStudent } from './actions'

export default async function Students(){
 const s=await createClient()
 const [{data:students},{data:classes},{data:streams}]=await Promise.all([
  s.from('students').select('id,portal_code,admission_number,first_name,middle_name,last_name,gender,date_of_birth,class_id,stream_id,blood_group,medical_conditions,disability_special_needs,status').order('last_name'),
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
   <form action={addStudent} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:16}}>
    <input name="admission_number" placeholder="Admission No." required/><input name="first_name" placeholder="First name" required/><input name="middle_name" placeholder="Middle name"/><input name="last_name" placeholder="Last name" required/>
    <select name="gender" required><option value="">Gender</option><option>Male</option><option>Female</option></select><input name="date_of_birth" type="date" aria-label="Date of birth"/>
    <select name="class_id" required><option value="">Grade / Class</option>{(classes||[]).map(c=><option value={c.id} key={c.id}>{c.name}{c.level?` — ${c.level}`:''}</option>)}</select>
    <select name="stream_id"><option value="">Stream</option>{(streams||[]).map(x=><option value={x.id} key={x.id}>{classMap.get(x.class_id)||'Class'} — {x.name}</option>)}</select>
    <input name="previous_school" placeholder="Previous school"/><input name="birth_certificate_no" placeholder="Birth certificate No."/>
    <input name="nationality" placeholder="Nationality" defaultValue="Kenyan"/><input name="county" placeholder="County"/><input name="address" placeholder="Home address"/>
    <select name="blood_group"><option value="">Blood group</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x=><option key={x}>{x}</option>)}</select>
    <input name="allergies" placeholder="Allergies (if any)"/><input name="medical_conditions" placeholder="Medical condition / disease (if any)"/><input name="disability_special_needs" placeholder="Disability / special needs"/><input name="medication_notes" placeholder="Medication / medical notes"/>
    <input name="emergency_contact_name" placeholder="Emergency contact name"/><input name="emergency_contact_phone" placeholder="Emergency contact phone"/><input name="emergency_contact_relationship" placeholder="Emergency relationship"/>
    <div style={{gridColumn:'1/-1',borderTop:'1px solid #e5e7eb',paddingTop:14,marginTop:4}}><h3>Primary parent / guardian</h3></div>
    <input name="parent_name" placeholder="Parent / guardian full name" required/><input name="parent_phone" placeholder="Parent phone" required/><input name="parent_email" type="email" placeholder="Parent email"/><input name="parent_occupation" placeholder="Occupation"/><input name="parent_id_number" placeholder="National ID / document No."/><input name="parent_relationship" placeholder="Relationship e.g. Mother" defaultValue="Parent" required/>
    <div style={{gridColumn:'1/-1',borderTop:'1px solid #e5e7eb',paddingTop:14,marginTop:4}}><h3>Second parent / guardian (optional)</h3></div>
    <input name="parent2_name" placeholder="Second guardian full name"/><input name="parent2_phone" placeholder="Second guardian phone"/><input name="parent2_email" type="email" placeholder="Second guardian email"/><input name="parent2_occupation" placeholder="Occupation"/><input name="parent2_relationship" placeholder="Relationship"/>
    <div style={{gridColumn:'1/-1'}}><button className="btn">Add complete student record</button></div>
   </form>
  </section>
  <section className="card" style={{marginTop:16}}><h2>Student register</h2><p className="muted">The portal code is safe to give to the child's parent after the parent account is activated.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Portal Code','Admission','Student','Grade','Stream','Blood','Medical / needs','Status'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{students?.length?students.map(x=><tr key={x.id}><td style={{padding:10,fontWeight:700,color:'#0757a6',whiteSpace:'nowrap'}}>{x.portal_code||'Generating…'}</td><td style={{padding:10}}>{x.admission_number}</td><td style={{padding:10}}>{x.first_name} {x.middle_name||''} {x.last_name}</td><td style={{padding:10}}>{classMap.get(x.class_id)||'—'}</td><td style={{padding:10}}>{streamMap.get(x.stream_id)||'—'}</td><td style={{padding:10}}>{x.blood_group||'—'}</td><td style={{padding:10}}>{x.medical_conditions||x.disability_special_needs||'None recorded'}</td><td style={{padding:10}}>{x.status}</td></tr>):<tr><td colSpan={8} style={{padding:35,textAlign:'center'}} className="muted">No students yet.</td></tr>}</tbody></table></div></section>
 </main>
}