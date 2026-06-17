import Link from 'next/link';

export const metadata = {
  title: 'Vendeloo · Tu catálogo para vender por WhatsApp',
};

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
          background: 'linear-gradient(135deg, var(--coral), #FF9A7A)',
          color: '#fff',
          padding: '72px 0 84px',
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: 'inline-flex',
              gap: 6,
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 13,
              background: 'rgba(255,255,255,.2)',
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              marginBottom: 22,
            }}
          >
            🛍️ Vendeloo
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 58px)', maxWidth: 720, color: '#fff' }}>
            Tu propio catálogo para vender por WhatsApp.
          </h1>
          <p style={{ fontSize: 19, opacity: 0.95, maxWidth: 540, marginTop: 18 }}>
            Mudanza, venta de garaje o tu negocio: arma un catálogo con tu marca y
            compártelo con tus contactos. Tú pones el precio, tú cierras la venta.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
            <Link className="btn" style={{ background: '#fff', color: 'var(--coral-deep)' }} href="/alta">
              Quiero mi catálogo
            </Link>
            <Link className="btn btn--ghost" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.6)' }} href="/app">
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
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: 'var(--coral)' }}>
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
            background: 'var(--ink)',
            color: '#fff',
            borderRadius: 'var(--r-card)',
            padding: 'clamp(32px, 6vw, 56px)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 4vw, 32px)', maxWidth: 460, margin: '0 auto 20px' }}>
            ¿Tienes cosas para vender? Móntalo hoy.
          </h2>
          <Link className="btn btn--primary" href="/alta">Empezar ahora</Link>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '0 20px 48px', color: 'var(--ink-soft)', fontSize: 13 }}>
        © {new Date().getFullYear()} Vendeloo
      </footer>
    </main>
  );
}
