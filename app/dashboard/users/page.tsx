'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const roles = [
  ['super_admin', 'Super Admin'], ['admin', 'Admin'], ['finance', 'Finance'], ['academic', 'Academic'],
  ['hr', 'HR / Staff'], ['operations', 'Operations'], ['class_teacher', 'Class Teacher'], ['subject_teacher', 'Subject Teacher'],
  ['parent', 'Parent'], ['student', 'Student']
]

const presets = [
  ['Admin', 'aiccathedraladmin@gmail.com', 'admin'], ['Finance', 'aiccathedralfinance@gmail.com', 'finance'],
  ['Academic', 'aiccathedralacademic@gmail.com', 'academic'], ['HR / Staff', 'aiccathedralhr@gmail.com', 'hr'],
  ['Operations', 'aiccathedraloperations@gmail.com', 'operations']
]

const emptyForm = { full_name: '', staff_id: '', email: '', phone: '', job_title: '', password: '', role: 'admin' }

export default function Users() {
  const s = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [staffIds, setStaffIds] = useState<Record<string,string>>({})
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const isTeacher = form.role === 'class_teacher' || form.role === 'subject_teacher'

  const load = async () => {
    const [{ data, error }, { data:staff }] = await Promise.all([
      s.from('profiles').select('id,full_name,role,status,must_change_password').order('full_name'),
      s.from('staff').select('profile_id,employee_number')
    ])
    if (error) setMsg(error.message)
    else {
      setUsers(data || [])
      setStaffIds(Object.fromEntries((staff || []).map(x => [x.profile_id, x.employee_number || ''])))
    }
  }

  useEffect(() => { load() }, [])

  function preset(name: string, email: string, role: string) {
    setForm({ ...emptyForm, full_name: name, email, role })
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (isTeacher && !form.staff_id.trim()) { setMsg('Staff ID is required for teacher accounts.'); return }
    setBusy(true)
    setMsg('')
    const { data, error } = await s.functions.invoke('admin-create-user', { body: form })
    if (error) setMsg(error.message)
    else if (data?.error) setMsg(data.error)
    else {
      setMsg(isTeacher ? `Teacher account created. Staff ID: ${data.staff_id}` : 'Account created. The user must change the temporary password at first sign-in.')
      setForm(emptyForm)
      await load()
    }
    setBusy(false)
  }

  return <main className="main">
    <header className="top"><div><h1>User Management</h1><p className="muted">Super Admin creates school accounts. Teacher accounts automatically create a linked staff record.</p></div></header>
    <section className="card">
      <h2>Quick role setup</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        {presets.map(p => <button key={p[1]} className="btn" type="button" onClick={() => preset(p[0], p[1], p[2])}>{p[0]}<br /><small>{p[1]}</small></button>)}
      </div>
    </section>
    <section className="card" style={{ marginTop: 16 }}>
      <h2>Create school account</h2>
      <form onSubmit={createUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" required />
        <input value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} placeholder={isTeacher ? 'Staff ID (required for teachers)' : 'Staff ID (optional)'} required={isTeacher} />
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" required />
        {isTeacher && <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />}
        {isTeacher && <input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder={form.role === 'class_teacher' ? 'Job title: Class Teacher' : 'Job title: Subject Teacher'} />}
        <input type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Temporary password (8+ characters)" required />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{roles.map(r => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</select>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : isTeacher ? 'Create teacher account' : 'Create user account'}</button>
      </form>
      {isTeacher && <p className="muted" style={{ marginTop: 10 }}>After creation, assign the teacher’s class, stream and learning area in Staff & Teachers → Teacher Assignments.</p>}
      {msg && <p style={{ marginTop: 14, color: msg.includes('created') || msg.includes('Staff ID:') ? '#18794e' : '#b42318' }}>{msg}</p>}
    </section>
    <section className="card" style={{ marginTop: 16 }}>
      <h2>Current users</h2>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left', padding: 10 }}>Name</th><th style={{ textAlign: 'left', padding: 10 }}>Staff ID</th><th style={{ textAlign: 'left', padding: 10 }}>Role</th><th style={{ textAlign: 'left', padding: 10 }}>Status</th><th style={{ textAlign: 'left', padding: 10 }}>First login</th></tr></thead><tbody>{users.length ? users.map(u => <tr key={u.id}><td style={{ padding: 10 }}>{u.full_name || '—'}</td><td style={{ padding: 10 }}>{staffIds[u.id] || '—'}</td><td style={{ padding: 10 }}>{roles.find(r => r[0] === u.role)?.[1] || u.role}</td><td style={{ padding: 10 }}>{u.status}</td><td style={{ padding: 10 }}>{u.must_change_password ? 'Password change required' : 'Ready'}</td></tr>) : <tr><td colSpan={5} className="muted" style={{ padding: 30, textAlign: 'center' }}>No users yet.</td></tr>}</tbody></table></div>
    </section>
  </main>
}
