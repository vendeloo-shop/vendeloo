'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError('No pudimos cambiar la contraseña. Abre el enlace del correo otra vez (pudo expirar).'); return; }
    setDone(true);
  }

  return (
    <>
    <header style={{ background: '#fff', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 22px', display: 'flex', alignItems: 'center', height: 96 }}>
        <Link href="/"><img src="/Vendeloo_horizontal.png" alt="Vendeloo" style={{ height: 80, display: 'block' }} /></Link>
      </div>
    </header>
    <main className="wrap" style={{ maxWidth: 420, padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, margin: '20px 0 6px' }}>Nueva contraseña</h1>
      {done ? (
        <>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>Tu contraseña quedó actualizada. Ya puedes entrar.</p>
          <Link className="btn btn--primary btn--block" href="/app/login">Ir a entrar</Link>
        </>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input required type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <input required type="password" placeholder="Repite la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
          {error && <p style={{ color: 'var(--gone)', fontSize: 14 }}>{error}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      )}
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
