'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import DumenLoading from '../../components/LoadingSpinner'
import { useLang } from '../../components/LangProvider'

const WHATSAPP = '905323456809'
const TEL = '+905323456809'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Tipler ──────────────────────────────────────────────────
interface TekneRez {
  id: string; isim: string; kapasite: number; model: string; emoji: string
  durumSimdi: 'musait' | 'mesgul' | 'hizmetdisi'
  ozellikler: string[]; hizmetDisiNeden: string | null
  sefer: {
    neyden: string; nereye: string; yolcuSayisi: number
    bitisZaman: string; tahminiMusait: string; tahminiBinis: string; ilerleme: number
  } | null
}

type TekneMusaitlik = 'musait' | 'mesgul' | 'hizmetdisi' | 'kapasiteyetersiz' | 'dolu'

// ─── Müsaitlik hesaplayıcı ────────────────────────────────────
function hesaplaMusaitlik(
  tekne: TekneRez,
  zamanMode: 'simdi' | 'planli' | null,
  yolcuSayisi: number,
  t: (tr: string, en: string) => string,
): { durum: TekneMusaitlik; aciklama: string } {
  if (tekne.durumSimdi === 'hizmetdisi') {
    return { durum: 'hizmetdisi', aciklama: tekne.hizmetDisiNeden ?? t('Hizmet dışı', 'Out of service') }
  }
  if (tekne.kapasite < yolcuSayisi) {
    return { durum: 'kapasiteyetersiz', aciklama: t(`Maks ${tekne.kapasite} kişi alabilir`, `Max ${tekne.kapasite} people`) }
  }
  if (zamanMode === 'simdi') {
    if (tekne.durumSimdi === 'mesgul') {
      return { durum: 'mesgul', aciklama: t(`Şu an seferde · ~${tekne.sefer?.tahminiBinis} müsait`, `On a trip · ~${tekne.sefer?.tahminiBinis} avail`) }
    }
    return { durum: 'musait', aciklama: t(`${tekne.kapasite} kişilik · Hazır`, `${tekne.kapasite} pax · Ready`) }
  }
  if (zamanMode === 'planli') {
    return { durum: 'musait', aciklama: t(`${tekne.kapasite} kişilik · Müsait`, `${tekne.kapasite} pax · Available`) }
  }
  return { durum: 'musait', aciklama: `${tekne.kapasite} ${t('kişilik', 'people')}` }
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
  noktalar: Nokta[]
  flyToOnLoad?: Nokta | null
}

