'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import DumenLoading from '../../components/LoadingSpinner'
import { useLang } from '../../components/LangProvider'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const KOYLAR = [
  { id: 'tersane',     isim: 'Tersane Koyu',     sure: '8 dk',  emoji: '🏛️' },
  { id: 'akvaryum',   isim: 'Akvaryum Koyu',    sure: '10 dk', emoji: '🐟' },
  { id: 'yassica',    isim: 'Yassıca Adası',    sure: '15 dk', emoji: '🏝️' },
  { id: 'boynuz',     isim: 'Boynuz Bükü',      sure: '20 dk', emoji: '⚓' },
  { id: 'bedri',      isim: 'Bedri Rahmi Koyu', sure: '18 dk', emoji: '🎨' },
  { id: 'sarsala',    isim: 'Büyük Sarsala',    sure: '25 dk', emoji: '🌿' },
  { id: 'hamam',      isim: 'Hamam Koyu',       sure: '22 dk', emoji: '💎' },
  { id: 'gocek_adasi',isim: 'Göcek Adası',      sure: '12 dk', emoji: '🌊' },
]

export default function AnaSayfa() {
  const router = useRouter()
  const { lang, setLang, t: tr } = useLang()
  const [loading, setLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [activeKoy, setActiveKoy] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const OZELLIKLER = [
    { icon: '⚡', baslik: tr('Anında Taksi', 'Instant Taxi'), aciklama: tr('Kaptan onayı dakikalar içinde. Bekleme yok.', 'Captain confirmation in minutes. No waiting.') },
    { icon: '📍', baslik: tr('Gerçek Zamanlı Takip', 'Real-Time Tracking'), aciklama: tr('Botunuzu haritada canlı izleyin, ETA takibi yapın.', 'Track your boat live on the map with ETA.') },
    { icon: '🗺️', baslik: tr('Kolay Rota Seçimi', 'Easy Route Selection'), aciklama: tr('Haritadan iniş biniş noktanızı kolayca seçin.', 'Select your pickup & drop-off on the map.') },
    { icon: '🛡️', baslik: tr('Güvenli Ödeme', 'Secure Payment'), aciklama: tr('Güvenli ödeme seçenekleri, sefer sonrası ücretlendirme.', 'Secure payment options, charged after the trip.') },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setActiveKoy(k => (k + 1) % KOYLAR.length), 2500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleCikis() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    setUser(null)
  }

  function handleRezervasyon() {
    setLoading(true)
    setTimeout(() => router.push('/rezervasyon'), 900)
  }

  function handleTekneler() {
    setLoading(true)
    setTimeout(() => router.push('/tekneler'), 900)
  }

  function handleGiris() {
    setLoading(true)
    setTimeout(() => router.push('/giris'), 900)
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''

  const langBtn = (
    <button
      onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia,serif', letterSpacing: '0.05em' }}
    >
      {lang === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
    </button>
  )

  return (
    <div style={{ background: '#050e1d', minHeight: '100vh', fontFamily: "'Georgia', serif", overflowX: 'hidden' }}>
      {loading && <DumenLoading text={tr('Hazırlanıyor', 'Loading')} />}

      {/* NAV */}
      <nav className="nav-inner" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        background: scrollY > 50 ? 'rgba(5,14,29,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚓</span>
          <div>
            <span className="nav-logo-text" style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.05em' }}>Göcek Bot Taksi</span>
            <div className="nav-logo-sub" style={{ color: '#0D7EA0', fontSize: '10px', letterSpacing: '0.2em' }}>GÖCEK · TÜRKİYE</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleTekneler} className="nav-tekneler-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', padding: '8px 14px', borderRadius: '20px', transition: 'all 0.2s', fontFamily: 'Georgia,serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
            ⛵ {tr('Teknelerimiz', 'Our Boats')}
          </button>
          {langBtn}
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div className="avatar-btn" onClick={() => setMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '25px', padding: '6px 14px 6px 6px',
                boxShadow: menuOpen ? '0 0 0 3px rgba(13,126,160,0.4)' : 'none',
              }}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="profil"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D7EA0, #00c6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
                    {initials}
                  </div>
                )}
                <span className="avatar-name" style={{ color: 'white', fontSize: '14px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', transform: menuOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
              </div>

              {menuOpen && (
                <div className="dropdown" style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'rgba(10,22,40,0.97)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', padding: '8px',
                  minWidth: '200px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '6px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 2px', letterSpacing: '0.08em' }}>{tr('HESABINIZ', 'YOUR ACCOUNT')}</p>
                    <p style={{ color: 'white', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                  {[
                    { icon: '🚤', label: tr('Taksi Çağır', 'Call a Taxi'), action: handleRezervasyon },
                    { icon: '⛵', label: tr('Teknelerimiz', 'Our Boats'), action: handleTekneler },
                    { icon: '📋', label: tr('Sefer Geçmişi', 'Trip History'), action: () => {} },
                    { icon: '👤', label: tr('Profil Ayarları', 'Profile Settings'), action: () => {} },
                  ].map(item => (
                    <div key={item.label} className="dropdown-item" onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span style={{ color: 'white', fontSize: '14px' }}>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '6px', paddingTop: '6px' }}>
                    <div className="dropdown-item" onClick={handleCikis} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🚪</span>
                      <span style={{ color: '#fca5a5', fontSize: '14px' }}>{tr('Çıkış Yap', 'Sign Out')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={handleGiris} className="btn-secondary nav-auth-btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', padding: '9px 18px', borderRadius: '25px', fontSize: '14px' }}>{tr('Giriş Yap', 'Sign In')}</button>
              <button onClick={handleRezervasyon} className="btn-primary nav-auth-btn" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '9px 18px', borderRadius: '25px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(13,126,160,0.35)' }}>{tr('Taksi Çağır →', 'Call a Taxi →')}</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {[
  { w: 2.3, op: 0.11, t: '27.5%', l: '22.3%' },
  { w: 2.5, op: 0.44, t: '89.2%', l: '8.7%' },
  { w: 1.8, op: 0.11, t: '21.9%', l: '50.5%' },
  { w: 1.1, op: 0.2, t: '65.0%', l: '54.5%' },
  { w: 1.4, op: 0.39, t: '80.9%', l: '0.6%' },
  { w: 2.6, op: 0.45, t: '34.0%', l: '15.5%' },
  { w: 2.9, op: 0.27, t: '9.3%', l: '9.7%' },
  { w: 2.7, op: 0.4, t: '80.7%', l: '73.0%' },
  { w: 2.1, op: 0.59, t: '37.9%', l: '55.2%' },
  { w: 2.7, op: 0.41, t: '86.2%', l: '57.7%' },
  { w: 2.4, op: 0.12, t: '22.8%', l: '28.9%' },
  { w: 1.2, op: 0.22, t: '10.1%', l: '27.8%' },
  { w: 2.3, op: 0.28, t: '37.0%', l: '21.0%' },
  { w: 1.5, op: 0.57, t: '64.8%', l: '60.9%' },
  { w: 1.3, op: 0.46, t: '16.3%', l: '37.9%' },
  { w: 3.0, op: 0.42, t: '55.7%', l: '68.5%' },
  { w: 2.7, op: 0.49, t: '22.9%', l: '3.2%' },
  { w: 1.6, op: 0.23, t: '21.1%', l: '94.3%' },
  { w: 2.8, op: 0.26, t: '65.5%', l: '39.6%' },
  { w: 2.8, op: 0.33, t: '26.5%', l: '24.7%' },
  { w: 2.1, op: 0.23, t: '58.5%', l: '89.8%' },
  { w: 1.8, op: 0.21, t: '99.8%', l: '51.0%' },
  { w: 1.2, op: 0.12, t: '11.0%', l: '62.7%' },
  { w: 2.6, op: 0.31, t: '6.4%', l: '38.2%' },
  { w: 3.0, op: 0.36, t: '97.1%', l: '86.1%' },
  { w: 1.0, op: 0.46, t: '68.2%', l: '53.7%' },
  { w: 1.5, op: 0.42, t: '11.2%', l: '43.5%' },
  { w: 1.9, op: 0.58, t: '87.6%', l: '26.3%' },
  { w: 2.0, op: 0.19, t: '91.3%', l: '87.1%' },
  { w: 1.6, op: 0.42, t: '60.9%', l: '15.3%' },
  { w: 2.5, op: 0.37, t: '77.9%', l: '53.0%' },
  { w: 1.0, op: 0.26, t: '1.9%', l: '92.9%' },
  { w: 2.8, op: 0.52, t: '30.8%', l: '5.8%' },
  { w: 2.8, op: 0.57, t: '8.6%', l: '48.6%' },
  { w: 1.1, op: 0.48, t: '76.6%', l: '12.8%' },
  { w: 2.0, op: 0.37, t: '26.5%', l: '87.2%' },
  { w: 1.8, op: 0.21, t: '53.9%', l: '73.0%' },
  { w: 1.4, op: 0.26, t: '99.5%', l: '65.0%' },
  { w: 1.9, op: 0.36, t: '12.1%', l: '22.5%' },
  { w: 1.7, op: 0.39, t: '23.0%', l: '22.0%' },
  { w: 1.1, op: 0.42, t: '22.9%', l: '90.5%' },
  { w: 2.7, op: 0.14, t: '23.8%', l: '66.9%' },
  { w: 1.4, op: 0.17, t: '93.6%', l: '57.1%' },
  { w: 1.9, op: 0.49, t: '80.7%', l: '19.0%' },
  { w: 1.2, op: 0.32, t: '42.4%', l: '46.7%' },
  { w: 2.5, op: 0.44, t: '98.4%', l: '9.8%' },
  { w: 1.8, op: 0.27, t: '86.2%', l: '24.9%' },
  { w: 1.4, op: 0.32, t: '42.2%', l: '27.9%' },
  { w: 1.5, op: 0.56, t: '44.3%', l: '86.1%' },
  { w: 2.1, op: 0.13, t: '99.9%', l: '83.6%' }
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: s.w + 'px', height: s.w + 'px',
            borderRadius: '50%', background: 'white',
            opacity: s.op, top: s.t, left: s.l,
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(13,126,160,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(0,198,255,0.08) 0%, transparent 60%)' }} />
{[1, 2, 3].map(i => (
          <div key={i} style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(13,126,160,0.12)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: `ripple ${3 + i}s ease-out ${i * 1.2}s infinite`, pointerEvents: 'none' }} />
        ))}

        <div style={{ textAlign: 'center', maxWidth: '780px', padding: '0 20px', position: 'relative', zIndex: 10, paddingTop: '80px' }}>
          <div className="fade1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(13,126,160,0.15)', border: '1px solid rgba(13,126,160,0.35)', borderRadius: '20px', padding: '6px 16px', marginBottom: '28px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00c6ff', display: 'inline-block', boxShadow: '0 0 8px #00c6ff' }} />
            <span style={{ color: '#00c6ff', fontSize: '13px', letterSpacing: '0.08em' }}>{tr('Göcek\'te Hizmetinizdeyiz', 'Serving Göcek')}</span>
          </div>

          <h1 className="fade2" style={{ margin: '0 0 12px', lineHeight: '1.1' }}>
            <span className="hero-title-sub" style={{ display: 'block', fontSize: '32px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' }}>
              {tr('Koyda Her Yere,', 'Every Cove,')}
            </span>
            <span className="hero-title-main shimmer-text" style={{ display: 'block', fontSize: '72px', fontWeight: 'bold' }}>
              {tr('Anında Ulaşım', 'Instantly')}
            </span>
          </h1>

          <p className="fade3 hero-desc" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', lineHeight: '1.6', margin: '0 0 36px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            {tr(
              'Göcek\'in eşsiz koylarına dakikalar içinde ulaşın. Profesyonel kaptanlar, konforlu tekneler.',
              'Reach Göcek\'s stunning coves in minutes. Professional captains, comfortable boats.'
            )}
          </p>

          <div className="fade3" style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
            <div className="koy-indicator" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', whiteSpace: 'nowrap' }}>{tr('Şu an', 'Now')}</span>
              <div key={activeKoy} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideKoy 0.4s ease-out' }}>
                <span style={{ fontSize: '18px' }}>{KOYLAR[activeKoy].emoji}</span>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{KOYLAR[activeKoy].isim}</span>
                <span style={{ background: 'rgba(13,126,160,0.25)', color: '#00c6ff', fontSize: '12px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(0,198,255,0.2)', whiteSpace: 'nowrap' }}>{KOYLAR[activeKoy].sure}</span>
              </div>
            </div>
          </div>

          <div className="fade4 hero-btns" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleRezervasyon} className="btn-primary" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '15px 36px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 12px 36px rgba(13,126,160,0.45)', letterSpacing: '0.02em' }}>
              ⚡ {tr('Taksi Çağır', 'Call a Taxi')}
            </button>
            {!user && (
              <button onClick={handleGiris} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '15px 28px', borderRadius: '30px', fontSize: '16px' }}>
                {tr('Giriş Yap', 'Sign In')}
              </button>
            )}
          </div>

          <div className="fade4 hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: '36px', marginTop: '52px', flexWrap: 'wrap' }}>
            {[
              { sayi: '1,200+', etiket: tr('Tamamlanan Sefer', 'Completed Trips') },
              { sayi: '8 dk',   etiket: tr('Ortalama Bekleme', 'Avg. Wait') },
              { sayi: '12',     etiket: tr('Aktif Bot', 'Active Boats') },
              { sayi: '22',     etiket: tr('Varış Noktası', 'Destinations') },
            ].map(s => (
              <div key={s.sayi} style={{ textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: '26px', fontWeight: 'bold' }}>{s.sayi}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.08em', marginTop: '4px' }}>{s.etiket}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, overflow: 'hidden', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#050e1d" />
          </svg>
        </div>
      </div>

      {/* KOYLAR */}
      <div style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ color: '#0D7EA0', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '12px' }}>{tr('KEŞFEDİN', 'EXPLORE')}</p>
          <h2 className="section-title" style={{ color: 'white', fontSize: '38px', fontWeight: 'bold', margin: '0 0 14px' }}>{tr('Göcek\'in En Güzel Koyları', "Göcek's Most Beautiful Coves")}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>{tr('Hepsine sizi dakikalar içinde götürüyoruz', 'We take you to all of them in minutes')}</p>
        </div>
        <div className="koy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {KOYLAR.map((koy, i) => (
            <div key={i} className="koy-card" onClick={() => { setLoading(true); setTimeout(() => router.push(`/rezervasyon?inis=${koy.id}`), 900) }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{koy.emoji}</span>
                <div>
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>{koy.isim}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '3px 0 0' }}>{tr('Göcek\'ten', 'From Göcek')}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#00c6ff', fontWeight: 'bold', fontSize: '17px', margin: 0 }}>{koy.sure}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{tr('uzaklıkta', 'away')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FİLOMUZ */}
      <div style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{ color: '#0D7EA0', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '12px' }}>{tr('FİLOMUZ', 'OUR FLEET')}</p>
          <h2 className="section-title" style={{ color: 'white', fontSize: '38px', fontWeight: 'bold', margin: '0 0 14px' }}>{tr('Teknelerimizle Tanışın', 'Meet Our Fleet')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>{tr('Modern ve bakımlı filomuz her zaman hizmetinizde', 'Our modern, well-maintained fleet is always at your service')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {[
            { emoji: '⛵', isim: 'Göcek I',   kapasite: 12, durum: 'musait' },
            { emoji: '🚤', isim: 'Göcek II',  kapasite: 8,  durum: 'musait' },
            { emoji: '⛴️', isim: 'Göcek III', kapasite: 15, durum: 'mesgul' },
            { emoji: '🛥️', isim: 'Göcek IV',  kapasite: 10, durum: 'hizmetdisi' },
          ].map((boat, i) => (
            <div key={i} className="koy-card" onClick={handleTekneler}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '13px', flexShrink: 0,
                background: boat.durum === 'musait' ? 'rgba(13,126,160,0.15)' : boat.durum === 'mesgul' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
                filter: boat.durum === 'hizmetdisi' ? 'grayscale(0.7)' : 'none',
              }}>
                {boat.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: boat.durum === 'hizmetdisi' ? 'rgba(255,255,255,0.4)' : 'white', fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px' }}>{boat.isim}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', background: boat.durum === 'musait' ? '#22c55e' : boat.durum === 'mesgul' ? '#f59e0b' : 'rgba(255,255,255,0.2)', boxShadow: boat.durum === 'musait' ? '0 0 5px #22c55e' : boat.durum === 'mesgul' ? '0 0 5px #f59e0b' : 'none' }} />
                  <span style={{ color: boat.durum === 'musait' ? '#4ade80' : boat.durum === 'mesgul' ? '#fbbf24' : 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                    {boat.durum === 'musait' ? tr('Müsait', 'Available') : boat.durum === 'mesgul' ? tr('Seferde', 'On Trip') : tr('Hizmet Dışı', 'Out of Service')}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginLeft: '4px' }}>· {boat.kapasite} {tr('kişi', 'pax')}</span>
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={handleTekneler} style={{ background: 'rgba(13,126,160,0.12)', border: '1px solid rgba(13,126,160,0.3)', color: '#00c6ff', padding: '12px 32px', borderRadius: '25px', fontSize: '15px', cursor: 'pointer', fontFamily: 'Georgia,serif', transition: 'all 0.2s' }}>
            {tr('Tüm Tekneleri İncele →', 'View All Boats →')}
          </button>
        </div>
      </div>

      {/* ÖZELLİKLER */}
      <div style={{ padding: '80px 20px', background: 'rgba(13,126,160,0.04)', borderTop: '1px solid rgba(13,126,160,0.1)', borderBottom: '1px solid rgba(13,126,160,0.1)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ color: '#0D7EA0', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '12px' }}>{tr('NEDEN BİZ?', 'WHY US?')}</p>
            <h2 className="section-title" style={{ color: 'white', fontSize: '38px', fontWeight: 'bold', margin: 0 }}>{tr('Her Şey Düşünüldü', 'Everything Considered')}</h2>
          </div>
          <div className="ozellik-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
            {OZELLIKLER.map((oz, i) => (
              <div key={i} className="ozellik-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '26px 22px' }}>
                <div style={{ fontSize: '34px', marginBottom: '14px' }}>{oz.icon}</div>
                <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: '0 0 8px' }}>{oz.baslik}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{oz.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '90px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(13,126,160,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="float" style={{ fontSize: '56px', marginBottom: '20px' }}>⚓</div>
          <h2 className="cta-title" style={{ color: 'white', fontSize: '44px', fontWeight: 'bold', margin: '0 0 14px' }}>{tr('Hazır mısınız?', 'Ready to go?')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px', margin: '0 0 36px' }}>{tr('Hemen bir bot çağırın', 'Call a boat right now')}</p>
          <button onClick={handleRezervasyon} className="btn-primary" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '16px 48px', borderRadius: '32px', fontSize: '17px', fontWeight: 'bold', boxShadow: '0 16px 48px rgba(13,126,160,0.5)', letterSpacing: '0.02em' }}>
            ⚡ {tr('Taksi Çağır →', 'Call a Taxi →')}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer-inner" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚓</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>© 2026 Göcek Bot Taksi</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Göcek, Muğla · Türkiye</p>
      </footer>
    </div>
  )
}
