'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DumenLoading from '../../components/LoadingSpinner'

const WHATSAPP = '905323456809'
const TEL = '+905323456809'

// ─── Nokta veritabanı ────────────────────────────────────────
const TUM_NOKTALAR = [
  { id: 'skopea',        isim: 'Skopea İskelesi',  lat: 36.7550, lng: 28.9200, tip: 'boarding' },
  { id: 'mucev',         isim: 'Muçev İskelesi',    lat: 36.7620, lng: 28.9350, tip: 'boarding' },
  { id: 'tersane',       isim: 'Tersane Koyu',      lat: 36.7850, lng: 28.9100, tip: 'koy' },
  { id: 'akvaryum',      isim: 'Akvaryum Koyu',     lat: 36.7900, lng: 28.8950, tip: 'koy' },
  { id: 'yassica',       isim: 'Yassıca Adası',     lat: 36.7750, lng: 28.8800, tip: 'koy' },
  { id: 'gocek_adasi',   isim: 'Göcek Adası',       lat: 36.7680, lng: 28.9050, tip: 'koy' },
  { id: 'domuz',         isim: 'Domuz Adası',       lat: 36.7720, lng: 28.8700, tip: 'koy' },
  { id: 'boynuz',        isim: 'Boynuz Bükü',       lat: 36.7450, lng: 28.8600, tip: 'koy' },
  { id: 'at_buku',       isim: 'At Bükü',           lat: 36.7380, lng: 28.8750, tip: 'koy' },
  { id: 'sirali',        isim: 'Sıralı Bük',        lat: 36.7320, lng: 28.8900, tip: 'koy' },
  { id: 'kille',         isim: 'Kille Koyu',        lat: 36.7280, lng: 28.9100, tip: 'koy' },
  { id: 'bedri',         isim: 'Bedri Rahmi Koyu',  lat: 36.7200, lng: 28.9300, tip: 'koy' },
  { id: 'buyuk_sarsala', isim: 'Büyük Sarsala',     lat: 36.7150, lng: 28.9500, tip: 'koy' },
  { id: 'kucuk_sarsala', isim: 'Küçük Sarsala',     lat: 36.7180, lng: 28.9650, tip: 'koy' },
  { id: 'buyukova',      isim: 'Büyükova Koyu',     lat: 36.7100, lng: 28.9800, tip: 'koy' },
  { id: 'hamam',         isim: 'Hamam Koyu',        lat: 36.8050, lng: 28.8900, tip: 'koy' },
  { id: 'marti',         isim: 'Martı Koyu',        lat: 36.8100, lng: 28.8750, tip: 'koy' },
  { id: 'binlik',        isim: 'Binlik Koyu',       lat: 36.8150, lng: 28.8600, tip: 'koy' },
  { id: 'merdivenli',    isim: 'Merdivenli Koyu',   lat: 36.8200, lng: 28.8450, tip: 'koy' },
  { id: 'gobun',         isim: 'Göbün Koyu',        lat: 36.8250, lng: 28.8300, tip: 'koy' },
  { id: 'osmanaga',      isim: 'Osmanağa Koyu',     lat: 36.7600, lng: 28.8500, tip: 'koy' },
  { id: 'ayten',         isim: 'Ayten Koyu',        lat: 36.7520, lng: 28.8350, tip: 'koy' },
]

// ─── Tekne veritabanı (gerçekte Supabase'den gelecek) ────────
const TEKNELER = [
  {
    id: 'bot1', isim: 'Göcek I', kapasite: 12, model: 'Ribeye 750', emoji: '⛵',
    durumSimdi: 'musait' as const,
    ozellikler: ['Gölgelik', 'Yüzme merdiveni', 'Bluetooth'],
    hizmetDisiNeden: null,
    sefer: null,
  },
  {
    id: 'bot2', isim: 'Göcek II', kapasite: 8, model: 'Ranieri 585', emoji: '🚤',
    durumSimdi: 'musait' as const,
    ozellikler: ['Hızlı tekne', 'Müzik sistemi', 'Soğutma'],
    hizmetDisiNeden: null,
    sefer: null,
  },
  {
    id: 'bot3', isim: 'Göcek III', kapasite: 15, model: 'Lomac 700 TT', emoji: '⛴️',
    durumSimdi: 'mesgul' as const,
    ozellikler: ['Büyük platform', 'Gölgelik', 'WC'],
    hizmetDisiNeden: null,
    sefer: {
      neyden: 'Skopea İskelesi', nereye: 'Tersane Koyu',
      yolcuSayisi: 6, bitisZaman: '14:35',
      tahminiMusait: '14:50', tahminiBinis: '15:05',
      ilerleme: 65,
    },
  },
  {
    id: 'bot4', isim: 'Göcek IV', kapasite: 10, model: 'Joker Coaster 580', emoji: '🛥️',
    durumSimdi: 'hizmetdisi' as const,
    ozellikler: ['Gölgelik', 'Soğutma'],
    hizmetDisiNeden: 'Bakım & onarım',
    sefer: null,
  },
]

type TekneMusaitlik = 'musait' | 'mesgul' | 'hizmetdisi' | 'kapasiteyetersiz' | 'dolu'

