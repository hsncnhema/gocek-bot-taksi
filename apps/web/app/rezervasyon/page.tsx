'use client'

import { useEffect, useRef, useState } from 'react'

interface Boat {
  id: string
  name: string
  type: string
  capacity: number
  speed: string
  length: string
  color: string
  accentColor: string
  available: boolean
  rating: number
  totalRides: number
  captainName: string
  queueCount: number
  estimatedWaitMinutes: number | null
  currentLocation: string
  upcomingRoutes: string[]
  busyHours: { [key: string]: string[] }
  features: string[]
  hullColor: string
  deckColor: string
}

const BOATS: Boat[] = [
  {
    id: '1', name: 'Ege Rüzgarı', type: 'Hız Teknesi', capacity: 8,
    speed: '45 knot', length: '9.5m', color: '#0D7EA0', accentColor: '#00c6ff',
    available: true, rating: 4.9, totalRides: 342, captainName: 'Mehmet K.',
    queueCount: 0, estimatedWaitMinutes: null, currentLocation: 'Göcek İskelesi No:3',
    upcomingRoutes: [],
    busyHours: { 'Bugün': ['10:00','11:30','14:00','16:30'], 'Yarın': ['09:00','12:00','15:00'], 'Salı': ['10:00','13:00','17:00'] },
    features: ['Klima','Müzik Sistemi','Şnorkel Ekipmanı','İlk Yardım'],
    hullColor: '#1a5f7a', deckColor: '#0D7EA0',
  },
  {
    id: '2', name: 'Deniz Yıldızı', type: 'Konfor Teknesi', capacity: 12,
    speed: '30 knot', length: '12m', color: '#2d6a4f', accentColor: '#52b788',
    available: false, rating: 4.7, totalRides: 218, captainName: 'Ali R.',
    queueCount: 2, estimatedWaitMinutes: 35, currentLocation: 'Küçük Göcek Koyu',
    upcomingRoutes: ['Göcek → Tersane Adası','Tersane → İskelesi No:1'],
    busyHours: { 'Bugün': ['09:00','10:30','13:00','15:30','18:00'], 'Yarın': ['10:00','13:30','16:00'], 'Salı': ['09:30','12:00','14:30'] },
    features: ['Güneş Teras','Mini Bar','Şnorkel Ekipmanı','Güneşlenme Alanı'],
    hullColor: '#1b4332', deckColor: '#2d6a4f',
  },
  {
    id: '3', name: 'Akdeniz', type: 'Lüks Yat', capacity: 6,
    speed: '25 knot', length: '14m', color: '#7b2d8b', accentColor: '#c77dff',
    available: true, rating: 5.0, totalRides: 89, captainName: 'Burak S.',
    queueCount: 0, estimatedWaitMinutes: null, currentLocation: 'Göcek Marina',
    upcomingRoutes: [],
    busyHours: { 'Bugün': ['11:00','15:00'], 'Yarın': ['10:00','14:00','18:00'], 'Salı': ['12:00','16:00'] },
    features: ['Özel Şef','Jakuzi','Güneş Teras','Balık Tutma','Premium Ses'],
    hullColor: '#4a0e6e', deckColor: '#7b2d8b',
  },
  {
    id: '4', name: 'Poyraz', type: 'Ekonomik Tekne', capacity: 10,
    speed: '28 knot', length: '8m', color: '#b5451b', accentColor: '#ff6b35',
    available: false, rating: 4.5, totalRides: 567, captainName: 'Hasan T.',
    queueCount: 1, estimatedWaitMinutes: 15, currentLocation: 'Sarsala Koyu',
    upcomingRoutes: ['Sarsala → Göcek İskelesi'],
    busyHours: { 'Bugün': ['08:30','10:00','11:30','13:00','14:30','16:00','17:30'], 'Yarın': ['09:00','10:30','12:00','13:30','15:00'], 'Salı': ['08:30','10:00','11:30','14:00'] },
    features: ['Ekonomik Fiyat','Geniş Kapasite','Tecrübeli Kaptan'],
    hullColor: '#7a2510', deckColor: '#b5451b',
  },
]

