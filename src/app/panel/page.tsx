import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Seller } from '@/lib/supabase/types';
import SignOut from '@/components/SignOut';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

export default async function PanelPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');

  const isOwner = OWNER_EMAIL && auth.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // Nota: la lectura completa de clientes requiere una política de admin en RLS (Fase 3).
  // Por ahora se listan los visibles según las políticas actuales.
  const { data } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });
  const sellers = (data as Seller[]) ?? [];

  if (!isOwner) {
    return (
      <main className="wrap" style={{ maxWidth: 520, padding: '64px 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Acceso restringido</h1>
        <p style={{ color: 'var(--ink-soft)' }}>Esta sección es solo para el equipo de Vendeloo.</p>
        <div style={{ marginTop: 20 }}><SignOut /></div>
      </main>
    );
  }

  return (
    <main className="wrap" style={{ padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28 }}>Cabina Vendeloo</h1>
        <SignOut />
      </div>
      <p style={{ color: 'var(--ink-soft)', margin: '6px 0 24px' }}>{sellers.length} clientes</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sellers.map((s) => {
          const dias = s.expires_at
            ? Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000)
            : null;
          return (
            <div key={s.id} style={rowStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{s.name || s.slug}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>/{s.slug} · {s.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {dias !== null && (
                  <span style={{ fontSize: 13, color: dias < 7 ? 'var(--gone)' : 'var(--ink-soft)' }}>
                    {dias}d
                  </span>
                )}
                <span className={`badge ${badgeClass(s.status)}`}>{s.status}</span>
                <Link href={`/${s.slug}`} className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>
                  Ver
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 24 }}>
        Aprobar, activar y renovar clientes llega en el siguiente avance (requiere política de admin en la base).
      </p>
    </main>
  );
}

function badgeClass(status: string) {
  if (status === 'active') return 'badge--disp';
  if (status === 'pending') return 'badge--apar';
  return 'badge--vend';
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  background: 'var(--card)',
  borderRadius: 'var(--r-btn)',
  padding: '12px 16px',
  boxShadow: 'var(--shadow)',
};
