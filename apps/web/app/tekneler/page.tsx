'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Tekne {
  id: string
  isim: string
  kapasite: number
  model: string
  emoji: string
  durum: 'musait' | 'mesgul' | 'hizmetdisi'
  yil?: number
  uzunluk?: string
  motor?: string
  hiz?: string
  yakit?: string
  aciklama?: string
  ozellikler: string[]
  renk: string
  glow?: string
  sira?: number
}

const DURUM_ETIKET: Record<string, { metin: string; renk: string; bg: string }> = {
  musait: { metin: 'Müsait', renk: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
  mesgul: { metin: 'Seferde', renk: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
  hizmetdisi: { metin: 'Hizmet Dışı', renk: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
}

export default function TeknelerPage() {
  const router = useRouter()
  const [tekneler, setTekneler] = useState<Tekne[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    supabase
      .from('tekneler')
      .select('*')
      .order('sira')
      .then(({ data }) => {
        if (data) setTekneler(data as Tekne[])
        setYukleniyor(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes boatFloat {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.7); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tekne-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 22px;
          cursor: pointer;
          transition: all 0.25s;
          animation: fadeUp 0.4s ease-out both;
        }
        .tekne-card:hover {
          background: rgba(13,126,160,0.07);
          border-color: rgba(13,126,160,0.3);
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.35);
        }
        .tekne-card.disabled { cursor: default; opacity: 0.5; }
        .tekne-card.disabled:hover { transform: none; background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.06); box-shadow: none; }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(5,14,29,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '14px', padding: '4px 0' }}>← Geri</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⛵</span>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Teknelerimiz</span>
        </div>
        <div style={{ width: '48px' }} />
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 20px 60px' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', margin: '0 0 28px', textAlign: 'center' }}>
          Filomuz hakkında bilgi almak için bir tekneye tıklayın.
        </p>

        {yukleniyor ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(13,126,160,0.3)', borderTopColor: '#0D7EA0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Müsait tekneler */}
            {tekneler.filter(t => t.durum === 'musait').length > 0 && (
              <>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '12px' }}>MÜSAİT</p>
                {tekneler.filter(t => t.durum === 'musait').map((tekne, i) => (
                  <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
                ))}
              </>
            )}

            {/* Seferde */}
            {tekneler.filter(t => t.durum === 'mesgul').length > 0 && (
              <>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.12em', margin: '20px 0 12px' }}>SEFERDE</p>
                {tekneler.filter(t => t.durum === 'mesgul').map((tekne, i) => (
                  <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60 + 120} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
                ))}
              </>
            )}

            {/* Hizmet dışı */}
            {tekneler.filter(t => t.durum === 'hizmetdisi').length > 0 && (
              <>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.12em', margin: '20px 0 12px' }}>HİZMET DIŞI</p>
                {tekneler.filter(t => t.durum === 'hizmetdisi').map((tekne, i) => (
                  <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60 + 180} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
                ))}
              </>
            )}

            {tekneler.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>⛵</p>
                <p>Henüz tekne eklenmemiş.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TekneListeKarti({ tekne, delay, onClick }: { tekne: Tekne; delay: number; onClick: () => void }) {
  const durum = DURUM_ETIKET[tekne.durum]
  const hizmetdisi = tekne.durum === 'hizmetdisi'

  return (
    <div
      className={`tekne-card${hizmetdisi ? ' disabled' : ''}`}
      style={{ animationDelay: `${delay}ms`, marginBottom: '12px', opacity: hizmetdisi ? 0.6 : 1 }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Emoji + float */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
          background: `linear-gradient(135deg, ${tekne.renk}22, ${tekne.renk}08)`,
          border: `1px solid ${tekne.renk}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px',
          animation: !hizmetdisi ? 'boatFloat 3.5s ease-in-out infinite' : 'none',
          filter: hizmetdisi ? 'grayscale(0.8)' : 'none',
        }}>
          {tekne.emoji}
        </div>

        {/* Bilgiler */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: hizmetdisi ? 'rgba(255,255,255,0.4)' : 'white' }}>{tekne.isim}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: durum.bg }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: durum.renk, display: 'inline-block', boxShadow: !hizmetdisi ? `0 0 5px ${durum.renk}` : 'none', animation: tekne.durum === 'musait' || tekne.durum === 'mesgul' ? 'pulseDot 2s infinite' : 'none' }} />
              <span style={{ color: durum.renk, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em' }}>{durum.metin}</span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 8px' }}>
            {tekne.model}{tekne.uzunluk ? ` · ${tekne.uzunluk}` : ''}{tekne.motor ? ` · ${tekne.motor}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
              👥 Maks {tekne.kapasite} kişi
            </span>
          </div>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px', flexShrink: 0 }}>›</span>
      </div>
    </div>
  )
}
