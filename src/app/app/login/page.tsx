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
  const [sent, setSent] = useState(false);

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
    router.push(email.trim().toLowerCase() === 'vendeloo.app@gmail.com' ? '/panel' : '/app');
    router.refresh();
  }

  async function forgot() {
    setError(null);
    if (!email) { setError('Escribe tu correo arriba y vuelve a tocar aquí.'); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/app/reset' });
    if (error) { setError('No pudimos enviar el correo. Intenta de nuevo.'); return; }
    setSent(true);
  }

  return (
    <>
    <header style={{ background: '#fff', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 22px', display: 'flex', alignItems: 'center', height: 96 }}>
        <Link href="/"><img src="/Vendeloo_horizontal.png" alt="Vendeloo" style={{ height: 80, display: 'block' }} /></Link>
      </div>
    </header>
    <main className="wrap" style={{ maxWidth: 420, padding: '48px 20px' }}>
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

      {sent ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 14 }}>Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja (y spam).</p>
      ) : (
        <p style={{ marginTop: 14 }}>
          <button type="button" onClick={forgot} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>¿Olvidaste tu contraseña?</button>
        </p>
      )}

      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 20 }}>
        ¿Aún no tienes catálogo? <Link href="/alta" style={{ color: 'var(--coral-deep)', fontWeight: 600 }}>Pídelo aquí</Link>.
      </p>
    </main>
    </>
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
