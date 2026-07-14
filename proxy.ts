import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/auth/adminSession'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/forgot-password'
  const isAdminRoute = pathname.startsWith('/admin')
  const isAccountRoute = pathname.startsWith('/account') || pathname.startsWith('/checkout')

  const hasAdminSession = verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)

  const { url: supabaseUrl, key: supabaseKey, isConfigured } = getSupabaseEnv()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Without Supabase configured: Dev Mode skips auth entirely (local convenience).
  // Otherwise the static admin session is the only way in — gated routes must NOT
  // be left wide open, which is why Dev Mode must stay "false" in production.
  if (!isConfigured) {
    if (isDevMode) {
      return NextResponse.next({ request })
    }
    if (!hasAdminSession && (isAdminRoute || isAccountRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (hasAdminSession && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = !!user || hasAdminSession

  if (!isAuthenticated && (isAdminRoute || isAccountRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
