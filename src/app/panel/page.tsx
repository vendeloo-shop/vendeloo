import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Seller } from '@/lib/supabase/types';
import SignOut from '@/components/SignOut';
import { activar, renovar, pausar, cambiarPlan, crearCliente, crearTiendaGratis, aprobarSolicitud, rechazarSolicitud } from './actions';

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
  const tipoDe = (s: Seller) => ((s as unknown as { tipo?: string }).tipo) || 'cliente';
  const propias = sellers.filter((s) => tipoDe(s) === 'propia').length;
  const cortesias = sellers.filter((s) => tipoDe(s) === 'cortesia').length;
  const PRICES: Record<string, number> = { basico: 130000, medio: 180000, grande: 230000 };
  const ingresos = sellers
    .filter((s) => s.status === 'active' && tipoDe(s) === 'cliente')
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

  const admin = createAdminClient();
  const { data: sigData } = await admin
    .from('signups')
    .select('*')
    .order('created_at', { ascending: false });
  const signups = (sigData as unknown as Signup[]) ?? [];
  const compMap: Record<string, string> = {};
  await Promise.all(
    signups
      .filter((s) => s.proof_path)
      .map(async (s) => {
        const { data: signed } = await admin.storage
          .from('comprobantes')
          .createSignedUrl(s.proof_path as string, 3600);
        if (signed?.signedUrl) compMap[s.id] = signed.signedUrl;
      }),
  );
  const pendientes = signups.filter((s) => s.status === 'pendiente');

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
        <div style={statCard}><div style={statNum}>{propias}</div><div style={statLbl}>Tuyas</div></div>
        <div style={statCard}><div style={statNum}>{cortesias}</div><div style={statLbl}>Cortesía</div></div>
      </div>

      {signups.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>
            Solicitudes{' '}
            {pendientes.length > 0 && (
              <span style={{ color: 'var(--blue)' }}>· {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</span>
            )}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
            Entran por /alta. Revisa el comprobante, crúzalo con tu banco y aprueba o rechaza.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signups.map((s) => (
              <div key={s.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {((s.first_name || '') + ' ' + (s.last_name || '')).trim() || '(sin nombre)'}
                      <span style={{ fontWeight: 500, color: 'var(--ink-soft)' }}> · {s.plan || 'sin plan'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                      {s.email || 'sin correo'} · {s.country || '—'} · {s.doc_type || ''} {s.doc_number || ''} · ref {s.ref_code || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {new Date(s.created_at).toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className={`badge ${sigBadge(s.status)}`}>{s.status}</span>
                    {compMap[s.id] && (
                      <a href={compMap[s.id]} target="_blank" rel="noreferrer" className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>
                        Ver comprobante
                      </a>
                    )}
                    {s.status === 'pendiente' && (
                      <>
                        <form action={aprobarSolicitud}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" style={{ ...actBtn, background: 'var(--blue)', color: '#fff', border: 'none' }}>Aprobar</button>
                        </form>
                        <form action={rechazarSolicitud}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" style={actBtn}>Rechazar</button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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

      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>+ Crear tienda de cortesía (gratis)</summary>
        <form action={crearTiendaGratis} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input name="nombre" placeholder="Nombre de la tienda" style={inpStyle} />
          <input name="slug" placeholder="slug (ej: mi-tienda)" required style={inpStyle} />
          <select name="plan" defaultValue="medio" style={selStyle}>
            <option value="basico">Básico (10)</option>
            <option value="medio">Medio (25)</option>
            <option value="grande">Grande (50)</option>
          </select>
          <select name="tipo" defaultValue="cortesia" style={selStyle}>
            <option value="cortesia">Cortesía (regalo)</option>
            <option value="propia">Propia (mía)</option>
          </select>
          <button type="submit" style={{ ...actBtn, background: 'var(--purple)', color: '#fff', border: 'none' }}>Crear gratis</button>
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
                  {tipoDe(s) === 'propia' && (
                    <Link href={`/app?tienda=${s.slug}`} className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13, background: 'var(--purple)', color: '#fff', borderColor: 'var(--purple)' }}>
                      Gestionar
                    </Link>
                  )}
                  <Link href={`/panel/tienda/${s.slug}`} className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>
                    Analítica
                  </Link>
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

function sigBadge(status: string) {
  if (status === 'aprobado') return 'badge--disp';
  if (status === 'rechazado') return 'badge--vend';
  return 'badge--apar';
}

type Signup = {
  id: string;
  created_at: string;
  plan: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  doc_type: string | null;
  doc_number: string | null;
  email: string | null;
  ref_code: string | null;
  proof_path: string | null;
  status: string;
};

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
