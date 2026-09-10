import Link from 'next/link'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

const all = [
  ['/dashboard', 'Dashboard'], ['/dashboard/students', 'Students'], ['/dashboard/academic', 'Academic Setup'],
  ['/dashboard/exams', 'Exams & CBC'], ['/dashboard/results', 'Results'], ['/dashboard/attendance', 'Attendance'],
  ['/dashboard/finance', 'Finance & Fees'], ['/dashboard/staff', 'Staff & Teachers'], ['/dashboard/hr', 'HR & Payroll'],
  ['/dashboard/procurement', 'Procurement'], ['/dashboard/inventory', 'Inventory'], ['/dashboard/transport', 'Transport'],
  ['/dashboard/timetable', 'Timetable'], ['/dashboard/communications', 'Communications'], ['/dashboard/analytics', 'School Intelligence'],
  ['/dashboard/reports', 'Reports'], ['/dashboard/settings', 'School Settings'], ['/dashboard/users', 'User Management'],
  ['/dashboard/staff/checkins', 'Teacher Check-ins'], ['/dashboard/staff/locations', 'Check-in Locations'], ['/dashboard/audit', 'Audit Logs']
]

const access: Record<string, string[] | undefined> = {
  Students: ['super_admin', 'admin'],
  'Academic Setup': ['super_admin', 'admin', 'academic'],
  'Exams & CBC': ['super_admin', 'academic'],
  Results: ['super_admin', 'academic', 'class_teacher', 'subject_teacher'],
  Attendance: ['super_admin', 'academic', 'class_teacher', 'subject_teacher'],
  'Finance & Fees': ['super_admin', 'finance'],
  'Staff & Teachers': ['super_admin', 'admin', 'hr'],
  'HR & Payroll': ['super_admin', 'hr'],
  Procurement: ['super_admin', 'admin', 'operations'],
  Inventory: ['super_admin', 'admin', 'operations'],
  Transport: ['super_admin', 'admin', 'operations'],
  Timetable: ['super_admin', 'academic', 'operations', 'class_teacher', 'subject_teacher'],
  Communications: ['super_admin', 'admin', 'operations'],
  'School Intelligence': ['super_admin', 'admin', 'finance', 'academic', 'hr', 'operations', 'class_teacher', 'subject_teacher'],
  Reports: ['super_admin', 'admin', 'finance', 'academic', 'hr', 'operations', 'class_teacher', 'subject_teacher'],
  'School Settings': ['super_admin', 'admin'],
  'User Management': ['super_admin'],
  'Teacher Check-ins': ['super_admin', 'hr'],
  'Check-in Locations': ['super_admin', 'hr'],
  'Audit Logs': ['super_admin']
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', finance: 'Finance', academic: 'Academic', hr: 'HR / Staff', operations: 'Operations',
  class_teacher: 'Class Teacher', subject_teacher: 'Subject Teacher'
}

export default async function Layout({ children }: { children: ReactNode }) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  const { data: p } = await s.from('profiles').select('role,full_name').eq('id', user.id).single()
  const role = p?.role || ''
  const items = all.filter(x => x[0] === '/dashboard' || role === 'super_admin' || access[x[1]]?.includes(role))

  async function logout() {
    'use server'
    const c = await createClient()
    await c.auth.signOut()
    redirect('/login')
  }

  return <div className="dashboard">
    <aside className="sidebar">
      <div className="brand">
        <img src="/aic-cathedral-logo.svg" alt="AIC Cathedral" style={{ width: 42, height: 42, objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 3 }} />
        <span className="label"><strong>AIC Cathedral</strong><br /><small>ERP</small></span>
      </div>
      {items.map(([href, label]) => <Link className="side-item" href={href} key={href}>• <span className="label">{label}</span></Link>)}
      <div style={{ marginTop: 'auto', padding: 16 }} className="muted">
        <strong>{p?.full_name || 'User'}</strong><br />
        <small>{roleLabels[role] || role || 'Authenticated user'}</small><br />
        <small>{user.email}</small>
        <form action={logout} style={{ marginTop: 10 }}><button className="btn" type="submit">Sign out</button></form>
      </div>
    </aside>
    <main style={{ width: '100%' }}>{children}</main>
  </div>
}
