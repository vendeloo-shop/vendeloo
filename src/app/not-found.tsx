import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="wrap" style={{ maxWidth: 460, padding: '96px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 44 }}>🔍</div>
      <h1 style={{ fontSize: 28, margin: '14px 0 8px' }}>No encontramos este catálogo</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        El link puede estar mal escrito o el catálogo ya no está disponible.
      </p>
      <Link className="btn btn--primary" href="/">Ir a Vendeloo</Link>
    </main>
  );
}
