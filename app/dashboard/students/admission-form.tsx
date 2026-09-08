'use client'
import {useMemo,useState} from 'react'
import {addStudent} from './actions'

type ClassOption={id:string;name:string;level:string|null}
type StreamOption={id:string;class_id:string;name:string}

export default function AdmissionForm({classes,streams}:{classes:ClassOption[];streams:StreamOption[]}){
 const [classId,setClassId]=useState('')
 const availableStreams=useMemo(()=>streams.filter(x=>x.class_id===classId),[streams,classId])
 return <form action={addStudent} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:16}}>
  <input name="admission_number" placeholder="Admission No." required/><input name="first_name" placeholder="First name" required/><input name="middle_name" placeholder="Middle name"/><input name="last_name" placeholder="Last name" required/>
  <select name="gender" required><option value="">Gender</option><option>Male</option><option>Female</option></select><input name="date_of_birth" type="date" aria-label="Date of birth"/>
  <select name="class_id" value={classId} onChange={e=>setClassId(e.target.value)} required><option value="">Grade / Class</option>{classes.map(c=><option value={c.id} key={c.id}>{c.name}{c.level?` — ${c.level}`:''}</option>)}</select>
  <select name="stream_id" disabled={!classId}><option value="">{classId?'Stream':'Select Grade / Class first'}</option>{availableStreams.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select>
  <input name="previous_school" placeholder="Previous school"/><input name="birth_certificate_no" placeholder="Birth certificate No."/>
  <input name="nationality" placeholder="Nationality" defaultValue="Kenyan"/><input name="county" placeholder="County"/><input name="address" placeholder="Home address"/>
  <select name="blood_group"><option value="">Blood group</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x=><option key={x}>{x}</option>)}</select>
  <input name="medical_conditions" placeholder="Medical information / special needs (if any)"/>
  <input name="emergency_contact_name" placeholder="Emergency contact name"/><input name="emergency_contact_phone" placeholder="Emergency contact phone"/><input name="emergency_contact_relationship" placeholder="Emergency relationship"/>
  <div style={{gridColumn:'1/-1',borderTop:'1px solid #e5e7eb',paddingTop:14,marginTop:4}}><h3>Primary parent / guardian</h3></div>
  <input name="parent_name" placeholder="Parent / guardian full name" required/><input name="parent_phone" placeholder="Parent phone" required/><input name="parent_email" type="email" placeholder="Parent email"/><input name="parent_occupation" placeholder="Occupation"/><input name="parent_id_number" placeholder="National ID / document No."/><input name="parent_relationship" placeholder="Relationship e.g. Mother" defaultValue="Parent" required/>
  <div style={{gridColumn:'1/-1',borderTop:'1px solid #e5e7eb',paddingTop:14,marginTop:4}}><h3>Second parent / guardian (optional)</h3></div>
  <input name="parent2_name" placeholder="Second guardian full name"/><input name="parent2_phone" placeholder="Second guardian phone"/><input name="parent2_email" type="email" placeholder="Second guardian email"/><input name="parent2_occupation" placeholder="Occupation"/><input name="parent2_relationship" placeholder="Relationship"/>
  <div style={{gridColumn:'1/-1'}}><button className="btn">Add complete student record</button></div>
 </form>
}
