'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const roles = [
  ['super_admin', 'Super Admin'], ['admin', 'Admin'], ['finance', 'Finance'], ['academic', 'Academic'],
  ['hr', 'HR / Staff'], ['operations', 'Operations'], ['class_teacher', 'Class Teacher'], ['subject_teacher', 'Subject Teacher'],
  ['headteacher', 'Legacy Headteacher'], ['deputy_headteacher', 'Legacy Deputy Headteacher'], ['accountant', 'Legacy Accountant'],
  ['hr_admin', 'Legacy HR'], ['procurement_officer', 'Legacy Procurement'], ['storekeeper', 'Legacy Storekeeper'],
  ['transport_manager', 'Legacy Transport'], ['parent', 'Parent'], ['student', 'Student']
]

const presets = [
  ['Admin', 'aiccathedraladmin@gmail.com', 'admin'], ['Finance', 'aiccathedralfinance@gmail.com', 'finance'],
  ['Academic', 'aiccathedralacademic@gmail.com', 'academic'], ['HR / Staff', 'aiccathedralhr@gmail.com', 'hr'],
  ['Operations', 'aiccathedraloperations@gmail.com', 'operations']
]

export default function Users() {
  const s = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'admin' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data, error } = await s.from('profiles').select('id,full_name,role,status,must_change_password').order('full_name')
    if (error) setMsg(error.message)
    else setUsers(data || [])
  }

  useEffect(() => { load() }, [])

  function preset(name: string, email: string, role: string) {
    setForm({ full_name: name, email, password: '', role })
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const { data, error } = await s.functions.invoke('admin-create-user', { body: form })
    if (error) setMsg(error.message)
    else if (data?.error) setMsg(data.error)
    else {
      setMsg('Account created. The user must change the temporary password at first sign-in.')
      setForm({ full_name: '', email: '', password: '', role: 'admin' })
      await load()
    }
    setBusy(false)
  }

  return <main className="main">
    <header className="top"><div><h1>User Management</h1><p className="muted">Super Admin creates accounts and assigns each person to the correct school system role.</p></div></header>
    <section className="card">
      <h2>Six main school roles</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        {presets.map(p => <button key={p[1]} className="btn" type="button" onClick={() => preset(p[0], p[1], p[2])}>{p[0]}<br /><small>{p[1]}</small></button>)}
      </div>
      <p className="muted" style={{ marginTop: 10 }}>Teachers are individual Class Teacher or Subject Teacher accounts. Their teaching permissions can be assigned separately by Super Admin.</p>
    </section>
    <section className="card" style={{ marginTop: 16 }}>
      <h2>Create Auth account</h2>
      <form onSubmit={createUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" required />
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" required />
        <input type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Temporary password (8+ characters)" required />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{roles.map(r => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</select>
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create user account'}</button>
      </form>
      {msg && <p style={{ marginTop: 14, color: msg.startsWith('Account') ? '#18794e' : '#b42318' }}>{msg}</p>}
    </section>
    <section className="card" style={{ marginTop: 16 }}>
      <h2>Current users</h2>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left', padding: 10 }}>Name</th><th style={{ textAlign: 'left', padding: 10 }}>Role</th><th style={{ textAlign: 'left', padding: 10 }}>Status</th><th style={{ textAlign: 'left', padding: 10 }}>First login</th></tr></thead><tbody>{users.length ? users.map(u => <tr key={u.id}><td style={{ padding: 10 }}>{u.full_name || '—'}</td><td style={{ padding: 10 }}>{roles.find(r => r[0] === u.role)?.[1] || u.role}</td><td style={{ padding: 10 }}>{u.status}</td><td style={{ padding: 10 }}>{u.must_change_password ? 'Password change required' : 'Ready'}</td></tr>) : <tr><td colSpan={4} className="muted" style={{ padding: 30, textAlign: 'center' }}>No users yet.</td></tr>}</tbody></table></div>
    </section>
  </main>
}
