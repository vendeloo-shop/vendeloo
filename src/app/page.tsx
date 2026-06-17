import Link from 'next/link';

export const metadata = {
  title: 'Vendeloo · Tu catálogo para vender por WhatsApp',
};

function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vendeloo">
      <defs>
        <linearGradient id="vgrad" x1="12" y1="14" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1565FF" />
          <stop offset="1" stopColor="#6D3DFF" />
        </linearGradient>
      </defs>
      <path d="M14 17 L30 49 L48 17" stroke="url(#vgrad)" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 38 Q31 49 44 34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(45 43 24)">
        <rect x="37" y="18" width="12" height="12" rx="3" fill="#6D3DFF" />
        <circle cx="40" cy="21" r="1.5" fill="#fff" />
      </g>
      <path d="M24 16 C24 6 38 6 38 16" stroke="#071A52" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="16" r="2.2" fill="#071A52" />
      <circle cx="38" cy="16" r="2.2" fill="#071A52" />
    </svg>
  );
}

const pasos = [
  { n: '01', t: 'Arma tu catálogo', d: 'Subes tus fotos, pones precios y eliges una plantilla bonita. Listo en minutos.' },
  { n: '02', t: 'Comparte tu link', d: 'Te damos un link con tu marca. Lo mandas a tus contactos por WhatsApp.' },
  { n: '03', t: 'Vendes directo', d: 'Cada interesado te escribe a tu WhatsApp. Sin intermediarios, sin comisiones por venta.' },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1565FF 0%, #6D3DFF 100%)',
          color: '#fff',
          padding: '72px 0 84px',
        }}
      >
        <div className="wrap">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 54,
                height: 54,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 10px 24px rgba(7,26,82,.28)',
              }}
            >
              <Logo size={36} />
            </span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 23, letterSpacing: '-.01em' }}>
              Vendeloo
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 58px)', maxWidth: 720, color: '#fff' }}>
            Tu propio catálogo para vender por WhatsApp.
          </h1>
          <p style={{ fontSize: 19, opacity: 0.95, maxWidth: 540, marginTop: 18 }}>
            Mudanza, venta de garaje o tu negocio: arma un catálogo con tu marca y
            compártelo con tus contactos. Tú pones el precio, tú cierras la venta.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
            <Link className="btn" style={{ background: '#fff', color: '#1565FF' }} href="/alta">
              Quiero mi catálogo
            </Link>
            <Link
              className="btn"
              style={{ background: 'rgba(255,255,255,.14)', color: '#fff', border: '1.5px solid rgba(255,255,255,.55)' }}
              href="/app"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="wrap" style={{ padding: '64px 20px' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', marginBottom: 8 }}>Cómo funciona</h2>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 480, marginBottom: 36 }}>
          Tres pasos. Sin apps que instalar, sin tienda física.
        </p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {pasos.map((p) => (
            <div
              key={p.n}
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--r-card)',
                padding: '26px 24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--blue)' }}>
                {p.n}
              </div>
              <h3 style={{ fontSize: 20, margin: '10px 0 8px' }}>{p.t}</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="wrap" style={{ padding: '0 20px 80px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #071A52 0%, #1565FF 100%)',
            color: '#fff',
            borderRadius: 'var(--r-card)',
            padding: 'clamp(32px, 6vw, 56px)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 4vw, 32px)', maxWidth: 460, margin: '0 auto 20px' }}>
            ¿Tienes cosas para vender? Móntalo hoy.
          </h2>
          <Link className="btn" style={{ background: '#fff', color: '#1565FF' }} href="/alta">Empezar ahora</Link>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '0 20px 48px', color: 'var(--ink-soft)', fontSize: 13 }}>
        © {new Date().getFullYear()} Vendeloo
      </footer>
    </main>
  );
}
