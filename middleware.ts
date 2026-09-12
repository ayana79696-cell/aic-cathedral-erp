import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const access: Record<string, string[] | undefined> = {
  '/dashboard/students': ['super_admin','admin','headteacher','deputy_headteacher','academic','class_teacher'],
  '/dashboard/academic': ['super_admin','admin','headteacher','deputy_headteacher','academic'],
  '/dashboard/exams': ['super_admin','admin','headteacher','deputy_headteacher','academic','class_teacher','subject_teacher'],
  '/dashboard/results': ['super_admin','admin','headteacher','deputy_headteacher','academic','class_teacher','subject_teacher'],
  '/dashboard/attendance': ['super_admin','admin','headteacher','deputy_headteacher','academic','class_teacher','subject_teacher','hr','hr_admin'],
  '/dashboard/finance': ['super_admin','admin','headteacher','deputy_headteacher','finance','bursar','accountant'],
  '/dashboard/teachers': ['super_admin','admin','headteacher','deputy_headteacher','hr','hr_admin','academic'],
  '/dashboard/staff': ['super_admin','admin','headteacher','deputy_headteacher','hr','hr_admin'],
  '/dashboard/hr': ['super_admin','admin','headteacher','deputy_headteacher','hr','hr_admin'],
  '/dashboard/procurement': ['super_admin','admin','operations','procurement_officer'],
  '/dashboard/inventory': ['super_admin','admin','operations','storekeeper'],
  '/dashboard/transport': ['super_admin','admin','operations','transport_manager'],
  '/dashboard/communications': ['super_admin','admin','headteacher','deputy_headteacher','operations'],
  '/dashboard/analytics': ['super_admin','admin','headteacher','deputy_headteacher','finance','bursar','academic','hr','hr_admin','operations','class_teacher','subject_teacher'],
  '/dashboard/reports': ['super_admin','admin','headteacher','deputy_headteacher','finance','bursar','accountant','academic','hr','hr_admin','operations','class_teacher','subject_teacher'],
  '/dashboard/settings': ['super_admin','admin'],
  '/dashboard/users': ['super_admin'],
  '/dashboard/audit': ['super_admin'],
  '/dashboard/timetable': ['super_admin','admin','headteacher','deputy_headteacher','academic','operations','class_teacher','subject_teacher'],
  '/dashboard/staff/locations': ['super_admin','hr','hr_admin'],
  '/dashboard/staff/checkins': ['super_admin','hr','hr_admin']
}

const homeByRole: Record<string, string> = {
  super_admin:'/dashboard', admin:'/dashboard/students', headteacher:'/dashboard/academic', deputy_headteacher:'/dashboard/academic',
  finance:'/dashboard/finance', bursar:'/dashboard/finance', accountant:'/dashboard/finance', academic:'/dashboard/academic',
  hr:'/dashboard/hr', hr_admin:'/dashboard/hr', operations:'/dashboard/procurement', procurement_officer:'/dashboard/procurement',
  storekeeper:'/dashboard/inventory', transport_manager:'/dashboard/transport', class_teacher:'/dashboard/results', subject_teacher:'/dashboard/results'
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
  if (path === '/login' && user) {
    const {data:p}=await s.from('profiles').select('role,status').eq('id',user.id).maybeSingle()
    if(p?.status && p.status!=='active') return NextResponse.redirect(new URL('/login',request.url))
    return NextResponse.redirect(new URL(homeByRole[p?.role||'']||'/dashboard',request.url))
  }
  if (path === '/change-password' && !user) return NextResponse.redirect(new URL('/login',request.url))
  if (path.startsWith('/dashboard') && !user) return NextResponse.redirect(new URL('/login',request.url))
  if (user && path.startsWith('/dashboard')) {
    const {data:p}=await s.from('profiles').select('role,status').eq('id',user.id).maybeSingle()
    if(p?.status && p.status!=='active') return NextResponse.redirect(new URL('/login',request.url))
    if(path==='/dashboard'&&p?.role&&p.role!=='super_admin')return NextResponse.redirect(new URL(homeByRole[p.role]||'/dashboard',request.url))
    const base=Object.keys(access).find(x=>path===x||path.startsWith(x+'/'))
    if(base&&p?.role!=='super_admin'&&!access[base]?.includes(p?.role||''))return NextResponse.redirect(new URL(homeByRole[p?.role||'']||'/dashboard',request.url))
  }
  return response
}
export const config={matcher:['/dashboard/:path*','/login','/change-password','/teacher-login','/']}