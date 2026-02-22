'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Tipler ────────────────────────────────────────────────────
interface Tekne {
  id: string; isim: string; kapasite: number; model: string; emoji: string
  durum: 'musait' | 'mesgul' | 'hizmetdisi'; yil: number; uzunluk: string
  motor: string; aciklama: string; ozellikler: string[]; renk: string
  hiz?: string; yakit?: string; glow?: string; sira?: number
}
interface Nokta { id: string; isim: string; lat: number; lng: number; tip: 'boarding' | 'koy' }
interface IstatistikItem { tekneId: string; donem: 'gunluk' | 'haftalik' | 'aylik'; sefer: number; yolcu: number; ciro: number }
interface RezLog { id: string; kaptan: string; tekne: string; binis: string; inis: string; yolcu: number; saat: string; not: string; zaman: string }

// ─── Sabitler ──────────────────────────────────────────────────
const VARSAYILAN_TEKNELER: Tekne[] = [
  { id: 'bot1', isim: 'Göcek I',   kapasite: 12, model: 'Ribeye 750',       emoji: '⛵',  durum: 'musait',    yil: 2019, uzunluk: '7.5m',  motor: '150 HP Yamaha',  aciklama: 'Göcek koylarını keşfetmek için ideal, konforlu ve hızlı tekne.', ozellikler: ['Güneşlik', 'Yüzme merdiveni', 'Bluetooth müzik'], renk: '#0D7EA0' },
  { id: 'bot2', isim: 'Göcek II',  kapasite: 8,  model: 'Ranieri 585',      emoji: '🚤', durum: 'musait',    yil: 2021, uzunluk: '5.85m', motor: '115 HP Mercury', aciklama: 'Küçük gruplar için hız ve manevra kabiliyetiyle öne çıkan tekne.', ozellikler: ['Yüksek hız', 'Müzik sistemi', 'Bimini gölgelik'], renk: '#00c6ff' },
  { id: 'bot3', isim: 'Göcek III', kapasite: 15, model: 'Lomac 700 TT',     emoji: '⛴️', durum: 'mesgul',    yil: 2018, uzunluk: '7.0m',  motor: '200 HP Suzuki',  aciklama: 'Büyük gruplar için geniş güverte ve eksiksiz konfor.', ozellikler: ['Büyük platform', 'Tam gölgelik', 'WC', 'Bluetooth müzik'], renk: '#f59e0b' },
  { id: 'bot4', isim: 'Göcek IV',  kapasite: 10, model: 'Joker Coaster 580',emoji: '🛥️', durum: 'hizmetdisi',yil: 2020, uzunluk: '5.8m',  motor: '150 HP Honda',   aciklama: 'Orta boy gruplar için çok yönlü ve dayanıklı tekne.', ozellikler: ['Güneşlik', 'Soğutma kutusu', 'Yüzme merdiveni'], renk: '#6b7280' },
]

const VARSAYILAN_NOKTALAR: Nokta[] = [
  { id: 'skopea',      isim: 'Skopea İskelesi',  lat: 36.7550, lng: 28.9200, tip: 'boarding' },
  { id: 'mucev',       isim: 'Muçev İskelesi',   lat: 36.7620, lng: 28.9350, tip: 'boarding' },
  { id: 'tersane',     isim: 'Tersane Koyu',      lat: 36.7850, lng: 28.9100, tip: 'koy' },
  { id: 'akvaryum',    isim: 'Akvaryum Koyu',     lat: 36.7900, lng: 28.8950, tip: 'koy' },
  { id: 'yassica',     isim: 'Yassıca Adası',     lat: 36.7750, lng: 28.8800, tip: 'koy' },
  { id: 'gocek_adasi', isim: 'Göcek Adası',       lat: 36.7680, lng: 28.9050, tip: 'koy' },
  { id: 'domuz',       isim: 'Domuz Adası',       lat: 36.7720, lng: 28.8700, tip: 'koy' },
  { id: 'boynuz',      isim: 'Boynuz Bükü',       lat: 36.7450, lng: 28.8600, tip: 'koy' },
  { id: 'at_buku',     isim: 'At Bükü',           lat: 36.7380, lng: 28.8750, tip: 'koy' },
  { id: 'hamam',       isim: 'Hamam Koyu',        lat: 36.8050, lng: 28.8900, tip: 'koy' },
  { id: 'boynuz2',     isim: 'Bedri Rahmi Koyu',  lat: 36.7200, lng: 28.9300, tip: 'koy' },
  { id: 'buyuksarsala',isim: 'Büyük Sarsala',     lat: 36.7150, lng: 28.9500, tip: 'koy' },
]

const VARSAYILAN_ISTATISTIK: IstatistikItem[] = [
  { tekneId: 'bot1', donem: 'gunluk',   sefer: 3,  yolcu: 28,  ciro: 4200 },
  { tekneId: 'bot2', donem: 'gunluk',   sefer: 4,  yolcu: 22,  ciro: 3300 },
  { tekneId: 'bot3', donem: 'gunluk',   sefer: 2,  yolcu: 26,  ciro: 5200 },
  { tekneId: 'bot4', donem: 'gunluk',   sefer: 0,  yolcu: 0,   ciro: 0 },
  { tekneId: 'bot1', donem: 'haftalik', sefer: 18, yolcu: 156, ciro: 23400 },
  { tekneId: 'bot2', donem: 'haftalik', sefer: 22, yolcu: 128, ciro: 19200 },
  { tekneId: 'bot3', donem: 'haftalik', sefer: 14, yolcu: 175, ciro: 35000 },
  { tekneId: 'bot4', donem: 'haftalik', sefer: 3,  yolcu: 24,  ciro: 3600 },
  { tekneId: 'bot1', donem: 'aylik',    sefer: 72, yolcu: 612, ciro: 91800 },
  { tekneId: 'bot2', donem: 'aylik',    sefer: 88, yolcu: 504, ciro: 75600 },
  { tekneId: 'bot3', donem: 'aylik',    sefer: 56, yolcu: 692, ciro: 138400 },
  { tekneId: 'bot4', donem: 'aylik',    sefer: 12, yolcu: 96,  ciro: 14400 },
]

