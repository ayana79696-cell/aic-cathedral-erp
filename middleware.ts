import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const access: Record<string, string[] | undefined> = {
  '/dashboard/students': ['super_admin', 'admin'],
  '/dashboard/academic': ['super_admin', 'admin', 'academic'],
  '/dashboard/exams': ['super_admin', 'academic'],
  '/dashboard/results': ['super_admin', 'academic', 'class_teacher', 'subject_teacher'],
  '/dashboard/attendance': ['super_admin', 'academic', 'class_teacher', 'subject_teacher'],
  '/dashboard/finance': ['super_admin', 'admin', 'finance'],
  '/dashboard/teachers': ['super_admin', 'admin', 'hr', 'academic'],
  '/dashboard/staff': ['super_admin', 'admin', 'hr'],
  '/dashboard/hr': ['super_admin', 'admin', 'hr'],
  '/dashboard/procurement': ['super_admin', 'admin', 'operations'],
  '/dashboard/inventory': ['super_admin', 'admin', 'operations'],
  '/dashboard/transport': ['super_admin', 'admin', 'operations'],
  '/dashboard/communications': ['super_admin', 'admin', 'operations'],
  '/dashboard/analytics': ['super_admin', 'admin', 'finance', 'academic', 'hr', 'operations', 'class_teacher', 'subject_teacher'],
  '/dashboard/reports': ['super_admin', 'admin', 'finance', 'academic', 'hr', 'operations', 'class_teacher', 'subject_teacher'],
  '/dashboard/settings': ['super_admin', 'admin'],
  '/dashboard/users': ['super_admin'],
  '/dashboard/audit': ['super_admin'],
  '/dashboard/timetable': ['super_admin', 'academic', 'operations', 'class_teacher', 'subject_teacher'],
  '/dashboard/staff/locations': ['super_admin', 'hr'],
  '/dashboard/staff/checkins': ['super_admin', 'hr']
}

const homeByRole: Record<string, string> = {
  admin: '/dashboard/students', finance: '/dashboard/finance', academic: '/dashboard/academic', hr: '/dashboard/hr', operations: '/dashboard/procurement', class_teacher: '/dashboard/results', subject_teacher: '/dashboard/results'
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response
  const s = createServerClient(url, key, { cookies: { getAll(){return request.cookies.getAll()}, setAll(cookies){cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options))} } })
  const { data: { user } } = await s.auth.getUser()
  const path = request.nextUrl.pathname
  if (path === '/') return response
  if (path === '/login' && user) { const {data:p}=await s.from('profiles').select('role,must_change_password').eq('id',user.id).maybeSingle(); if(p?.must_change_password)return NextResponse.redirect(new URL('/change-password',request.url)); return NextResponse.redirect(new URL(homeByRole[p?.role||'']||'/dashboard',request.url)) }
  if (path === '/change-password' && !user) return NextResponse.redirect(new URL('/login',request.url))
  if (path.startsWith('/dashboard') && !user) return NextResponse.redirect(new URL('/login',request.url))
  if (user && path.startsWith('/dashboard')) { const {data:p}=await s.from('profiles').select('role,must_change_password').eq('id',user.id).maybeSingle(); if(p?.must_change_password)return NextResponse.redirect(new URL('/change-password',request.url)); if(path==='/dashboard'&&p?.role&&p.role!=='super_admin')return NextResponse.redirect(new URL(homeByRole[p.role]||'/dashboard',request.url)); const base=Object.keys(access).find(x=>path===x||path.startsWith(x+'/')); if(base&&p?.role!=='super_admin'&&!access[base]?.includes(p?.role||''))return NextResponse.redirect(new URL(homeByRole[p?.role||'']||'/dashboard',request.url)) }
  return response
}
export const config={matcher:['/dashboard/:path*','/login','/change-password','/teacher-login','/']}
