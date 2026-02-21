import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Giriş gerektiren rotalar
const PROTECTED_ROUTES = ['/rezervasyon', '/profil', '/gecmis']
// Sadece belirli rollere açık rotalar
const ROLE_ROUTES: Record<string, string[]> = {
  '/api/dispatcher': ['dispatcher', 'admin'],
  '/api/captain':    ['captain', 'admin'],
  '/api/admin':      ['admin'],
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Korumalı rota kontrolü
  const isProtected = PROTECTED_ROUTES.some(r => path.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  // Rol kontrolü (API rotaları için)
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route)) {
      if (!user) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
      }
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (!profile || !roles.includes(profile.role)) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
