import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

const PLAN_FEATURES: Record<string, string[]> = {
  basico: ['Catálogo público', 'Botón de WhatsApp', 'Estados: disponible / apartado / vendido'],
  medio: ['Todo lo del Básico', 'Plantillas y colores', 'Estadísticas básicas', 'Cuentas: quién pagó y quién no'],
  grande: ['Todo lo del Medio', 'Estadísticas completas', 'Ventas múltiples'],
};
const PLAN_NAME: Record<string, string> = { basico: 'Básico', medio: 'Medio', grande: 'Grande' };

function fmtMoney(n: number) {
  return '$' + (n || 0).toLocaleString('es-CO');
}

function diasInfo(expires_at: string | null) {
  if (!expires_at) return { txt: 'Sin fecha de vencimiento', tone: 'soft' };
  const ms = new Date(expires_at).getTime() - Date.now();
  const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (dias < 0) return { txt: 'Vencido hace ' + Math.abs(dias) + ' días', tone: 'bad' };
  if (dias === 0) return { txt: 'Vence hoy', tone: 'bad' };
  return { txt: 'Quedan ' + dias + ' días', tone: dias <= 5 ? 'warn' : 'ok' };
}

export default async function TiendaDetalle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const isOwner = OWNER_EMAIL && auth.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  if (!isOwner) redirect('/panel');

  const { data: seller } = await supabase.from('sellers').select('*').eq('slug', slug).single();
  if (!seller) notFound();

  const { count: itemCount } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', seller.id);
  const { data: ventas } = await supabase
    .from('ventas')
    .select('amount, paid, created_at')
    .eq('seller_id', seller.id);
  const nVentas = ventas?.length || 0;
  const totalVendido = (ventas || []).reduce((s: number, v: { amount: number | null }) => s + (v.amount || 0), 0);
  const totalCobrado = (ventas || []).reduce((s: number, v: { paid: number | null }) => s + (v.paid || 0), 0);

  const plan = (seller.plan || 'medio') as string;
  const dias = diasInfo(seller.expires_at);
  const toneColor: Record<string, string> = { ok: '#176c47', warn: '#b8860b', bad: '#c0392b', soft: 'var(--ink-soft)' };

  return (
    <main className="wrap" style={{ maxWidth: 720, padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 26 }}>{seller.name}</h1>
        <Link href="/panel" className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>Volver</Link>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
        /{seller.slug} · {PLAN_NAME[plan] || 'Sin plan'} · {seller.status}
        {seller.notes === 'Cortesia' ? ' · Cortesía' : ''}
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <Stat label="Artículos" value={String(itemCount || 0)} />
        <Stat label="Ventas" value={String(nVentas)} />
        <Stat label="Total vendido" value={fmtMoney(totalVendido)} />
        <Stat label="Total cobrado" value={fmtMoney(totalCobrado)} />
      </div>

      <Card title="Estado del plan">
        <p style={{ fontSize: 15, fontWeight: 600, color: toneColor[dias.tone] }}>{dias.txt}</p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Plan {PLAN_NAME[plan] || '—'} · límite {seller.item_limit || '—'} artículos
        </p>
      </Card>

      <Card title={'Incluye el plan ' + (PLAN_NAME[plan] || '')}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8 }}>
          {(PLAN_FEATURES[plan] || []).map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </Card>

      <Card title="Ventas de la tienda">
        {nVentas === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            Sin ventas registradas todavía. Aparecerán aquí cuando la tienda registre ventas desde su panel.
          </p>
        ) : (
          <p style={{ fontSize: 14 }}>
            {nVentas} ventas · {fmtMoney(totalVendido)} vendido · {fmtMoney(totalCobrado)} cobrado
          </p>
        )}
      </Card>

      <div style={{ marginTop: 18 }}>
        <a
          href={'/' + seller.slug}
          target="_blank"
          rel="noreferrer"
          className="btn btn--ghost"
          style={{ padding: '8px 14px', fontSize: 13 }}
        >
          Ver catálogo público
        </a>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '14px 18px', boxShadow: 'var(--shadow)', minWidth: 130 }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '16px 18px', boxShadow: 'var(--shadow)', marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  );
}
