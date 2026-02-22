'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Tipler ────────────────────────────────────────────
interface Kaptan {
  id: string;
  ad: string;
  kod: string;
  tekneId: string;
  tekneAd: string;
}

interface Sefer {
  id: string;
  binisNokta: string;
  inisNokta: string;
  yolcuSayisi: number;
  baslangicSaat: string;
  ilerleme: number;
  durum: 'aktif' | 'tamamlandi';
}

interface Rezervasyon {
  id: string;
  musteriAd: string;
  binisNokta: string;
  inisNokta: string;
  yolcuSayisi: number;
  istenenSaat: string;
  olusturmaZamani: string;
  durum: 'beklemede' | 'kabul' | 'red';
}

type TekneDurum = 'musait' | 'seferde' | 'bakim';

// ─── Mock Veriler ──────────────────────────────────────
const MOCK_SEFERLER: Record<string, Sefer | null> = {
  'gocek-1': null,
  'gocek-2': null,
  'gocek-3': {
    id: 'sfr-1',
    binisNokta: 'Skopea Limanı',
    inisNokta: 'Tersane Adası',
    yolcuSayisi: 6,
    baslangicSaat: '14:30',
    ilerleme: 65,
    durum: 'aktif',
  },
  'gocek-4': null,
};

const MOCK_REZERVASYONLAR: Record<string, Rezervasyon[]> = {
  'gocek-1': [
    {
      id: 'rzv-1',
      musteriAd: 'Ayşe Y.',
      binisNokta: 'Göcek Marina',
      inisNokta: 'Yassıca Adaları',
      yolcuSayisi: 4,
      istenenSaat: '16:00',
      olusturmaZamani: '5 dk önce',
      durum: 'beklemede',
    },
    {
      id: 'rzv-2',
      musteriAd: 'Mehmet K.',
      binisNokta: 'İnlice Plajı',
      inisNokta: 'Göcek Marina',
      yolcuSayisi: 2,
      istenenSaat: '17:30',
      olusturmaZamani: '12 dk önce',
      durum: 'beklemede',
    },
  ],
  'gocek-2': [
    {
      id: 'rzv-3',
      musteriAd: 'Can B.',
      binisNokta: 'Hamam Koyu',
      inisNokta: 'Göcek Marina',
      yolcuSayisi: 3,
      istenenSaat: '15:00',
      olusturmaZamani: '2 dk önce',
      durum: 'beklemede',
    },
  ],
  'gocek-3': [],
  'gocek-4': [],
};

const MOCK_TEKNE_DURUM: Record<string, TekneDurum> = {
  'gocek-1': 'musait',
  'gocek-2': 'musait',
  'gocek-3': 'seferde',
  'gocek-4': 'bakim',
};

// ─── Yardımcılar ───────────────────────────────────────
const durumRenk: Record<TekneDurum, string> = {
  musait: '#22c55e',
  seferde: '#f59e0b',
  bakim: '#6b7280',
};

const durumEtiket: Record<TekneDurum, string> = {
  musait: 'Müsait',
  seferde: 'Seferde',
  bakim: 'Hizmet Dışı',
};

const durumEmoji: Record<TekneDurum, string> = {
  musait: '🟢',
  seferde: '🟡',
  bakim: '🔧',
};

