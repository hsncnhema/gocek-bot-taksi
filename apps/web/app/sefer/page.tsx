'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DumenLoading from '../../components/LoadingSpinner'

const MOCK_SEFER = {
  id: 'SF-2026-0421',
  botAdi: 'Ege Rüzgarı',
  botTipi: 'Hız Teknesi',
  kaptanAdi: 'Mehmet K.',
  kaptanPuan: 4.9,
  hedef: 'Tersane Adası',
  accentColor: '#00c6ff',
  hullColor: '#1a5f7a',
  durum: 'en_route' as 'accepted' | 'en_route' | 'arrived' | 'in_progress',
  // Bot başlangıç konumu (iskeleden geliyor)
  botBaslangic: [28.9320, 36.7610] as [number, number],
  botHedef: [28.9200, 36.7520] as [number, number],
  pickupKonum: [28.9250, 36.7580] as [number, number],
}

const DURUM_ADIM = {
  accepted: 0,
  en_route: 1,
  arrived: 2,
  in_progress: 3,
}

const ADIMLAR = [
  { label: 'Kaptan onayladı', icon: '✓' },
  { label: 'Kaptan yolda', icon: '🚤' },
  { label: 'Kaptan geldi', icon: '📍' },
  { label: 'Sefer başladı', icon: '⛵' },
]

