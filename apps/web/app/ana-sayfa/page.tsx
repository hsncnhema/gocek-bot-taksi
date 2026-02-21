'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import DumenLoading from '../../components/LoadingSpinner'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const KOYLAR = [
  { isim: 'Tersane Adası', sure: '8 dk', emoji: '🏛️' },
  { isim: 'Sarsala Koyu', sure: '12 dk', emoji: '🌿' },
  { isim: 'Yassıca Adaları', sure: '18 dk', emoji: '🏝️' },
  { isim: 'Cleopatra Koyu', sure: '22 dk', emoji: '✨' },
  { isim: 'Küçük Göcek', sure: '6 dk', emoji: '⚓' },
  { isim: 'Boynuzbükü', sure: '25 dk', emoji: '🐠' },
]

const OZELLIKLER = [
  { icon: '⚡', baslik: 'Anında Rezervasyon', aciklama: 'Kaptan onayı dakikalar içinde. Bekleme yok.' },
  { icon: '📍', baslik: 'Gerçek Zamanlı Takip', aciklama: 'Botunuzu haritada canlı izleyin, ETA takibi yapın.' },
  { icon: '⭐', baslik: 'Puanlı Kaptanlar', aciklama: 'Yüzlerce sefer deneyimli, lisanslı kaptanlar.' },
  { icon: '🛡️', baslik: 'Güvenli Ödeme', aciklama: 'Iyzico ile güvenli ödeme, sefer sonrası ücretlendirme.' },
]

