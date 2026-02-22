'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'

// Bu veri gerçekte Supabase'den gelecek
const TEKNELER_DETAY = [
  {
    id: 'bot1', isim: 'Göcek I', kapasite: 12, model: 'Ribeye 750',
    durum: 'musait', emoji: '⛵', yil: 2019, uzunluk: '7.5m', motor: '150 HP Yamaha',
    hiz: '35 knot', yakit: 'Benzin',
    aciklama: 'Göcek koylarını keşfetmek için ideal, konforlu ve hızlı tekne. Geniş güverte alanı ve yüzme platformu ile hem gölge sevenler hem de deniz tutkunları için mükemmel bir seçim.',
    ozellikler: ['Güneşlik', 'Deniz suyu', 'Yüzme merdiveni', 'Bluetooth müzik', 'Soğutma kutusu'],
    renk: '#0D7EA0',
    glow: 'rgba(13,126,160,0.5)',
  },
  {
    id: 'bot2', isim: 'Göcek II', kapasite: 8, model: 'Ranieri 585',
    durum: 'musait', emoji: '🚤', yil: 2021, uzunluk: '5.85m', motor: '115 HP Mercury',
    hiz: '40 knot', yakit: 'Benzin',
    aciklama: 'Küçük gruplar için hız ve manevra kabiliyetiyle öne çıkan tekne. 2021 model filomuzun en yeni üyesi, konfor ve performansı bir arada sunuyor.',
    ozellikler: ['Yüksek hız', 'Müzik sistemi', 'Soğutma kutusu', 'Bimini gölgelik', 'Bluetooth'],
    renk: '#00c6ff',
    glow: 'rgba(0,198,255,0.5)',
  },
  {
    id: 'bot3', isim: 'Göcek III', kapasite: 15, model: 'Lomac 700 TT',
    durum: 'mesgul', emoji: '⛴️', yil: 2018, uzunluk: '7.0m', motor: '200 HP Suzuki',
    hiz: '30 knot', yakit: 'Benzin',
    aciklama: 'Büyük gruplar için geniş güverte ve eksiksiz konfor. Filomuzun en büyük teknesi, 15 kişiye kadar rahatça seyahat imkânı sunar.',
    ozellikler: ['Büyük platform', 'Tam gölgelik', 'WC', 'Derin hacim', 'Bluetooth müzik', 'Soğutma kutusu'],
    renk: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
  },
  {
    id: 'bot4', isim: 'Göcek IV', kapasite: 10, model: 'Joker Coaster 580',
    durum: 'hizmetdisi', emoji: '🛥️', yil: 2020, uzunluk: '5.8m', motor: '150 HP Honda',
    hiz: '38 knot', yakit: 'Benzin',
    aciklama: 'Orta boy gruplar için çok yönlü ve dayanıklı tekne. Şu anda bakım sürecinde, yakında tekrar hizmetinizde.',
    ozellikler: ['Güneşlik', 'Soğutma kutusu', 'Yüzme merdiveni'],
    renk: '#6b7280',
    glow: 'rgba(107,114,128,0.2)',
  },
]

