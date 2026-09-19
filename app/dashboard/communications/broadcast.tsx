'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

type Parent={id:string;name:string;phone?:string|null;email?:string|null;status?:string|null}
type Student={
 id:string;first_name:string;last_name:string;admission_number?:string|null;class_id:string|null;stream_id:string|null;
 classes?:{name?:string}[]|null;streams?:{name?:string}[]|null;
 student_parents?:{parent_id:string;relationship?:string|null;primary_guardian?:boolean;parents?:Parent[]|null}[]
}
type ParentContact=Parent&{studentId:string;student:string;grade:string;stream:string;relationship:string;primary:boolean}
type Staff={id:string;profile_id?:string|null;employee_number?:string|null;first_name:string;middle_name?:string|null;last_name:string;phone?:string|null;email?:string|null;department?:string|null;job_title?:string|null;employment_type?:string|null;status?:string|null;role?:string|null}
type Recipient=ParentContact&{recipientType:'parent'}|({id:string;name:string;phone:string;email?:string|null;studentId:string;student:string;grade:string;stream:string;relationship:string;primary:boolean;recipientType:'staff';job_title?:string|null;department?:string|null})

type ApiConfig={api_base_url:string;sender_name:string;sender_id:string;enabled:boolean}
const templates=[
 ['Fee Reminder','SMS',"Dear parent, your child's fee balance is {balance}. Kindly clear by {date}. AIC Cathedral."],
 ['Fee Hold Notice','SMS','Dear parent, {student} has been placed on fee hold. Kindly contact the office. AIC Cathedral.'],
 ['Transport Delay','SMS','Dear parent, {bus} is delayed by {minutes} minutes due to {reason}. AIC Cathedral.'],
 ['Exam Results','Email',"Dear parent, {student}'s end-term results are now available. Log in to view. AIC Cathedral."]
]

