'use client'

import { useRouter } from 'next/navigation'

const TEKNELER_DETAY = [
  {
    id: 'bot1', isim: 'Göcek I', kapasite: 12, model: 'Ribeye 750',
    durum: 'musait', emoji: '⛵', yil: 2019, uzunluk: '7.5m', motor: '150 HP Yamaha',
    aciklama: 'Göcek koylarını keşfetmek için ideal, konforlu ve hızlı tekne.',
    ozellikler: ['Güneşlik', 'Deniz suyu', 'Yüzme merdiveni', 'Bluetooth müzik'],
    renk: '#0D7EA0',
  },
  {
    id: 'bot2', isim: 'Göcek II', kapasite: 8, model: 'Ranieri 585',
    durum: 'musait', emoji: '🚤', yil: 2021, uzunluk: '5.85m', motor: '115 HP Mercury',
    aciklama: 'Küçük gruplar için hız ve manevra kabiliyetiyle öne çıkan tekne.',
    ozellikler: ['Yüksek hız', 'Müzik sistemi', 'Soğutma kutusu', 'Bimini gölgelik'],
    renk: '#00c6ff',
  },
  {
    id: 'bot3', isim: 'Göcek III', kapasite: 15, model: 'Lomac 700 TT',
    durum: 'mesgul', emoji: '⛴️', yil: 2018, uzunluk: '7.0m', motor: '200 HP Suzuki',
    aciklama: 'Büyük gruplar için geniş güverte ve eksiksiz konfor.',
    ozellikler: ['Büyük platform', 'Tam gölgelik', 'WC', 'Derin hacim', 'Bluetooth müzik'],
    renk: '#f59e0b',
  },
  {
    id: 'bot4', isim: 'Göcek IV', kapasite: 10, model: 'Joker Coaster 580',
    durum: 'hizmetdisi', emoji: '🛥️', yil: 2020, uzunluk: '5.8m', motor: '150 HP Honda',
    aciklama: 'Orta boy gruplar için çok yönlü ve dayanıklı tekne.',
    ozellikler: ['Güneşlik', 'Soğutma kutusu', 'Yüzme merdiveni'],
    renk: '#6b7280',
  },
]

const DURUM_ETIKET: Record<string, { metin: string; renk: string; bg: string }> = {
  musait: { metin: 'Müsait', renk: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
  mesgul: { metin: 'Seferde', renk: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
  hizmetdisi: { metin: 'Hizmet Dışı', renk: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
}

export default function TeknelerPage() {
  const router = useRouter()

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

        {/* Müsait tekneler */}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '12px' }}>MÜSAİT</p>
        {TEKNELER_DETAY.filter(t => t.durum === 'musait').map((tekne, i) => (
          <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
        ))}

        {/* Seferde */}
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.12em', margin: '20px 0 12px' }}>SEFERDE</p>
        {TEKNELER_DETAY.filter(t => t.durum === 'mesgul').map((tekne, i) => (
          <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60 + 120} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
        ))}

        {/* Hizmet dışı */}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.12em', margin: '20px 0 12px' }}>HİZMET DIŞI</p>
        {TEKNELER_DETAY.filter(t => t.durum === 'hizmetdisi').map((tekne, i) => (
          <TekneListeKarti key={tekne.id} tekne={tekne} delay={i * 60 + 180} onClick={() => router.push(`/tekneler/${tekne.id}`)} />
        ))}
      </div>
    </div>
  )
}

function TekneListeKarti({ tekne, delay, onClick }: { tekne: typeof TEKNELER_DETAY[number]; delay: number; onClick: () => void }) {
  const durum = DURUM_ETIKET[tekne.durum]
  const tiklanabilir = tekne.durum !== 'hizmetdisi'

  return (
    <div
      className={`tekne-card${!tiklanabilir ? ' disabled' : ''}`}
      style={{ animationDelay: `${delay}ms`, marginBottom: '12px' }}
      onClick={tiklanabilir ? onClick : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Emoji + float */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
          background: `linear-gradient(135deg, ${tekne.renk}22, ${tekne.renk}08)`,
          border: `1px solid ${tekne.renk}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px',
          animation: tiklanabilir ? 'boatFloat 3.5s ease-in-out infinite' : 'none',
          filter: !tiklanabilir ? 'grayscale(0.8)' : 'none',
        }}>
          {tekne.emoji}
        </div>

        {/* Bilgiler */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: !tiklanabilir ? 'rgba(255,255,255,0.4)' : 'white' }}>{tekne.isim}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: durum.bg }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: durum.renk, display: 'inline-block', boxShadow: tiklanabilir ? `0 0 5px ${durum.renk}` : 'none', animation: tekne.durum === 'musait' || tekne.durum === 'mesgul' ? 'pulseDot 2s infinite' : 'none' }} />
              <span style={{ color: durum.renk, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em' }}>{durum.metin}</span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: '0 0 8px' }}>{tekne.model} · {tekne.uzunluk} · {tekne.motor}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
              👥 Maks {tekne.kapasite} kişi
            </span>
          </div>
        </div>

        {tiklanabilir && (
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px', flexShrink: 0 }}>›</span>
        )}
      </div>
    </div>
  )
}