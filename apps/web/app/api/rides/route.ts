import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@gbt/db'

// POST /api/rides — Yeni sefer talebi oluştur
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Oturum kontrolü
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }

  // Kullanıcının DB kaydını al
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'customer') {
    return NextResponse.json({ error: 'Bu işlem için müşteri hesabı gerekiyor' }, { status: 403 })
  }

  // Request body
  const body = await request.json()
  const { pickup_lng, pickup_lat, pickup_label, dropoff_lng, dropoff_lat, dropoff_label, passenger_count, customer_note } = body

  // Koordinat validasyonu
  if (!pickup_lng || !pickup_lat) {
    return NextResponse.json({ error: 'Başlangıç koordinatları zorunlu' }, { status: 400 })
  }

  // Aktif tarifeden fiyat hesapla
  const { data: pricing } = await supabase
    .from('pricing_rules')
    .select('base_fare, per_km_rate, min_fare')
    .eq('is_active', true)
    .lte('valid_from', new Date().toISOString().split('T')[0])
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`)
    .single()

  // Mesafe hesabı (varsa)
  let estimatedPrice = pricing?.base_fare ?? 150
  if (dropoff_lng && dropoff_lat && pricing) {
    const distanceKm = haversineKm(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    estimatedPrice = Math.max(
      pricing.min_fare,
      pricing.base_fare + distanceKm * pricing.per_km_rate
    )
  }

  // Seferi oluştur
  const { data: ride, error: rideError } = await supabase
    .from('rides')
    .insert({
      customer_id:      dbUser.id,
      status:           'pending',
      pickup_location:  `SRID=4326;POINT(${pickup_lng} ${pickup_lat})`,
      pickup_label,
      dropoff_location: dropoff_lng ? `SRID=4326;POINT(${dropoff_lng} ${dropoff_lat})` : null,
      dropoff_label,
      passenger_count:  passenger_count ?? 1,
      estimated_price:  Math.round(estimatedPrice * 100) / 100,
      currency:         'TRY',
      customer_note,
    })
    .select()
    .single()

  if (rideError) {
    console.error('Sefer oluşturma hatası:', rideError)
    return NextResponse.json({ error: 'Sefer oluşturulamadı' }, { status: 500 })
  }

  return NextResponse.json({ ride }, { status: 201 })
}

// GET /api/rides — Müşterinin kendi seferlerini listele
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!dbUser) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit  = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('rides')
    .select(`
      id, status, pickup_label, dropoff_label,
      estimated_price, final_price, currency,
      passenger_count, requested_at, completed_at, cancelled_at,
      captain:users!captain_id(first_name, last_name, phone),
      boat:boats!boat_id(name, type),
      payment:payments(status, provider)
    `)
    .eq('customer_id', dbUser.id)
    .order('requested_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data: rides, error } = await query

  if (error) return NextResponse.json({ error: 'Seferler yüklenemedi' }, { status: 500 })

  return NextResponse.json({ rides })
}

// ── Haversine mesafe hesabı ─────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) { return deg * (Math.PI / 180) }
