import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Seller, Item } from '@/lib/supabase/types';
import { formatPrice, estadoLabel } from '@/lib/format';
import SignOut from '@/components/SignOut';
import { registrarVenta, crearItem, editarItem, toggleItem, guardarTienda } from './actions';

export const dynamic = 'force-dynamic';

export default async function SellerHome() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');

  const OWNER_EMAIL = process.env.OWNER_EMAIL || '';
  const isOwner = !!OWNER_EMAIL && auth.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const { data: sellerData } = await supabase
    .from('sellers').select('*').eq('user_id', auth.user.id).maybeSingle();
  const seller = sellerData as Seller | null;

  const { data: itemsData } = seller
    ? await supabase.from('items').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false })
    : { data: [] as Item[] };
  const items = (itemsData as Item[]) ?? [];

  const ventasRes = seller
    ? await supabase.from('ventas').select('*').eq('seller_id', seller.id).order('created_at', { ascending: false }).limit(20)
    : null;
  const ventas = (ventasRes?.data ?? []) as Array<{ id: string; item_name: string | null; amount: number; paid: number; buyer: string | null }>;
  const totalVendido = ventas.reduce((a, v) => a + (v.amount || 0), 0);
  const totalCobrado = ventas.reduce((a, v) => a + (v.paid || 0), 0);

  const dias = seller?.expires_at ? Math.ceil((new Date(seller.expires_at).getTime() - Date.now()) / 86400000) : null;
  const limit = seller?.item_limit || 0;
  const lleno = items.length >= limit;

  if (!seller) {
    return (
      <main className="wrap" style={{ padding: '48px 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Tu cuenta aún no tiene catálogo</h1>
        <p style={{ color: 'var(--ink-soft)' }}>Estamos terminando de configurarlo. Te avisamos en cuanto esté listo.</p>
        <div style={{ marginTop: 20 }}><SignOut /></div>
      </main>
    );
  }

  return (
    <main style={{ paddingBottom: 80 }}>
      <header style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', padding: '20px 0 26px' }}>
        <div className="wrap" style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            {isOwner
              ? <Link href="/panel" style={{ color: '#fff', fontSize: 14, fontWeight: 700, opacity: 0.92 }}>← Volver al panel</Link>
              : <span style={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--display)', opacity: 0.92 }}>Vendeloo</span>}
            <SignOut />
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,38px)', color: '#fff' }}>{seller.name}</h1>
          <a href={'/' + seller.slug} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', opacity: 0.9, fontSize: 14, fontWeight: 600 }}>
            vendeloo.shop/{seller.slug} ↗
          </a>
        </div>
      </header>

      <div className="wrap vtabs" style={{ padding: '0 20px' }}>
        <input className="vt" type="radio" name="vtab" id="vt-cat" defaultChecked />
        <input className="vt" type="radio" name="vtab" id="vt-cfg" />
        <input className="vt" type="radio" name="vtab" id="vt-cta" />

        <div className="vtabbar">
          <label className="vtab" htmlFor="vt-cat">Mi catálogo</label>
          <label className="vtab" htmlFor="vt-cfg">Configuración</label>
          <label className="vtab" htmlFor="vt-cta">Cuentas</label>
        </div>

        <section className="vpanel vpanel-cat">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <strong style={{ fontFamily: 'var(--display)' }}>{items.length} de {limit} artículos</strong>
              <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{dias === null ? '' : '  ·  vence en ' + dias + ' días'}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{lleno ? 'Plan lleno' : 'Plan ' + (seller.plan || '')}</span>
          </div>

          {!lleno ? (
            <details style={{ marginBottom: 18 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--blue)' }}>+ Añadir artículo</summary>
              <form action={crearItem} style={formGrid}>
                <input name="name" placeholder="Nombre" required style={inp} />
                <input name="price" type="number" placeholder="Precio" style={{ ...inp, maxWidth: 120 }} />
                <select name="estado" defaultValue="disp" style={{ ...inp, maxWidth: 150 }}>
                  <option value="disp">Disponible</option>
                  <option value="apar">Apartado</option>
                  <option value="vend">Vendido</option>
                </select>
                <input name="brand" placeholder="Marca" style={{ ...inp, maxWidth: 130 }} />
                <input name="dims" placeholder="Medidas/talla" style={{ ...inp, maxWidth: 130 }} />
                <input name="note" placeholder="Descripción" style={inp} />
                <button type="submit" className="btn btn--primary" style={{ padding: '10px 18px' }}>Añadir</button>
              </form>
            </details>
          ) : (
            <p style={{ color: 'var(--gone)', fontSize: 13, marginBottom: 18 }}>Llegaste al límite de tu plan ({limit}). Amplía para añadir más.</p>
          )}

          {items.length === 0 ? (
            <div className="empty">Aún no has añadido artículos. Empieza con el botón de arriba.</div>
          ) : (
            <div className="grid">
              {items.map((it) => {
                const img = it.imgs?.[0];
                return (
                  <article key={it.id} className={'card ' + (it.visible ? '' : 'vcard-off')}>
                    <div className="card__media">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={it.name} loading="lazy" />
                      ) : (
                        <div style={ph}>🏷️</div>
                      )}
                      <span className={'badge badge--' + it.estado + ' card__badge'}>{estadoLabel[it.estado]}</span>
                      <form action={toggleItem} className={'vswitch vswitch--' + (it.visible ? 'on' : 'off')}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="visible" value={String(it.visible)} />
                        <button type="submit"><span className="vknob" />{it.visible ? 'ON' : 'APAGADO'}</button>
                      </form>
                    </div>
                    <div className="card__body">
                      <div className="card__name">{it.name}</div>
                      {(it.brand || it.dims) && <div className="card__meta">{[it.brand, it.dims].filter(Boolean).join(' · ')}</div>}
                      <div className="card__price">{formatPrice(it.price)}</div>
                      <details style={{ marginTop: 4 }}>
                        <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>Editar</summary>
                        <form action={editarItem} style={{ ...formGrid, marginTop: 8 }}>
                          <input type="hidden" name="id" value={it.id} />
                          <input name="name" defaultValue={it.name} placeholder="Nombre" style={inp} />
                          <input name="price" type="number" defaultValue={it.price ?? ''} placeholder="Precio" style={{ ...inp, maxWidth: 110 }} />
                          <select name="estado" defaultValue={it.estado} style={{ ...inp, maxWidth: 140 }}>
                            <option value="disp">Disponible</option>
                            <option value="apar">Apartado</option>
                            <option value="vend">Vendido</option>
                          </select>
                          <input name="brand" defaultValue={it.brand ?? ''} placeholder="Marca" style={{ ...inp, maxWidth: 120 }} />
                          <input name="dims" defaultValue={it.dims ?? ''} placeholder="Medidas" style={{ ...inp, maxWidth: 120 }} />
                          <input name="note" defaultValue={it.note ?? ''} placeholder="Descripción" style={inp} />
                          <button type="submit" className="btn btn--primary" style={{ padding: '8px 14px' }}>Guardar</button>
                        </form>
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="vpanel vpanel-cfg">
          <h2 style={{ fontSize: 20, marginBottom: 14 }}>Configuración de tu tienda</h2>
          <form action={guardarTienda} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }}>
            <label style={lbl}>Nombre de la tienda<input name="name" defaultValue={seller.name} style={inpFull} /></label>
            <label style={lbl}>Título (cabecera)<input name="title" defaultValue={seller.title ?? ''} placeholder="Ej: Mi venta de garaje" style={inpFull} /></label>
            <label style={lbl}>Subtítulo<input name="subtitle" defaultValue={seller.subtitle ?? ''} placeholder="Ej: Todo debe irse" style={inpFull} /></label>
            <label style={lbl}>WhatsApp (con indicativo)<input name="whatsapp" defaultValue={seller.whatsapp ?? ''} placeholder="Ej: 573001234567" style={inpFull} /></label>
            <button type="submit" className="btn btn--primary" style={{ alignSelf: 'flex-start', padding: '11px 22px' }}>Guardar cambios</button>
          </form>
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1.5px solid var(--line)' }}>
            <a href={'/' + seller.slug} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">Ver mi catálogo público</a>
            <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 12 }}>Plan {seller.plan || '—'} · plantilla {seller.template || 'vibrante'} · {limit} artículos</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 6 }}>Las fotos y la elección de plantilla/colores llegan en el siguiente avance.</p>
          </div>
        </section>

        <section className="vpanel vpanel-cta">
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Registrar una venta</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 12 }}>Marca si te pagaron o no. Sin justificantes.</p>
          <form action={registrarVenta} style={formGrid}>
            <input name="item" list="lista-items" placeholder="Artículo" style={inp} />
            <datalist id="lista-items">
              {items.map((it) => <option key={it.id} value={it.name} />)}
            </datalist>
            <input name="amount" type="number" placeholder="Monto" required style={{ ...inp, maxWidth: 120 }} />
            <input name="qty" type="number" defaultValue={1} placeholder="Cant." style={{ ...inp, maxWidth: 80 }} />
            <select name="pagado" defaultValue="si" style={{ ...inp, maxWidth: 140 }}>
              <option value="si">Pagado: Sí</option>
              <option value="no">Pagado: No</option>
            </select>
            <input name="buyer" placeholder="Comprador (opcional)" style={inp} />
            <button type="submit" className="btn btn--primary" style={{ padding: '10px 18px' }}>Registrar</button>
          </form>

          {ventas.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <Stat label="Vendido" value={formatPrice(totalVendido)} />
                <Stat label="Cobrado" value={formatPrice(totalCobrado)} />
                <Stat label="Ventas" value={String(ventas.length)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ventas.map((v) => {
                  const pend = (v.amount || 0) - (v.paid || 0);
                  return (
                    <div key={v.id} style={row}>
                      <span style={{ fontWeight: 600 }}>{v.item_name || 'Venta'}{v.buyer ? ' · ' + v.buyer : ''}</span>
                      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {pend > 0 && <span className="badge badge--apar">Debe {formatPrice(pend)}</span>}
                        <span style={{ fontFamily: 'var(--display)', fontWeight: 700 }}>{formatPrice(v.amount)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const formGrid: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' };
const inp: React.CSSProperties = { border: '1.5px solid var(--line)', borderRadius: 'var(--r-btn)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--body)', background: '#fff', flex: '1 1 140px', minWidth: 0 };
const inpFull: React.CSSProperties = { border: '1.5px solid var(--line)', borderRadius: 'var(--r-btn)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--body)', background: '#fff', width: '100%', marginTop: 5 };
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', fontFamily: 'var(--display)' };
const ph: React.CSSProperties = { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontSize: 34 };
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '12px 16px', boxShadow: 'var(--shadow)' };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '12px 18px', boxShadow: 'var(--shadow)', minWidth: 110 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18 }}>{value}</div>
    </div>
  );
}
