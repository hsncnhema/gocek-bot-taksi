'use client'

export default function DumenLoading({ text = 'Yükleniyor...' }: { text?: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8, 18, 35, 0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <style>{`
        @keyframes dumenSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dumenPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes fadeInLoading {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dumen-spin { animation: dumenSpin 2s linear infinite; }
        .dumen-wrap { animation: fadeInLoading 0.3s ease-out both; }
        .loading-text { animation: dumenPulse 1.8s ease-in-out infinite; }
      `}</style>

      <div className="dumen-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        {/* Dümen SVG */}
        <div className="dumen-spin">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            {/* Dış halka */}
            <circle cx="50" cy="50" r="44" stroke="#0D7EA0" strokeWidth="6" fill="none" opacity="0.9" />
            <circle cx="50" cy="50" r="44" stroke="#00c6ff" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="8 4" />

            {/* Merkez */}
            <circle cx="50" cy="50" r="10" fill="#0D7EA0" />
            <circle cx="50" cy="50" r="6" fill="#00c6ff" opacity="0.8" />

            {/* 6 kol — dümen parmakları */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              const x1 = 50 + 10 * Math.cos(rad)
              const y1 = 50 + 10 * Math.sin(rad)
              const x2 = 50 + 38 * Math.cos(rad)
              const y2 = 50 + 38 * Math.sin(rad)
              return (
                <line key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#0D7EA0" strokeWidth="5"
                  strokeLinecap="round"
                />
              )
            })}

            {/* Kol uçlarındaki toplar */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              const cx = 50 + 44 * Math.cos(rad)
              const cy = 50 + 44 * Math.sin(rad)
              return <circle key={i} cx={cx} cy={cy} r="5" fill="#0D7EA0" stroke="#00c6ff" strokeWidth="1.5" />
            })}
          </svg>
        </div>

        {/* Metin */}
        <div className="loading-text" style={{ textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            letterSpacing: '0.12em',
            margin: 0,
            fontFamily: "'Georgia', serif",
          }}>{text.toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
