import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@gbt/db'

interface RouteParams { params: { id: string } }

// PATCH /api/rides/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const cookieStore = cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient(cookieStore) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (!dbUser) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const { action, boat_id, cancellation_reason } = await request.json()

  const { data: ride } = await supabase
    .from('rides')
    .select('id, status, customer_id, captain_id')
    .eq('id', params.id)
    .single()

  if (!ride) return NextResponse.json({ error: 'Sefer bulunamadı' }, { status: 404 })

  const now = new Date().toISOString()
  let updateData: Record<string, unknown> = {}

  switch (action) {
    case 'accept':
      if (dbUser.role !== 'captain') {
        return NextResponse.json({ error: 'Sadece kaptanlar kabul edebilir' }, { status: 403 })
      }
      if (ride.status !== 'pending') {
        return NextResponse.json({ error: 'Sefer artık kabul edilemez' }, { status: 409 })
      }
      updateData = { status: 'accepted', captain_id: dbUser.id, boat_id, accepted_at: now }
      break

    case 'en_route':
      if (dbUser.role !== 'captain' || ride.captain_id !== dbUser.id) {
        return NextResponse.json({ error: 'Bu sefere erişim yetkiniz yok' }, { status: 403 })
      }
      updateData = { status: 'captain_en_route' }
      break

    case 'start':
      if (dbUser.role !== 'captain' || ride.captain_id !== dbUser.id) {
        return NextResponse.json({ error: 'Bu sefere erişim yetkiniz yok' }, { status: 403 })
      }
      updateData = { status: 'in_progress', started_at: now }
      break

    case 'complete':
      if (dbUser.role !== 'captain' || ride.captain_id !== dbUser.id) {
        return NextResponse.json({ error: 'Bu sefere erişim yetkiniz yok' }, { status: 403 })
      }
      updateData = { status: 'completed', completed_at: now }
      break

    case 'cancel':
      if (ride.customer_id === dbUser.id) {
        updateData = { status: 'cancelled_by_customer', cancelled_at: now, cancelled_by: dbUser.id, cancellation_reason }
      } else if (ride.captain_id === dbUser.id) {
        updateData = { status: 'cancelled_by_captain', captain_id: null, cancelled_at: now, cancelled_by: dbUser.id, cancellation_reason }
      } else {
        return NextResponse.json({ error: 'İptal yetkisi yok' }, { status: 403 })
      }
      break

    default:
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('rides')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Sefer güncelleme hatası:', error)
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }

  return NextResponse.json({ ride: updated })
}

// GET /api/rides/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const cookieStore = cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient(cookieStore) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: ride, error } = await supabase
    .from('rides')
    .select(`*, customer:users!customer_id(id, first_name, last_name, phone, avatar_url), captain:users!captain_id(id, first_name, last_name, phone, avatar_url), boat:boats!boat_id(id, name, type, capacity, photo_urls), payment:payments(id, status, provider, amount, currency, invoice_url)`)
    .eq('id', params.id)
    .single()

  if (error || !ride) return NextResponse.json({ error: 'Sefer bulunamadı' }, { status: 404 })

  return NextResponse.json({ ride })
}