const KAPTANLAR = [
  { id: 'kpt-1', ad: 'Ahmet Kaptan',  tekneId: 'bot1' },
  { id: 'kpt-2', ad: 'Mehmet Kaptan', tekneId: 'bot2' },
  { id: 'kpt-3', ad: 'Ali Kaptan',    tekneId: 'bot3' },
  { id: 'kpt-4', ad: 'Hasan Kaptan',  tekneId: 'bot4' },
]

const EMOJI_LİST = ['⛵', '🚤', '⛴️', '🛥️', '🚢', '⚓', '🏄', '🐋']
const RENK_LİST  = ['#0D7EA0', '#00c6ff', '#f59e0b', '#6b7280', '#10b981', '#ef4444', '#8b5cf6', '#f97316']
const ADMIN_PIN  = '0000'

// ─── Ortak stiller ─────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: '10px', color: '#0D7EA0', letterSpacing: '0.12em',
  textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold',
}
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: '14px',
  fontFamily: "'Georgia', serif", background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  color: 'white', boxSizing: 'border-box', transition: 'all 0.2s',
}

// ─── Marker oluşturucu ─────────────────────────────────────────
function createAdminMarkerEl(nokta: Nokta): HTMLDivElement {
  const isBoarding = nokta.tip === 'boarding'
  const container = document.createElement('div')
  container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;user-select:none;'
  const sz = isBoarding ? 36 : 30
  const icon = document.createElement('div')
  icon.style.cssText = [
    `width:${sz}px`, `height:${sz}px`, 'border-radius:50%',
    `background:${isBoarding ? 'rgba(13,126,160,0.85)' : 'rgba(8,24,50,0.9)'}`,
    `border:${isBoarding ? '2px solid #00c6ff' : '2px solid rgba(255,255,255,0.5)'}`,
    'display:flex', 'align-items:center', 'justify-content:center',
    `font-size:${isBoarding ? 15 : 13}px`,
    'box-shadow:0 2px 8px rgba(0,0,0,0.6)', 'transition:all 0.15s',
  ].join(';')
  icon.textContent = isBoarding ? '⚓' : '🏝️'
  container.appendChild(icon)
  const label = document.createElement('div')
  label.style.cssText = [
    'background:rgba(5,14,29,0.88)', 'color:rgba(255,255,255,0.85)', 'font-size:10px',
    'font-weight:600', 'white-space:nowrap', 'padding:2px 6px', 'border-radius:5px',
    'border:1px solid rgba(255,255,255,0.15)', 'line-height:1.3',
    'font-family:Georgia,serif', 'pointer-events:none',
  ].join(';')
  label.textContent = nokta.isim
  container.appendChild(label)
  return container
}