// ─── Müsaitlik hesaplayıcı ────────────────────────────────────
function hesaplaMusaitlik(
  tekne: typeof TEKNELER[0],
  zamanMode: 'simdi' | 'planli' | null,
  yolcuSayisi: number,
): { durum: TekneMusaitlik; aciklama: string } {
  // Hizmet dışı — her zaman
  if (tekne.durumSimdi === 'hizmetdisi') {
    return { durum: 'hizmetdisi', aciklama: tekne.hizmetDisiNeden ?? 'Hizmet dışı' }
  }
  // Kapasite yetersiz
  if (tekne.kapasite < yolcuSayisi) {
    return { durum: 'kapasiteyetersiz', aciklama: `Maks ${tekne.kapasite} kişi alabilir` }
  }
  // Hemen seçildiyse gerçek anlık durum
  if (zamanMode === 'simdi') {
    if (tekne.durumSimdi === 'mesgul') {
      return { durum: 'mesgul', aciklama: `Şu an seferde · ~${tekne.sefer?.tahminiBinis} müsait` }
    }
    return { durum: 'musait', aciklama: `${tekne.kapasite} kişilik · Hazır` }
  }
  // İleri tarih: Gerçek sistemde Supabase sorgusu yapılır.
  // Mock: Şu an seferde olanlar ileri tarihlerde müsait, hizmetdisi değişmez.
  if (zamanMode === 'planli') {
    return { durum: 'musait', aciklama: `${tekne.kapasite} kişilik · Müsait` }
  }
  return { durum: 'musait', aciklama: `${tekne.kapasite} kişilik` }
}

type Step = 'binis' | 'inis' | 'zamantekne' | 'ozet'
interface Nokta { id: string; isim: string; lat: number; lng: number; tip: string; aciklama?: string }