function simdikiSaat(): string {
  return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Ana Bileşen ───────────────────────────────────────
export default function KaptanPanel() {
  const router = useRouter();
  const [kaptan, setKaptan] = useState<Kaptan | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saat, setSaat] = useState('');

  const [aktifSefer, setAktifSefer] = useState<Sefer | null>(null);
  const [rezervasyonlar, setRezervasyonlar] = useState<Rezervasyon[]>([]);
  const [tekneDurum, setTekneDurum] = useState<TekneDurum>('musait');
  const [varildiAnimasyon, setVarildiAnimasyon] = useState(false);
  const [durumMenuAcik, setDurumMenuAcik] = useState(false);
  const durumRef = useRef<HTMLDivElement>(null);

  const [bildirim, setBildirim] = useState<{ mesaj: string; tip: 'basari' | 'uyari' | 'bilgi' } | null>(null);

  const bildirimGoster = useCallback((mesaj: string, tip: 'basari' | 'uyari' | 'bilgi' = 'basari') => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  }, []);

  useEffect(() => {
    setMounted(true);
    const kaptanStr = localStorage.getItem('kaptan');
    if (!kaptanStr) {
      router.push('/kaptan');
      return;
    }
    const k: Kaptan = JSON.parse(kaptanStr);
    setKaptan(k);

    const sefer = MOCK_SEFERLER[k.tekneId];
    setAktifSefer(sefer !== undefined ? sefer : null);
    setRezervasyonlar(MOCK_REZERVASYONLAR[k.tekneId] || []);
    setTekneDurum(MOCK_TEKNE_DURUM[k.tekneId] || 'musait');

    setSaat(simdikiSaat());
    const interval = setInterval(() => setSaat(simdikiSaat()), 30000);
    return () => clearInterval(interval);
  }, [router]);

  // Dropdown dışı tıklama — document listener (overlay YOK)
  useEffect(() => {
    if (!durumMenuAcik) return;
    const handleClick = (e: MouseEvent) => {
      if (durumRef.current && !durumRef.current.contains(e.target as Node)) {
        setDurumMenuAcik(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [durumMenuAcik]);

  // İlerleme simulasyonu
  useEffect(() => {
    if (!aktifSefer || aktifSefer.durum !== 'aktif') return;
    const interval = setInterval(() => {
      setAktifSefer(prev => {
        if (!prev || prev.ilerleme >= 98) return prev;
        return { ...prev, ilerleme: Math.min(prev.ilerleme + 0.5, 98) };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [aktifSefer?.durum]);

  const cikisYap = () => {
    localStorage.removeItem('kaptan');
    router.push('/kaptan');
  };

  const seferiTamamla = () => {
    if (!aktifSefer) return;
    setVarildiAnimasyon(true);
    setTimeout(() => {
      setAktifSefer({ ...aktifSefer, ilerleme: 100, durum: 'tamamlandi' });
      setTekneDurum('musait');
      bildirimGoster('Sefer tamamlandı! Tekne müsait duruma alındı.', 'basari');
    }, 600);
    setTimeout(() => {
      setVarildiAnimasyon(false);
      setAktifSefer(null);
    }, 3000);
  };

  const rezervasyonKabul = (id: string) => {
    const rzv = rezervasyonlar.find(r => r.id === id);
    if (!rzv) return;

    setRezervasyonlar(prev => prev.map(r =>
      r.id === id ? { ...r, durum: 'kabul' as const } : r
    ));

    const yeniSefer: Sefer = {
      id: `sfr-${Date.now()}`,
      binisNokta: rzv.binisNokta,
      inisNokta: rzv.inisNokta,
      yolcuSayisi: rzv.yolcuSayisi,
      baslangicSaat: rzv.istenenSaat,
      ilerleme: 0,
      durum: 'aktif',
    };

    setTimeout(() => {
      setAktifSefer(yeniSefer);
      setTekneDurum('seferde');
      setRezervasyonlar(prev => prev.filter(r => r.id !== id));
      bildirimGoster(`${rzv.musteriAd} rezervasyonu kabul edildi — sefer başladı!`, 'basari');
    }, 500);
  };

  const rezervasyonReddet = (id: string) => {
    const rzv = rezervasyonlar.find(r => r.id === id);
    setRezervasyonlar(prev => prev.map(r =>
      r.id === id ? { ...r, durum: 'red' as const } : r
    ));
    setTimeout(() => {
      setRezervasyonlar(prev => prev.filter(r => r.id !== id));
    }, 400);
    bildirimGoster(`${rzv?.musteriAd} rezervasyonu reddedildi.`, 'uyari');
  };

  const durumDegistir = (yeniDurum: TekneDurum) => {
    if (aktifSefer && aktifSefer.durum === 'aktif') {
      bildirimGoster('Aktif sefer varken durum değiştirilemez.', 'uyari');
      setDurumMenuAcik(false);
      return;
    }
    setTekneDurum(yeniDurum);
    setDurumMenuAcik(false);
    bildirimGoster(`Tekne durumu "${durumEtiket[yeniDurum]}" olarak güncellendi.`, 'bilgi');
  };

  if (!mounted || !kaptan) return null;

  const bekleyenRezervasyonlar = rezervasyonlar.filter(r => r.durum === 'beklemede');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050e1d',
      fontFamily: "'Georgia', serif",
      color: 'white',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(80px); }
        }
        @keyframes varildi {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.4); }
        }
        @keyframes bildirimGir {
          from { opacity: 0; transform: translateY(-20px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .panel-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          animation: fadeUp 0.4s ease-out both;
          transition: all 0.25s;
        }
        .panel-card:hover {
          border-color: rgba(255,255,255,0.12);
        }
        .aksiyon-btn {
          padding: 12px 24px;
          border-radius: 14px;
          border: none;
          font-family: 'Georgia', serif;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.25s;
        }
        .aksiyon-btn:hover {
          transform: translateY(-2px);
        }
        .aksiyon-btn:active {
          transform: translateY(0);
        }
        .rzv-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s;
          animation: fadeUp 0.4s ease-out both;
        }
        .durum-secim-btn {
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          background: rgba(255,255,255,0.04);
          color: white;
          font-family: 'Georgia', serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
        }
        .durum-secim-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          transform: translateX(4px);
        }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: 'rgba(5,14,29,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚓</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{kaptan.ad}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{kaptan.tekneAd} • {saat}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: `${durumRenk[tekneDurum]}15`,
            border: `1px solid ${durumRenk[tekneDurum]}40`,
            fontSize: '12px',
            fontWeight: 'bold',
            color: durumRenk[tekneDurum],
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: durumRenk[tekneDurum],
              display: 'inline-block',
              animation: tekneDurum === 'seferde' ? 'pulseDot 1.5s ease-in-out infinite' : 'none',
            }} />
            {durumEtiket[tekneDurum]}
          </div>

          <button
            onClick={cikisYap}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.5)',
              padding: '7px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Georgia', serif",
            }}
          >
            Çıkış
          </button>
        </div>
      </nav>

      {/* ═══ BİLDİRİM ═══ */}
      {bildirim && (
        <div style={{
          position: 'fixed',
          top: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          padding: '12px 24px',
          borderRadius: '14px',
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: "'Georgia', serif",
          animation: 'bildirimGir 0.3s ease-out both',
          background: bildirim.tip === 'basari' ? 'rgba(34,197,94,0.15)' :
            bildirim.tip === 'uyari' ? 'rgba(245,158,11,0.15)' : 'rgba(13,126,160,0.15)',
          border: `1px solid ${
            bildirim.tip === 'basari' ? 'rgba(34,197,94,0.4)' :
              bildirim.tip === 'uyari' ? 'rgba(245,158,11,0.4)' : 'rgba(13,126,160,0.4)'
          }`,
          color: bildirim.tip === 'basari' ? '#22c55e' :
            bildirim.tip === 'uyari' ? '#f59e0b' : '#0D7EA0',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          maxWidth: '90vw',
        }}>
          {bildirim.tip === 'basari' ? '✅' : bildirim.tip === 'uyari' ? '⚠️' : 'ℹ️'} {bildirim.mesaj}
        </div>
      )}

      {/* ═══ İÇERİK ═══ */}
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '24px 16px 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* ── AKTİF SEFER ── */}
        <section>
          <div style={{ fontSize: '10px', color: '#0D7EA0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
            Aktif Sefer
          </div>

          {aktifSefer && aktifSefer.durum === 'aktif' ? (
            <div
              className="panel-card"
              style={{
                animationDelay: '0.1s',
                ...(varildiAnimasyon ? { animation: 'varildi 0.6s ease-out forwards' } : {}),
              }}
            >
              {/* Rota */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0D7EA0', border: '2px solid rgba(13,126,160,0.4)', flexShrink: 0 }} />
                  <div style={{ width: '2px', flex: 1, minHeight: '24px', background: 'linear-gradient(to bottom, rgba(13,126,160,0.4), rgba(34,197,94,0.4))', borderRadius: '1px' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '2px solid rgba(34,197,94,0.4)', flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Biniş</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>📍 {aktifSefer.binisNokta}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>İniş</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>🏁 {aktifSefer.inisNokta}</div>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', fontSize: '13px' }}>
                  👥 <span style={{ fontWeight: 'bold' }}>{aktifSefer.yolcuSayisi}</span> yolcu
                </div>
                <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', fontSize: '13px' }}>
                  🕐 <span style={{ fontWeight: 'bold' }}>{aktifSefer.baslangicSaat}</span> başlangıç
                </div>
                <div style={{ padding: '8px 14px', background: 'rgba(13,126,160,0.08)', border: '1px solid rgba(13,126,160,0.15)', borderRadius: '10px', fontSize: '13px', color: '#0D7EA0', fontWeight: 'bold' }}>
                  ⛵ %{Math.round(aktifSefer.ilerleme)}
                </div>
              </div>

              {/* İlerleme barı */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{
                  width: `${aktifSefer.ilerleme}%`,
                  height: '100%',
                  borderRadius: '3px',
                  background: aktifSefer.ilerleme > 80 ? 'linear-gradient(90deg, #0D7EA0, #22c55e)' : 'linear-gradient(90deg, #0D7EA0, #0a9cc4)',
                  transition: 'width 2s ease-out',
                }} />
              </div>

              {/* Varıldı */}
              <button
                className="aksiyon-btn"
                onClick={seferiTamamla}
                style={{ width: '100%', padding: '16px', fontSize: '16px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}
              >
                🏁 Varıldı — Seferi Tamamla
              </button>
            </div>
          ) : aktifSefer && aktifSefer.durum === 'tamamlandi' ? (
            <div className="panel-card" style={{ textAlign: 'center', padding: '32px 24px', background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>Sefer Tamamlandı!</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{aktifSefer.binisNokta} → {aktifSefer.inisNokta}</div>
            </div>
          ) : (
            <div className="panel-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.3 }}>🌊</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Aktif sefer yok</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Yeni bir rezervasyon kabul ederek sefer başlatabilirsiniz</div>
            </div>
          )}
        </section>

        {/* ── REZERVASYONLAR ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#0D7EA0', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Gelen Rezervasyonlar
            </div>
            {bekleyenRezervasyonlar.length > 0 && (
              <div style={{ background: 'rgba(13,126,160,0.15)', border: '1px solid rgba(13,126,160,0.3)', color: '#0D7EA0', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '10px' }}>
                {bekleyenRezervasyonlar.length} yeni
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bekleyenRezervasyonlar.length === 0 ? (
              <div className="panel-card" style={{ textAlign: 'center', padding: '28px 24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.3 }}>📋</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Bekleyen rezervasyon yok</div>
              </div>
            ) : (
              bekleyenRezervasyonlar.map((rzv, i) => (
                <div key={rzv.id} className="rzv-card" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{rzv.musteriAd}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{rzv.olusturmaZamani}</div>
                    </div>
                    <div style={{ padding: '5px 12px', background: 'rgba(13,126,160,0.1)', border: '1px solid rgba(13,126,160,0.2)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#0D7EA0' }}>
                      🕐 {rzv.istenenSaat}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                    <span>📍 {rzv.binisNokta}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                    <span>🏁 {rzv.inisNokta}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      👥 {rzv.yolcuSayisi} kişi
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => rezervasyonReddet(rzv.id)}
                        className="aksiyon-btn"
                        style={{ padding: '8px 16px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                      >
                        ✕ Reddet
                      </button>
                      <button
                        onClick={() => {
                          if (aktifSefer && aktifSefer.durum === 'aktif') {
                            bildirimGoster('Aktif sefer varken yeni sefer kabul edilemez.', 'uyari');
                            return;
                          }
                          if (tekneDurum === 'bakim') {
                            bildirimGoster('Tekne hizmet dışında. Önce durumu değiştirin.', 'uyari');
                            return;
                          }
                          rezervasyonKabul(rzv.id);
                        }}
                        className="aksiyon-btn"
                        style={{ padding: '8px 20px', fontSize: '12px', background: 'linear-gradient(135deg, #0D7EA0, #0a9cc4)', color: 'white', boxShadow: '0 4px 16px rgba(13,126,160,0.25)' }}
                      >
                        ✓ Kabul Et
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── TEKNE DURUMU ── */}
        <section>
          <div style={{ fontSize: '10px', color: '#0D7EA0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
            Tekne Durumu
          </div>

          <div className="panel-card" style={{ animationDelay: '0.25s', overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(13,126,160,0.1)', border: '1px solid rgba(13,126,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  ⛵
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{kaptan.tekneAd}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Atanmış tekne</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: durumRenk[tekneDurum] }}>
                {durumEmoji[tekneDurum]} {durumEtiket[tekneDurum]}
              </div>
            </div>

            {/* ══ DROPDOWN — ref tabanlı, overlay YOK ══ */}
            <div ref={durumRef} style={{ position: 'relative', zIndex: 50 }}>
              <button
                onClick={() => setDurumMenuAcik(prev => !prev)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: durumMenuAcik ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${durumMenuAcik ? 'rgba(13,126,160,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: durumMenuAcik ? '12px 12px 0 0' : '12px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '13px',
                  fontFamily: "'Georgia', serif",
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <span>Durumu Değiştir</span>
                <span style={{ transform: durumMenuAcik ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '10px' }}>▼</span>
              </button>

              {durumMenuAcik && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(10,20,40,0.98)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  padding: '6px',
                  animation: 'slideDown 0.15s ease-out both',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                }}>
                  {(['musait', 'bakim'] as TekneDurum[]).map(d => (
                    <button
                      key={d}
                      className="durum-secim-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        durumDegistir(d);
                      }}
                      style={{
                        background: tekneDurum === d ? `${durumRenk[d]}12` : 'transparent',
                        borderLeft: tekneDurum === d ? `3px solid ${durumRenk[d]}` : '3px solid transparent',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: durumRenk[d], display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{durumEtiket[d]}</span>
                      {tekneDurum === d && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>mevcut</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {aktifSefer && aktifSefer.durum === 'aktif' && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', fontSize: '11px', color: 'rgba(245,158,11,0.7)' }}>
                ⚠️ Aktif sefer devam ederken durum değiştirilemez
              </div>
            )}
          </div>
        </section>

        {/* ── GÜNLÜK ÖZET ── */}
        <section>
          <div style={{ fontSize: '10px', color: '#0D7EA0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
            Günlük Özet
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { etiket: 'Tamamlanan', deger: '3', emoji: '✅', renk: '#22c55e' },
              { etiket: 'Toplam Yolcu', deger: '14', emoji: '👥', renk: '#0D7EA0' },
              { etiket: 'Kazanç', deger: '₺2.400', emoji: '💰', renk: '#f59e0b' },
            ].map((item, i) => (
              <div key={item.etiket} className="panel-card" style={{ textAlign: 'center', padding: '18px 12px', animationDelay: `${0.3 + i * 0.08}s` }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.emoji}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: item.renk }}>{item.deger}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', letterSpacing: '0.04em' }}>{item.etiket}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}