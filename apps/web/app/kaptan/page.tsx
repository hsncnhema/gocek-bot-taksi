'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock kaptan verileri (ileride Supabase auth ile değişecek)
const KAPTANLAR = [
  { id: 'kpt-1', ad: 'Ahmet Kaptan', kod: '1234', tekneId: 'gocek-1', tekneAd: 'Göcek I' },
  { id: 'kpt-2', ad: 'Mehmet Kaptan', kod: '5678', tekneId: 'gocek-2', tekneAd: 'Göcek II' },
  { id: 'kpt-3', ad: 'Ali Kaptan', kod: '9012', tekneId: 'gocek-3', tekneAd: 'Göcek III' },
  { id: 'kpt-4', ad: 'Hasan Kaptan', kod: '3456', tekneId: 'gocek-4', tekneAd: 'Göcek IV' },
];

export default function KaptanGiris() {
  const router = useRouter();
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Eğer zaten giriş yapılmışsa panele yönlendir
    const kaptan = localStorage.getItem('kaptan');
    if (kaptan) {
      router.push('/kaptan/panel');
    }
  }, [router]);

  const girisYap = () => {
    setHata('');
    setYukleniyor(true);

    setTimeout(() => {
      const kaptan = KAPTANLAR.find(k => k.kod === kod);
      if (kaptan) {
        localStorage.setItem('kaptan', JSON.stringify(kaptan));
        router.push('/kaptan/panel');
      } else {
        setHata('Geçersiz kaptan kodu');
        setYukleniyor(false);
      }
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && kod.length === 4) {
      girisYap();
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050e1d',
      fontFamily: "'Georgia', serif",
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Arka plan efektleri */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(13,126,160,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .kod-input:focus {
          outline: none;
          border-color: rgba(13,126,160,0.6) !important;
          box-shadow: 0 0 0 3px rgba(13,126,160,0.15), 0 8px 32px rgba(0,0,0,0.3) !important;
        }
        .giris-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #0D7EA0 0%, #0a9cc4 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 32px rgba(13,126,160,0.35) !important;
        }
        .giris-btn:active:not(:disabled) {
          transform: translateY(0) !important;
        }
      `}</style>

      {/* Ana Sayfa Linki */}
      <button
        onClick={() => router.push('/ana-sayfa')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.55)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '4px 0',
          fontFamily: "'Georgia', serif",
        }}
      >
        ← Ana Sayfa
      </button>

      {/* Çapa ikonu */}
      <div style={{
        fontSize: '56px',
        marginBottom: '12px',
        animation: 'float 3s ease-in-out infinite, fadeUp 0.6s ease-out both',
      }}>
        ⚓
      </div>

      {/* Başlık */}
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'normal',
        marginBottom: '4px',
        animation: 'fadeUp 0.6s ease-out 0.1s both',
        letterSpacing: '-0.02em',
      }}>
        Kaptan Paneli
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.45)',
        fontSize: '14px',
        marginBottom: '36px',
        animation: 'fadeUp 0.6s ease-out 0.2s both',
      }}>
        Göcek Bot Taksi — Kaptan Giriş
      </p>

      {/* Giriş Kartı */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '380px',
        animation: hata ? 'shake 0.4s ease-out, fadeUp 0.6s ease-out 0.3s both' : 'fadeUp 0.6s ease-out 0.3s both',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Kod Etiketi */}
        <label style={{
          display: 'block',
          fontSize: '11px',
          color: '#0D7EA0',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '10px',
          fontWeight: 'bold',
        }}>
          Kaptan Kodu
        </label>

        {/* 4 Haneli Kod Girişi */}
        <input
          className="kod-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={kod}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setKod(val);
            setHata('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="• • • •"
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: '28px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '12px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            color: 'white',
            boxSizing: 'border-box',
            transition: 'all 0.25s',
          }}
        />

        {/* Hata Mesajı */}
        {hata && (
          <div style={{
            color: '#e74c3c',
            fontSize: '13px',
            textAlign: 'center',
            marginTop: '12px',
            animation: 'fadeUp 0.3s ease-out both',
          }}>
            ⚠️ {hata}
          </div>
        )}

        {/* Giriş Butonu */}
        <button
          className="giris-btn"
          onClick={girisYap}
          disabled={kod.length !== 4 || yukleniyor}
          style={{
            width: '100%',
            padding: '16px',
            marginTop: '20px',
            fontSize: '15px',
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            color: 'white',
            background: kod.length === 4
              ? 'linear-gradient(135deg, #0D7EA0 0%, #0a8fb8 100%)'
              : 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '14px',
            cursor: kod.length === 4 && !yukleniyor ? 'pointer' : 'default',
            transition: 'all 0.3s',
            opacity: kod.length === 4 ? 1 : 0.4,
            boxShadow: kod.length === 4 ? '0 8px 24px rgba(13,126,160,0.25)' : 'none',
          }}
        >
          {yukleniyor ? (
            <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>Giriş yapılıyor...</span>
          ) : (
            'Giriş Yap →'
          )}
        </button>
      </div>

      {/* Alt bilgi — demo kodları */}
      <div style={{
        marginTop: '32px',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '14px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
        animation: 'fadeUp 0.6s ease-out 0.5s both',
        maxWidth: '380px',
        width: '100%',
      }}>
        <div style={{ marginBottom: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Demo Kodları
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {KAPTANLAR.map(k => (
            <span
              key={k.id}
              onClick={() => setKod(k.kod)}
              style={{
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(13,126,160,0.08)',
                border: '1px solid rgba(13,126,160,0.15)',
                transition: 'all 0.2s',
                fontSize: '11px',
              }}
            >
              {k.tekneAd}: <span style={{ color: '#0D7EA0', fontWeight: 'bold' }}>{k.kod}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