// ─── Marker fabrikası — tümü ⚓, isim altında ───────────────
function createMarkerEl(nokta: Nokta, selected: boolean): HTMLDivElement {
  const isBoarding = nokta.tip === 'boarding'
  const container = document.createElement('div')
  container.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center', 'gap:3px',
    'cursor:pointer', 'user-select:none',
  ].join(';')

  // İkon çemberi
  const iconSize = isBoarding ? 36 : 30
  const icon = document.createElement('div')
  icon.style.cssText = [
    `width:${iconSize}px`, `height:${iconSize}px`, 'border-radius:50%',
    `background:${selected ? '#0D7EA0' : isBoarding ? 'rgba(13,126,160,0.85)' : 'rgba(8,24,50,0.9)'}`,
    `border:${selected ? '3px solid #fff' : isBoarding ? '2px solid #00c6ff' : '2px solid rgba(255,255,255,0.5)'}`,
    'display:flex', 'align-items:center', 'justify-content:center',
    `font-size:${isBoarding ? 15 : 13}px`,
    `box-shadow:${selected ? '0 0 0 4px rgba(0,198,255,0.4), 0 4px 12px rgba(0,0,0,0.7)' : '0 2px 8px rgba(0,0,0,0.6)'}`,
    'transition:all 0.15s',
  ].join(';')
  icon.textContent = '⚓'
  container.appendChild(icon)

  // İsim etiketi
  const label = document.createElement('div')
  label.style.cssText = [
    'background:rgba(5,14,29,0.88)',
    'color:' + (selected ? '#00c6ff' : 'rgba(255,255,255,0.85)'),
    'font-size:10px', 'font-weight:' + (selected ? 'bold' : '600'),
    'white-space:nowrap', 'padding:2px 6px', 'border-radius:5px',
    `border:1px solid ${selected ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
    'line-height:1.3', 'font-family:Georgia,serif',
    'pointer-events:none',
    'letter-spacing:0.01em',
    `box-shadow:${selected ? '0 0 8px rgba(0,198,255,0.3)' : 'none'}`,
  ].join(';')
  label.textContent = nokta.isim
  container.appendChild(label)

  return container
}

// ─── Harita bileşeni ──────────────────────────────────────────
interface HaritaProps {
  active: boolean
  onSelect: (n: Nokta) => void
  selectedId?: string | null
  allowCustom?: boolean
}

function Harita({ active, onSelect, selectedId, allowCustom = false }: HaritaProps) {
  const mapRef = useRef<any>(null)
  const markerMap = useRef<Map<string, { container: HTMLDivElement; icon: HTMLDivElement; label: HTMLDivElement; marker: any; nokta: Nokta }>>(new Map())
  const customMarkerRef = useRef<any>(null)
  const pinHitRef = useRef(false)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current || mapRef.current) return
    let map: any
    let mounted = true   // unmount guard

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (!mounted || !containerRef.current) return
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [28.91, 36.765], zoom: 13,
        dragRotate: false, attributionControl: false,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
      mapRef.current = map

      map.on('load', () => {
        setLoaded(true)

        // Kullanıcı konumu
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(({ coords }) => {
            const dot = document.createElement('div')
            dot.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #0D7EA0;box-shadow:0 0 0 4px rgba(13,126,160,0.2)'
            new mapboxgl.Marker({ element: dot, anchor: 'center' }).setLngLat([coords.longitude, coords.latitude]).addTo(map)
          }, () => {})
        }

        // Noktaları ekle
        TUM_NOKTALAR.forEach((nokta) => {
          const sel = nokta.id === selectedId
          const isB = nokta.tip === 'boarding'   // forEach içi scope
          const container = createMarkerEl(nokta, sel)

          // Referanslar için iç elementleri bul
          const icon = container.children[0] as HTMLDivElement
          const label = container.children[1] as HTMLDivElement

          container.addEventListener('click', (e) => {
            e.stopPropagation()
            pinHitRef.current = true
            setTimeout(() => { pinHitRef.current = false }, 100)
            if (customMarkerRef.current) { customMarkerRef.current.remove(); customMarkerRef.current = null }

            // Tüm marker'ları sıfırla
            markerMap.current.forEach(({ icon: ic, label: lb, nokta: n2 }) => {
              const ib = n2.tip === 'boarding'
              ic.style.background = ib ? 'rgba(13,126,160,0.85)' : 'rgba(8,24,50,0.9)'
              ic.style.border = ib ? '2px solid #00c6ff' : '2px solid rgba(255,255,255,0.5)'
              ic.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)'
              lb.style.color = 'rgba(255,255,255,0.85)'
              lb.style.fontWeight = '600'
              lb.style.border = '1px solid rgba(255,255,255,0.1)'
              lb.style.boxShadow = 'none'
            })

            // Bu marker'ı seç
            icon.style.background = isB ? '#0D7EA0' : '#1a3a5c'
            icon.style.border = '3px solid #fff'
            icon.style.boxShadow = '0 0 0 4px rgba(0,198,255,0.4), 0 4px 12px rgba(0,0,0,0.7)'
            label.style.color = '#00c6ff'
            label.style.fontWeight = 'bold'
            label.style.border = '1px solid rgba(0,198,255,0.5)'
            label.style.boxShadow = '0 0 8px rgba(0,198,255,0.3)'

            onSelect(nokta)
          })

          // Hover
          container.addEventListener('mouseenter', () => {
            if (nokta.id !== selectedId) {
              icon.style.boxShadow = '0 0 0 3px rgba(13,126,160,0.35), 0 2px 8px rgba(0,0,0,0.6)'
              icon.style.transform = 'scale(1.1)'
            }
          })
          container.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)'
            if (nokta.id !== selectedId) icon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)'
          })

          const marker = new mapboxgl.Marker({ element: container, anchor: 'top' })
            .setLngLat([nokta.lng, nokta.lat]).addTo(map)

          markerMap.current.set(nokta.id, { container, icon, label, marker, nokta })
        })

        // Haritaya tıklama — özel nokta
        if (allowCustom) {
          map.on('click', (e: any) => {
            if (pinHitRef.current) return
            const { lng, lat } = e.lngLat
            if (customMarkerRef.current) { customMarkerRef.current.remove(); customMarkerRef.current = null }
            markerMap.current.forEach(({ icon: ic, label: lb, nokta: n2 }) => {
              const ib = n2.tip === 'boarding'
              ic.style.background = ib ? 'rgba(13,126,160,0.85)' : 'rgba(8,24,50,0.9)'
              ic.style.border = ib ? '2px solid #00c6ff' : '2px solid rgba(255,255,255,0.5)'
              ic.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)'
              lb.style.color = 'rgba(255,255,255,0.85)'
              lb.style.fontWeight = '600'
              lb.style.border = '1px solid rgba(255,255,255,0.1)'
              lb.style.boxShadow = 'none'
            })

            const cEl = document.createElement('div')
            cEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default'
            const cIcon = document.createElement('div')
            cIcon.style.cssText = 'width:34px;height:34px;border-radius:50%;background:rgba(255,107,53,0.9);border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 0 4px rgba(255,107,53,0.3),0 4px 12px rgba(0,0,0,0.6)'
            cIcon.textContent = '📍'
            const cLabel = document.createElement('div')
            cLabel.style.cssText = 'background:rgba(5,14,29,0.88);color:#ff9a6c;font-size:10px;font-weight:bold;white-space:nowrap;padding:2px 6px;border-radius:5px;border:1px solid rgba(255,107,53,0.4);font-family:Georgia,serif'
            cLabel.textContent = 'Özel Nokta'
            cEl.appendChild(cIcon)
            cEl.appendChild(cLabel)

            customMarkerRef.current = new mapboxgl.Marker({ element: cEl, anchor: 'top' }).setLngLat([lng, lat]).addTo(map)
            onSelect({ id: 'custom', isim: 'Özel Nokta', lat, lng, tip: 'custom', aciklama: `${lat.toFixed(4)}° K, ${lng.toFixed(4)}° D` })
          })
        }
      })
    })

    return () => {
      mounted = false
      markerMap.current.clear()
      if (customMarkerRef.current) { customMarkerRef.current.remove(); customMarkerRef.current = null }
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      setLoaded(false)
    }
  }, [active]) // eslint-disable-line

  return (
    <div style={{ position: 'relative', marginBottom: '14px' }}>
      <div ref={containerRef} className="map-box" style={{ width: '100%', height: '360px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a1628', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid rgba(13,126,160,0.3)', borderTopColor: '#0D7EA0', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#0D7EA0', fontSize: '13px', margin: 0, fontFamily: 'Georgia,serif' }}>Harita yükleniyor...</p>
          </div>
        </div>
      )}
      {allowCustom && loaded && (
        <div style={{ position: 'absolute', bottom: '42px', left: '12px', zIndex: 5, background: 'rgba(5,14,29,0.88)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', fontFamily: 'Georgia,serif', pointerEvents: 'none' }}>
          ⚓ Koy seçin veya haritaya tıklayarak özel nokta
        </div>
      )}
    </div>
  )
}

// ─── Tekne kartı (birleşik adımda) ───────────────────────────
function TekneKart({ tekne, durum, aciklama, secili, detayAcik, onSec, onDetayToggle }: {
  tekne: typeof TEKNELER[0]
  durum: TekneMusaitlik
  aciklama: string
  secili: boolean
  detayAcik: boolean
  onSec: () => void
  onDetayToggle: () => void
}) {
  const [hover, setHover] = useState(false)
  const tiklanabilir = durum === 'musait'

  const renkler = {
    musait: { dot: '#22c55e', label: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', etiket: 'MÜSAİT' },
    mesgul: { dot: '#f59e0b', label: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', etiket: 'SEFERDE' },
    hizmetdisi: { dot: 'rgba(255,255,255,0.2)', label: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', etiket: 'HİZMET DIŞI' },
    kapasiteyetersiz: { dot: '#f87171', label: '#fca5a5', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', etiket: 'KAPASİTE YETERSİZ' },
    dolu: { dot: '#f59e0b', label: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', etiket: 'DOLU' },
  }
  const r = renkler[durum]

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* ── Ana kart satırı ── */}
      <div
        onClick={tiklanabilir ? onDetayToggle : undefined}
        onMouseEnter={() => tiklanabilir && setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          borderRadius: detayAcik ? '14px 14px 0 0' : '14px',
          border: `1px solid ${secili ? 'rgba(0,198,255,0.55)' : detayAcik ? 'rgba(13,126,160,0.4)' : hover ? 'rgba(13,126,160,0.35)' : 'rgba(255,255,255,0.08)'}`,
          borderBottom: detayAcik ? '1px solid rgba(13,126,160,0.15)' : undefined,
          background: secili
            ? 'linear-gradient(135deg, rgba(13,126,160,0.2), rgba(0,198,255,0.06))'
            : detayAcik ? 'rgba(13,126,160,0.08)'
            : hover ? 'rgba(13,126,160,0.06)' : 'rgba(255,255,255,0.03)',
          padding: '14px 16px',
          cursor: tiklanabilir ? 'pointer' : 'default',
          opacity: tiklanabilir ? 1 : 0.5,
          transition: 'all 0.2s ease',
          boxShadow: secili ? '0 0 0 2px rgba(0,198,255,0.25), 0 8px 24px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Bot emoji */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: tiklanabilir ? 'linear-gradient(135deg, rgba(13,126,160,0.25), rgba(0,198,255,0.08))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tiklanabilir ? 'rgba(13,126,160,0.35)' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            filter: !tiklanabilir ? 'grayscale(0.8)' : 'none',
            animation: tiklanabilir && !hover && !detayAcik ? 'boatFloat 3.5s ease-in-out infinite' : 'none',
          }}>
            {tekne.emoji}
          </div>
          {/* Bilgiler */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
              <span style={{ color: tiklanabilir ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '15px' }}>{tekne.isim}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: r.bg, border: `1px solid ${r.border}`, flexShrink: 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.dot, display: 'inline-block', boxShadow: durum === 'musait' ? `0 0 5px ${r.dot}` : 'none', animation: durum === 'musait' ? 'pulseDot 2s infinite' : 'none' }} />
                <span style={{ color: r.label, fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.04em' }}>{r.etiket}</span>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '0 0 3px' }}>{tekne.model}</p>
            <p style={{ color: durum === 'musait' ? 'rgba(255,255,255,0.45)' : r.label, fontSize: '12px', margin: 0 }}>{aciklama}</p>
          </div>
          {/* Chevron */}
          {tiklanabilir && (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', transform: detayAcik ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
          )}
        </div>

        {/* Seferde progress */}
        {durum === 'mesgul' && tekne.sefer && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>⚓ {tekne.sefer.neyden}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0D7EA0', left: `${tekne.sefer.ilerleme}%`, transform: 'translateX(-50%)', boxShadow: '0 0 6px #0D7EA0', animation: 'pulseDot 1.8s infinite', display: 'block' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{tekne.sefer.nereye} ⚓</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: 'BİTİŞ', value: tekne.sefer.bitisZaman, color: '#fbbf24' },
                { label: 'MÜSAİT', value: `~${tekne.sefer.tahminiMusait}`, color: '#00c6ff' },
                { label: 'BİNİŞ', value: `~${tekne.sefer.tahminiBinis}`, color: '#4ade80' },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.07em', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${tekne.sefer.ilerleme}%`, background: 'linear-gradient(90deg, #0D7EA0, #00c6ff)', borderRadius: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Detay widget — accordion ── */}
      {detayAcik && tiklanabilir && (
        <div style={{ background: 'rgba(13,126,160,0.05)', border: '1px solid rgba(13,126,160,0.3)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '16px', animation: 'fadeUp 0.2s ease-out' }}>
          {/* Kapasite + hız bilgisi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              { ikon: '👥', etiket: 'Kapasite', deger: `${tekne.kapasite} kişi` },
              { ikon: '⚙️', etiket: 'Model', deger: tekne.model },
              { ikon: '✅', etiket: 'Durum', deger: 'Hazır' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.ikon}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '3px' }}>{item.etiket.toUpperCase()}</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{item.deger}</div>
              </div>
            ))}
          </div>
          {/* Özellikler */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', margin: '0 0 8px' }}>DONANIM</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tekne.ozellikler.map((o, i) => (
                <span key={i} style={{ padding: '5px 10px', background: 'rgba(13,126,160,0.12)', border: '1px solid rgba(13,126,160,0.25)', borderRadius: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{o}</span>
              ))}
            </div>
          </div>
          {/* Seç butonu */}
          <button onClick={onSec}
            style={{ width: '100%', padding: '12px', background: secili ? 'rgba(0,198,255,0.15)' : '#0D7EA0', color: 'white', border: secili ? '1px solid rgba(0,198,255,0.4)' : 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia,serif', transition: 'all 0.15s' }}>
            {secili ? '✓ Bu tekne seçildi' : `⛵ ${tekne.isim}'i Seç`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Ana bileşen ──────────────────────────────────────────────
export default function RezervasyonPage() {
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(false)
  const [step, setStep] = useState<Step>('binis')
  const [binisNokta, setBinisNokta] = useState<Nokta | null>(null)
  const [inisNokta, setInisNokta] = useState<Nokta | null>(null)
  const [yolcuSayisi, setYolcuSayisi] = useState(1)

  // Zaman
  const [zamanMode, setZamanMode] = useState<'simdi' | 'planli' | null>(null)
  const [zamanGun, setZamanGun] = useState<'bugun' | 'yarin' | 'diger'>('bugun')
  const [zamanSaat, setZamanSaat] = useState<number | null>(null)
  const [zamanDakika, setZamanDakika] = useState<number | null>(null)
  const [saatAcik, setSaatAcik] = useState(false)
  const [dakikaAcik, setDakikaAcik] = useState(false)
  const [digerTarih, setDigerTarih] = useState('')

  // Tekne
  const [seciliTekne, setSeciliTekne] = useState<string | null>(null)
  const [tekneDetayAcik, setTekneDetayAcik] = useState<string | null>(null) // hangi teknenin detayı açık

  const stepIdx: Record<Step, number> = { binis: 0, inis: 1, zamantekne: 2, ozet: 3 }
  const ADIMLAR: [Step, string, number][] = [
    ['binis', 'Biniş', 1], ['inis', 'İniş', 2], ['zamantekne', 'Zaman & Tekne', 3], ['ozet', 'Özet', 4]
  ]

  // İlk müsait saat (+20dk, 15dk yuvarlama)
  const ilkMusait = useMemo(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 20)
    const dk = Math.ceil(now.getMinutes() / 15) * 15
    if (dk >= 60) { now.setHours(now.getHours() + 1); now.setMinutes(0) } else now.setMinutes(dk)
    return now
  }, [])

  const defSaat = ilkMusait.getHours()
  const defDakika = Math.ceil(ilkMusait.getMinutes() / 15) * 15 % 60
  const dispSaat = String(zamanSaat ?? defSaat).padStart(2, '0')
  const dispDakika = String(zamanDakika ?? defDakika).padStart(2, '0')

  const secilenTarihStr = useMemo(() => {
    if (zamanGun === 'bugun') return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    if (zamanGun === 'yarin') { const y = new Date(); y.setDate(y.getDate() + 1); return y.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) }
    return digerTarih ? new Date(digerTarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''
  }, [zamanGun, digerTarih])

  // Hesaplanan müsaitlik listesi
  const tekneMusaitlikleri = useMemo(() =>
    TEKNELER.map(t => ({ tekne: t, ...hesaplaMusaitlik(t, zamanMode, yolcuSayisi) })),
    [zamanMode, yolcuSayisi]
  )

  const musaitSayisi = tekneMusaitlikleri.filter(t => t.durum === 'musait').length
  const zamanSecilebilir = zamanMode === 'simdi' || (zamanMode === 'planli' && (zamanGun !== 'diger' || digerTarih !== ''))

  function zamanEtiketi() {
    if (zamanMode === 'simdi') return 'Hemen'
    if (zamanMode === 'planli') return `${secilenTarihStr} ${dispSaat}:${dispDakika}`
    return '-'
  }

  const inisAdi = inisNokta?.tip === 'custom'
    ? `Özel (${inisNokta.lat.toFixed(3)}, ${inisNokta.lng.toFixed(3)})`
    : inisNokta?.isim ?? '-'

  function whatsappUrl() {
    const b = binisNokta?.isim ?? '?'
    const i = inisNokta?.tip === 'custom' ? `Özel konum (${inisNokta?.lat?.toFixed(4)}, ${inisNokta?.lng?.toFixed(4)})` : inisNokta?.isim ?? '?'
    const t = seciliTekne ? TEKNELER.find(x => x.id === seciliTekne)?.isim ?? '' : ''
    const msg = `Merhaba! Bot Taksi rezervasyonu yapmak istiyorum.\n\n⚓ Biniş: ${b}\n📍 İniş: ${i}\n👥 Yolcu: ${yolcuSayisi}\n🕐 Zaman: ${zamanEtiketi()}${t ? `\n⛵ Tekne: ${t}` : ''}\n\nFiyat bilgisi alabilir miyim?`
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`
  }

  function navigate(target: string) {
    setPageLoading(true)
    setTimeout(() => router.push(target), 350)
  }

  function SecilenKart({ nokta }: { nokta: Nokta }) {
    const custom = nokta.tip === 'custom'
    return (
      <div style={{ background: custom ? 'rgba(255,107,53,0.1)' : 'rgba(13,126,160,0.12)', border: `1px solid ${custom ? 'rgba(255,107,53,0.35)' : 'rgba(13,126,160,0.35)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>⚓</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', margin: '0 0 2px' }}>{nokta.isim}</p>
          {nokta.aciklama && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{nokta.aciklama}</p>}
          {custom && <p style={{ color: 'rgba(255,165,80,0.8)', fontSize: '11px', margin: '2px 0 0' }}>Ücret varışta mesafeye göre hesaplanır</p>}
        </div>
        <span style={{ color: custom ? '#ff9a6c' : '#00c6ff' }}>✓</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white' }}>
      {pageLoading && <DumenLoading text="Hazırlanıyor" />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes boatFloat { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-4px) rotate(1deg)} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.7)} }
        .fadeup { animation: fadeUp 0.3s ease-out both }
        .card-hover { transition: all 0.18s; cursor: pointer; }
        .card-hover:hover { transform: translateY(-2px); }
        .saat-cell:hover { background: rgba(13,126,160,0.18) !important; color: white !important; }
        .mapboxgl-ctrl-group { background: rgba(5,14,29,0.9) !important; border: 1px solid rgba(255,255,255,0.12) !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; }
        .mapboxgl-ctrl-group button span { filter: invert(1); }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px }
        input[type=date] { color-scheme: dark }
        @media(max-width:640px) {
          .rez-inner { padding: 14px !important }
          .progress-label { display: none !important }
          .map-box { height: 300px !important }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(5,14,29,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/ana-sayfa')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '14px', padding: '4px 0' }}>← Ana Sayfa</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚓</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Göcek Bot Taksi</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={`tel:${TEL}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '50%', fontSize: '16px', textDecoration: 'none' }}>📞</a>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>💬</a>
        </div>
      </nav>

      {/* PROGRESS — 4 adım */}
      <div style={{ background: 'rgba(13,126,160,0.04)', borderBottom: '1px solid rgba(13,126,160,0.1)', padding: '10px 20px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'flex-start' }}>
          {ADIMLAR.map(([s, l, n], i) => {
            const cur = stepIdx[step]; const idx = stepIdx[s]
            const done = cur > idx; const active = cur === idx
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                {/* Step dairesi + etiket */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '48px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', background: done ? '#0D7EA0' : active ? 'rgba(13,126,160,0.25)' : 'rgba(255,255,255,0.06)', border: `2px solid ${done ? '#0D7EA0' : active ? '#0D7EA0' : 'rgba(255,255,255,0.1)'}`, color: done ? 'white' : active ? '#00c6ff' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {done ? '✓' : n}
                  </div>
                  <span className="progress-label" style={{ fontSize: '9px', color: active ? '#00c6ff' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', letterSpacing: '0.03em', whiteSpace: 'nowrap', textAlign: 'center' }}>{l}</span>
                </div>
                {/* Connector */}
                {i < 3 && <div style={{ flex: 1, height: '2px', background: done ? '#0D7EA0' : 'rgba(255,255,255,0.07)', margin: '0 4px', marginBottom: '14px', borderRadius: '1px' }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rez-inner" style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* ── ADIM 1: BİNİŞ ── */}
        {step === 'binis' && (
          <div className="fadeup">
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>ADIM 1</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>Nereden bineceksiniz?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px' }}>İskele veya koya tıklayın</p>
            <Harita active={step === 'binis'} onSelect={setBinisNokta} selectedId={binisNokta?.id} />
            {binisNokta ? <SecilenKart nokta={binisNokta} /> : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span>👆</span><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Haritada bir nokta seçin</p>
              </div>
            )}
            {/* Yolcu sayısı */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <p style={{ color: 'white', fontSize: '15px', margin: '0 0 2px', fontWeight: '600' }}>Yolcu Sayısı</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Kaç kişisiniz?</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button onClick={() => setYolcuSayisi(Math.max(1, yolcuSayisi - 1))} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', minWidth: '22px', textAlign: 'center' }}>{yolcuSayisi}</span>
                <button onClick={() => setYolcuSayisi(Math.min(15, yolcuSayisi + 1))} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(13,126,160,0.4)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <button disabled={!binisNokta} onClick={() => setStep('inis')}
              style={{ width: '100%', padding: '14px', background: binisNokta ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: binisNokta ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: binisNokta ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              İniş Noktasını Seç →
            </button>
          </div>
        )}

        {/* ── ADIM 2: İNİŞ ── */}
        {step === 'inis' && (
          <div className="fadeup">
            <button onClick={() => setStep('binis')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← Geri</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>ADIM 2</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>Nereye gideceksiniz?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px' }}>Biniş: <span style={{ color: '#00c6ff' }}>⚓ {binisNokta?.isim}</span></p>
            <Harita active={step === 'inis'} onSelect={setInisNokta} selectedId={inisNokta?.id} allowCustom={true} />
            {inisNokta ? <SecilenKart nokta={inisNokta} /> : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span>👆</span><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Haritada bir nokta seçin</p>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 8px' }}>Nereye gittiğinizden emin değil misiniz?</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '9px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none', fontSize: '13px' }}>💬 WhatsApp</a>
                <a href={`tel:${TEL}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'white', textDecoration: 'none', fontSize: '13px' }}>📞 Ara</a>
              </div>
            </div>
            <button disabled={!inisNokta} onClick={() => setStep('zamantekne')}
              style={{ width: '100%', padding: '14px', background: inisNokta ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: inisNokta ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: inisNokta ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              Zaman & Tekne Seç →
            </button>
          </div>
        )}

        {/* ── ADIM 3: ZAMAN & TEKNE (BİRLEŞİK) ── */}
        {step === 'zamantekne' && (
          <div className="fadeup">
            <button onClick={() => setStep('inis')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← Geri</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>ADIM 3</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>Ne zaman &amp; hangi tekne?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 20px' }}>
              ⚓ {binisNokta?.isim} → 📍 {inisAdi} · 👥 {yolcuSayisi} kişi
            </p>

            {/* ── Zaman seçici ── */}
            {/* Hemen */}
            <div className="card-hover" onClick={() => { setZamanMode('simdi'); setSeciliTekne(null) }}
              style={{ background: zamanMode === 'simdi' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${zamanMode === 'simdi' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>Hemen Gelsin</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', margin: 0 }}>En yakın müsait bot yönlendirilir</p>
              </div>
              {zamanMode === 'simdi' && <span style={{ color: '#4ade80', fontSize: '18px' }}>✓</span>}
            </div>

            {/* Belirli Saat */}
            <div
              onClick={() => { if (zamanMode !== 'planli') { setZamanMode('planli'); setSeciliTekne(null) } }}
              style={{ background: zamanMode === 'planli' ? 'rgba(13,126,160,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${zamanMode === 'planli' ? 'rgba(13,126,160,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '16px', cursor: zamanMode === 'planli' ? 'default' : 'pointer', marginBottom: '18px', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: zamanMode === 'planli' ? '18px' : 0 }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(13,126,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🕐</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>Belirli Bir Saatte</p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', margin: 0 }}>
                    {zamanMode === 'planli' ? `${secilenTarihStr || '...'} · ${dispSaat}:${dispDakika}` : 'Tarih ve saati siz belirleyin'}
                  </p>
                </div>
                {zamanMode === 'planli' && <span style={{ color: '#00c6ff', fontSize: '18px' }}>✓</span>}
              </div>

              {zamanMode === 'planli' && (
                <div className="fadeup">
                  {/* Gün seçici */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                    {(['bugun', 'yarin', 'diger'] as const).map(g => {
                      const aktif = zamanGun === g
                      return (
                        <button key={g} onClick={e => { e.stopPropagation(); setZamanGun(g) }}
                          style={{ flex: 1, padding: '10px 0', borderRadius: '10px', border: `1px solid ${aktif ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.1)'}`, background: aktif ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.04)', color: aktif ? '#00c6ff' : 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: aktif ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Georgia,serif' }}>
                          {g === 'bugun' ? 'Bugün' : g === 'yarin' ? 'Yarın' : 'Diğer Gün'}
                        </button>
                      )
                    })}
                  </div>

                  {zamanGun === 'diger' && (
                    <div className="fadeup" style={{ marginBottom: '18px' }}>
                      <input type="date" value={digerTarih} onChange={e => { e.stopPropagation(); setDigerTarih(e.target.value) }}
                        onClick={e => e.stopPropagation()}
                        min={(() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0] })()}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                  )}

                  {/* Büyük saat göstergesi */}
                  <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', margin: '0 0 10px' }}>KALKIŞ SAATİ</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <div onClick={e => { e.stopPropagation(); setSaatAcik(!saatAcik); setDakikaAcik(false) }}
                        style={{ width: '78px', height: '76px', borderRadius: '14px', background: saatAcik ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.07)', border: `2px solid ${saatAcik ? 'rgba(0,198,255,0.6)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '34px', fontWeight: 'bold', color: saatAcik ? '#00c6ff' : 'white', letterSpacing: '-1px', lineHeight: 1 }}>{dispSaat}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '0.08em' }}>SAAT</span>
                      </div>
                      <span style={{ fontSize: '30px', fontWeight: 'bold', color: 'rgba(255,255,255,0.35)', margin: '0 2px', marginBottom: '14px' }}>:</span>
                      <div onClick={e => { e.stopPropagation(); setDakikaAcik(!dakikaAcik); setSaatAcik(false) }}
                        style={{ width: '78px', height: '76px', borderRadius: '14px', background: dakikaAcik ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.07)', border: `2px solid ${dakikaAcik ? 'rgba(0,198,255,0.6)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '34px', fontWeight: 'bold', color: dakikaAcik ? '#00c6ff' : 'white', letterSpacing: '-1px', lineHeight: 1 }}>{dispDakika}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '0.08em' }}>DAKİKA</span>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '8px 0 0' }}>Tıklayarak seçin</p>
                  </div>

                  {/* Saat grid */}
                  {saatAcik && (
                    <div className="fadeup" onClick={e => e.stopPropagation()} style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
                        {Array.from({ length: 24 }, (_, i) => {
                          const aktif = (zamanSaat ?? defSaat) === i
                          return (
                            <div key={i} className="saat-cell" onClick={() => { setZamanSaat(i); setSaatAcik(false) }}
                              style={{ padding: '8px 0', borderRadius: '7px', textAlign: 'center', fontSize: '13px', background: aktif ? 'rgba(13,126,160,0.35)' : 'rgba(255,255,255,0.04)', border: `1px solid ${aktif ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.06)'}`, color: aktif ? '#00c6ff' : 'rgba(255,255,255,0.65)', fontWeight: aktif ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.12s' }}>
                              {String(i).padStart(2, '0')}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dakika seçici */}
                  {dakikaAcik && (
                    <div className="fadeup" onClick={e => e.stopPropagation()} style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[0, 15, 30, 45].map(dk => {
                          const aktif = (zamanDakika ?? defDakika) === dk
                          return (
                            <div key={dk} onClick={() => { setZamanDakika(dk); setDakikaAcik(false) }}
                              style={{ padding: '14px 0', borderRadius: '10px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', background: aktif ? 'rgba(13,126,160,0.35)' : 'rgba(255,255,255,0.05)', border: `1px solid ${aktif ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.08)'}`, color: aktif ? '#00c6ff' : 'white', cursor: 'pointer', transition: 'all 0.12s' }}>
                              :{String(dk).padStart(2, '0')}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Tekne listesi — zaman seçilince göster ── */}
            {zamanSecilebilir && (
              <div className="fadeup">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.1em', margin: 0 }}>
                    {zamanMode === 'simdi' ? 'ANLIK MÜSAİTLİK' : `${secilenTarihStr ? secilenTarihStr.toUpperCase() + ' · ' : ''}${dispSaat}:${dispDakika} İÇİN MÜSAİTLİK`}
                  </p>
                  {musaitSayisi > 0
                    ? <span style={{ color: '#4ade80', fontSize: '12px' }}>✓ {musaitSayisi} tekne müsait</span>
                    : <span style={{ color: '#fca5a5', fontSize: '12px' }}>⚠ Müsait tekne yok</span>
                  }
                </div>

                {musaitSayisi === 0 && (
                  <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '14px', margin: '0 0 6px', fontWeight: 'bold' }}>Bu saatte müsait tekne bulunamadı</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Farklı bir saat seçin veya WhatsApp üzerinden ulaşın</p>
                  </div>
                )}

                {/* Müsait */}
                {tekneMusaitlikleri.filter(t => t.durum === 'musait').map(({ tekne, durum, aciklama }) => (
                  <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama}
                    secili={seciliTekne === tekne.id}
                    detayAcik={tekneDetayAcik === tekne.id}
                    onSec={() => { setSeciliTekne(tekne.id); setTekneDetayAcik(tekne.id) }}
                    onDetayToggle={() => setTekneDetayAcik(prev => prev === tekne.id ? null : tekne.id)}
                  />
                ))}

                {/* Seferde */}
                {tekneMusaitlikleri.filter(t => t.durum === 'mesgul').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>SEFERDE</p>
                    {tekneMusaitlikleri.filter(t => t.durum === 'mesgul').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                {/* Kapasite yetersiz */}
                {tekneMusaitlikleri.filter(t => t.durum === 'kapasiteyetersiz').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>KAPASİTE YETERSİZ</p>
                    {tekneMusaitlikleri.filter(t => t.durum === 'kapasiteyetersiz').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                {/* Hizmet dışı */}
                {tekneMusaitlikleri.filter(t => t.durum === 'hizmetdisi').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>HİZMET DIŞI</p>
                    {tekneMusaitlikleri.filter(t => t.durum === 'hizmetdisi').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                <button disabled={!seciliTekne} onClick={() => setStep('ozet')}
                  style={{ width: '100%', padding: '14px', marginTop: '8px', background: seciliTekne ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: seciliTekne ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: seciliTekne ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                  Özeti Gör →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ADIM 4: ÖZET ── */}
        {step === 'ozet' && (
          <div className="fadeup">
            <button onClick={() => setStep('zamantekne')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← Geri</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>ÖZET</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 18px' }}>Rezervasyonunuzu Onaylayın</h2>

            <div style={{ background: 'rgba(13,126,160,0.08)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              {([
                ['⚓ Biniş', binisNokta?.isim ?? '-'],
                ['📍 İniş', inisAdi],
                ['👥 Yolcu', `${yolcuSayisi} kişi`],
                ['🕐 Zaman', zamanEtiketi()],
                ['⛵ Tekne', TEKNELER.find(t => t.id === seciliTekne)?.isim ?? '-'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>{k}</span>
                  <span style={{ color: 'white', fontSize: '14px', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
              {inisNokta?.tip === 'custom' && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,107,53,0.1)', borderRadius: '8px', border: '1px solid rgba(255,107,53,0.22)' }}>
                  <p style={{ color: '#ff9a6c', fontSize: '12px', margin: 0 }}>📍 Özel nokta — ücret varışta mesafeye göre hesaplanır</p>
                </div>
              )}
              <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0 }}>💳 Ödeme sefer sonunda nakit veya kart ile alınır</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => alert('Supabase entegrasyonu yakında aktif!')}
                style={{ width: '100%', padding: '15px', background: '#0D7EA0', color: 'white', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                ✅ Rezervasyonu Onayla
              </button>
              <a href={whatsappUrl()} target="_blank" rel="noreferrer"
                style={{ width: '100%', padding: '14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                💬 WhatsApp ile Rezervasyon
              </a>
              <a href={`tel:${TEL}`}
                style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '11px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                📞 Telefonla Ara
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}