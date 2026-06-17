import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Seller, Item } from '@/lib/supabase/types';
import { formatPrice, estadoLabel } from '@/lib/format';
import SignOut from '@/components/SignOut';

export const dynamic = 'force-dynamic';

export default async function SellerHome() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');

  const { data: sellerData } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  const seller = sellerData as Seller | null;

  const { data: itemsData } = seller
    ? await supabase.from('items').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false })
    : { data: [] as Item[] };
  const items = (itemsData as Item[]) ?? [];

  const dias = seller?.expires_at
    ? Math.ceil((new Date(seller.expires_at).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="wrap" style={{ padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Link href="/" style={{ color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>Vendeloo</Link>
        <SignOut />
      </div>

      {!seller ? (
        <div className="empty">
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Tu cuenta aún no tiene catálogo</h1>
          <p>Estamos terminando de configurarlo. Te avisamos por WhatsApp en cuanto esté listo.</p>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 30, margin: '12px 0 4px' }}>{seller.name}</h1>
          <p style={{ color: 'var(--ink-soft)' }}>
            vendeloo.shop/<strong style={{ color: 'var(--ink)' }}>{seller.slug}</strong>
          </p>

          {/* Estado del plan */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '20px 0 28px' }}>
            <Stat label="Estado" value={seller.status} />
            <Stat label="Artículos" value={`${items.length} / ${seller.item_limit}`} />
            <Stat label="Días restantes" value={dias === null ? '—' : `${dias}`} />
            <Stat label="Plantilla" value={seller.template} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>Tus artículos</h2>
            <Link className="btn btn--primary" href="/app">+ Agregar</Link>
          </div>

          {items.length === 0 ? (
            <div className="empty">Aún no has agregado artículos. Empieza con el botón “Agregar”.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((it) => (
                <div key={it.id} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span className={`badge badge--${it.estado}`}>{estadoLabel[it.estado]}</span>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700 }}>{formatPrice(it.price)}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 24 }}>
            La edición completa de artículos (fotos, precios, estados) llega en el siguiente avance.
          </p>
        </>
      )}
    </main>
  );
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '12px 18px', boxShadow: 'var(--shadow)', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
