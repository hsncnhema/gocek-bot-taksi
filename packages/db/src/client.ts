import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as _createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import type { CookieOptions } from '@supabase/ssr'

// ── Ortam değişkenleri ──────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('Supabase ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gerekli')
}

// ── Tarayıcı (Client Component) ────────────────────────────
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON)
}

// ── Sunucu (Server Component / Route Handler) ──────────────
// Next.js App Router cookie helper ile kullanılır
export function createServerClient(cookieStore: {
  get(name: string): { value: string } | undefined
  set(name: string, value: string, options: CookieOptions): void
  delete(name: string): void
}) {
  return _createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set(name, value, options) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set(name, '', options) } catch {}
      },
    },
  })
}

// ── Tip yardımcıları ────────────────────────────────────────
export type { Database }
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Sık kullanılan tip kısayolları
export type User           = Tables<'users'>
export type CaptainProfile = Tables<'captain_profiles'>
export type Boat           = Tables<'boats'>
export type Ride           = Tables<'rides'>
export type Payment        = Tables<'payments'>
export type Review         = Tables<'reviews'>
export type Notification   = Tables<'notification_logs'>
export type PricingRule    = Tables<'pricing_rules'>

export type UserRole       = Enums<'user_role'>
export type RideStatus     = Enums<'ride_status'>
export type PaymentStatus  = Enums<'payment_status'>
