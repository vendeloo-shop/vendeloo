import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Seller } from '@/lib/supabase/types';
import SignOut from '@/components/SignOut';
import { activar, renovar, pausar, cambiarPlan, crearCliente } from './actions';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

export default async function PanelPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');

  const isOwner = OWNER_EMAIL && auth.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const { data } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });
  const sellers = (data as Seller[]) ?? [];
  const activos = sellers.filter((s) => s.status === 'active').length;
  const PRICES: Record<string, number> = { basico: 130000, medio: 180000, grande: 230000 };
  const ingresos = sellers
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.plan ? PRICES[s.plan] || 0 : 0), 0);

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/panel/ajustes" className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>Ajustes</Link>
          <SignOut />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '14px 0 24px' }}>
        <div style={statCard}><div style={statNum}>{sellers.length}</div><div style={statLbl}>Clientes</div></div>
        <div style={statCard}><div style={statNum}>{activos}</div><div style={statLbl}>Activos</div></div>
        <div style={statCard}><div style={statNum}>${ingresos.toLocaleString('es-CO')}</div><div style={statLbl}>Ingresos estimados (4 sem)</div></div>
      </div>

      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>+ Crear cliente nuevo</summary>
        <form action={crearCliente} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input name="nombre" placeholder="Nombre de la tienda" style={inpStyle} />
          <input name="slug" placeholder="slug (ej: mi-tienda)" required style={inpStyle} />
          <input name="email" type="email" placeholder="Correo" required style={inpStyle} />
          <input name="password" type="password" placeholder="Contraseña temporal" required style={inpStyle} />
          <select name="plan" defaultValue="medio" style={selStyle}>
            <option value="basico">Básico (10)</option>
            <option value="medio">Medio (25)</option>
            <option value="grande">Grande (50)</option>
          </select>
          <button type="submit" style={{ ...actBtn, background: 'var(--blue)', color: '#fff', border: 'none' }}>Crear cliente</button>
        </form>
      </details>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sellers.map((s) => {
          const dias = s.expires_at
            ? Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000)
            : null;
          return (
            <div key={s.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{s.name || s.slug}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    /{s.slug} · {s.email || 'sin correo'} · {s.plan || 'sin plan'} · {s.item_limit} art.
                  </div>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
                <form action={activar}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" style={actBtn}>Activar</button>
                </form>
                <form action={renovar}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" style={actBtn}>Renovar +4 sem</button>
                </form>
                <form action={pausar}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" style={actBtn}>Pausar</button>
                </form>
                <form action={cambiarPlan} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="hidden" name="id" value={s.id} />
                  <select name="plan" defaultValue={s.plan || 'medio'} style={selStyle}>
                    <option value="basico">Básico (10)</option>
                    <option value="medio">Medio (25)</option>
                    <option value="grande">Grande (50)</option>
                  </select>
                  <button type="submit" style={actBtn}>Cambiar plan</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function badgeClass(status: string) {
  if (status === 'active') return 'badge--disp';
  if (status === 'pending') return 'badge--apar';
  return 'badge--vend';
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  borderRadius: 'var(--r-btn)',
  padding: '14px 16px',
  boxShadow: 'var(--shadow)',
};

const actBtn: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--r-btn)',
  padding: '7px 12px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'var(--body)',
  color: 'var(--ink)',
  cursor: 'pointer',
};

const statCard: React.CSSProperties = {
  background: 'var(--card)',
  borderRadius: 'var(--r-btn)',
  padding: '14px 18px',
  boxShadow: 'var(--shadow)',
  minWidth: 120,
};

const statNum: React.CSSProperties = { fontSize: 22, fontWeight: 800, fontFamily: 'var(--display)' };
const statLbl: React.CSSProperties = { fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 };

const inpStyle: React.CSSProperties = {
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--r-btn)',
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--body)',
  background: '#fff',
  color: 'var(--ink)',
  minWidth: 140,
};

const selStyle: React.CSSProperties = {
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--r-btn)',
  padding: '7px 10px',
  fontSize: 13,
  fontFamily: 'var(--body)',
  background: '#fff',
  color: 'var(--ink)',
};
