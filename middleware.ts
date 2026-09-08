import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Vercel/Supabase integrations can expose either the modern publishable key
  // or the legacy anon key. Never crash the whole site just because the
  // integration has not finished injecting its variables.
  if (!url || !key) return response

  const s = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await s.auth.getUser()
  const path = request.nextUrl.pathname

  if (path === '/login' && user) return NextResponse.redirect(new URL('/dashboard', request.url))
  if (path === '/change-password' && !user) return NextResponse.redirect(new URL('/login', request.url))
  if (path.startsWith('/dashboard') && !user) return NextResponse.redirect(new URL('/login', request.url))

  if (user && path.startsWith('/dashboard')) {
    const { data: profile } = await s.from('profiles').select('must_change_password').eq('id', user.id).maybeSingle()
    if (profile?.must_change_password) return NextResponse.redirect(new URL('/change-password', request.url))
  }

  return response
}

export const config = { matcher: ['/dashboard/:path*', '/login', '/change-password'] }