export default function AnaSayfa() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [activeKoy, setActiveKoy] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Kullanıcı oturumunu al
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
    const t = setInterval(() => setActiveKoy(k => (k + 1) % KOYLAR.length), 2500)
    return () => clearInterval(t)
  }, [])

  // Menü dışına tıklayınca kapat
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

  function handleGiris() {
    setLoading(true)
    setTimeout(() => router.push('/giris'), 900)
  }

  const parallaxY = scrollY * 0.35
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''

  return (
    <div style={{ background: '#050e1d', minHeight: '100vh', fontFamily: "'Georgia', serif", overflowX: 'hidden' }}>
      {loading && <DumenLoading text="Hazırlanıyor" />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)} }
        @keyframes floatWave { 0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)} }
        @keyframes shimmerText { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
        @keyframes ripple { 0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(2.4);opacity:0} }
        @keyframes slideKoy { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes dropDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        .fade1{animation:fadeUp 0.8s ease-out 0.1s both}
        .fade2{animation:fadeUp 0.8s ease-out 0.3s both}
        .fade3{animation:fadeUp 0.8s ease-out 0.5s both}
        .fade4{animation:fadeUp 0.8s ease-out 0.7s both}
        .float{animation:floatWave 4s ease-in-out infinite}
        .shimmer-text{
          background:linear-gradient(90deg,#ffffff,#00c6ff,#ffffff,#0D7EA0,#ffffff);
          background-size:300% 100%;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          animation:shimmerText 5s ease-in-out infinite;
        }
        .btn-primary{transition:all 0.25s;cursor:pointer}
        .btn-primary:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(13,126,160,0.5)!important}
        .btn-secondary{transition:all 0.25s;cursor:pointer}
        .btn-secondary:hover{background:rgba(255,255,255,0.1)!important;transform:translateY(-2px)}
        .koy-card{transition:all 0.2s;cursor:pointer}
        .koy-card:hover{border-color:rgba(13,126,160,0.5)!important;transform:translateY(-4px)}
        .ozellik-card{transition:all 0.25s}
        .ozellik-card:hover{transform:translateY(-6px);border-color:rgba(13,126,160,0.4)!important}
        .stat-num{background:linear-gradient(135deg,#00c6ff,#0D7EA0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .dropdown{animation:dropDown 0.2s ease-out both}
        .dropdown-item{transition:background 0.15s;cursor:pointer}
        .dropdown-item:hover{background:rgba(255,255,255,0.08)!important}
        .avatar-btn{transition:all 0.2s;cursor:pointer}
        .avatar-btn:hover{transform:scale(1.05);box-shadow:0 0 0 3px rgba(13,126,160,0.5)!important}
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        background: scrollY > 50 ? 'rgba(5,14,29,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>⚓</span>
          <div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.05em' }}>Göcek Bot Taksi</span>
            <div style={{ color: '#0D7EA0', fontSize: '10px', letterSpacing: '0.2em' }}>GÖCEK · TÜRKİYE</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            /* Giriş yapılmış — avatar + dropdown */
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div className="avatar-btn" onClick={() => setMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '25px', padding: '6px 16px 6px 6px',
                boxShadow: menuOpen ? '0 0 0 3px rgba(13,126,160,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>
                {/* Avatar */}
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="profil"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D7EA0, #00c6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                    {initials}
                  </div>
                )}
                <span style={{ color: 'white', fontSize: '14px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
              </div>

              {/* Dropdown menü */}
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
                  {/* Kullanıcı bilgisi */}
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '6px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 2px', letterSpacing: '0.08em' }}>HESABINIZ</p>
                    <p style={{ color: 'white', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>

                  {[
                    { icon: '🚤', label: 'Rezervasyon Yap', action: handleRezervasyon },
                    { icon: '📋', label: 'Sefer Geçmişi', action: () => {} },
                    { icon: '👤', label: 'Profil Ayarları', action: () => {} },
                  ].map(item => (
                    <div key={item.label} className="dropdown-item" onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span style={{ color: 'white', fontSize: '14px' }}>{item.label}</span>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '6px', paddingTop: '6px' }}>
                    <div className="dropdown-item" onClick={handleCikis} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🚪</span>
                      <span style={{ color: '#fca5a5', fontSize: '14px' }}>Çıkış Yap</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Giriş yapılmamış */
            <>
              <button onClick={handleGiris} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', padding: '10px 22px', borderRadius: '25px', fontSize: '14px' }}>Giriş Yap</button>
              <button onClick={handleRezervasyon} className="btn-primary" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '10px 22px', borderRadius: '25px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(13,126,160,0.35)' }}>Rezervasyon →</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(13,126,160,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(0,198,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(26,60,94,0.3) 0%, transparent 60%)' }} />

        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 2 + 1 + 'px', height: Math.random() * 2 + 1 + 'px',
            borderRadius: '50%', background: 'white',
            opacity: Math.random() * 0.6 + 0.1,
            top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
            transform: `translateY(${parallaxY * (Math.random() * 0.5 + 0.1)}px)`,
            transition: 'transform 0.1s linear',
          }} />
        ))}

        {[1, 2, 3].map(i => (
          <div key={i} style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(13,126,160,0.15)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: `ripple ${3 + i}s ease-out ${i * 1.2}s infinite`, pointerEvents: 'none' }} />
        ))}

        <div style={{ textAlign: 'center', maxWidth: '780px', padding: '0 24px', position: 'relative', zIndex: 10 }}>
          <div className="fade1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(13,126,160,0.15)', border: '1px solid rgba(13,126,160,0.35)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00c6ff', display: 'inline-block', boxShadow: '0 0 8px #00c6ff' }} />
            <span style={{ color: '#00c6ff', fontSize: '13px', letterSpacing: '0.08em' }}>Göcek'te Hizmetinizdeyiz</span>
          </div>

          <h1 className="fade2" style={{ fontSize: '64px', fontWeight: 'bold', margin: '0 0 16px', lineHeight: '1.1', color: 'white' }}>
            Koyda Her Yere,<br />
            <span className="shimmer-text">Anında Ulaşım</span>
          </h1>

          <p className="fade3" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '20px', lineHeight: '1.6', margin: '0 0 40px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            Göcek'in eşsiz koylarına dakikalar içinde ulaşın. Profesyonel kaptanlar, konforlu tekneler.
          </p>

          <div className="fade3" style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Şu an</span>
              <div key={activeKoy} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideKoy 0.4s ease-out' }}>
                <span style={{ fontSize: '18px' }}>{KOYLAR[activeKoy].emoji}</span>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{KOYLAR[activeKoy].isim}</span>
                <span style={{ background: 'rgba(13,126,160,0.25)', color: '#00c6ff', fontSize: '12px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(0,198,255,0.2)' }}>{KOYLAR[activeKoy].sure}</span>
              </div>
            </div>
          </div>

          <div className="fade4" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleRezervasyon} className="btn-primary" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '16px 40px', borderRadius: '30px', fontSize: '17px', fontWeight: 'bold', boxShadow: '0 12px 36px rgba(13,126,160,0.45)', letterSpacing: '0.02em' }}>
              Bot Rezervasyonu Yap
            </button>
            {!user && (
              <button onClick={handleGiris} className="btn-secondary" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '16px 32px', borderRadius: '30px', fontSize: '17px' }}>
                Giriş Yap
              </button>
            )}
          </div>

          <div className="fade4" style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '56px', flexWrap: 'wrap' }}>
            {[
              { sayi: '1,200+', etiket: 'Tamamlanan Sefer' },
              { sayi: '4.9★', etiket: 'Ortalama Puan' },
              { sayi: '8 dk', etiket: 'Ortalama Bekleme' },
              { sayi: '12', etiket: 'Aktif Bot' },
            ].map(s => (
              <div key={s.sayi} style={{ textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: '28px', fontWeight: 'bold' }}>{s.sayi}</div>
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
      <div style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ color: '#0D7EA0', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '12px' }}>KEŞFEDİN</p>
          <h2 style={{ color: 'white', fontSize: '42px', fontWeight: 'bold', margin: '0 0 16px' }}>Göcek'in En Güzel Koyları</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '17px', maxWidth: '480px', margin: '0 auto' }}>Hepsine sizi dakikalar içinde götürüyoruz</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {KOYLAR.map((koy, i) => (
            <div key={i} className="koy-card" onClick={handleRezervasyon} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '32px' }}>{koy.emoji}</span>
                <div>
                  <p style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{koy.isim}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>Göcek'ten</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#00c6ff', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{koy.sure}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>uzaklıkta</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ÖZELLİKLER */}
      <div style={{ padding: '80px 24px', background: 'rgba(13,126,160,0.04)', borderTop: '1px solid rgba(13,126,160,0.1)', borderBottom: '1px solid rgba(13,126,160,0.1)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#0D7EA0', fontSize: '13px', letterSpacing: '0.2em', marginBottom: '12px' }}>NEDEN BİZ?</p>
            <h2 style={{ color: 'white', fontSize: '42px', fontWeight: 'bold', margin: 0 }}>Her Şey Düşünüldü</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {OZELLIKLER.map((oz, i) => (
              <div key={i} className="ozellik-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px 24px' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{oz.icon}</div>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>{oz.baslik}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{oz.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(13,126,160,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="float" style={{ fontSize: '64px', marginBottom: '24px' }}>⚓</div>
          <h2 style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', margin: '0 0 16px' }}>Hazır mısınız?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', margin: '0 0 40px' }}>İlk rezervasyonunuzu şimdi yapın</p>
          <button onClick={handleRezervasyon} className="btn-primary" style={{ background: '#0D7EA0', border: 'none', color: 'white', padding: '18px 56px', borderRadius: '32px', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 16px 48px rgba(13,126,160,0.5)', letterSpacing: '0.02em' }}>
            Hemen Rezervasyon Yap →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚓</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>© 2026 Göcek Bot Taksi</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Göcek, Muğla · Türkiye</p>
      </footer>
    </div>
  )
}