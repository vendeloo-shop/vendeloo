import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Seller, Item } from '@/lib/supabase/types';
import { formatPrice, estadoLabel } from '@/lib/format';
import SignOut from '@/components/SignOut';
import { registrarVenta } from './actions';

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

  const ventasRes = seller
    ? await supabase.from('ventas').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }).limit(10)
    : null;
  const ventas = (ventasRes?.data ?? []) as Array<{ id: string; item_name: string | null; amount: number; buyer: string | null }>;
  const totalVendido = ventas.reduce((acc, v) => acc + (v.amount || 0), 0);

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

          <h2 style={{ fontSize: 20, marginTop: 32, marginBottom: 12 }}>Registrar una venta</h2>
          <form action={registrarVenta} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <input name="item" list="lista-items" placeholder="Artículo" style={inpV} />
            <datalist id="lista-items">
              {items.map((it) => (
                <option key={it.id} value={it.name} />
              ))}
            </datalist>
            <input name="amount" type="number" placeholder="Monto" required style={{ ...inpV, maxWidth: 120 }} />
            <input name="qty" type="number" defaultValue={1} placeholder="Cant." style={{ ...inpV, maxWidth: 80 }} />
            <input name="paid" type="number" placeholder="Pagado" style={{ ...inpV, maxWidth: 120 }} />
            <input name="buyer" placeholder="Comprador (opcional)" style={inpV} />
            <button type="submit" className="btn btn--primary" style={{ padding: '10px 18px' }}>Registrar venta</button>
          </form>

          {ventas.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ fontSize: 20 }}>Ventas recientes</h2>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700 }}>{formatPrice(totalVendido)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ventas.map((v) => (
                  <div key={v.id} style={rowStyle}>
                    <span style={{ fontWeight: 600 }}>
                      {v.item_name || 'Venta'}
                      {v.buyer ? ' · ' + v.buyer : ''}
                    </span>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700 }}>{formatPrice(v.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

const inpV: React.CSSProperties = {
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--r-btn)',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'var(--body)',
  background: '#fff',
  flex: '1 1 140px',
  minWidth: 0,
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '12px 18px', boxShadow: 'var(--shadow)', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