export default function Broadcast(){
 const db=createClient()
 const[tab,setTab]=useState<'send'|'templates'|'integrations'>('send')
 const[contactSection,setContactSection]=useState<'parents'|'staff'>('parents')
 const[students,setStudents]=useState<Student[]>([])
 const[staff,setStaff]=useState<Staff[]>([])
 const[channel,setChannel]=useState('sms')
 const[message,setMessage]=useState('Dear parent, this is a reminder about the upcoming PTA meeting on 12th June 2026 at the school hall. AIC Cathedral.')
 const[subject,setSubject]=useState('')
 const[status,setStatus]=useState('')
 const[api,setApi]=useState<ApiConfig>({api_base_url:'https://graph.facebook.com/v23.0',sender_name:'AIC Cathedral',sender_id:'',enabled:false})
 const[channels,setChannels]=useState({sms:true,whatsapp:true,email:true,inApp:false})
 const[saving,setSaving]=useState(false)
 const[gradeFilter,setGradeFilter]=useState('all')
 const[streamFilter,setStreamFilter]=useState('all')
 const[studentSearch,setStudentSearch]=useState('')
 const[selectedStudentIds,setSelectedStudentIds]=useState<string[]>([])
 const[selectedStaffIds,setSelectedStaffIds]=useState<string[]>([])
 
 async function loadContacts(){
  const[{data:studentData,error:studentError},{data:staffData,error:staffError}]=await Promise.all([
   db.from('students').select('id,first_name,last_name,admission_number,class_id,stream_id,classes(name),streams(name),student_parents(parent_id,relationship,primary_guardian,parents(id,name,phone,email,status))').eq('status','active').order('first_name'),
   db.from('staff').select('id,profile_id,employee_number,first_name,middle_name,last_name,phone,email,department,job_title,employment_type,status').eq('status','active').order('first_name')
  ])
  if(studentError)setStatus(studentError.message)
  else setStudents((studentData||[]) as unknown as Student[])
  if(staffError)setStatus(staffError.message)
  else setStaff((staffData||[]) as Staff[])
 }
 useEffect(()=>{void loadContacts();(async()=>{const{data:settings}=await db.from('communication_settings').select('api_base_url,sender_name,sender_id,enabled').eq('provider','whatsapp').maybeSingle();if(settings)setApi(settings as ApiConfig);try{const saved=localStorage.getItem('aic-communication-channels');if(saved)setChannels(JSON.parse(saved))}catch{}})()},[])
 
 const grades=useMemo(()=>Array.from(new Set(students.map(s=>s.classes?.[0]?.name).filter(Boolean) as string[])).sort(),[students])
 const streams=useMemo(()=>Array.from(new Set(students.map(s=>s.streams?.[0]?.name).filter(Boolean) as string[])).sort(),[students])
 const visibleStudents=useMemo(()=>students.filter(s=>{
  const g=s.classes?.[0]?.name||'';const st=s.streams?.[0]?.name||'';const q=studentSearch.toLowerCase()
  return(gradeFilter==='all'||g===gradeFilter)&&(streamFilter==='all'||st===streamFilter)&&(!q||((s.first_name+' '+s.last_name+' '+(s.admission_number||'')).toLowerCase().includes(q)))
 }),[students,gradeFilter,streamFilter,studentSearch])
 const parentContacts=useMemo<ParentContact[]>(()=>students.flatMap(s=>(s.student_parents||[]).map(link=>{
  const p=Array.isArray(link.parents)?link.parents[0]:link.parents
  if(!p||!p.phone||String(p.status||'active')!=='active')return null
  return {...p,studentId:s.id,student:[s.first_name,s.last_name].filter(Boolean).join(' '),grade:s.classes?.[0]?.name||'Unassigned',stream:s.streams?.[0]?.name||'Unassigned',relationship:link.relationship||'Parent/Guardian',primary:!!link.primary_guardian,recipientType:'parent' as const}
 }).filter((x):x is ParentContact=>!!x)),[students])
 const filteredParentContacts=useMemo(()=>parentContacts.filter(p=>(gradeFilter==='all'||p.grade===gradeFilter)&&(streamFilter==='all'||p.stream===streamFilter)&&(!studentSearch||[p.student,p.name,p.phone,p.grade,p.stream].join(' ').toLowerCase().includes(studentSearch.toLowerCase()))),[parentContacts,gradeFilter,streamFilter,studentSearch])
 const selectedParentContacts=useMemo(()=>parentContacts.filter(p=>selectedStudentIds.includes(p.studentId)),[parentContacts,selectedStudentIds])
 const selectedStaff=useMemo(()=>staff.filter(s=>selectedStaffIds.includes(s.id)&&s.phone).map(s=>({id:s.id,name:[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' '),phone:s.phone!,email:s.email||null,studentId:s.id,student:'Staff',grade:'Staff',stream:s.department||'General',relationship:s.job_title||'Staff',primary:true,recipientType:'staff' as const,job_title:s.job_title,department:s.department})),[staff,selectedStaffIds])
 const recipients=contactSection==='parents'?selectedParentContacts:selectedStaff
 const recipientTotal=useMemo(()=>{const seen=new Set<string>();return recipients.filter(r=>{const k=r.phone||r.id;if(seen.has(k))return false;seen.add(k);return true})},[recipients])
 const groupedParents=useMemo(()=>{const groups:Record<string,Record<string,ParentContact[]>>={};for(const p of filteredParentContacts){(groups[p.grade] ||= {});(groups[p.grade][p.stream] ||= []).push(p)}return groups},[filteredParentContacts])
 
 function toggleStudent(id:string){setSelectedStudentIds(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 function toggleStaff(id:string){setSelectedStaffIds(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 function toggleVisibleStudents(){const ids=visibleStudents.map(s=>s.id);const all=ids.length>0&&ids.every(id=>selectedStudentIds.includes(id));setSelectedStudentIds(v=>all?v.filter(id=>!ids.includes(id)):Array.from(new Set([...v,...ids])))}
 function toggleAllStaff(){const ids=staff.map(s=>s.id);const all=ids.length>0&&ids.every(id=>selectedStaffIds.includes(id));setSelectedStaffIds(all?[]:ids)}
 
 async function send(){
  if(!message.trim()){setStatus('Enter a message first.');return}
  if(channel==='sms'&&recipientTotal.length>100){setStatus('SMS broadcasts are limited to 100 recipients per send.');return}
  if(!recipientTotal.length){setStatus('Select at least one recipient.');return}
  setSaving(true)
  const{data:user}=await db.auth.getUser()
  const audience=contactSection==='parents'?'selected parents':'selected staff/teachers'
  const{data:b,error}=await db.from('message_broadcasts').insert({title:subject||'School broadcast',message,channel,audience,status:channel==='sms'?'phone_pending':'ready',created_by:user.user?.id||null}).select('id').single()
  if(error||!b){setStatus(error?.message||'Could not create broadcast.');setSaving(false);return}
  const{error:re}=await db.from('message_recipients').insert(recipientTotal.map(p=>({broadcast_id:b.id,parent_id:p.recipientType==='parent'?p.id:null,phone:p.phone||null,email:p.email||null,channel,status:channel==='sms'?'phone_pending':'pending'})))
  if(re){setStatus(re.message);setSaving(false);return}
  if(channel==='whatsapp'&&api.enabled){const{data:r,error:e}=await db.functions.invoke('send-whatsapp-broadcast',{body:{broadcast_id:b.id}});setStatus(e?.message||r?.error||('WhatsApp broadcast sent: '+(r?.sent||0)+' sent, '+(r?.failed||0)+' failed.'))}
  else if(channel==='sms')setStatus('SMS queued for the school phone: '+recipientTotal.length+' recipient(s). Keep AIC School Messenger open on the Android phone.')
  else setStatus('Broadcast created for '+recipientTotal.length+' recipient(s).')
  setSaving(false)
 }
 async function saveIntegrations(){
  localStorage.setItem('aic-communication-channels',JSON.stringify(channels))
  const{error}=await db.from('communication_settings').upsert({provider:'whatsapp',api_base_url:api.api_base_url,sender_name:api.sender_name,sender_id:api.sender_id,enabled:api.enabled},{onConflict:'provider'})
  setStatus(error?.message||'Integration settings saved.')
 }
 return <>
  <section className="prototype-module">
   <header className="prototype-module-header"><div><h1>Communications</h1><p>Automatic parent and staff/teacher contact directory with SMS, WhatsApp, email and in-app messaging.</p></div><button className="prototype-primary-button" onClick={()=>{setTab('send');void loadContacts()}}>↻ Refresh Contacts</button></header>
   <section className="prototype-kpis">
    <div className="prototype-kpi navy"><div className="prototype-kpi-icon">▯</div><div><div className="prototype-kpi-label">Parent phone contacts</div><div className="prototype-kpi-value">{parentContacts.length}</div><div className="prototype-kpi-note">Active linked parents</div></div></div>
    <div className="prototype-kpi green"><div className="prototype-kpi-icon">♙</div><div><div className="prototype-kpi-label">Staff / Teachers</div><div className="prototype-kpi-value">{staff.length}</div><div className="prototype-kpi-note">Active staff records</div></div></div>
    <div className="prototype-kpi blue"><div className="prototype-kpi-icon">▣</div><div><div className="prototype-kpi-label">Students</div><div className="prototype-kpi-value">{students.length}</div><div className="prototype-kpi-note">Active learners</div></div></div>
    <div className="prototype-kpi"><div className="prototype-kpi-icon">✉</div><div><div className="prototype-kpi-label">Selected recipients</div><div className="prototype-kpi-value">{recipientTotal.length}</div><div className="prototype-kpi-note">Current message</div></div></div>
   </section>
   <nav className="prototype-tabs"><button className={tab==='send'?'active':''} onClick={()=>setTab('send')}>Send Message</button><button className={tab==='templates'?'active':''} onClick={()=>setTab('templates')}>Templates</button><button className={tab==='integrations'?'active':''} onClick={()=>setTab('integrations')}>Integrations & API</button></nav>
   {tab==='send'&&<section className="prototype-panel">
    <div className="prototype-panel-head"><div><h2>Contact Directory</h2><p className="muted">Parent phone numbers come directly from the parent/guardian details captured during student admission. New admissions appear automatically after refresh.</p></div></div>
    <div className="prototype-panel-body">
     <div style={{display:'flex',gap:8,marginBottom:15,flexWrap:'wrap'}}>
      <button type="button" className={contactSection==='parents'?'prototype-primary-button':'prototype-secondary-button'} onClick={()=>setContactSection('parents')}>Parents</button>
      <button type="button" className={contactSection==='staff'?'prototype-primary-button':'prototype-secondary-button'} onClick={()=>setContactSection('staff')}>Staff / Teachers</button>
     </div>
     {contactSection==='parents'&&<div>
      <div className="prototype-section-title">Parent Contacts — arranged by Grade and Stream</div>
      <div className="prototype-form-grid" style={{marginTop:8}}>
       <div><label>Grade</label><select value={gradeFilter} onChange={e=>{setGradeFilter(e.target.value);setSelectedStudentIds([])}}><option value="all">All Grades</option>{grades.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
       <div><label>Stream</label><select value={streamFilter} onChange={e=>{setStreamFilter(e.target.value);setSelectedStudentIds([])}}><option value="all">All Streams</option>{streams.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
       <div style={{gridColumn:'1/-1'}}><label>Search student / parent / phone</label><input value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} placeholder="Search by learner, parent or phone"/></div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',margin:'12px 0',flexWrap:'wrap'}}><span className="prototype-kpi-note"><b>{filteredParentContacts.length}</b> parent contact records · <b>{selectedStudentIds.length}</b> students selected</span><button type="button" className="prototype-secondary-button" onClick={toggleVisibleStudents}>{visibleStudents.length&&visibleStudents.every(s=>selectedStudentIds.includes(s.id))?'Clear Visible Students':'Select Visible Students'}</button></div>
      <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>GRADE</th><th>STREAM</th><th>STUDENT</th><th>PARENT / GUARDIAN</th><th>RELATIONSHIP</th><th>PHONE NUMBER</th><th>PRIMARY</th><th>SELECT</th></tr></thead><tbody>
       {Object.entries(groupedParents).map(([grade,streamsInGrade])=><>{<tr key={grade} style={{background:'#f5f7fa'}}><td colSpan={8}><strong>{grade}</strong> <span className="muted">· {Object.values(streamsInGrade).reduce((n,items)=>n+items.length,0)} contact(s)</span></td></tr>}{Object.entries(streamsInGrade).map(([stream,items])=><>{<tr key={grade+'-'+stream} style={{background:'#fbfcfe'}}><td colSpan={8}><strong>{stream}</strong> <span className="muted">· {items.length} contact(s)</span></td></tr>}{items.map(p=><tr key={p.studentId+'-'+p.id+'-'+p.relationship}><td>{p.grade}</td><td>{p.stream}</td><td><strong>{p.student}</strong><br/><small>{students.find(s=>s.id===p.studentId)?.admission_number||'—'}</small></td><td>{p.name}</td><td>{p.relationship}</td><td><strong>{p.phone}</strong></td><td>{p.primary?'Yes':'No'}</td><td><input type="checkbox" checked={selectedStudentIds.includes(p.studentId)} onChange={()=>toggleStudent(p.studentId)}/></td></tr>)}</>)}</>)}
       {!filteredParentContacts.length&&<tr><td colSpan={8} className="prototype-empty">No active parent phone numbers found for the selected Grade / Stream.</td></tr>}
      </tbody></table></div>
      <div className="prototype-note" style={{marginTop:10}}>Every active parent/guardian phone stored during admission is shown here. The primary parent is marked automatically, but second parent/guardian numbers are also displayed.</div>
     </div>}
     {contactSection==='staff'&&<div>
      <div className="prototype-section-title">Staff / Teachers</div>
      <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',margin:'10px 0',flexWrap:'wrap'}}><span className="prototype-kpi-note"><b>{staff.length}</b> active staff/teacher records · <b>{selectedStaffIds.length}</b> selected</span><button type="button" className="prototype-secondary-button" onClick={toggleAllStaff}>{staff.length&&staff.every(s=>selectedStaffIds.includes(s.id))?'Clear All':'Select All Staff / Teachers'}</button></div>
      <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>NAME</th><th>ROLE / JOB TITLE</th><th>DEPARTMENT</th><th>PHONE NUMBER</th><th>EMAIL</th><th>STATUS</th><th>SELECT</th></tr></thead><tbody>{staff.map(s=><tr key={s.id}><td><strong>{[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' ')}</strong><br/><small>{s.employee_number||'—'}</small></td><td>{s.job_title||'Staff'} </td><td>{s.department||'—'}</td><td>{s.phone?<strong>{s.phone}</strong>:'No phone number'}</td><td>{s.email||'—'}</td><td>{s.status||'active'}</td><td><input type="checkbox" checked={selectedStaffIds.includes(s.id)} onChange={()=>toggleStaff(s.id)} disabled={!s.phone}/></td></tr>)}{!staff.length&&<tr><td colSpan={7} className="prototype-empty">No active staff records found.</td></tr>}</tbody></table></div>
      <div className="prototype-note" style={{marginTop:10}}>This section reads the same Staff records used by the ERP. Teachers with Class Teacher or Subject Teacher accounts are included when their staff record is active.</div>
     </div>}
    </div>
   </section>}
   {tab==='send'&&<section className="prototype-panel">
    <div className="prototype-panel-head"><h2>Send Message to {contactSection==='parents'?'Parents':'Staff / Teachers'}</h2></div>
    <div className="prototype-panel-body">
     <div className="prototype-section-title">Channel</div>
     <div style={{display:'flex',gap:7,margin:'7px 0 15px',flexWrap:'wrap'}}>{[['sms','SMS'],['whatsapp','WhatsApp'],['email','Email'],['in_app','In-App']].map(([v,l])=><button key={v} type="button" className={`prototype-primary-button ${channel===v?'':'secondary'}`} style={channel===v?{}:{background:'#eef1f5',color:'#455468'}} onClick={()=>setChannel(v)}>{l}</button>)}</div>
     <div className="prototype-form-grid"><div><label>Subject (email only)</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject"/></div><div><label>Recipients</label><input value={String(recipientTotal.length)} readOnly/></div><div style={{gridColumn:'1/-1'}}><label>Message</label><textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></div></div>
     <button className="prototype-primary-button" onClick={send} disabled={saving||(channel==='sms'&&recipientTotal.length>100)||recipientTotal.length===0}>{saving?'Sending…':channel==='sms'?'✈ Queue SMS on School Phone':'✈ Send Message'}</button>
     {status&&<div className="prototype-note" style={{marginTop:10}}>{status}</div>}
     <div className="prototype-preview" style={{marginTop:15}}><small>{channel.toUpperCase()} · {contactSection==='parents'?'PARENTS':'STAFF / TEACHERS'}</small><p style={{marginBottom:0}}>{message}</p></div>
     <div className="prototype-kpi-note" style={{marginTop:7}}>Maximum SMS recipients per broadcast: <b>100</b></div>
    </div>
   </section>}
   {tab==='templates'&&<section className="prototype-panel"><div className="prototype-panel-head"><h2>Notification Templates</h2></div><div className="prototype-panel-body" style={{display:'grid',gap:10}}>{templates.map(([name,type,text])=><div key={name} style={{border:'1px solid #e0e6ee',borderRadius:9,padding:12}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{name}</strong><span style={{fontSize:9,fontWeight:800,color:type==='SMS'?'#17774f':'#8b6100',background:type==='SMS'?'#dcf7eb':'#fff0c2',padding:'3px 7px',borderRadius:999}}>{type}</span><button style={{border:0,background:'transparent',color:'#0757a6',fontSize:10,fontWeight:800}}>Edit</button></div><div style={{marginTop:8,padding:10,background:'#f7f9fc',borderRadius:7,fontSize:10,color:'#5e6b7e'}}>{text}</div></div>)}</div></section>}
   {tab==='integrations'&&<><section className="prototype-panel"><div className="prototype-panel-head"><h2>Integration Channels — Enable / Disable</h2></div><div className="prototype-panel-body" style={{display:'grid',gap:8}}>{[['sms','SMS Gateway (Africa\'s Talking)'],['whatsapp','WhatsApp Business API'],['email','Email (SMTP)'],['inApp','In-App Push Notifications']].map(([key,label])=><div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 12px',border:'1px solid #e0e6ee',borderRadius:8}}><span style={{fontSize:11,fontWeight:700}}>{label}</span><button type="button" onClick={()=>setChannels(c=>({...c,[key]:!c[key as keyof typeof c]}))} style={{width:38,height:22,borderRadius:999,border:0,background:channels[key as keyof typeof channels]?'#12ad73':'#d7dee8',position:'relative',cursor:'pointer'}}><span style={{position:'absolute',top:3,left:channels[key as keyof typeof channels]?19:3,width:16,height:16,borderRadius:'50%',background:'#fff'}}/></button></div>)}</div></section><section className="prototype-panel"><div className="prototype-panel-head"><h2>API Configuration</h2></div><div className="prototype-panel-body"><div className="prototype-note">Keep API keys, access tokens and SMTP passwords in Supabase Edge Function secrets. These browser fields are visual configuration placeholders and never store a service-role secret.</div><div className="prototype-form-grid"><div><label>SMS API Key</label><input value="atsk_xxxxxxxxxxxxxxxx" readOnly/></div><div><label>SMS Username</label><input value="AIC_Cathedral" readOnly/></div><div><label>WhatsApp Phone ID</label><input value="0712345678" readOnly/></div><div><label>WhatsApp Token</label><input value="wabi_xxxxxxxxxxxx" readOnly/></div><div><label>SMTP Server</label><input value="smtp.gmail.com" readOnly/></div><div><label>SMTP Port</label><input value="587" readOnly/></div><div><label>Sender Email</label><input value="info@aic.ac.ke" readOnly/></div><div><label>Sender Name</label><input value={api.sender_name} onChange={e=>setApi({...api,sender_name:e.target.value})}/></div><div><label>WhatsApp API Base URL</label><input value={api.api_base_url} onChange={e=>setApi({...api,api_base_url:e.target.value})}/></div><div><label>WhatsApp Enabled</label><select value={api.enabled?'true':'false'} onChange={e=>setApi({...api,enabled:e.target.value==='true'})}><option value="false">Disabled</option><option value="true">Enabled</option></select></div></div><button className="prototype-primary-button prototype-green-button" onClick={saveIntegrations}>⚿ Save Integration Settings</button></div></section></>}
  </section>
 </>
}
