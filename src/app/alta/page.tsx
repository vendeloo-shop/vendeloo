'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AltaPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', message: '' });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('applications').insert({
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      message: form.message,
    });
    setLoading(false);
    if (error) {
      setError('No pudimos enviar tu solicitud. Revisa los datos e inténtalo de nuevo.');
      return;
    }
    setSent(true);
  }

  return (
    <main className="wrap" style={{ maxWidth: 520, padding: '48px 20px 80px' }}>
      <Link href="/" style={{ color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>← Vendeloo</Link>

      {sent ? (
        <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', padding: 32, marginTop: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 38 }}>🎉</div>
          <h1 style={{ fontSize: 26, margin: '12px 0 8px' }}>¡Solicitud recibida!</h1>
          <p style={{ color: 'var(--ink-soft)' }}>
            Te escribiremos por WhatsApp para coordinar el pago y activar tu catálogo.
          </p>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 30, margin: '20px 0 8px' }}>Pide tu catálogo</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
            Déjanos tus datos y te contactamos para activarlo.
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Tu nombre o el de tu negocio">
              <input required value={form.name} onChange={set('name')} style={inputStyle} placeholder="Ej. Casa de Laura" />
            </Field>
            <Field label="Correo">
              <input required type="email" value={form.email} onChange={set('email')} style={inputStyle} placeholder="tucorreo@ejemplo.com" />
            </Field>
            <Field label="WhatsApp">
              <input required value={form.whatsapp} onChange={set('whatsapp')} style={inputStyle} placeholder="+57 300 000 0000" />
            </Field>
            <Field label="¿Qué vas a vender? (opcional)">
              <textarea value={form.message} onChange={set('message')} style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Cuéntanos en una línea" />
            </Field>

            {error && <p style={{ color: 'var(--gone)', fontSize: 14 }}>{error}</p>}

            <button className="btn btn--primary btn--block" type="submit" disabled={loading} style={{ marginTop: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>
        </>
      )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14 }}>{label}</span>
      {children}
    </label>
  );
}