function Harita({ active, onSelect, selectedId, allowCustom = false, noktalar, flyToOnLoad }: HaritaProps) {
  const { t } = useLang()
  const tRef = useRef(t)
  const mapRef = useRef<any>(null)
  const markerMap = useRef<Map<string, { container: HTMLDivElement; icon: HTMLDivElement; label: HTMLDivElement; marker: any; nokta: Nokta }>>(new Map())
  const customMarkerRef = useRef<any>(null)
  const pinHitRef = useRef(false)
  const userLocRef = useRef<{ lng: number; lat: number } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapboxglRef = useRef<any>(null)
  const flyToOnLoadRef = useRef(flyToOnLoad)

  // Her render'da ref'leri güncelle (stale closure önlemi)
  useEffect(() => { tRef.current = t })
  useEffect(() => { flyToOnLoadRef.current = flyToOnLoad })

  // Harita yüklenince merkezi ayarla
  useEffect(() => {
    if (!loaded || !mapRef.current) return
    const target = flyToOnLoadRef.current
    if (target) {
      mapRef.current.flyTo({ center: [target.lng, target.lat], zoom: 14, duration: 800 })
    } else {
      mapRef.current.jumpTo({ center: [28.9200, 36.7550], zoom: 14 })
    }
  }, [loaded]) // eslint-disable-line

  useEffect(() => {
    if (!active || !containerRef.current || mapRef.current) return
    let map: any
    let mounted = true

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (!mounted || !containerRef.current) return
      mapboxglRef.current = mapboxgl
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [28.9200, 36.7550], zoom: 14,
        dragRotate: false, attributionControl: false,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
      mapRef.current = map

      map.on('load', () => {
        setLoaded(true)
        map.resize()

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(({ coords }) => {
            userLocRef.current = { lng: coords.longitude, lat: coords.latitude }
            const dot = document.createElement('div')
            dot.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #0D7EA0;box-shadow:0 0 0 4px rgba(13,126,160,0.2)'
            new mapboxgl.Marker({ element: dot, anchor: 'center' }).setLngLat([coords.longitude, coords.latitude]).addTo(map)
          }, () => {})
        }

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
            const customIsim = tRef.current('Özel Nokta', 'Custom Point')
            cLabel.textContent = customIsim
            cEl.appendChild(cIcon)
            cEl.appendChild(cLabel)

            customMarkerRef.current = new mapboxgl.Marker({ element: cEl, anchor: 'top' }).setLngLat([lng, lat]).addTo(map)
            const coordStr = tRef.current(
              `${lat.toFixed(4)}° K, ${lng.toFixed(4)}° D`,
              `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
            )
            onSelect({ id: 'custom', isim: customIsim, lat, lng, tip: 'custom', aciklama: coordStr })
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

  // Noktalar Supabase'den geç gelirse haritaya ekle
  useEffect(() => {
    if (!loaded || !mapRef.current || !mapboxglRef.current || noktalar.length === 0) return
    const mapboxgl = mapboxglRef.current

    noktalar.forEach((nokta) => {
      const existing = markerMap.current.get(nokta.id)
      if (existing) {
        if (existing.nokta.lat !== nokta.lat || existing.nokta.lng !== nokta.lng) {
          existing.marker.setLngLat([nokta.lng, nokta.lat])
          markerMap.current.set(nokta.id, { ...existing, nokta })
        }
        return
      }

      const sel = nokta.id === selectedId
      const isB = nokta.tip === 'boarding'
      const container = createMarkerEl(nokta, sel)
      const icon = container.children[0] as HTMLDivElement
      const label = container.children[1] as HTMLDivElement

      container.addEventListener('click', (e) => {
        e.stopPropagation()
        pinHitRef.current = true
        setTimeout(() => { pinHitRef.current = false }, 100)
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

        icon.style.background = isB ? '#0D7EA0' : '#1a3a5c'
        icon.style.border = '3px solid #fff'
        icon.style.boxShadow = '0 0 0 4px rgba(0,198,255,0.4), 0 4px 12px rgba(0,0,0,0.7)'
        label.style.color = '#00c6ff'
        label.style.fontWeight = 'bold'
        label.style.border = '1px solid rgba(0,198,255,0.5)'
        label.style.boxShadow = '0 0 8px rgba(0,198,255,0.3)'
        onSelect(nokta)
      })

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
        .setLngLat([nokta.lng, nokta.lat]).addTo(mapRef.current)

      markerMap.current.set(nokta.id, { container, icon, label, marker, nokta })
    })
  }, [noktalar, loaded]) // eslint-disable-line

  return (
    <div style={{ position: 'relative', marginBottom: '14px' }}>
      <div ref={containerRef} className="map-box" style={{ width: '100%', height: '360px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a1628', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid rgba(13,126,160,0.3)', borderTopColor: '#0D7EA0', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#0D7EA0', fontSize: '13px', margin: 0, fontFamily: 'Georgia,serif' }}>{t('Harita yükleniyor...', 'Loading map...')}</p>
          </div>
        </div>
      )}
      {allowCustom && loaded && (
        <div style={{ position: 'absolute', bottom: '42px', left: '12px', zIndex: 5, background: 'rgba(5,14,29,0.88)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', fontFamily: 'Georgia,serif', pointerEvents: 'none' }}>
          {t('⚓ Koy seçin veya haritaya tıklayarak özel nokta', '⚓ Select a bay or tap map for a custom point')}
        </div>
      )}
      {loaded && (
        <button
          onClick={() => {
            if (userLocRef.current && mapRef.current) {
              mapRef.current.flyTo({ center: [userLocRef.current.lng, userLocRef.current.lat], zoom: 14, duration: 1000 })
            }
          }}
          title={t('Konumuma git', 'Go to my location')}
          style={{ position: 'absolute', bottom: '42px', right: '10px', zIndex: 5, width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(5,14,29,0.92)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          📍
        </button>
      )}
    </div>
  )
}

// ─── Tekne kartı (birleşik adımda) ───────────────────────────
function TekneKart({ tekne, durum, aciklama, secili, detayAcik, onSec, onDetayToggle }: {
  tekne: TekneRez
  durum: TekneMusaitlik
  aciklama: string
  secili: boolean
  detayAcik: boolean
  onSec: () => void
  onDetayToggle: () => void
}) {
  const { t } = useLang()
  const [hover, setHover] = useState(false)
  const tiklanabilir = durum === 'musait'

  const renkler = {
    musait: { dot: '#22c55e', label: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', etiket: t('MÜSAİT', 'AVAILABLE') },
    mesgul: { dot: '#f59e0b', label: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', etiket: t('SEFERDE', 'ON TRIP') },
    hizmetdisi: { dot: 'rgba(255,255,255,0.2)', label: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', etiket: t('HİZMET DIŞI', 'OUT OF SERVICE') },
    kapasiteyetersiz: { dot: '#f87171', label: '#fca5a5', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', etiket: t('KAPASİTE YETERSİZ', 'OVER CAPACITY') },
    dolu: { dot: '#f59e0b', label: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', etiket: t('DOLU', 'FULL') },
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
                { label: t('BİTİŞ', 'FINISH'), value: tekne.sefer.bitisZaman, color: '#fbbf24' },
                { label: t('MÜSAİT', 'AVAIL'), value: `~${tekne.sefer.tahminiMusait}`, color: '#00c6ff' },
                { label: t('BİNİŞ', 'BOARD'), value: `~${tekne.sefer.tahminiBinis}`, color: '#4ade80' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              { ikon: '👥', etiket: t('Kapasite', 'Capacity'), deger: `${tekne.kapasite} ${t('kişi', 'people')}` },
              { ikon: '⚙️', etiket: t('Model', 'Model'), deger: tekne.model },
              { ikon: '✅', etiket: t('Durum', 'Status'), deger: t('Hazır', 'Ready') },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.ikon}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '3px' }}>{item.etiket.toUpperCase()}</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{item.deger}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', margin: '0 0 8px' }}>{t('DONANIM', 'FEATURES')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tekne.ozellikler.map((o, i) => (
                <span key={i} style={{ padding: '5px 10px', background: 'rgba(13,126,160,0.12)', border: '1px solid rgba(13,126,160,0.25)', borderRadius: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{o}</span>
              ))}
            </div>
          </div>
          <button onClick={onSec}
            style={{ width: '100%', padding: '12px', background: secili ? 'rgba(0,198,255,0.15)' : '#0D7EA0', color: 'white', border: secili ? '1px solid rgba(0,198,255,0.4)' : 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia,serif', transition: 'all 0.15s' }}>
            {secili ? t('✓ Bu tekne seçildi', '✓ This boat selected') : t(`⛵ ${tekne.isim}'i Seç`, `⛵ Select ${tekne.isim}`)}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Ana bileşen ──────────────────────────────────────────────
export default function RezervasyonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang, setLang, t } = useLang()
  const [pageLoading, setPageLoading] = useState(false)
  const [step, setStep] = useState<Step>('binis')
  const [user, setUser] = useState<any>(null)
  const [telefon, setTelefon] = useState('')
  const [noktalar, setNoktalar] = useState<Nokta[]>([])
  const [teknelerRez, setTeknelerRez] = useState<TekneRez[]>([])
  const preSelectDone = useRef(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    const fetchVeri = () => Promise.all([
      supabase.from('noktalar').select('*').order('created_at'),
      supabase.from('tekneler').select('*').order('sira'),
    ]).then(([{ data: nkt }, { data: tkn }]) => {
      if (nkt) setNoktalar(nkt as Nokta[])
      if (tkn) setTeknelerRez(tkn.map((x: any) => ({
        id: x.id, isim: x.isim, kapasite: x.kapasite, model: x.model, emoji: x.emoji,
        durumSimdi: x.durum as 'musait' | 'mesgul' | 'hizmetdisi',
        ozellikler: x.ozellikler ?? [], hizmetDisiNeden: null, sefer: null,
      })))
    })
    fetchVeri()

    const channel = supabase
      .channel('noktalar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'noktalar' }, () => {
        supabase.from('noktalar').select('*').order('created_at').then(({ data }) => {
          if (data) setNoktalar(data as Nokta[])
        })
      })
      .subscribe()

    return () => {
      listener.subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  const [binisNokta, setBinisNokta] = useState<Nokta | null>(null)
  const [inisNokta, setInisNokta] = useState<Nokta | null>(null)
  const [yolcuSayisi, setYolcuSayisi] = useState(1)
  const [seciliTekne, setSeciliTekne] = useState<string | null>(null)
  const [tekneDetayAcik, setTekneDetayAcik] = useState<string | null>(null)

  // Query param pre-selection — noktalar gelince bir kez çalışır
  useEffect(() => {
    if (preSelectDone.current || noktalar.length === 0) return
    preSelectDone.current = true

    const tekneParam = searchParams.get('tekne')
    const inisParam  = searchParams.get('inis')

    if (tekneParam) {
      setSeciliTekne(tekneParam)
      setTekneDetayAcik(tekneParam)
    }

    if (inisParam) {
      const inis = noktalar.find(n => n.id === inisParam) ?? null
      if (inis) setInisNokta(inis)
    }
  }, [noktalar]) // eslint-disable-line

  // Zaman
  const [zamanMode, setZamanMode] = useState<'simdi' | 'planli' | null>(null)
  const [zamanGun, setZamanGun] = useState<'bugun' | 'yarin' | 'diger'>('bugun')
  const [zamanSaat, setZamanSaat] = useState<number | null>(null)
  const [zamanDakika, setZamanDakika] = useState<number | null>(null)
  const [saatAcik, setSaatAcik] = useState(false)
  const [dakikaAcik, setDakikaAcik] = useState(false)
  const [digerTarih, setDigerTarih] = useState('')

  const stepIdx: Record<Step, number> = { binis: 0, inis: 1, zamantekne: 2, ozet: 3 }
  const ADIMLAR: [Step, string, number][] = [
    ['binis', t('Biniş', 'Board'), 1],
    ['inis', t('İniş', 'Drop-off'), 2],
    ['zamantekne', t('Zaman & Tekne', 'Time & Boat'), 3],
    ['ozet', t('Özet', 'Summary'), 4],
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

  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  const secilenTarihStr = useMemo(() => {
    if (zamanGun === 'bugun') return new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long' })
    if (zamanGun === 'yarin') { const y = new Date(); y.setDate(y.getDate() + 1); return y.toLocaleDateString(locale, { day: 'numeric', month: 'long' }) }
    return digerTarih ? new Date(digerTarih).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) : ''
  }, [zamanGun, digerTarih, locale])

  const tekneMusaitlikleri = useMemo(() =>
    teknelerRez.map(tkn => ({ tekne: tkn, ...hesaplaMusaitlik(tkn, zamanMode, yolcuSayisi, t) })),
    [teknelerRez, zamanMode, yolcuSayisi, t]
  )

  const musaitSayisi = tekneMusaitlikleri.filter(x => x.durum === 'musait').length
  const zamanSecilebilir = zamanMode === 'simdi' || (zamanMode === 'planli' && (zamanGun !== 'diger' || digerTarih !== ''))

  function zamanEtiketi() {
    if (zamanMode === 'simdi') return t('Hemen', 'Now')
    if (zamanMode === 'planli') return `${secilenTarihStr} ${dispSaat}:${dispDakika}`
    return '-'
  }

  const inisAdi = inisNokta?.tip === 'custom'
    ? `${t('Özel', 'Custom')} (${inisNokta.lat.toFixed(3)}, ${inisNokta.lng.toFixed(3)})`
    : inisNokta?.isim ?? '-'

  function whatsappUrl() {
    const b = binisNokta?.isim ?? '?'
    const i = inisNokta?.tip === 'custom' ? `Özel konum (${inisNokta?.lat?.toFixed(4)}, ${inisNokta?.lng?.toFixed(4)})` : inisNokta?.isim ?? '?'
    const tekneIsim = seciliTekne ? teknelerRez.find(x => x.id === seciliTekne)?.isim ?? '' : ''
    const msg = `Merhaba! Bot Taksi rezervasyonu yapmak istiyorum.\n\n⚓ Biniş: ${b}\n📍 İniş: ${i}\n👥 Yolcu: ${yolcuSayisi}\n🕐 Zaman: ${zamanEtiketi()}${tekneIsim ? `\n⛵ Tekne: ${tekneIsim}` : ''}\n\nFiyat bilgisi alabilir miyim?`
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
          {custom && <p style={{ color: 'rgba(255,165,80,0.8)', fontSize: '11px', margin: '2px 0 0' }}>{t('Ücret varışta mesafeye göre hesaplanır', 'Fare calculated by distance at arrival')}</p>}
        </div>
        <span style={{ color: custom ? '#ff9a6c' : '#00c6ff' }}>✓</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white' }}>
      {pageLoading && <DumenLoading text={t('Hazırlanıyor', 'Loading')} />}

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
        <button onClick={() => navigate('/ana-sayfa')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '14px', padding: '4px 0' }}>{t('← Ana Sayfa', '← Home')}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚓</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Göcek Bot Taksi</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia,serif', letterSpacing: '0.05em' }}>
            {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </button>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '48px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', background: done ? '#0D7EA0' : active ? 'rgba(13,126,160,0.25)' : 'rgba(255,255,255,0.06)', border: `2px solid ${done ? '#0D7EA0' : active ? '#0D7EA0' : 'rgba(255,255,255,0.1)'}`, color: done ? 'white' : active ? '#00c6ff' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {done ? '✓' : n}
                  </div>
                  <span className="progress-label" style={{ fontSize: '9px', color: active ? '#00c6ff' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', letterSpacing: '0.03em', whiteSpace: 'nowrap', textAlign: 'center' }}>{l}</span>
                </div>
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
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>{t('ADIM 1', 'STEP 1')}</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>{t('Nereden bineceksiniz?', 'Where are you boarding?')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px' }}>{t('İskele veya koya tıklayın', 'Tap a pier or bay')}</p>
            <Harita active={step === 'binis'} onSelect={setBinisNokta} selectedId={binisNokta?.id} allowCustom={true} noktalar={noktalar} />
            {binisNokta ? <SecilenKart nokta={binisNokta} /> : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span>👆</span><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{t('Haritada bir nokta seçin', 'Select a point on the map')}</p>
              </div>
            )}
            {/* Yolcu sayısı */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <p style={{ color: 'white', fontSize: '15px', margin: '0 0 2px', fontWeight: '600' }}>{t('Yolcu Sayısı', 'Passengers')}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{t('Kaç kişisiniz?', 'How many people?')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button onClick={() => setYolcuSayisi(Math.max(1, yolcuSayisi - 1))} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', minWidth: '22px', textAlign: 'center' }}>{yolcuSayisi}</span>
                <button onClick={() => setYolcuSayisi(Math.min(15, yolcuSayisi + 1))} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(13,126,160,0.4)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <button disabled={!binisNokta} onClick={() => setStep('inis')}
              style={{ width: '100%', padding: '14px', background: binisNokta ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: binisNokta ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: binisNokta ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {t('İniş Noktasını Seç →', 'Select Drop-off →')}
            </button>
          </div>
        )}

        {/* ── ADIM 2: İNİŞ ── */}
        {step === 'inis' && (
          <div className="fadeup">
            <button onClick={() => setStep('binis')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← {t('Geri', 'Back')}</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>{t('ADIM 2', 'STEP 2')}</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>{t('Nereye gideceksiniz?', 'Where are you going?')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px' }}>{t('Biniş:', 'Board:')} <span style={{ color: '#00c6ff' }}>⚓ {binisNokta?.isim}</span></p>
            <Harita active={step === 'inis'} onSelect={setInisNokta} selectedId={inisNokta?.id} allowCustom={true} noktalar={noktalar} flyToOnLoad={inisNokta} />
            {inisNokta ? <SecilenKart nokta={inisNokta} /> : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span>👆</span><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{t('Haritada bir nokta seçin', 'Select a point on the map')}</p>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 8px' }}>{t('Nereye gittiğinizden emin değil misiniz?', 'Not sure where you\'re going?')}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '9px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none', fontSize: '13px' }}>💬 WhatsApp</a>
                <a href={`tel:${TEL}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'white', textDecoration: 'none', fontSize: '13px' }}>📞 {t('Ara', 'Call')}</a>
              </div>
            </div>
            <button disabled={!inisNokta} onClick={() => setStep('zamantekne')}
              style={{ width: '100%', padding: '14px', background: inisNokta ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: inisNokta ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: inisNokta ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {t('Zaman & Tekne Seç →', 'Time & Boat →')}
            </button>
          </div>
        )}

        {/* ── ADIM 3: ZAMAN & TEKNE (BİRLEŞİK) ── */}
        {step === 'zamantekne' && (
          <div className="fadeup">
            <button onClick={() => setStep('inis')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← {t('Geri', 'Back')}</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>{t('ADIM 3', 'STEP 3')}</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px' }}>{t('Ne zaman & hangi tekne?', 'When & which boat?')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 20px' }}>
              ⚓ {binisNokta?.isim} → 📍 {inisAdi} · 👥 {yolcuSayisi} {t('kişi', 'people')}
            </p>

            {/* ── Hemen ── */}
            <div className="card-hover" onClick={() => { setZamanMode('simdi') }}
              style={{ background: zamanMode === 'simdi' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${zamanMode === 'simdi' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>{t('Hemen Gelsin', 'Come Now')}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', margin: 0 }}>{t('En yakın müsait bot yönlendirilir', 'Nearest available boat dispatched')}</p>
              </div>
              {zamanMode === 'simdi' && <span style={{ color: '#4ade80', fontSize: '18px' }}>✓</span>}
            </div>

            {/* ── Belirli Saat ── */}
            <div
              onClick={() => { if (zamanMode !== 'planli') { setZamanMode('planli') } }}
              style={{ background: zamanMode === 'planli' ? 'rgba(13,126,160,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${zamanMode === 'planli' ? 'rgba(13,126,160,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '16px', cursor: zamanMode === 'planli' ? 'default' : 'pointer', marginBottom: '18px', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: zamanMode === 'planli' ? '18px' : 0 }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(13,126,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🕐</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 2px' }}>{t('Belirli Bir Saatte', 'At a Specific Time')}</p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', margin: 0 }}>
                    {zamanMode === 'planli' ? `${secilenTarihStr || '...'} · ${dispSaat}:${dispDakika}` : t('Tarih ve saati siz belirleyin', 'You choose the date and time')}
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
                          {g === 'bugun' ? t('Bugün', 'Today') : g === 'yarin' ? t('Yarın', 'Tomorrow') : t('Diğer Gün', 'Other Day')}
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
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', margin: '0 0 10px' }}>{t('KALKIŞ SAATİ', 'DEPARTURE TIME')}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <div onClick={e => { e.stopPropagation(); setSaatAcik(!saatAcik); setDakikaAcik(false) }}
                        style={{ width: '78px', height: '76px', borderRadius: '14px', background: saatAcik ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.07)', border: `2px solid ${saatAcik ? 'rgba(0,198,255,0.6)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '34px', fontWeight: 'bold', color: saatAcik ? '#00c6ff' : 'white', letterSpacing: '-1px', lineHeight: 1 }}>{dispSaat}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '0.08em' }}>{t('SAAT', 'HOUR')}</span>
                      </div>
                      <span style={{ fontSize: '30px', fontWeight: 'bold', color: 'rgba(255,255,255,0.35)', margin: '0 2px', marginBottom: '14px' }}>:</span>
                      <div onClick={e => { e.stopPropagation(); setDakikaAcik(!dakikaAcik); setSaatAcik(false) }}
                        style={{ width: '78px', height: '76px', borderRadius: '14px', background: dakikaAcik ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.07)', border: `2px solid ${dakikaAcik ? 'rgba(0,198,255,0.6)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '34px', fontWeight: 'bold', color: dakikaAcik ? '#00c6ff' : 'white', letterSpacing: '-1px', lineHeight: 1 }}>{dispDakika}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '0.08em' }}>{t('DAKİKA', 'MIN')}</span>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '8px 0 0' }}>{t('Tıklayarak seçin', 'Tap to select')}</p>
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
                    {zamanMode === 'simdi' ? t('ANLIK MÜSAİTLİK', 'INSTANT AVAILABILITY') : `${secilenTarihStr ? secilenTarihStr.toUpperCase() + ' · ' : ''}${dispSaat}:${dispDakika} ${t('İÇİN MÜSAİTLİK', 'AVAILABILITY')}`}
                  </p>
                  {musaitSayisi > 0
                    ? <span style={{ color: '#4ade80', fontSize: '12px' }}>✓ {musaitSayisi} {t('tekne müsait', 'boats available')}</span>
                    : <span style={{ color: '#fca5a5', fontSize: '12px' }}>{t('⚠ Müsait tekne yok', '⚠ No boats available')}</span>
                  }
                </div>

                {musaitSayisi === 0 && (
                  <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', textAlign: 'center' }}>
                    <p style={{ color: '#fca5a5', fontSize: '14px', margin: '0 0 6px', fontWeight: 'bold' }}>{t('Bu saatte müsait tekne bulunamadı', 'No boats available at this time')}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{t('Farklı bir saat seçin veya WhatsApp üzerinden ulaşın', 'Try a different time or contact us via WhatsApp')}</p>
                  </div>
                )}

                {/* Müsait */}
                {tekneMusaitlikleri.filter(x => x.durum === 'musait').map(({ tekne, durum, aciklama }) => (
                  <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama}
                    secili={seciliTekne === tekne.id}
                    detayAcik={tekneDetayAcik === tekne.id}
                    onSec={() => { setSeciliTekne(tekne.id); setTekneDetayAcik(tekne.id) }}
                    onDetayToggle={() => setTekneDetayAcik(prev => prev === tekne.id ? null : tekne.id)}
                  />
                ))}

                {/* Seferde */}
                {tekneMusaitlikleri.filter(x => x.durum === 'mesgul').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>{t('SEFERDE', 'ON TRIP')}</p>
                    {tekneMusaitlikleri.filter(x => x.durum === 'mesgul').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                {/* Kapasite yetersiz */}
                {tekneMusaitlikleri.filter(x => x.durum === 'kapasiteyetersiz').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>{t('KAPASİTE YETERSİZ', 'OVER CAPACITY')}</p>
                    {tekneMusaitlikleri.filter(x => x.durum === 'kapasiteyetersiz').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                {/* Hizmet dışı */}
                {tekneMusaitlikleri.filter(x => x.durum === 'hizmetdisi').length > 0 && (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.1em', margin: '14px 0 8px' }}>{t('HİZMET DIŞI', 'OUT OF SERVICE')}</p>
                    {tekneMusaitlikleri.filter(x => x.durum === 'hizmetdisi').map(({ tekne, durum, aciklama }) => (
                      <TekneKart key={tekne.id} tekne={tekne} durum={durum} aciklama={aciklama} secili={false} detayAcik={false} onSec={() => {}} onDetayToggle={() => {}} />
                    ))}
                  </>
                )}

                <button disabled={!seciliTekne} onClick={() => setStep('ozet')}
                  style={{ width: '100%', padding: '14px', marginTop: '8px', background: seciliTekne ? '#0D7EA0' : 'rgba(255,255,255,0.07)', color: seciliTekne ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: seciliTekne ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                  {t('Özeti Gör →', 'See Summary →')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ADIM 4: ÖZET ── */}
        {step === 'ozet' && (
          <div className="fadeup">
            <button onClick={() => setStep('zamantekne')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>← {t('Geri', 'Back')}</button>
            <p style={{ color: '#0D7EA0', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '5px' }}>{t('ÖZET', 'SUMMARY')}</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 18px' }}>{t('Rezervasyonunuzu Onaylayın', 'Confirm Your Booking')}</h2>

            <div style={{ background: 'rgba(13,126,160,0.08)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              {([
                ['⚓ ' + t('Biniş', 'Board'), binisNokta?.isim ?? '-'],
                ['📍 ' + t('İniş', 'Drop-off'), inisAdi],
                ['👥 ' + t('Yolcu', 'Pax'), `${yolcuSayisi} ${t('kişi', 'people')}`],
                ['🕐 ' + t('Zaman', 'Time'), zamanEtiketi()],
                ['⛵ ' + t('Tekne', 'Boat'), teknelerRez.find(tkn => tkn.id === seciliTekne)?.isim ?? '-'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>{k}</span>
                  <span style={{ color: 'white', fontSize: '14px', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
              {inisNokta?.tip === 'custom' && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,107,53,0.1)', borderRadius: '8px', border: '1px solid rgba(255,107,53,0.22)' }}>
                  <p style={{ color: '#ff9a6c', fontSize: '12px', margin: 0 }}>{t('📍 Özel nokta — ücret varışta mesafeye göre hesaplanır', '📍 Custom point — fare calculated by distance at arrival')}</p>
                </div>
              )}
              <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0 }}>{t('💳 Ödeme sefer sonunda nakit veya kart ile alınır', '💳 Payment by cash or card at end of trip')}</p>
              </div>
            </div>

            {user && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.12em', display: 'block', marginBottom: '8px' }}>{t('TELEFON NUMARANIZ', 'YOUR PHONE NUMBER')}</label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={e => setTelefon(e.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '15px', boxSizing: 'border-box', fontFamily: 'Georgia,serif', outline: 'none' }}
                />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '6px 0 0' }}>
                  {t('📞 Konumunuza geldiğinde kaptanımız sizi arayacak', '📞 Your captain will call when they arrive')}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user && (
                <button onClick={() => alert(t('Supabase entegrasyonu yakında aktif!', 'Supabase integration coming soon!'))}
                  style={{ width: '100%', padding: '15px', background: '#0D7EA0', color: 'white', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {t('✅ Rezervasyonu Onayla', '✅ Confirm Booking')}
                </button>
              )}
              <a href={whatsappUrl()} target="_blank" rel="noreferrer"
                style={{ width: '100%', padding: '14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366', borderRadius: '11px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                {t('💬 WhatsApp ile Rezervasyon', '💬 Book via WhatsApp')}
              </a>
              {!user && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(13,126,160,0.06)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '11px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{t('Online rezervasyon için', 'For online booking')}</span>
                  <button onClick={() => navigate('/giris')} style={{ background: 'none', border: 'none', color: '#00c6ff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontFamily: 'Georgia,serif' }}>
                    {t('giriş yapın →', 'sign in →')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