export default function SeferTakipPage() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [eta, setEta] = useState(6)
  const [progress, setProgress] = useState(0)
  const [durum, setDurum] = useState<keyof typeof DURUM_ADIM>('en_route')
  const botMarkerRef = useRef<any>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    import('mapbox-gl').then((mapboxgl) => {
      const mapbox = mapboxgl.default
      mapbox.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapbox.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [28.9250, 36.7580],
        zoom: 14,
      })

      map.on('load', () => {
        setMapLoaded(true)

        // Rota çizgisi
        map.addSource('rota', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [MOCK_SEFER.botBaslangic, MOCK_SEFER.pickupKonum, MOCK_SEFER.botHedef],
            },
            properties: {},
          },
        })

        map.addLayer({
          id: 'rota-line',
          type: 'line',
          source: 'rota',
          paint: {
            'line-color': '#0D7EA0',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2],
          },
        })

        // Pickup marker (müşteri konumu)
        const pickupEl = document.createElement('div')
        pickupEl.innerHTML = `
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:#0D7EA0;
            border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
            box-shadow:0 4px 16px rgba(13,126,160,0.6);
          ">📍</div>
        `
        new mapbox.Marker({ element: pickupEl })
          .setLngLat(MOCK_SEFER.pickupKonum)
          .addTo(map)

        // Bot marker
        const botEl = document.createElement('div')
        botEl.innerHTML = `
          <div style="
            width:44px;height:44px;border-radius:50%;
            background:linear-gradient(135deg,#1a5f7a,#0D7EA0);
            border:3px solid #00c6ff;
            display:flex;align-items:center;justify-content:center;
            font-size:20px;
            box-shadow:0 4px 20px rgba(0,198,255,0.5);
            animation: botPulse 1.5s ease-in-out infinite;
          ">🚤</div>
        `
        const botMarker = new mapbox.Marker({ element: botEl })
          .setLngLat(MOCK_SEFER.botBaslangic)
          .addTo(map)
        botMarkerRef.current = botMarker

        // Animasyon ekle
        const style = document.createElement('style')
        style.textContent = `@keyframes botPulse { 0%,100%{box-shadow:0 4px 20px rgba(0,198,255,0.5)} 50%{box-shadow:0 4px 32px rgba(0,198,255,0.9)} }`
        document.head.appendChild(style)
      })

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // Bot animasyonu — pickup'a doğru yavaşça hareket et
  useEffect(() => {
    if (!mapLoaded) return

    const interval = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.008, 1)
      setProgress(progressRef.current)

      const p = progressRef.current
      const [sx, sy] = MOCK_SEFER.botBaslangic
      const [ex, ey] = MOCK_SEFER.pickupKonum
      const newLng = sx + (ex - sx) * p
      const newLat = sy + (ey - sy) * p

      if (botMarkerRef.current) {
        botMarkerRef.current.setLngLat([newLng, newLat])
      }

      setEta(Math.max(1, Math.round(6 * (1 - p))))

      if (p >= 0.95 && durum === 'en_route') {
        setDurum('arrived')
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [mapLoaded])

  function handleIptal() {
    setLoading(true)
    setTimeout(() => router.push('/rezervasyon'), 800)
  }

  const aktifAdim = DURUM_ADIM[durum]

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', fontFamily: "'Georgia', serif", overflow: 'hidden' }}>
      {loading && <DumenLoading text="Yönlendiriliyor" />}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes progressAnim{from{width:0}to{width:100%}}
        @keyframes arrive{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        .panel{animation:fadeUp 0.4s ease-out both}
        .arrive-anim{animation:arrive 0.5s ease-out}
      `}</style>

      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Üst bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(to bottom, rgba(8,18,35,0.95), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>⚓</span>
          <div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Aktif Sefer</span>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, letterSpacing: '0.05em' }}>#{MOCK_SEFER.id}</p>
          </div>
        </div>
        <button onClick={handleIptal} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>
          İptal Et
        </button>
      </div>

      {/* Alt panel */}
      <div className="panel" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(8,18,35,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 36px',
        zIndex: 10,
      }}>
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 20px' }} />

        {/* ETA - büyük gösterge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            {durum === 'arrived' ? (
              <div className="arrive-anim">
                <p style={{ color: '#86efac', fontSize: '13px', margin: '0 0 2px', letterSpacing: '0.08em' }}>KAPTAN GELDİ!</p>
                <p style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Hazır mısınız? 🎉</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 2px', letterSpacing: '0.1em' }}>TAHMİNİ VARIŞ</p>
                <p style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>
                  {eta} <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>dakika</span>
                </p>
              </>
            )}
          </div>

          {/* Bot bilgisi */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>{MOCK_SEFER.botAdi}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px' }}>{MOCK_SEFER.botTipi}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '12px' }}>👨‍✈️</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{MOCK_SEFER.kaptanAdi}</span>
              <span style={{ color: '#ffd700', fontSize: '12px' }}>★ {MOCK_SEFER.kaptanPuan}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, #0D7EA0, #00c6ff)`, borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>İskele</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Konumunuz</span>
          </div>
        </div>

        {/* Adımlar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          {ADIMLAR.map((adim, i) => {
            const gecti = i <= aktifAdim
            const aktif = i === aktifAdim
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                {/* Çizgi - önceki adıma */}
                {i > 0 && (
                  <div style={{ position: 'absolute' }} />
                )}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: gecti ? (aktif ? MOCK_SEFER.accentColor : '#0D7EA0') : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${gecti ? MOCK_SEFER.accentColor : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                  boxShadow: aktif ? `0 0 16px ${MOCK_SEFER.accentColor}66` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {adim.icon}
                </div>
                <p style={{ color: gecti ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', fontSize: '10px', textAlign: 'center', margin: 0, letterSpacing: '0.03em', maxWidth: '64px', lineHeight: '1.3' }}>
                  {adim.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bağlantı çizgileri */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '-44px', marginBottom: '8px', padding: '0 26px', pointerEvents: 'none' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, height: '2px', background: i < aktifAdim ? '#0D7EA0' : 'rgba(255,255,255,0.08)', margin: '0 4px', transition: 'background 0.5s', marginTop: '-16px' }} />
          ))}
        </div>

        {/* Hedef */}
        <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🏛️</span>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 2px', letterSpacing: '0.1em' }}>HEDEFİNİZ</p>
              <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{MOCK_SEFER.hedef}</p>
            </div>
          </div>
          <span style={{ color: '#00c6ff', fontSize: '13px' }}>8 dk uzaklıkta</span>
        </div>
      </div>

      {/* Harita yükleniyor */}
      {!mapLoaded && <DumenLoading text="Harita Yükleniyor" />}
    </div>
  )
}