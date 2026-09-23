'use client'

import {useEffect,useMemo,useState} from 'react'
import {createClient} from '../../../lib/supabase/client'

const templates=[
 ['Fee Reminder','SMS',"Dear parent, your child's fee balance is {balance}. Kindly clear by {date}. AIC Cathedral."],
 ['Fee Hold Notice','SMS','Dear parent, {student} has been placed on fee hold. Kindly contact the office. AIC Cathedral.'],
 ['Transport Delay','SMS','Dear parent, {bus} is delayed by {minutes} minutes due to {reason}. AIC Cathedral.'],
 ['Exam Results','Email',"Dear parent, {student}'s end-term results are now available. Log in to view. AIC Cathedral."]
]

export default function Broadcast(){
 const db=createClient()
 const[tab,setTab]=useState('send')
 const[section,setSection]=useState('parents')
 const[students,setStudents]=useState<any[]>([])
 const[staff,setStaff]=useState<any[]>([])
 const[grade,setGrade]=useState('all')
 const[stream,setStream]=useState('all')
 const[search,setSearch]=useState('')
 const[selectedStudents,setSelectedStudents]=useState<string[]>([])
 const[selectedStaff,setSelectedStaff]=useState<string[]>([])
 const[channel,setChannel]=useState('sms')
 const[message,setMessage]=useState('Dear parent, this is a reminder about the upcoming PTA meeting. AIC Cathedral.')
 const[subject,setSubject]=useState('')
 const[status,setStatus]=useState('')
 const[saving,setSaving]=useState(false)
 const[api,setApi]=useState<any>({api_base_url:'https://graph.facebook.com/v23.0',sender_name:'AIC Cathedral',sender_id:'',enabled:false})
 const[channels,setChannels]=useState<any>({sms:true,whatsapp:true,email:true,inApp:false})

 async function loadContacts(){
  const [a,cq,sq,b]=await Promise.all([
   db.from('students').select('id,first_name,last_name,admission_number,class_id,stream_id,student_parents(parent_id,relationship,primary_guardian,parents(id,name,phone,email,status))').eq('status','active').order('first_name'),
   db.from('classes').select('id,name,level').eq('status','active').order('name'),
   db.from('streams').select('id,class_id,name').eq('status','active').order('name'),
   db.from('staff').select('id,profile_id,employee_number,first_name,middle_name,last_name,phone,email,department,job_title,employment_type,status').eq('status','active').order('first_name')
  ])
  const classMap=new Map((cq.data||[]).map((x:any)=>[x.id,x.name]))
  const streamMap=new Map((sq.data||[]).map((x:any)=>[x.id,x.name]))
  const enriched=(a.data||[]).map((s:any)=>({...s,class_name:classMap.get(s.class_id)||null,stream_name:streamMap.get(s.stream_id)||null}))
  if(a.error)setStatus(a.error.message);else setStudents(enriched)
  if(b.error)setStatus(b.error.message);else setStaff((b.data||[]) as any[])
 }
 useEffect(()=>{void loadContacts();(async()=>{const{data}=await db.from('communication_settings').select('api_base_url,sender_name,sender_id,enabled').eq('provider','whatsapp').maybeSingle();if(data)setApi(data);try{const saved=localStorage.getItem('aic-communication-channels');if(saved)setChannels(JSON.parse(saved))}catch{}})()},[])

 const grades=['Playgroup','PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9']
 const streams=['East','West']
 const parentRows=useMemo(()=>students.flatMap(s=>(s.student_parents||[]).map((link:any)=>{const p=Array.isArray(link.parents)?link.parents[0]:link.parents;if(!p||!p.phone||String(p.status||'active')!=='active')return null;return{studentId:s.id,student:[s.first_name,s.last_name].filter(Boolean).join(' '),admission:s.admission_number||'',grade:s.class_name||'Not assigned',stream:s.stream_name||'Not assigned',parentId:p.id,name:p.name||'Parent/Guardian',phone:p.phone,email:p.email||null,relationship:link.relationship||'Parent/Guardian',primary:!!link.primary_guardian}}).filter(Boolean)),[students])
 const filteredParents=useMemo(()=>parentRows.filter((p:any)=>(grade==='all'||p.grade===grade)&&(stream==='all'||p.stream===stream)&&(!search||[p.student,p.name,p.phone,p.admission,p.grade,p.stream].join(' ').toLowerCase().includes(search.toLowerCase()))),[parentRows,grade,stream,search])
 const groups=useMemo(()=>{const out:any={};for(const p of filteredParents){out[p.grade]??={};out[p.grade][p.stream]??=[];out[p.grade][p.stream].push(p)}return out},[filteredParents])
 const selectedParentRows=useMemo(()=>parentRows.filter((p:any)=>selectedStudents.includes(p.studentId)),[parentRows,selectedStudents])
 const selectedStaffRows=useMemo(()=>staff.filter(s=>selectedStaff.includes(s.id)&&s.phone),[staff,selectedStaff])
 const selectedRows=section==='parents'?selectedParentRows:selectedStaffRows
 const recipientRows=useMemo(()=>{const seen=new Set<string>();return selectedRows.filter((x:any)=>{const k=String(x.phone||x.id);if(seen.has(k))return false;seen.add(k);return true})},[selectedRows])
 const recipientCount=recipientRows.length

 function toggleStudent(id:string){setSelectedStudents(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 function toggleStaff(id:string){setSelectedStaff(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 function selectVisible(){const ids=filteredParents.map((p:any)=>p.studentId);const unique=Array.from(new Set(ids));const all=unique.length>0&&unique.every(id=>selectedStudents.includes(id));setSelectedStudents(v=>all?v.filter(id=>!unique.includes(id)):Array.from(new Set([...v,...unique])))}

 async function send(){
  if(!message.trim()){setStatus('Enter a message first.');return}
  if(!recipientCount){setStatus('Select at least one recipient.');return}
  if(channel==='sms'&&recipientCount>100){setStatus('SMS broadcasts are limited to 100 recipients per send.');return}
  setSaving(true)
  const{data:user}=await db.auth.getUser()
  const{data:b,error}=await db.from('message_broadcasts').insert({title:subject||'School broadcast',message,channel,audience:section==='parents'?'parents':'staff/teachers',status:channel==='sms'?'phone_pending':'ready',created_by:user.user?.id||null}).select('id').single()
  if(error||!b){setStatus(error?.message||'Could not create broadcast.');setSaving(false);return}
  const rows=recipientRows.map((x:any)=>({broadcast_id:b.id,parent_id:section==='parents'?x.parentId:null,phone:x.phone||null,email:x.email||null,channel,status:channel==='sms'?'phone_pending':'pending'}))
  const{error:re}=await db.from('message_recipients').insert(rows)
  if(re){setStatus(re.message);setSaving(false);return}
  if(channel==='whatsapp'&&api.enabled){const{data:r,error:e}=await db.functions.invoke('send-whatsapp-broadcast',{body:{broadcast_id:b.id}});setStatus(e?.message||r?.error||('WhatsApp broadcast sent: '+(r?.sent||0)+' sent, '+(r?.failed||0)+' failed.'))}
  else if(channel==='sms')setStatus('SMS queued for the school phone: '+recipientCount+' recipient(s). Keep AIC School Messenger open.')
  else setStatus('Broadcast created for '+recipientCount+' recipient(s).')
  setSaving(false)
 }
 async function saveIntegrations(){localStorage.setItem('aic-communication-channels',JSON.stringify(channels));const{error}=await db.from('communication_settings').upsert({provider:'whatsapp',api_base_url:api.api_base_url,sender_name:api.sender_name,sender_id:api.sender_id,enabled:api.enabled},{onConflict:'provider'});setStatus(error?.message||'Integration settings saved.')}

 return <section className="prototype-module">
  <header className="prototype-module-header"><div><h1>Communications</h1><p>Automatic parent and staff/teacher contact directory.</p></div><button className="prototype-primary-button" onClick={()=>void loadContacts()}>↻ Refresh Contacts</button></header>
  <section className="prototype-kpis">
   <div className="prototype-kpi navy"><div className="prototype-kpi-icon">▯</div><div><div className="prototype-kpi-label">Parent phone contacts</div><div className="prototype-kpi-value">{parentRows.length}</div><div className="prototype-kpi-note">Active linked parents</div></div></div>
   <div className="prototype-kpi green"><div className="prototype-kpi-icon">♙</div><div><div className="prototype-kpi-label">Staff / Teachers</div><div className="prototype-kpi-value">{staff.length}</div><div className="prototype-kpi-note">Active staff records</div></div></div>
   <div className="prototype-kpi blue"><div className="prototype-kpi-icon">▣</div><div><div className="prototype-kpi-label">Students</div><div className="prototype-kpi-value">{students.length}</div><div className="prototype-kpi-note">Active learners</div></div></div>
   <div className="prototype-kpi"><div className="prototype-kpi-icon">✉</div><div><div className="prototype-kpi-label">Selected recipients</div><div className="prototype-kpi-value">{recipientCount}</div><div className="prototype-kpi-note">Current message</div></div></div>
  </section>
  <nav className="prototype-tabs"><button className={tab==='send'?'active':''} onClick={()=>setTab('send')}>Send Message</button><button className={tab==='templates'?'active':''} onClick={()=>setTab('templates')}>Templates</button><button className={tab==='integrations'?'active':''} onClick={()=>setTab('integrations')}>Integrations & API</button></nav>

  {tab==='send'&&<section className="prototype-panel">
   <div className="prototype-panel-head"><div><h2>Communication Contacts</h2><p className="muted">Parent numbers are taken automatically from the parent/guardian details captured during student admission. New students and their parent numbers appear here after the page refreshes.</p></div></div>
   <div className="prototype-panel-body">
    <div style={{display:'flex',gap:8,marginBottom:15,flexWrap:'wrap'}}><button type="button" className={section==='parents'?'prototype-primary-button':'prototype-secondary-button'} onClick={()=>setSection('parents')}>Parents</button><button type="button" className={section==='staff'?'prototype-primary-button':'prototype-secondary-button'} onClick={()=>setSection('staff')}>Staff / Teachers</button></div>
    {section==='parents'&&<div>
     <div className="prototype-section-title">Parents — Grade & Stream Directory</div>
     <div className="prototype-form-grid" style={{marginTop:8}}>
      <div><label>Grade</label><select value={grade} onChange={e=>{setGrade(e.target.value);setSelectedStudents([])}}><option value="all">All Grades</option>{grades.map((g:any)=><option key={g} value={g}>{g}</option>)}</select></div>
      <div><label>Stream</label><select value={stream} onChange={e=>{setStream(e.target.value);setSelectedStudents([])}}><option value="all">All Streams</option>{streams.map((s:any)=><option key={s} value={s}>{s}</option>)}</select></div>
      <div style={{gridColumn:'1/-1'}}><label>Search</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Student, parent, admission number or phone"/></div>
     </div>
     <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',margin:'12px 0',flexWrap:'wrap'}}><span className="prototype-kpi-note"><b>{filteredParents.length}</b> parent contact records</span><button type="button" className="prototype-secondary-button" onClick={selectVisible}>Select visible students</button></div>
     <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>GRADE</th><th>STREAM</th><th>STUDENT</th><th>PARENT / GUARDIAN</th><th>RELATIONSHIP</th><th>PHONE NUMBER</th><th>PRIMARY</th><th>SELECT</th></tr></thead><tbody>
      {Object.keys(groups).map(g=><>{<tr key={'grade-'+g} style={{background:'#f5f7fa'}}><td colSpan={8}><strong>{g}</strong> <span className="muted">· Grade contacts</span></td></tr>}{Object.keys(groups[g]).map(st=><>{<tr key={'stream-'+g+'-'+st} style={{background:'#fbfcfe'}}><td colSpan={8}><strong>{st}</strong> <span className="muted">· {groups[g][st].length} contact(s)</span></td></tr>}{groups[g][st].map((p:any)=><tr key={p.studentId+'-'+p.parentId+'-'+p.relationship}><td>{p.grade}</td><td>{p.stream}</td><td><strong>{p.student}</strong><br/><small>{p.admission||'—'}</small></td><td>{p.name}</td><td>{p.relationship}</td><td><strong>{p.phone}</strong></td><td>{p.primary?'Yes':'No'}</td><td><input type="checkbox" checked={selectedStudents.includes(p.studentId)} onChange={()=>toggleStudent(p.studentId)}/></td></tr>)}</>)}</>)}
      {!filteredParents.length&&<tr><td colSpan={8} className="prototype-empty">No active parent phone numbers found.</td></tr>}
     </tbody></table></div>
     <div className="prototype-note" style={{marginTop:10}}>All active parent/guardian phone numbers linked to admitted students are displayed. If a student has two registered parents/guardians, both phone numbers are displayed.</div>
    </div>}
    {section==='staff'&&<div>
     <div className="prototype-section-title">Staff / Teachers Directory</div>
     <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',margin:'10px 0',flexWrap:'wrap'}}><span className="prototype-kpi-note"><b>{staff.length}</b> active staff/teacher records · <b>{selectedStaff.length}</b> selected</span><button type="button" className="prototype-secondary-button" onClick={()=>setSelectedStaff(staff.filter(s=>s.phone).map(s=>s.id))}>Select all with phone</button></div>
     <div className="prototype-table-wrap"><table className="prototype-table"><thead><tr><th>NAME</th><th>ROLE / JOB TITLE</th><th>DEPARTMENT</th><th>PHONE NUMBER</th><th>EMAIL</th><th>STATUS</th><th>SELECT</th></tr></thead><tbody>
      {staff.map(s=><tr key={s.id}><td><strong>{[s.first_name,s.middle_name,s.last_name].filter(Boolean).join(' ')}</strong><br/><small>{s.employee_number||'—'}</small></td><td>{s.job_title||'Staff / Teacher'}</td><td>{s.department||'—'}</td><td>{s.phone?<strong>{s.phone}</strong>:'No phone number'}</td><td>{s.email||'—'}</td><td>{s.status||'active'}</td><td><input type="checkbox" disabled={!s.phone} checked={selectedStaff.includes(s.id)} onChange={()=>toggleStaff(s.id)}/></td></tr>)}
      {!staff.length&&<tr><td colSpan={7} className="prototype-empty">No active staff records found.</td></tr>}
     </tbody></table></div>
     <div className="prototype-note" style={{marginTop:10}}>This section reads the ERP Staff table, so active teachers and non-teaching staff can be contacted from the same Communications page.</div>
    </div>}
   </div>
  </section>}

  {tab==='send'&&<section className="prototype-panel">
   <div className="prototype-panel-head"><h2>Send Message to {section==='parents'?'Parents':'Staff / Teachers'}</h2></div>
   <div className="prototype-panel-body">
    <div className="prototype-section-title">Channel</div>
    <div style={{display:'flex',gap:7,margin:'7px 0 15px',flexWrap:'wrap'}}>{[['sms','SMS'],['whatsapp','WhatsApp'],['email','Email'],['in_app','In-App']].map(([v,l])=><button key={v} type="button" className={channel===v?'prototype-primary-button':'prototype-secondary-button'} onClick={()=>setChannel(v)}>{l}</button>)}</div>
    <div className="prototype-form-grid"><div><label>Subject (email only)</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject"/></div><div><label>Recipients</label><input value={String(recipientCount)} readOnly/></div><div style={{gridColumn:'1/-1'}}><label>Message</label><textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></div></div>
    <button className="prototype-primary-button" onClick={send} disabled={saving||!recipientCount||(channel==='sms'&&recipientCount>100)}>{saving?'Sending…':channel==='sms'?'✈ Queue SMS on School Phone':'✈ Send Message'}</button>
    {status&&<div className="prototype-note" style={{marginTop:10}}>{status}</div>}
    <div className="prototype-preview" style={{marginTop:15}}><small>{channel.toUpperCase()} · {section==='parents'?'PARENTS':'STAFF / TEACHERS'}</small><p style={{marginBottom:0}}>{message}</p></div>
    <div className="prototype-kpi-note" style={{marginTop:7}}>Maximum SMS recipients per broadcast: <b>100</b></div>
   </div>
  </section>}

  {tab==='templates'&&<section className="prototype-panel"><div className="prototype-panel-head"><h2>Notification Templates</h2></div><div className="prototype-panel-body" style={{display:'grid',gap:10}}>{templates.map(([name,type,text])=><div key={name} style={{border:'1px solid #e0e6ee',borderRadius:9,padding:12}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{name}</strong><span>{type}</span></div><div style={{marginTop:8,padding:10,background:'#f7f9fc',borderRadius:7,fontSize:10}}>{text}</div></div>)}</div></section>}

  {tab==='integrations'&&<><section className="prototype-panel"><div className="prototype-panel-head"><h2>Integration Channels</h2></div><div className="prototype-panel-body" style={{display:'grid',gap:8}}>{[['sms','SMS Gateway'],['whatsapp','WhatsApp Business API'],['email','Email (SMTP)'],['inApp','In-App Push Notifications']].map(([key,label])=><div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 12px',border:'1px solid #e0e6ee',borderRadius:8}}><span>{label}</span><button type="button" onClick={()=>setChannels((c:any)=>({...c,[key]:!c[key]}))}>{channels[key]?'Enabled':'Disabled'}</button></div>)}</div></section><section className="prototype-panel"><div className="prototype-panel-head"><h2>API Configuration</h2></div><div className="prototype-panel-body"><div className="prototype-note">Keep provider secrets in Supabase Edge Function secrets. Never put a service-role key in the browser.</div><div className="prototype-form-grid"><div><label>WhatsApp API Base URL</label><input value={api.api_base_url} onChange={e=>setApi({...api,api_base_url:e.target.value})}/></div><div><label>Sender Name</label><input value={api.sender_name} onChange={e=>setApi({...api,sender_name:e.target.value})}/></div><div><label>WhatsApp Enabled</label><select value={api.enabled?'true':'false'} onChange={e=>setApi({...api,enabled:e.target.value==='true'})}><option value="false">Disabled</option><option value="true">Enabled</option></select></div></div><button className="prototype-primary-button" onClick={saveIntegrations}>Save Integration Settings</button></div></section></>}
 </section>
}