export default function TekneDetayPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const tekne = TEKNELER_DETAY.find(t => t.id === id)

  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  if (!tekne) {
    return (
      <div style={{ minHeight: '100vh', background: '#050e1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Georgia,serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>⚓</p>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Tekne bulunamadı</p>
          <button onClick={() => router.back()} style={{ marginTop: '16px', padding: '10px 24px', background: '#0D7EA0', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>← Geri</button>
        </div>
      </div>
    )
  }

  const musait = tekne.durum === 'musait'
  const hizmetdisi = tekne.durum === 'hizmetdisi'

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isHovering) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setRotX(-dy * 15)
    setRotY(dx * 15)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes boatIdle {
          0%,100% { transform: translateY(0px) rotate(-1.5deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        @keyframes waveAnim {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.7); }
        }
        .detail-card { animation: fadeUp 0.4s ease-out both; }
        .ozellik-chip {
          padding: 8px 14px; border-radius: 20px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6); font-size: 13px;
          display: inline-block;
        }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(5,14,29,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '14px', padding: '4px 0' }}>← Tekneler</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{tekne.emoji}</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{tekne.isim}</span>
        </div>
        <div style={{ width: '64px' }} />
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 60px' }}>

        {/* ── 3D HERO BÖLÜMÜ ── */}
        <div style={{ position: 'relative', marginBottom: '28px', overflow: 'hidden' }}>
          {/* Arka plan glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '280px', height: '280px', borderRadius: '50%',
            background: `radial-gradient(circle, ${tekne.glow} 0%, transparent 70%)`,
            animation: 'glowPulse 3s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Deniz dalgaları */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', overflow: 'hidden', opacity: musait ? 0.4 : 0.1 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '100%', animation: 'waveAnim 4s linear infinite' }}>
              <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '50%', height: '100%', display: 'inline-block' }}>
                <path d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 L1440,60 L0,60 Z" fill={tekne.renk} fillOpacity="0.3" />
              </svg>
              <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '50%', height: '100%', display: 'inline-block' }}>
                <path d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 L1440,60 L0,60 Z" fill={tekne.renk} fillOpacity="0.3" />
              </svg>
            </div>
          </div>

          {/* 3D Tekne */}
          <div
            style={{ padding: '48px 0 72px', display: 'flex', justifyContent: 'center', perspective: '600px', cursor: musait ? 'grab' : 'default' }}
            onMouseEnter={() => { if (musait) setIsHovering(true) }}
            onMouseLeave={() => { setIsHovering(false); setRotX(0); setRotY(0) }}
            onMouseMove={handleMouseMove}
          >
            <div style={{
              fontSize: '96px', lineHeight: 1,
              transform: isHovering
                ? `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.05)`
                : `rotateX(0deg) rotateY(0deg)`,
              transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
              animation: musait && !isHovering ? 'boatIdle 3.5s ease-in-out infinite' : 'none',
              filter: hizmetdisi ? 'grayscale(0.8) opacity(0.5)' : `drop-shadow(0 8px 24px ${tekne.renk}66)`,
              transformStyle: 'preserve-3d',
              userSelect: 'none',
            }}>
              {tekne.emoji}
            </div>
          </div>

          {/* Shimmer overlay — only when musait */}
          {musait && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120px', height: '120px',
              background: `conic-gradient(from 0deg, transparent, ${tekne.renk}22, transparent)`,
              borderRadius: '50%',
              animation: 'waveAnim 6s linear infinite',
              pointerEvents: 'none',
            }} />
          )}

          {musait && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', position: 'absolute', bottom: '70px', left: 0, right: 0 }}>
              Tekneye fareyle dokunun
            </p>
          )}
        </div>

        {/* İsim + Durum */}
        <div className="detail-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{tekne.isim}</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 12px' }}>{tekne.model} · {tekne.yil}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: musait ? 'rgba(34,197,94,0.12)' : hizmetdisi ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)', border: `1px solid ${musait ? 'rgba(34,197,94,0.3)' : hizmetdisi ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.25)'}` }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: musait ? '#22c55e' : hizmetdisi ? 'rgba(255,255,255,0.3)' : '#f59e0b', display: 'inline-block', boxShadow: musait ? '0 0 6px #22c55e' : 'none', animation: musait ? 'pulseDot 2s infinite' : 'none' }} />
            <span style={{ color: musait ? '#4ade80' : hizmetdisi ? 'rgba(255,255,255,0.35)' : '#fbbf24', fontSize: '13px', fontWeight: 'bold' }}>
              {musait ? 'Müsait' : hizmetdisi ? 'Hizmet Dışı' : 'Şu an Seferde'}
            </span>
          </div>
        </div>

        {/* Teknik özellikler grid */}
        <div className="detail-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px', animationDelay: '60ms' }}>
          {[
            { ikon: '📏', etiket: 'Uzunluk', deger: tekne.uzunluk },
            { ikon: '⚙️', etiket: 'Motor', deger: tekne.motor },
            { ikon: '💨', etiket: 'Max Hız', deger: tekne.hiz },
            { ikon: '👥', etiket: 'Kapasite', deger: `${tekne.kapasite} kişi` },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>{item.ikon}</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 3px', letterSpacing: '0.05em' }}>{item.etiket.toUpperCase()}</p>
                <p style={{ color: 'white', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>{item.deger}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Açıklama */}
        <div className="detail-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px', marginBottom: '20px', animationDelay: '100ms' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{tekne.aciklama}</p>
        </div>

        {/* Özellikler */}
        <div className="detail-card" style={{ marginBottom: '28px', animationDelay: '140ms' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.12em', margin: '0 0 12px' }}>DONANIM</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tekne.ozellikler.map((o, i) => (
              <span key={i} className="ozellik-chip">{o}</span>
            ))}
          </div>
        </div>

        {/* CTA butonları */}
        <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', animationDelay: '180ms' }}>
          {musait ? (
            <button
              onClick={() => router.push('/rezervasyon')}
              style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${tekne.renk}, ${tekne.renk}cc)`, color: 'white', border: 'none', borderRadius: '13px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia,serif', boxShadow: `0 4px 24px ${tekne.glow}`, transition: 'all 0.2s' }}>
              ⛵ Bu Tekne ile Rezervasyon Yap
            </button>
          ) : (
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              {hizmetdisi ? '🔧 Bu tekne şu an bakımda, diğer teknelerden rezervasyon yapabilirsiniz.' : '⏳ Bu tekne şu an seferde. Rezervasyon için diğer tekneleri inceleyebilirsiniz.'}
            </div>
          )}
          <button onClick={() => router.back()}
            style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)', borderRadius: '13px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
            ← Tüm Teknelere Bak
          </button>
        </div>
      </div>
    </div>
  )
}