'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('No pudimos iniciar sesión. Revisa tu correo y contraseña.');
      return;
    }
    router.push('/app');
    router.refresh();
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, padding: '64px 20px' }}>
      <Link href="/" style={{ color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>← Vendeloo</Link>
      <h1 style={{ fontSize: 28, margin: '20px 0 6px' }}>Entra a tu catálogo</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>Gestiona tus artículos y tu marca.</p>

      <form onSubmit={signIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input required type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        {error && <p style={{ color: 'var(--gone)', fontSize: 14 }}>{error}</p>}
        <button className="btn btn--primary btn--block" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 20 }}>
        ¿Aún no tienes catálogo? <Link href="/alta" style={{ color: 'var(--coral-deep)', fontWeight: 600 }}>Pídelo aquí</Link>.
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--r-btn)',
  border: '1.5px solid var(--line)',
  fontSize: 15,
  fontFamily: 'var(--body)',
  background: '#fff',
  color: 'var(--ink)',
};
