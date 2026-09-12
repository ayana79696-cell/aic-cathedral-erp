'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const roles = [
  ['super_admin', 'Super Admin'], ['headteacher', 'Head Teacher'], ['deputy_headteacher', 'Deputy Head Teacher'],
  ['admin', 'Admin'], ['finance', 'Finance'], ['bursar', 'Bursar'], ['academic', 'Academic'],
  ['hr_admin', 'HR Admin'], ['hr', 'HR'], ['operations', 'Operations'], ['class_teacher', 'Class Teacher'],
  ['subject_teacher', 'Subject Teacher'], ['accountant', 'Accountant'], ['procurement_officer', 'Procurement Officer'],
  ['storekeeper', 'Storekeeper'], ['transport_manager', 'Transport Manager'], ['parent', 'Parent'], ['student', 'Student']
]
const presets = [
  ['Admin', 'aiccathedraladmin@gmail.com', 'admin'], ['Finance', 'aiccathedralfinance@gmail.com', 'finance'],
  ['Bursar', 'aiccathedralbursar@gmail.com', 'bursar'], ['Academic', 'aiccathedralacademic@gmail.com', 'academic'],
  ['HR Admin', 'aiccathedralhr@gmail.com', 'hr_admin'], ['Head Teacher', 'aiccathedralheadteacher@gmail.com', 'headteacher']
]
const permissionChoices = [
  ['dashboard.view','Dashboard'],['students.view','View Students'],['students.add','Add Students'],['students.edit','Edit Students'],
  ['results.view','View Results'],['results.edit','Enter / Edit Marks'],['exams.view','View Exams & CBC'],['finance.view','View Finance'],
  ['finance.edit','Record / Edit Finance'],['finance.receipts','Create / View School Fee Receipts'],['finance.pending_fees','Check Pending School Fees'],
  ['teachers.view','View Teachers'],['teachers.edit','Manage Teacher Assignments'],['hr.view','View HR'],['payroll.view','View Payroll'],
  ['payroll.edit','Manage Payroll'],['leave.request','Send Leave / Off Request'],['leave.approve.short','Approve Short Leave'],
  ['leave.approve.off','Approve Staff Off'],['reports.view','View Reports'],['attendance.view','View Attendance'],
  ['communications.view','View Communications'],['inventory.view','View Inventory'],['transport.view','View Transport'],
  ['users.manage','Manage User Accounts'],['settings.view','View School Settings']
]
const emptyForm = { full_name: '', email: '', phone: '', job_title: '', password: '', role: 'admin' }