function Boat3D({ hullColor, deckColor, accentColor, autoRotate = false, big = false }: {
  hullColor: string; deckColor: string; accentColor: string; autoRotate?: boolean; big?: boolean
}) {
  const [rotY, setRotY] = useState(25)
  const [dragging, setDragging] = useState(false)
  const lastX = useRef(0)
  const animRef = useRef<number>()

  useEffect(() => {
    if (autoRotate && !dragging) {
      const animate = () => { setRotY(r => (r + 0.5) % 360); animRef.current = requestAnimationFrame(animate) }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [autoRotate, dragging])

  const rad = (rotY * Math.PI) / 180
  const cosR = Math.cos(rad)
  const sinR = Math.sin(rad)
  const perspective = 300

  function project(px: number, py: number, pz: number) {
    const rx = px * cosR - pz * sinR
    const rz = px * sinR + pz * cosR
    const scale = perspective / (perspective + rz + 50)
    return { x: rx * scale, y: py * scale, scale }
  }

  const hullPts = [
    { x: -70, y: 20, z: 25 }, { x: 70, y: 20, z: 25 },
    { x: -60, y: 20, z: -25 }, { x: 60, y: 20, z: -25 },
    { x: -80, y: -10, z: 30 }, { x: 80, y: -10, z: 30 },
    { x: -70, y: -10, z: -30 }, { x: 70, y: -10, z: -30 },
    { x: 0, y: 5, z: 45 }, { x: 0, y: -20, z: 45 },
  ]
  const pts = hullPts.map(p => project(p.x, p.y, p.z))
  const showRight = cosR > 0

  const deckPts = `${pts[4].x},${pts[4].y} ${pts[5].x},${pts[5].y} ${pts[9].x},${pts[9].y} ${pts[6].x},${pts[6].y} ${pts[7].x},${pts[7].y}`
  const frontPts = `${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[9].x},${pts[9].y+25} ${pts[8].x},${pts[8].y+20}`
  const sidePts = showRight
    ? `${pts[1].x},${pts[1].y} ${pts[3].x},${pts[3].y} ${pts[7].x},${pts[7].y} ${pts[5].x},${pts[5].y}`
    : `${pts[0].x},${pts[0].y} ${pts[2].x},${pts[2].y} ${pts[6].x},${pts[6].y} ${pts[4].x},${pts[4].y}`

  const w = big ? 240 : 160
  const h = big ? 160 : 110

  return (
    <svg width={w} height={h} viewBox="-110 -80 220 140"
      style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.7))' }}
      onMouseDown={e => { setDragging(true); lastX.current = e.clientX }}
      onMouseMove={e => { if (!dragging) return; setRotY(r => r + (e.clientX - lastX.current) * 0.8); lastX.current = e.clientX }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchStart={e => { lastX.current = e.touches[0].clientX }}
      onTouchMove={e => { setRotY(r => r + (e.touches[0].clientX - lastX.current) * 0.8); lastX.current = e.touches[0].clientX }}
    >
      <ellipse cx="0" cy="50" rx="80" ry="9" fill="rgba(0,0,0,0.35)" />
      <polygon points={sidePts} fill={showRight ? `${hullColor}cc` : `${hullColor}99`} stroke={`${accentColor}44`} strokeWidth="0.5" />
      <polygon points={frontPts} fill={hullColor} stroke={`${accentColor}66`} strokeWidth="0.5" />
      <polygon points={deckPts} fill={deckColor} stroke={accentColor} strokeWidth="1" />
      <polygon points={`${pts[4].x*0.3+pts[5].x*0.1},${pts[4].y-22} ${pts[4].x*0.45},${pts[4].y-4} ${pts[5].x*0.45},${pts[5].y-4} ${pts[5].x*0.3+pts[4].x*0.05},${pts[5].y-22}`}
        fill={`${deckColor}dd`} stroke={accentColor} strokeWidth="0.8" />
      {[-22, 0, 22].map((wx, i) => {
        const wp = project(wx, -28, 18)
        return <ellipse key={i} cx={wp.x} cy={wp.y} rx={5.5*wp.scale} ry={3.5*wp.scale} fill={`${accentColor}77`} stroke={accentColor} strokeWidth="0.5" />
      })}
      {(() => { const b = project(0,-12,5); const t = project(0,-65,5); return <><line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke={accentColor} strokeWidth="1.5" /><polygon points={`${t.x},${t.y} ${t.x+12},${t.y+5} ${t.x},${t.y+10}`} fill={accentColor} opacity="0.85" /></> })()}
      <line x1={pts[4].x} y1={pts[4].y-7} x2={pts[5].x} y2={pts[5].y-7} stroke={`${accentColor}55`} strokeWidth="0.8" strokeDasharray="3,2" />
      <line x1={pts[0].x} y1={pts[0].y} x2={pts[8].x} y2={pts[8].y+20} stroke={accentColor} strokeWidth="1.5" opacity="0.55" />
      <ellipse cx="0" cy="52" rx="90" ry="11" fill="rgba(255,255,255,0.04)" />
    </svg>
  )
}

interface Location { lng: number; lat: number; label: string }

export default function RezervasyonPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [pickup, setPickup] = useState<Location | null>(null)
  const [step, setStep] = useState<'pickup'|'select'|'detail'|'searching'>('pickup')
  const [passengerCount, setPassengerCount] = useState(1)
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null)
  const [activeDay, setActiveDay] = useState('Bugün')
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    import('mapbox-gl').then((mapboxgl) => {
      const mapbox = mapboxgl.default
      mapbox.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      const map = new mapbox.Map({ container: mapContainer.current!, style: 'mapbox://styles/mapbox/dark-v11', center: [28.9276, 36.7594], zoom: 13 })
      map.on('load', () => {
        setMapLoaded(true)
        map.addSource('gocek', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [28.9276, 36.7594] }, properties: {} } })
        map.addLayer({ id: 'gocek-pulse', type: 'circle', source: 'gocek', paint: { 'circle-radius': 60, 'circle-color': '#0D7EA0', 'circle-opacity': 0.08, 'circle-stroke-width': 2, 'circle-stroke-color': '#0D7EA0', 'circle-stroke-opacity': 0.3 } })
      })
      map.on('click', (e) => {
        if (step !== 'pickup') return
        const { lng, lat } = e.lngLat
        if ((map as any)._pm) (map as any)._pm.remove()
        const m = new mapbox.Marker({ color: '#0D7EA0' }).setLngLat([lng, lat]).addTo(map)
        ;(map as any)._pm = m
        setPickup({ lng, lat, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
      })
      mapRef.current = map
    })
    return () => { if (mapRef.current) { (mapRef.current as any).remove(); mapRef.current = null } }
  }, [])

  function Stars({ r }: { r: number }) {
    return <span style={{ color: '#ffd700', fontSize: '12px' }}>{'★'.repeat(Math.floor(r))}{'☆'.repeat(5-Math.floor(r))}<span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '4px' }}>{r.toFixed(1)}</span></span>
  }

  const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', fontFamily: "'Georgia', serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .fadeup{animation:fadeUp 0.4s ease-out both}
        .slidein{animation:slideIn 0.35s cubic-bezier(0.22,1,0.36,1) both}
        .boat-card{transition:all 0.2s;cursor:pointer}
        .boat-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,0.25)!important}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
      `}</style>

      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Üst bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(to bottom, rgba(10,22,40,0.95), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚓</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em' }}>Göcek Bot Taksi</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {step !== 'pickup' && <button onClick={() => { setStep(step === 'detail' ? 'select' : 'pickup'); setSelectedBoat(null) }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>← Geri</button>}
          <button onClick={() => window.location.href = '/giris'} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>Çıkış</button>
        </div>
      </div>

      {/* Konum Seçimi */}
      {step === 'pickup' && (
        <div className="fadeup" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.98) 85%, transparent)', padding: '32px 24px 40px', zIndex: 10 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '8px' }}>BAŞLANGIÇ NOKTASI</p>
          <div style={{ background: pickup ? 'rgba(13,126,160,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${pickup ? 'rgba(13,126,160,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', transition: 'all 0.3s' }}>
            <span style={{ fontSize: '20px' }}>{pickup ? '📍' : '🗺️'}</span>
            <div>
              <p style={{ color: 'white', fontSize: '15px', margin: 0 }}>{pickup ? `${pickup.lat.toFixed(4)}° K, ${pickup.lng.toFixed(4)}° D` : 'Haritada bir nokta seçin'}</p>
              {!pickup && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>Bot'unuzu buraya gönderelim</p>}
            </div>
          </div>
          {pickup && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Yolcu sayısı</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => setPassengerCount(Math.max(1, passengerCount-1))} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>−</button>
                <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{passengerCount}</span>
                <button onClick={() => setPassengerCount(Math.min(12, passengerCount+1))} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(13,126,160,0.5)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>+</button>
              </div>
            </div>
            <button onClick={() => setStep('select')} style={{ width: '100%', padding: '16px', background: '#0D7EA0', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Bot Talep Et →</button>
          </>)}
          {!pickup && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginTop: '8px' }}>↑ Haritada bulunduğunuz noktaya tıklayın</p>}
        </div>
      )}

      {/* Bot Seçimi */}
      {step === 'select' && (
        <div className="fadeup" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,22,40,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', zIndex: 10, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 20px' }} />
          <h2 style={{ color: 'white', fontSize: '18px', margin: '0 0 4px' }}>Botunuzu Seçin</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 20px' }}>{BOATS.filter(b=>b.available).length} müsait · {BOATS.filter(b=>!b.available).length} meşgul</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {BOATS.map((boat, idx) => (
              <div key={boat.id} className="boat-card" onClick={() => { setSelectedBoat(boat); setStep('detail') }}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${boat.available ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '90px', height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle, ${boat.color}22, transparent)`, borderRadius: '12px' }}>
                  <Boat3D hullColor={boat.hullColor} deckColor={boat.deckColor} accentColor={boat.accentColor} autoRotate />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{boat.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: boat.available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: boat.available ? '#86efac' : '#fca5a5', border: `1px solid ${boat.available ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                      {boat.available ? '● Müsait' : `● ~${boat.estimatedWaitMinutes}dk`}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 6px' }}>{boat.type} · {boat.capacity} kişi · {boat.speed}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stars r={boat.rating} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>👨‍✈️ {boat.captainName}</span>
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bot Detayı */}
      {step === 'detail' && selectedBoat && (
        <div className="slidein" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(8,18,35,0.98)', borderTop: `2px solid ${selectedBoat.accentColor}44`, borderRadius: '20px 20px 0 0', zIndex: 10, maxHeight: '85vh', overflowY: 'auto' }}>
          {/* Hero */}
          <div style={{ background: `linear-gradient(135deg, ${selectedBoat.hullColor}cc, rgba(8,18,35,0.9))`, padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '22px', margin: '0 0 4px' }}>{selectedBoat.name}</h2>
                <p style={{ color: selectedBoat.accentColor, fontSize: '13px', margin: 0 }}>{selectedBoat.type} · Kapt. {selectedBoat.captainName}</p>
              </div>
              <div style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', background: selectedBoat.available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: selectedBoat.available ? '#86efac' : '#fca5a5', border: `1px solid ${selectedBoat.available ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, animation: 'pulse 2s ease-in-out infinite' }}>
                {selectedBoat.available ? '● MÜSAİT' : '● MEŞGUL'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }}>
              <Boat3D hullColor={selectedBoat.hullColor} deckColor={selectedBoat.deckColor} accentColor={selectedBoat.accentColor} autoRotate big />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', textAlign: 'center', margin: '0 0 16px', letterSpacing: '0.08em' }}>↔ SÜRÜKLEYEREK DÖNDÜRÜN</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[{l:'KAPASİTE',v:`${selectedBoat.capacity} kişi`,i:'👥'},{l:'HIZ',v:selectedBoat.speed,i:'⚡'},{l:'UZUNLUK',v:selectedBoat.length,i:'📏'},{l:'SEFER',v:String(selectedBoat.totalRides),i:'⚓'}].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>{s.i}</div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>{s.v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px', letterSpacing: '0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px 24px 32px' }}>
            {/* Durum */}
            {!selectedBoat.available ? (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ color: '#fca5a5', fontWeight: 'bold', margin: '0 0 8px', fontSize: '14px' }}>🕐 Şu an meşgul</p>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 2px', letterSpacing: '0.05em' }}>TAHMİNİ SÜRE</p><p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>~{selectedBoat.estimatedWaitMinutes} dakika</p></div>
                  <div><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 2px', letterSpacing: '0.05em' }}>SIRADAKİ</p><p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{selectedBoat.queueCount} müşteri</p></div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '14px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <div><p style={{ color: '#86efac', fontWeight: 'bold', margin: '0 0 2px', fontSize: '14px' }}>Hemen müsait!</p><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>Sırada kimse yok, anında hareket eder</p></div>
              </div>
            )}

            {/* Konum */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', margin: '0 0 8px' }}>MEVCUT KONUM</p>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📍</span><span style={{ color: 'white', fontSize: '14px' }}>{selectedBoat.currentLocation}</span>
              </div>
              {selectedBoat.upcomingRoutes.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', margin: '0 0 8px' }}>SIRADAKİ ROTALAR</p>
                  {selectedBoat.upcomingRoutes.map((r, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: selectedBoat.accentColor, fontSize: '12px' }}>→</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yoğun saatler */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', margin: '0 0 12px' }}>YOĞUN SAATLER</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto' }}>
                {Object.keys(selectedBoat.busyHours).map(day => (
                  <button key={day} onClick={() => setActiveDay(day)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: activeDay === day ? selectedBoat.accentColor : 'rgba(255,255,255,0.06)', color: activeDay === day ? '#000' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: activeDay === day ? 'bold' : 'normal', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>{day}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {HOURS.map(hour => {
                  const busy = selectedBoat.busyHours[activeDay]?.includes(hour)
                  return <div key={hour} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: busy ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)', color: busy ? '#fca5a5' : '#86efac', border: `1px solid ${busy ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.2)'}` }}>{hour} {busy ? '●' : '○'}</div>
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <span style={{ color: '#86efac', fontSize: '11px' }}>○ Müsait</span>
                <span style={{ color: '#fca5a5', fontSize: '11px' }}>● Meşgul</span>
              </div>
            </div>

            {/* Özellikler */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', margin: '0 0 10px' }}>ÖZELLİKLER</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedBoat.features.map(f => <span key={f} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: `${selectedBoat.color}22`, color: selectedBoat.accentColor, border: `1px solid ${selectedBoat.accentColor}33` }}>✓ {f}</span>)}
              </div>
            </div>

            <button onClick={() => setStep('searching')} style={{ width: '100%', padding: '16px', background: selectedBoat.available ? selectedBoat.accentColor : 'rgba(255,255,255,0.1)', color: selectedBoat.available ? '#000' : 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: selectedBoat.available ? 'pointer' : 'default' }}>
              {selectedBoat.available ? `${selectedBoat.name} ile Yola Çık →` : `Sıraya Gir (~${selectedBoat.estimatedWaitMinutes}dk)`}
            </button>
          </div>
        </div>
      )}

      {/* Aranıyor */}
      {step === 'searching' && (
        <div className="fadeup" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,22,40,0.97)', borderRadius: '20px 20px 0 0', padding: '40px 24px 48px', zIndex: 10, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', border: '3px solid rgba(13,126,160,0.3)', borderTopColor: selectedBoat?.accentColor || '#0D7EA0', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ color: 'white', fontSize: '20px', margin: '0 0 8px' }}>{selectedBoat?.name} hazırlanıyor...</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Kaptanınız {selectedBoat?.captainName} bilgilendiriliyor</p>
        </div>
      )}

      {!mapLoaded && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚓</div>
            <p style={{ color: '#0D7EA0' }}>Harita yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  )
}