// ─── Ana bileşen ───────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted]         = useState(false)
  const [auth, setAuth]               = useState(false)
  const [pin, setPin]                 = useState('')
  const [pinHata, setPinHata]         = useState('')
  const [pinYuk, setPinYuk]           = useState(false)
  const [tab, setTab]                 = useState<'tekneler' | 'harita' | 'istatistik' | 'rezervasyon'>('tekneler')
  const [tekneler, setTekneler]       = useState<Tekne[]>([])
  const [noktalar, setNoktalar]       = useState<Nokta[]>([])
  const [veriYukleniyor, setVeriYuk]  = useState(false)

  const veriYukle = async () => {
    setVeriYuk(true)
    const [{ data: tkn }, { data: nkt }] = await Promise.all([
      supabase.from('tekneler').select('*').order('sira'),
      supabase.from('noktalar').select('*').order('created_at'),
    ])
    setTekneler(tkn ?? VARSAYILAN_TEKNELER)
    setNoktalar(nkt ?? VARSAYILAN_NOKTALAR)
    setVeriYuk(false)
  }

  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem('admin_auth') === 'true') {
      setAuth(true)
      veriYukle()
    }
  }, []) // eslint-disable-line

  const girisYap = () => {
    if (pin === ADMIN_PIN) {
      setPinYuk(true)
      setTimeout(() => {
        localStorage.setItem('admin_auth', 'true')
        setAuth(true)
        setPinYuk(false)
        veriYukle()
      }, 600)
    } else {
      setPinHata('Yanlış PIN'); setPin('')
    }
  }
  const cikis = () => { localStorage.removeItem('admin_auth'); setAuth(false) }

  if (!mounted) return null

  if (!auth) return (
    <PinEkrani
      pin={pin} setPin={setPin} hata={pinHata} setHata={setPinHata}
      onGiris={girisYap} yukleniyor={pinYuk}
      onGeri={() => router.push('/ana-sayfa')}
    />
  )

  if (veriYukleniyor) return (
    <div style={{ minHeight: '100vh', background: '#050e1d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif", color: 'rgba(255,255,255,0.4)', flexDirection: 'column', gap: '14px' }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(13,126,160,0.2)', borderTopColor: '#0D7EA0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '14px' }}>Veriler yükleniyor...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .adm-input:focus  { outline:none; border-color:rgba(13,126,160,0.6)!important; box-shadow:0 0 0 3px rgba(13,126,160,0.15)!important; }
        .adm-card         { transition:all 0.2s; }
        .adm-card:hover   { border-color:rgba(13,126,160,0.3)!important; }
        .adm-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(13,126,160,0.4)!important; }
        .adm-del:hover    { background:rgba(239,68,68,0.18)!important; border-color:rgba(239,68,68,0.5)!important; }
        .nokta-row:hover  { background:rgba(255,255,255,0.04)!important; }
        .kpt-btn          { transition:all 0.2s; }
        .kpt-btn:hover    { border-color:rgba(13,126,160,0.5)!important; background:rgba(13,126,160,0.08)!important; }
        .kpt-btn.sel      { background:rgba(13,126,160,0.2)!important; border-color:#0D7EA0!important; }
        ::-webkit-scrollbar       { width:4px }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:2px }
      `}</style>

      {/* Üst nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(5,14,29,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/ana-sayfa')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px', fontFamily: "'Georgia', serif" }}>← Geri</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚙️</span>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Admin Panel</span>
        </div>
        <button onClick={cikis} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', fontFamily: "'Georgia', serif" }}>Çıkış</button>
      </nav>

      {/* İçerik */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '76px' }}>
        {tab === 'tekneler'    && <TeknelerTab   tekneler={tekneler} setTekneler={setTekneler} />}
        {tab === 'harita'      && <HaritaTab     noktalar={noktalar} setNoktalar={setNoktalar} />}
        {tab === 'istatistik'  && <IstatistikTab tekneler={tekneler} istatistikler={VARSAYILAN_ISTATISTIK} />}
        {tab === 'rezervasyon' && <RezervasyonTab tekneler={tekneler} noktalar={noktalar} />}
      </div>

      {/* Alt tab nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(5,14,29,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', zIndex: 200 }}>
        {([
          { key: 'tekneler',    emoji: '⛵',  label: 'Tekneler' },
          { key: 'harita',      emoji: '🗺️',  label: 'Harita' },
          { key: 'istatistik',  emoji: '📊',  label: 'İstatistik' },
          { key: 'rezervasyon', emoji: '📋', label: 'Rezervasyon' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, background: 'none', border: 'none', color: tab === t.key ? '#00c6ff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '10px 0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontFamily: "'Georgia', serif", transition: 'color 0.2s' }}
          >
            <span style={{ fontSize: '22px' }}>{t.emoji}</span>
            <span style={{ fontSize: '10px', letterSpacing: '0.03em' }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── PIN Ekranı ────────────────────────────────────────────────
function PinEkrani({ pin, setPin, hata, setHata, onGiris, yukleniyor, onGeri }: {
  pin: string; setPin: (v: string) => void; hata: string; setHata: (v: string) => void
  onGiris: () => void; yukleniyor: boolean; onGeri: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#050e1d', fontFamily: "'Georgia', serif", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .pin-in:focus   { outline:none; border-color:rgba(13,126,160,0.6)!important; box-shadow:0 0 0 3px rgba(13,126,160,0.15)!important; }
        .pin-btn:hover:not(:disabled) { transform:translateY(-2px)!important; box-shadow:0 12px 32px rgba(13,126,160,0.4)!important; }
      `}</style>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(13,126,160,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <button onClick={onGeri} style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px', fontFamily: "'Georgia', serif" }}>← Ana Sayfa</button>
      <div style={{ fontSize: '52px', marginBottom: '12px', animation: 'float 3s ease-in-out infinite, fadeUp 0.6s ease-out both' }}>⚙️</div>
      <h1 style={{ fontSize: '26px', fontWeight: 'normal', marginBottom: '4px', animation: 'fadeUp 0.6s ease-out 0.1s both' }}>Admin Paneli</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px', animation: 'fadeUp 0.6s ease-out 0.2s both' }}>Göcek Bot Taksi — Yönetici Girişi</p>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '360px', animation: hata ? 'shake 0.4s ease-out' : 'fadeUp 0.6s ease-out 0.3s both', backdropFilter: 'blur(20px)' }}>
        <label style={{ display: 'block', fontSize: '11px', color: '#0D7EA0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>Admin PIN</label>
        <input
          className="pin-in"
          type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setHata('') }}
          onKeyDown={e => { if (e.key === 'Enter' && pin.length === 4) onGiris() }}
          placeholder="• • • •"
          style={{ width: '100%', padding: '16px 20px', fontSize: '28px', fontFamily: "'Georgia', serif", letterSpacing: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', color: 'white', boxSizing: 'border-box', transition: 'all 0.25s' }}
        />
        {hata && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>⚠️ {hata}</div>}
        <button
          className="pin-btn"
          onClick={onGiris} disabled={pin.length !== 4 || yukleniyor}
          style={{ width: '100%', padding: '16px', marginTop: '20px', fontSize: '15px', fontFamily: "'Georgia', serif", fontWeight: 'bold', color: 'white', background: pin.length === 4 ? 'linear-gradient(135deg, #0D7EA0, #0a8fb8)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '14px', cursor: pin.length === 4 && !yukleniyor ? 'pointer' : 'default', transition: 'all 0.3s', opacity: pin.length === 4 ? 1 : 0.4 }}
        >
          {yukleniyor ? <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>Giriş yapılıyor...</span> : 'Giriş Yap →'}
        </button>
      </div>
    </div>
  )
}

// ─── Tekneler Tab ──────────────────────────────────────────────
function TeknelerTab({ tekneler, setTekneler }: { tekneler: Tekne[]; setTekneler: (t: Tekne[]) => void }) {
  const [editId, setEditId]         = useState<string | null>(null)
  const [formAcik, setFormAcik]     = useState(false)
  const [confirmSil, setConfirmSil] = useState<string | null>(null)
  const [ozellikIn, setOzellikIn]   = useState('')
  const [form, setForm]             = useState<Partial<Tekne>>({})

  const bosForm = () => setForm({ emoji: '⛵', durum: 'musait', renk: '#0D7EA0', ozellikler: [], yil: new Date().getFullYear() })

  const acDuzenle = (t: Tekne) => { setEditId(t.id); setForm({ ...t }); setFormAcik(true) }
  const acYeni    = () => { bosForm(); setEditId(null); setFormAcik(true) }
  const kapat     = () => { setEditId(null); setFormAcik(false); setForm({}); setOzellikIn('') }

  const kaydet = async () => {
    if (!form.isim?.trim() || !form.model?.trim()) return
    if (editId) {
      const guncellenen = { ...form } as Tekne
      setTekneler(tekneler.map(t => t.id === editId ? { ...t, ...guncellenen } : t))
      await supabase.from('tekneler').update(guncellenen).eq('id', editId)
    } else {
      const yeni: Tekne = {
        id: 'bot' + Date.now(), isim: form.isim!, model: form.model!, kapasite: form.kapasite ?? 10,
        emoji: form.emoji ?? '⛵', durum: form.durum ?? 'musait', yil: form.yil ?? new Date().getFullYear(),
        uzunluk: form.uzunluk ?? '-', motor: form.motor ?? '-', aciklama: form.aciklama ?? '',
        ozellikler: form.ozellikler ?? [], renk: form.renk ?? '#0D7EA0',
        hiz: form.hiz, yakit: form.yakit ?? 'Benzin', sira: tekneler.length + 1,
      }
      setTekneler([...tekneler, yeni])
      await supabase.from('tekneler').insert(yeni)
    }
    kapat()
  }

  const sil = async (id: string) => {
    setTekneler(tekneler.filter(t => t.id !== id))
    setConfirmSil(null)
    await supabase.from('tekneler').delete().eq('id', id)
  }

  const ozellikEkle = () => {
    if (!ozellikIn.trim()) return
    setForm(f => ({ ...f, ozellikler: [...(f.ozellikler ?? []), ozellikIn.trim()] }))
    setOzellikIn('')
  }
  const ozellikSil = (i: number) => setForm(f => ({ ...f, ozellikler: (f.ozellikler ?? []).filter((_, idx) => idx !== i) }))

  const durumRenk: Record<string, string> = { musait: '#4ade80', mesgul: '#fbbf24', hizmetdisi: 'rgba(255,255,255,0.3)' }
  const durumMetin: Record<string, string> = { musait: 'Müsait', mesgul: 'Seferde', hizmetdisi: 'Hizmet Dışı' }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'normal' }}>Tekne Yönetimi</h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{tekneler.length} tekne kayıtlı</p>
        </div>
        <button
          className="adm-btn"
          onClick={acYeni}
          style={{ background: 'linear-gradient(135deg, #0D7EA0, #0a8fb8)', border: 'none', borderRadius: '12px', color: 'white', padding: '10px 18px', fontSize: '14px', fontFamily: "'Georgia', serif", cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 16px rgba(13,126,160,0.3)', transition: 'all 0.2s' }}
        >
          + Yeni Tekne
        </button>
      </div>

      {formAcik && (
        <TekneForm
          form={form} setForm={setForm} ozellikIn={ozellikIn} setOzellikIn={setOzellikIn}
          onOzellikEkle={ozellikEkle} onOzellikSil={ozellikSil}
          onKaydet={kaydet} onKapat={kapat} isEdit={!!editId}
        />
      )}

      {tekneler.map((tekne, i) => (
        <div key={tekne.id} className="adm-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', marginBottom: '12px', animation: `fadeUp 0.3s ease-out ${i * 50}ms both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: `linear-gradient(135deg, ${tekne.renk}22, ${tekne.renk}08)`, border: `1px solid ${tekne.renk}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{tekne.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{tekne.isim}</span>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', color: durumRenk[tekne.durum], background: `${durumRenk[tekne.durum]}18`, border: `1px solid ${durumRenk[tekne.durum]}40` }}>{durumMetin[tekne.durum]}</span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{tekne.model} · {tekne.kapasite} kişi · {tekne.uzunluk}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => acDuzenle(tekne)} style={{ background: 'rgba(13,126,160,0.12)', border: '1px solid rgba(13,126,160,0.25)', borderRadius: '10px', color: '#0D7EA0', cursor: 'pointer', padding: '8px 14px', fontSize: '13px', fontFamily: "'Georgia', serif", transition: 'all 0.2s' }}>Düzenle</button>
              {confirmSil === tekne.id ? (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="adm-del" onClick={() => sil(tekne.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', padding: '8px 12px', fontSize: '12px', fontFamily: "'Georgia', serif", transition: 'all 0.2s' }}>Evet Sil</button>
                  <button onClick={() => setConfirmSil(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 10px', fontSize: '12px', fontFamily: "'Georgia', serif" }}>İptal</button>
                </div>
              ) : (
                <button className="adm-del" onClick={() => setConfirmSil(tekne.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '8px 12px', fontSize: '14px', transition: 'all 0.2s' }}>🗑️</button>
              )}
            </div>
          </div>
          {tekne.ozellikler.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {tekne.ozellikler.map((o, j) => (
                <span key={j} style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{o}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tekne Formu ───────────────────────────────────────────────
function TekneForm({ form, setForm, ozellikIn, setOzellikIn, onOzellikEkle, onOzellikSil, onKaydet, onKapat, isEdit }: {
  form: Partial<Tekne>
  setForm: React.Dispatch<React.SetStateAction<Partial<Tekne>>>
  ozellikIn: string; setOzellikIn: (v: string) => void
  onOzellikEkle: () => void; onOzellikSil: (i: number) => void
  onKaydet: () => void; onKapat: () => void; isEdit: boolean
}) {
  const set = (k: keyof Tekne, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ background: 'rgba(13,126,160,0.06)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '20px', animation: 'fadeUp 0.25s ease-out both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#00c6ff' }}>{isEdit ? '✏️ Tekneyi Düzenle' : '+ Yeni Tekne'}</span>
        <button onClick={onKapat} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
      </div>

      {/* Emoji */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelSt}>EMOJİ</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EMOJI_LİST.map(e => (
            <button key={e} onClick={() => set('emoji', e)} style={{ width: '42px', height: '42px', borderRadius: '10px', border: form.emoji === e ? '2px solid #0D7EA0' : '1px solid rgba(255,255,255,0.1)', background: form.emoji === e ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: '20px' }}>{e}</button>
          ))}
        </div>
      </div>

      {/* 2 sütun alanlar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelSt}>İSİM *</label>
          <input className="adm-input" value={form.isim ?? ''} onChange={e => set('isim', e.target.value)} placeholder="Göcek I" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>MODEL *</label>
          <input className="adm-input" value={form.model ?? ''} onChange={e => set('model', e.target.value)} placeholder="Ribeye 750" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>KAPASİTE</label>
          <input className="adm-input" type="number" value={form.kapasite ?? ''} onChange={e => set('kapasite', parseInt(e.target.value) || 0)} placeholder="12" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>YIL</label>
          <input className="adm-input" type="number" value={form.yil ?? ''} onChange={e => set('yil', parseInt(e.target.value) || 0)} placeholder="2021" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>UZUNLUK</label>
          <input className="adm-input" value={form.uzunluk ?? ''} onChange={e => set('uzunluk', e.target.value)} placeholder="7.5m" style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>MOTOR</label>
          <input className="adm-input" value={form.motor ?? ''} onChange={e => set('motor', e.target.value)} placeholder="150 HP Yamaha" style={inputSt} />
        </div>
      </div>

      {/* Açıklama */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelSt}>AÇIKLAMA</label>
        <textarea className="adm-input" value={form.aciklama ?? ''} onChange={e => set('aciklama', e.target.value)} placeholder="Kısa açıklama..." rows={2} style={{ ...inputSt, resize: 'none' }} />
      </div>

      {/* Durum */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelSt}>DURUM</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['musait', 'mesgul', 'hizmetdisi'] as const).map(d => (
            <button key={d} onClick={() => set('durum', d)} style={{ flex: 1, padding: '8px 4px', borderRadius: '10px', border: form.durum === d ? '2px solid #0D7EA0' : '1px solid rgba(255,255,255,0.1)', background: form.durum === d ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.03)', color: form.durum === d ? '#00c6ff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '11px', fontFamily: "'Georgia', serif", transition: 'all 0.15s' }}>
              {d === 'musait' ? '✅ Müsait' : d === 'mesgul' ? '🔄 Seferde' : '🔧 Hizmet Dışı'}
            </button>
          ))}
        </div>
      </div>

      {/* Renk */}
      <div style={{ marginBottom: '14px' }}>
        <label style={labelSt}>RENK</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {RENK_LİST.map(r => (
            <button key={r} onClick={() => set('renk', r)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: r, border: form.renk === r ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.renk === r ? `0 0 10px ${r}` : 'none', transition: 'all 0.2s' }} />
          ))}
        </div>
      </div>

      {/* Özellikler */}
      <div style={{ marginBottom: '18px' }}>
        <label style={labelSt}>ÖZELLİKLER</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input className="adm-input" value={ozellikIn} onChange={e => setOzellikIn(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onOzellikEkle() } }} placeholder="Özellik ekle ve Enter'a bas..." style={{ ...inputSt, flex: 1 }} />
          <button onClick={onOzellikEkle} style={{ background: 'rgba(13,126,160,0.2)', border: '1px solid rgba(13,126,160,0.4)', borderRadius: '10px', color: '#0D7EA0', cursor: 'pointer', padding: '0 16px', fontSize: '20px' }}>+</button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(form.ozellikler ?? []).map((o, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(13,126,160,0.12)', border: '1px solid rgba(13,126,160,0.25)', borderRadius: '20px', color: '#00c6ff', fontSize: '12px' }}>
              {o}
              <button onClick={() => onOzellikSil(i)} style={{ background: 'none', border: 'none', color: 'rgba(0,198,255,0.5)', cursor: 'pointer', padding: 0, fontSize: '15px', lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Kaydet / İptal */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="adm-btn" onClick={onKaydet} style={{ flex: 1, background: 'linear-gradient(135deg, #0D7EA0, #0a8fb8)', border: 'none', borderRadius: '12px', color: 'white', padding: '14px', fontSize: '14px', fontFamily: "'Georgia', serif", fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,126,160,0.3)', transition: 'all 0.2s' }}>
          {isEdit ? '✅ Değişiklikleri Kaydet' : '+ Ekle'}
        </button>
        <button onClick={onKapat} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', padding: '14px 20px', fontSize: '14px', fontFamily: "'Georgia', serif", cursor: 'pointer' }}>İptal</button>
      </div>
    </div>
  )
}

// ─── Harita Tab ────────────────────────────────────────────────
function HaritaTab({ noktalar, setNoktalar }: { noktalar: Nokta[]; setNoktalar: (n: Nokta[]) => void }) {
  const mapRef        = useRef<any>(null)
  const mapboxglRef   = useRef<any>(null)
  const markerMapRef  = useRef<Map<string, any>>(new Map())
  const noktalarRef   = useRef(noktalar)
  const setNoktalarRef= useRef(setNoktalar)
  const containerRef  = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded]           = useState(false)
  const [yeniForm, setYeniForm]       = useState<{ lat: number; lng: number } | null>(null)
  const [yeniIsim, setYeniIsim]       = useState('')
  const [yeniTip, setYeniTip]         = useState<'boarding' | 'koy'>('boarding')
  const [seciliNokta, setSeciliNokta] = useState<Nokta | null>(null)

  useEffect(() => { noktalarRef.current = noktalar }, [noktalar])
  useEffect(() => { setNoktalarRef.current = setNoktalar }, [setNoktalar])

  const addMarkerToMap = useCallback((nokta: Nokta) => {
    if (!mapRef.current || !mapboxglRef.current) return
    const mgl = mapboxglRef.current
    const el  = createAdminMarkerEl(nokta)
    const marker = new mgl.Marker({ element: el, draggable: true })
      .setLngLat([nokta.lng, nokta.lat])
      .addTo(mapRef.current)

    el.addEventListener('click', (e: Event) => {
      e.stopPropagation()
      setSeciliNokta(noktalarRef.current.find(n => n.id === nokta.id) ?? nokta)
      setYeniForm(null)
    })

    marker.on('dragend', async () => {
      const { lng, lat } = marker.getLngLat()
      const updated = noktalarRef.current.map(n => n.id === nokta.id ? { ...n, lat, lng } : n)
      noktalarRef.current = updated
      setNoktalarRef.current(updated)
      await supabase.from('noktalar').update({ lat, lng }).eq('id', nokta.id)
    })

    markerMapRef.current.set(nokta.id, marker)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let alive = true
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (!alive || !containerRef.current) return
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [28.91, 36.765], zoom: 12,
        dragRotate: false, attributionControl: false,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
      mapRef.current    = map
      mapboxglRef.current = mapboxgl

      map.on('load', () => {
        setLoaded(true)
        noktalarRef.current.forEach(n => addMarkerToMap(n))
      })

      map.on('click', (e: any) => {
        if ((e.originalEvent.target as HTMLElement) !== map.getCanvas()) return
        setYeniForm({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        setYeniIsim(''); setYeniTip('boarding'); setSeciliNokta(null)
      })
    })
    return () => { alive = false; mapRef.current?.remove(); mapRef.current = null }
  }, [addMarkerToMap])

  const noktaEkle = async () => {
    if (!yeniIsim.trim() || !yeniForm) return
    const yeni: Nokta = { id: 'nokta_' + Date.now(), isim: yeniIsim.trim(), lat: yeniForm.lat, lng: yeniForm.lng, tip: yeniTip }
    const updated = [...noktalarRef.current, yeni]
    noktalarRef.current = updated
    setNoktalarRef.current(updated)
    addMarkerToMap(yeni)
    setYeniForm(null); setYeniIsim('')
    await supabase.from('noktalar').insert(yeni)
  }

  const noktaSil = async (id: string) => {
    const marker = markerMapRef.current.get(id)
    if (marker) { marker.remove(); markerMapRef.current.delete(id) }
    const updated = noktalarRef.current.filter(n => n.id !== id)
    noktalarRef.current = updated
    setNoktalarRef.current(updated)
    setSeciliNokta(null)
    await supabase.from('noktalar').delete().eq('id', id)
  }

  const noktaGuncelle = async (id: string, isim: string, tip: 'boarding' | 'koy') => {
    const updated = noktalarRef.current.map(n => n.id === id ? { ...n, isim, tip } : n)
    noktalarRef.current = updated
    setNoktalarRef.current(updated)
    setSeciliNokta(null)
    await supabase.from('noktalar').update({ isim, tip }).eq('id', id)
  }

  const noktayaGit = (n: Nokta) => {
    mapRef.current?.flyTo({ center: [n.lng, n.lat], zoom: 15, duration: 800 })
    setSeciliNokta(n); setYeniForm(null)
  }

  const popupStyle: React.CSSProperties = {
    position: 'absolute', bottom: '16px', left: '16px', right: '16px',
    background: 'rgba(5,14,29,0.96)', border: '1px solid rgba(13,126,160,0.3)',
    borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)',
    animation: 'fadeUp 0.2s ease-out both', maxWidth: '360px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Harita alanı */}
      <div style={{ flex: 1, position: 'relative', minHeight: '280px' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, background: '#050e1d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Harita yükleniyor...</div>
        )}
        {loaded && !yeniForm && !seciliNokta && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(5,14,29,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }}>
            📍 Boş yere tıkla → nokta ekle · Markeri sürükle → konum değiştir
          </div>
        )}

        {/* Yeni nokta formu */}
        {yeniForm && (
          <div style={popupStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00c6ff' }}>➕ Yeni Nokta Ekle</span>
              <button onClick={() => setYeniForm(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <input className="adm-input" value={yeniIsim} onChange={e => setYeniIsim(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') noktaEkle() }} placeholder="Nokta adı..." style={{ ...inputSt, marginBottom: '10px' }} autoFocus />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(['boarding', 'koy'] as const).map(t => (
                <button key={t} onClick={() => setYeniTip(t)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: yeniTip === t ? '2px solid #0D7EA0' : '1px solid rgba(255,255,255,0.1)', background: yeniTip === t ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.03)', color: yeniTip === t ? '#00c6ff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontFamily: "'Georgia', serif", transition: 'all 0.15s' }}>
                  {t === 'boarding' ? '⚓ İskele' : '🏝️ Koy'}
                </button>
              ))}
            </div>
            <button className="adm-btn" onClick={noktaEkle} disabled={!yeniIsim.trim()} style={{ width: '100%', background: yeniIsim.trim() ? 'linear-gradient(135deg, #0D7EA0, #0a8fb8)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', color: 'white', padding: '12px', fontSize: '14px', fontFamily: "'Georgia', serif", fontWeight: 'bold', cursor: yeniIsim.trim() ? 'pointer' : 'default', opacity: yeniIsim.trim() ? 1 : 0.4, transition: 'all 0.2s' }}>Noktayı Ekle</button>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center' }}>{yeniForm.lat.toFixed(5)}, {yeniForm.lng.toFixed(5)}</p>
          </div>
        )}

        {/* Nokta düzenleme paneli */}
        {seciliNokta && (
          <NoklaPanel nokta={seciliNokta} onKapat={() => setSeciliNokta(null)} onGuncelle={noktaGuncelle} onSil={noktaSil} />
        )}
      </div>

      {/* Nokta listesi */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '8px 16px 2px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{noktalar.length} Nokta</div>
        {noktalar.map(n => (
          <div key={n.id} className="nokta-row" onClick={() => noktayaGit(n)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', background: seciliNokta?.id === n.id ? 'rgba(13,126,160,0.1)' : 'transparent', transition: 'all 0.15s' }}>
            <span style={{ fontSize: '16px' }}>{n.tip === 'boarding' ? '⚓' : '🏝️'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px' }}>{n.isim}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{n.tip === 'boarding' ? 'İskele' : 'Koy'} · {n.lat.toFixed(4)}, {n.lng.toFixed(4)}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); noktaSil(n.id) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '16px', padding: '4px', transition: 'color 0.2s' }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Nokta Düzenleme Paneli ────────────────────────────────────
function NoklaPanel({ nokta, onKapat, onGuncelle, onSil }: {
  nokta: Nokta; onKapat: () => void
  onGuncelle: (id: string, isim: string, tip: 'boarding' | 'koy') => void
  onSil: (id: string) => void
}) {
  const [isim, setIsim] = useState(nokta.isim)
  const [tip, setTip]   = useState<'boarding' | 'koy'>(nokta.tip)
  const [onay, setOnay] = useState(false)
  useEffect(() => { setIsim(nokta.isim); setTip(nokta.tip); setOnay(false) }, [nokta.id])

  return (
    <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', background: 'rgba(5,14,29,0.96)', border: '1px solid rgba(13,126,160,0.3)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(20px)', animation: 'fadeUp 0.2s ease-out both', maxWidth: '360px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00c6ff' }}>✏️ Noktayı Düzenle</span>
        <button onClick={onKapat} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
      </div>
      <input className="adm-input" value={isim} onChange={e => setIsim(e.target.value)} style={{ ...inputSt, marginBottom: '10px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {(['boarding', 'koy'] as const).map(t => (
          <button key={t} onClick={() => setTip(t)} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: tip === t ? '2px solid #0D7EA0' : '1px solid rgba(255,255,255,0.1)', background: tip === t ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.03)', color: tip === t ? '#00c6ff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontFamily: "'Georgia', serif", transition: 'all 0.15s' }}>
            {t === 'boarding' ? '⚓ İskele' : '🏝️ Koy'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="adm-btn" onClick={() => onGuncelle(nokta.id, isim, tip)} style={{ flex: 1, background: 'linear-gradient(135deg, #0D7EA0, #0a8fb8)', border: 'none', borderRadius: '10px', color: 'white', padding: '10px', fontSize: '13px', fontFamily: "'Georgia', serif", fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Kaydet</button>
        {onay ? (
          <button className="adm-del" onClick={() => onSil(nokta.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#ef4444', padding: '10px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Georgia', serif", transition: 'all 0.2s' }}>Sil?</button>
        ) : (
          <button onClick={() => setOnay(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', padding: '10px 14px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}>🗑️</button>
        )}
      </div>
    </div>
  )
}

// ─── İstatistik Tab ────────────────────────────────────────────
function IstatistikTab({ tekneler, istatistikler }: { tekneler: Tekne[]; istatistikler: IstatistikItem[] }) {
  const [donem, setDonem] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk')

  const donIst     = istatistikler.filter(i => i.donem === donem)
  const topSefer   = donIst.reduce((s, i) => s + i.sefer, 0)
  const topYolcu   = donIst.reduce((s, i) => s + i.yolcu, 0)
  const topCiro    = donIst.reduce((s, i) => s + i.ciro, 0)
  const maxCiro    = Math.max(...donIst.map(i => i.ciro), 1)

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Başlık + dönem seçici */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'normal' }}>İstatistikler</h2>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', gap: '2px' }}>
          {(['gunluk', 'haftalik', 'aylik'] as const).map(d => (
            <button key={d} onClick={() => setDonem(d)} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', background: donem === d ? 'rgba(13,126,160,0.3)' : 'none', color: donem === d ? '#00c6ff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontFamily: "'Georgia', serif", transition: 'all 0.2s', fontWeight: donem === d ? 'bold' : 'normal' }}>
              {d === 'gunluk' ? 'Günlük' : d === 'haftalik' ? 'Haftalık' : 'Aylık'}
            </button>
          ))}
        </div>
      </div>

      {/* Toplam özet kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Toplam Sefer', val: topSefer.toString(), emoji: '⛵' },
          { label: 'Toplam Yolcu', val: topYolcu.toString(), emoji: '👥' },
          { label: 'Toplam Ciro',  val: topCiro.toLocaleString('tr-TR') + ' ₺', emoji: '💰' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'rgba(13,126,160,0.08)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '16px', padding: '16px 10px', textAlign: 'center', animation: `fadeUp 0.35s ease-out ${i * 80}ms both` }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{c.emoji}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00c6ff', marginBottom: '2px', wordBreak: 'break-all' }}>{c.val}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tekne bazlı */}
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Tekne Bazlı</p>
      {tekneler.map((tekne, i) => {
        const stat     = donIst.find(s => s.tekneId === tekne.id)
        const ciro     = stat?.ciro   ?? 0
        const sefer    = stat?.sefer  ?? 0
        const yolcu    = stat?.yolcu  ?? 0
        const progress = (ciro / maxCiro) * 100
        return (
          <div key={tekne.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px', marginBottom: '12px', animation: `fadeUp 0.35s ease-out ${(i + 3) * 60}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{tekne.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{tekne.isim}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{tekne.model}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00c6ff' }}>{ciro.toLocaleString('tr-TR')} ₺</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Ciro</div>
              </div>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${tekne.renk}, #00c6ff)`, borderRadius: '3px', transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[{ label: 'Sefer', val: sefer }, { label: 'Yolcu', val: yolcu }].map(({ label, val }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{val}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Rezervasyon Tab ───────────────────────────────────────────
function RezervasyonTab({ tekneler, noktalar }: { tekneler: Tekne[]; noktalar: Nokta[] }) {
  const [kaptanId, setKaptanId] = useState<string | null>(null)
  const [binisId, setBinisId]   = useState('')
  const [inisId, setInisId]     = useState('')
  const [yolcu, setYolcu]       = useState(2)
  const [saat, setSaat]         = useState('')
  const [not, setNot]           = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [log, setLog]           = useState<RezLog[]>([])

  const kaptan    = KAPTANLAR.find(k => k.id === kaptanId)
  const tekne     = tekneler.find(t => t.id === kaptan?.tekneId)
  const binisNk   = noktalar.find(n => n.id === binisId)
  const inisNk    = noktalar.find(n => n.id === inisId)
  const hazir     = kaptanId && binisId && inisId && saat

  const gonder = () => {
    if (!hazir || !kaptan || !tekne || !binisNk || !inisNk) return
    setGonderiyor(true)
    setTimeout(() => {
      setLog(prev => [{
        id: 'rez_' + Date.now(), kaptan: kaptan.ad, tekne: tekne.isim,
        binis: binisNk.isim, inis: inisNk.isim, yolcu, saat, not,
        zaman: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev])
      setGonderiyor(false); setBasarili(true)
      setKaptanId(null); setBinisId(''); setInisId(''); setYolcu(2); setSaat(''); setNot('')
      setTimeout(() => setBasarili(false), 3500)
    }, 900)
  }

  const selectSt: React.CSSProperties = { ...inputSt, cursor: 'pointer', background: '#0a1628' }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 'normal' }}>Rezervasyon Gönder</h2>
      <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Kaptana sefer talebi ilet</p>

      {/* Kaptan seçimi */}
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '10px', textTransform: 'uppercase' }}>Kaptan Seç</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
        {KAPTANLAR.map(k => {
          const t = tekneler.find(t => t.id === k.tekneId)
          const sel = kaptanId === k.id
          return (
            <button key={k.id} className={`kpt-btn${sel ? ' sel' : ''}`} onClick={() => setKaptanId(k.id)} style={{ background: sel ? 'rgba(13,126,160,0.2)' : 'rgba(255,255,255,0.03)', border: sel ? '2px solid #0D7EA0' : '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: "'Georgia', serif", display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '22px' }}>{t?.emoji ?? '⛵'}</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: sel ? '#00c6ff' : 'white' }}>{k.ad}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{t?.isim ?? '-'}</div>
            </button>
          )
        })}
      </div>

      {/* Biniş / İniş */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelSt}>BİNİŞ NOKTASI</label>
          <select className="adm-input" value={binisId} onChange={e => setBinisId(e.target.value)} style={selectSt}>
            <option value="">Seçin...</option>
            {noktalar.map(n => <option key={n.id} value={n.id}>{n.isim}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>İNİŞ NOKTASI</label>
          <select className="adm-input" value={inisId} onChange={e => setInisId(e.target.value)} style={selectSt}>
            <option value="">Seçin...</option>
            {noktalar.map(n => <option key={n.id} value={n.id}>{n.isim}</option>)}
          </select>
        </div>
      </div>

      {/* Yolcu + Saat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelSt}>YOLCU SAYISI</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setYolcu(Math.max(1, yolcu - 1))} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '20px', fontFamily: "'Georgia', serif", flexShrink: 0 }}>−</button>
            <span style={{ fontSize: '22px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{yolcu}</span>
            <button onClick={() => setYolcu(Math.min(tekne?.kapasite ?? 20, yolcu + 1))} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '20px', fontFamily: "'Georgia', serif", flexShrink: 0 }}>+</button>
          </div>
        </div>
        <div>
          <label style={labelSt}>KALKIŞ SAATİ</label>
          <input className="adm-input" type="time" value={saat} onChange={e => setSaat(e.target.value)} style={{ ...inputSt, colorScheme: 'dark' }} />
        </div>
      </div>

      {/* Not */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelSt}>NOT (OPSİYONEL)</label>
        <textarea className="adm-input" value={not} onChange={e => setNot(e.target.value)} placeholder="Kaptana özel not..." rows={2} style={{ ...inputSt, resize: 'none' }} />
      </div>

      {/* Sefer özeti */}
      {hazir && kaptan && binisNk && inisNk && (
        <div style={{ background: 'rgba(13,126,160,0.08)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '14px', padding: '14px', marginBottom: '16px', animation: 'fadeUp 0.2s ease-out both' }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#0D7EA0', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Sefer Özeti</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 16px', fontSize: '13px' }}>
            {[
              ['Kaptan', kaptan.ad],
              ['Tekne', tekne?.isim ?? '-'],
              ['Biniş', binisNk.isim],
              ['İniş', inisNk.isim],
              ['Yolcu', yolcu + ' kişi'],
              ['Saat', saat],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{k}</span>
                <span>{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Gönder butonu */}
      <button
        className="adm-btn"
        onClick={gonder} disabled={!hazir || gonderiyor}
        style={{ width: '100%', background: hazir ? 'linear-gradient(135deg, #0D7EA0, #0a8fb8)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '14px', color: 'white', padding: '16px', fontSize: '15px', fontFamily: "'Georgia', serif", fontWeight: 'bold', cursor: hazir && !gonderiyor ? 'pointer' : 'default', opacity: hazir ? 1 : 0.4, marginBottom: '12px', boxShadow: hazir ? '0 4px 20px rgba(13,126,160,0.3)' : 'none', transition: 'all 0.2s' }}
      >
        {gonderiyor ? <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>Gönderiliyor...</span> : '📤 Kaptana Gönder'}
      </button>

      {basarili && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '14px', textAlign: 'center', color: '#4ade80', fontSize: '14px', animation: 'fadeUp 0.3s ease-out both', marginBottom: '16px' }}>
          ✅ Rezervasyon kaptana iletildi!
        </div>
      )}

      {/* Gönderilen rezervasyonlar log */}
      {log.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '10px', textTransform: 'uppercase' }}>Gönderilen Rezervasyonlar</p>
          {log.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', animation: 'fadeUp 0.3s ease-out both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{r.kaptan} · {r.tekne}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{r.zaman}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                {r.binis} → {r.inis} · {r.yolcu} kişi · {r.saat}
              </div>
              {r.not && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontStyle: 'italic' }}>"{r.not}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