export default function Users() {
  const s = createClient()
  const [users,setUsers]=useState<any[]>([])
  const [form,setForm]=useState(emptyForm)
  const [permissions,setPermissions]=useState<string[]>([])
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editRole,setEditRole]=useState('admin')
  const [editPermissions,setEditPermissions]=useState<string[]>([])
  const [editStatus,setEditStatus]=useState('active')
  const [msg,setMsg]=useState('')
  const [busy,setBusy]=useState(false)

  const load=async()=>{
    const {data,error}=await s.from('profiles').select('id,full_name,role,status,must_change_password,permissions').order('full_name')
    if(error)setMsg(error.message);else setUsers(data||[])
  }
  useEffect(()=>{load()},[])

  function defaultPermissions(role:string){
    if(role==='super_admin')return permissionChoices.map(x=>x[0])
    const base=['dashboard.view']
    if(['headteacher','deputy_headteacher'].includes(role))return [...base,'students.view','students.add','students.edit','results.view','results.edit','exams.view','teachers.view','teachers.edit','hr.view','leave.approve.short','leave.approve.off','reports.view','attendance.view','communications.view','transport.view']
    if(['class_teacher','subject_teacher'].includes(role))return [...base,'students.view','results.view',...(role==='subject_teacher'?['results.edit','exams.view']:['students.edit','results.edit','exams.view','attendance.view','reports.view'])]
    if(['hr','hr_admin'].includes(role))return [...base,'teachers.view','hr.view','payroll.view','payroll.edit','leave.request','leave.approve.off','attendance.view']
    if(['finance','accountant'].includes(role))return [...base,'finance.view','finance.edit','finance.receipts','finance.pending_fees','reports.view']
    if(role==='bursar')return [...base,'finance.view','finance.receipts','finance.pending_fees','reports.view']
    return base
  }
  function preset(name:string,email:string,role:string){setForm({...emptyForm,full_name:name,email,role});setPermissions(defaultPermissions(role))}
  function togglePermission(key:string){setPermissions(p=>p.includes(key)?p.filter(x=>x!==key):[...p,key])}
  function toggleEditPermission(key:string){setEditPermissions(p=>p.includes(key)?p.filter(x=>x!==key):[...p,key])}

  async function createUser(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg('')
    const {data,error}=await s.functions.invoke('admin-create-user',{body:{...form,permissions}})
    if(error)setMsg(error.message)
    else if(data?.error)setMsg(data.error)
    else{
      const createdUserId=data?.user_id||data?.id||data?.user?.id
      if(createdUserId){const update=await s.from('profiles').update({permissions}).eq('id',createdUserId);if(update.error)setMsg(`Account created, but permissions could not be saved: ${update.error.message}`);else setMsg('Account created successfully.')}
      else setMsg('Account created successfully.')
      setForm(emptyForm);setPermissions([]);await load()
    }
    setBusy(false)
  }

  function beginEdit(u:any){
    setEditingId(u.id);setEditRole(u.role||'admin');setEditPermissions(Array.isArray(u.permissions)?u.permissions:defaultPermissions(u.role||'admin'));setEditStatus(u.status||'active');setMsg('')
  }
  function cancelEdit(){setEditingId(null);setEditPermissions([]);setMsg('')}
  async function saveEdit(id:string){
    setBusy(true);setMsg('')
    const {error}=await s.from('profiles').update({role:editRole,permissions:editPermissions,status:editStatus}).eq('id',id)
    if(error)setMsg(error.message);else{setMsg('User role and permissions updated successfully.');setEditingId(null);await load()}
    setBusy(false)
  }

  return <main className="main">
    <header className="top"><div><h1>User Management</h1><p className="muted">Super Admin creates accounts and controls exactly what each user can see or manage.</p></div></header>

    <section className="card"><h2>Quick role setup</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{presets.map(p=><button key={p[1]} className="btn" type="button" onClick={()=>preset(p[0],p[1],p[2])}>{p[0]}<br/><small>{p[1]}</small></button>)}</div></section>

    <section className="card" style={{marginTop:16}}><h2>Create school account</h2>
      <form onSubmit={createUser} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Full name" required/>
        <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email address" required/>
        <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone number"/>
        <input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})} placeholder="Job title"/>
        <input type="password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Temporary password (8+ characters)" required/>
        <select value={form.role} onChange={e=>{const role=e.target.value;setForm({...form,role});setPermissions(defaultPermissions(role))}}>{roles.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}</select>
        <button className="btn" disabled={busy}>{busy?'Creating…':'Create user account'}</button>
      </form>
      <p className="muted" style={{marginTop:10}}>No Teacher ID or Staff ID is required. Staff/employee numbers are generated automatically by the system where needed.</p>
      <div style={{marginTop:18,borderTop:'1px solid #e2e8f0',paddingTop:16}}><h3 style={{marginBottom:6}}>What can this user see or manage?</h3><p className="muted">Select the exact permissions for the account. Bursar is focused on school fee receipts and checking pending school fees.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>{permissionChoices.map(([key,label])=><label key={key} style={{display:'flex',gap:8,alignItems:'center',padding:'8px 10px',background:'#f7f9fc',borderRadius:7}}><input type="checkbox" checked={permissions.includes(key)} onChange={()=>togglePermission(key)}/><span>{label}</span></label>)}</div></div>
      {msg&&<p style={{marginTop:14,color:msg.includes('successfully')||msg.includes('created')?'#18794e':'#b42318'}}>{msg}</p>}
    </section>

    <section className="card" style={{marginTop:16}}><h2>Current users</h2>
      <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Name</th><th style={{textAlign:'left',padding:10}}>Role</th><th style={{textAlign:'left',padding:10}}>Permissions</th><th style={{textAlign:'left',padding:10}}>Status</th><th style={{textAlign:'left',padding:10}}>Actions</th></tr></thead>
      <tbody>{users.length?users.map(u=>editingId===u.id?<tr key={u.id}><td style={{padding:10}}><strong>{u.full_name||'—'}</strong></td><td style={{padding:10}}><select value={editRole} onChange={e=>{setEditRole(e.target.value);setEditPermissions(defaultPermissions(e.target.value))}}>{roles.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}</select></td><td style={{padding:10}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:5,minWidth:420}}>{permissionChoices.map(([key,label])=><label key={key} style={{display:'flex',gap:5,fontSize:12}}><input type="checkbox" checked={editPermissions.includes(key)} onChange={()=>toggleEditPermission(key)}/>{label}</label>)}</div></td><td style={{padding:10}}><select value={editStatus} onChange={e=>setEditStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></td><td style={{padding:10,whiteSpace:'nowrap'}}><button type="button" className="btn" disabled={busy} onClick={()=>saveEdit(u.id)}>Save</button><button type="button" className="btn secondary" style={{marginLeft:8}} onClick={cancelEdit}>Cancel</button></td></tr>:<tr key={u.id}><td style={{padding:10}}><strong>{u.full_name||'—'}</strong></td><td style={{padding:10}}>{roles.find(r=>r[0]===u.role)?.[1]||u.role}</td><td style={{padding:10}}>{Array.isArray(u.permissions)&&u.permissions.length?u.permissions.length+' selected':'Role defaults'}</td><td style={{padding:10}}>{u.status}</td><td style={{padding:10}}><button type="button" className="btn secondary" onClick={()=>beginEdit(u)}>Edit role & permissions</button></td></tr>):<tr><td colSpan={5} className="muted" style={{padding:30,textAlign:'center'}}>No users yet.</td></tr>}</tbody></table></div>
    </section>
  </main>
}
