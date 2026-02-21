'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GirisPage() {
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'giris') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: 'E-posta veya şifre hatalı.' })
      } else {
        window.location.href = '/ana-sayfa'
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data.user) {
        await supabase.from('users').insert({
          auth_id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
        })
        setMessage({ type: 'success', text: 'Hesabınız oluşturuldu! Giriş yapabilirsiniz.' })
        setMode('giris')
      }
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/ana-sayfa`,
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1628',
      display: 'flex',
      fontFamily: "'Georgia', serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes wave { 0%{transform:translateX(0) translateY(0)} 50%{transform:translateX(-25px) translateY(-15px)} 100%{transform:translateX(0) translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.8} 100%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .wave1{animation:wave 8s ease-in-out infinite}
        .wave2{animation:wave 12s ease-in-out infinite reverse}
        .form-card{animation:fadeUp 0.7s ease-out both}
        input:focus{outline:none;border-color:#0D7EA0!important;box-shadow:0 0 0 3px rgba(13,126,160,0.15)}
        .btn-primary:hover{background:#0b6a8a!important;transform:translateY(-1px)}
        .btn-google:hover{background:rgba(255,255,255,0.08)!important;transform:translateY(-1px)}
        .tab-btn:hover{color:white!important}
      `}</style>

      {/* Dekoratif daireler */}
      <div className="wave1" style={{ position:'absolute',width:'600px',height:'600px',borderRadius:'50%',top:'-200px',right:'-200px',background:'radial-gradient(circle,rgba(13,126,160,0.15) 0%,transparent 70%)',pointerEvents:'none' }} />
      <div className="wave2" style={{ position:'absolute',width:'400px',height:'400px',borderRadius:'50%',bottom:'-100px',left:'-100px',background:'radial-gradient(circle,rgba(26,60,94,0.4) 0%,transparent 70%)',pointerEvents:'none' }} />

      {/* Form alanı */}
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px',position:'relative',zIndex:10 }}>
        <div className="form-card" style={{ width:'100%',maxWidth:'420px' }}>

          {/* Logo */}
          <div style={{ textAlign:'center',marginBottom:'40px' }}>
            <div style={{ fontSize:'48px',marginBottom:'12px' }}>⚓</div>
            <h1 style={{ fontSize:'26px',fontWeight:'bold',color:'white',letterSpacing:'0.05em',margin:0 }}>Göcek Bot Taksi</h1>
            <p style={{ color:'#0D7EA0',fontSize:'14px',marginTop:'4px',fontStyle:'italic' }}>Koyda her yere, anında ulaşım</p>
          </div>

          {/* Kart */}
          <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'20px',padding:'36px',backdropFilter:'blur(20px)' }}>

            {/* Google Butonu */}
            <button onClick={handleGoogle} disabled={googleLoading} className="btn-google" style={{
              width:'100%',padding:'13px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.15)',
              borderRadius:'12px',
              color:'white',fontSize:'15px',
              cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',
              marginBottom:'20px',
              transition:'all 0.2s',
            }}>
              {googleLoading ? (
                <div style={{ width:'20px',height:'20px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
              )}
              Google ile {mode === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>

            {/* Ayraç */}
            <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px' }}>
              <div style={{ flex:1,height:'1px',background:'rgba(255,255,255,0.08)' }} />
              <span style={{ color:'rgba(255,255,255,0.3)',fontSize:'12px',letterSpacing:'0.1em' }}>VEYA</span>
              <div style={{ flex:1,height:'1px',background:'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Tab */}
            <div style={{ display:'flex',background:'rgba(0,0,0,0.3)',borderRadius:'10px',padding:'4px',marginBottom:'28px' }}>
              {(['giris','kayit'] as const).map((tab) => (
                <button key={tab} className="tab-btn"
                  onClick={() => { setMode(tab); setMessage(null) }}
                  style={{ flex:1,padding:'10px',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'600',transition:'all 0.2s',background:mode===tab?'#0D7EA0':'transparent',color:mode===tab?'white':'rgba(255,255,255,0.4)' }}>
                  {tab === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {mode === 'kayit' && (
                <div style={{ display:'flex',gap:'12px',marginBottom:'16px' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:'block',color:'rgba(255,255,255,0.6)',fontSize:'12px',marginBottom:'6px',letterSpacing:'0.05em' }}>AD</label>
                    <input value={firstName} onChange={e=>setFirstName(e.target.value)} required placeholder="Ahmet" style={inputStyle} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:'block',color:'rgba(255,255,255,0.6)',fontSize:'12px',marginBottom:'6px',letterSpacing:'0.05em' }}>SOYAD</label>
                    <input value={lastName} onChange={e=>setLastName(e.target.value)} required placeholder="Yılmaz" style={inputStyle} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block',color:'rgba(255,255,255,0.6)',fontSize:'12px',marginBottom:'6px',letterSpacing:'0.05em' }}>E-POSTA</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@email.com" style={inputStyle} />
              </div>

              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block',color:'rgba(255,255,255,0.6)',fontSize:'12px',marginBottom:'6px',letterSpacing:'0.05em' }}>ŞİFRE</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
              </div>

              {message && (
                <div style={{ padding:'12px 16px',borderRadius:'10px',marginBottom:'16px',fontSize:'14px',background:message.type==='error'?'rgba(239,68,68,0.15)':'rgba(34,197,94,0.15)',color:message.type==='error'?'#fca5a5':'#86efac',border:`1px solid ${message.type==='error'?'rgba(239,68,68,0.3)':'rgba(34,197,94,0.3)'}` }}>
                  {message.text}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%',padding:'14px',background:'#0D7EA0',color:'white',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,transition:'all 0.2s',letterSpacing:'0.03em',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px' }}>
                {loading && <div style={{ width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />}
                {loading ? '...' : mode==='giris' ? 'Giriş Yap' : 'Hesap Oluştur'}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:'12px',marginTop:'24px' }}>© 2026 Göcek Bot Taksi</p>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:'100%',padding:'12px 16px',
  background:'rgba(255,255,255,0.06)',
  border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:'10px',color:'white',fontSize:'15px',
  transition:'border-color 0.2s,box-shadow 0.2s',
  boxSizing:'border-box',
}