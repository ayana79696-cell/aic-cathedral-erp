'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Item = [string, string]

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/dashboard/students': 'Students', '/dashboard/academic': 'Academic Setup',
  '/dashboard/exams': 'Exams & CBC', '/dashboard/results': 'Results', '/dashboard/attendance': 'Attendance',
  '/dashboard/finance': 'Finance', '/dashboard/teachers': 'Teachers', '/dashboard/staff': 'Staff',
  '/dashboard/hr': 'HR & Payroll', '/dashboard/procurement': 'Procurement', '/dashboard/inventory': 'Inventory',
  '/dashboard/transport': 'Transport', '/dashboard/timetable': 'Timetable', '/dashboard/communications': 'Communications',
  '/dashboard/analytics': 'School Intelligence', '/dashboard/reports': 'Reports', '/dashboard/settings': 'School Settings',
  '/dashboard/users': 'User Management', '/dashboard/audit': 'Audit Logs',
}

export default function PrototypeHeader({ items, fullName, role, email }: { items: Item[]; fullName: string; role: string; email?: string | null }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false)
  const title = titles[pathname] || 'AIC Cathedral ERP'
  const roleLabel: Record<string, string> = {super_admin:'Super Admin',admin:'Admin',finance:'Finance',academic:'Academic',hr:'HR / Staff',operations:'Operations',class_teacher:'Class Teacher',subject_teacher:'Subject Teacher'}
  return <>
    <header className="prototype-mobile-header no-print">
      <button className="prototype-menu-button" type="button" aria-label="Open navigation" onClick={()=>setOpen(true)}>☰</button>
      <strong>{title}</strong><span className="prototype-header-spacer" />
      <div className="prototype-user-chip"><span className="prototype-avatar">SA</span><span><b>{roleLabel[role]||role||'User'}</b><small>Term 2, 2026</small></span></div>
    </header>
    {open&&<div className="prototype-drawer-backdrop no-print" onClick={()=>setOpen(false)}><nav className="prototype-drawer" onClick={e=>e.stopPropagation()}>
      <div className="prototype-drawer-head"><b>AIC Cathedral ERP</b><button type="button" onClick={()=>setOpen(false)}>×</button></div>
      <div className="prototype-drawer-user"><span className="prototype-avatar">SA</span><div><b>{fullName||'User'}</b><small>{roleLabel[role]||role}</small>{email&&<small>{email}</small>}</div></div>
      {items.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={pathname===href?'active':''}>{label}</Link>)}
    </nav></div>}
  </>
}
