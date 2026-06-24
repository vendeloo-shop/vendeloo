'use client';

import { useState } from 'react';
import type { Seller, Item } from '@/lib/supabase/types';
import { formatPrice, estadoLabel, waLink } from '@/lib/format';

const GRADS: ReadonlyArray<readonly [string, string]> = [
  ['#1565FF', '#6D3DFF'],
  ['#6D3DFF', '#A855F7'],
  ['#0EA5E9', '#1565FF'],
  ['#14B8A6', '#1565FF'],
  ['#6D3DFF', '#1565FF'],
  ['#3B82F6', '#8B5CF6'],
];

function gradOf(key: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

function emojiOf(name: string): string {
  const n = (name || '').toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/(silla|sillas|sill[oó]n|sof[aá]|poltrona|banco|taburete)/, '🪑'],
    [/(mesa|comedor|escritorio)/, '🍽️'],
    [/(cama|colch[oó]n|base|cabecero|nochero|mesa de noche|c[oó]moda)/, '🛏️'],
    [/(cafetera|caf[eé])/, '☕'],
    [/(batidora|licuadora|exprimidor)/, '🥤'],
    [/(nevera|nevec[oó]n|refriger|congelador)/, '🧊'],
    [/(lavadora|secadora)/, '🧺'],
    [/(tv|televis|pantalla|monitor)/, '📺'],
    [/(biblioteca|estante|repisa|librero|vitrina)/, '📚'],
    [/(l[aá]mpara|luz|foco)/, '💡'],
    [/(microondas|horno|tostadora|sandwich|airfry)/, '🍳'],
    [/(scooter|bici|patineta|moto)/, '🛴'],
    [/(plancha|aspirador|aspiradora)/, '🧹'],
    [/(espejo|cuadro|decor|adorno)/, '🖼️'],
    [/(olla|sart[eé]n|vajilla|plato|cocina|set de)/, '🍲'],
    [/(ventilador|aire|calefactor)/, '🌀'],
    [/(maleta|malet[ií]n|bolso|mochila)/, '🧳'],
    [/(consola|xbox|play|nintendo|juego)/, '🎮'],
    [/(parlante|altavoz|sonido|audio)/, '🔊'],
  ];
  for (const [re, e] of map) if (re.test(n)) return e;
  return '🛋️';
}

export default function StoreClient({
  seller,
  items,
}: {
  seller: Seller;
  items: Item[];
}) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const inCart = (id: string) => cart.includes(id);
  const add = (id: string) => setCart((c) => (c.includes(id) ? c : [...c, id]));
  const remove = (id: string) => setCart((c) => c.filter((x) => x !== id));
  const cartItems = items.filter((it) => cart.includes(it.id));
  const total = cartItems.reduce((a, b) => a + (b.price || 0), 0);

  const orderMessage = () => {
    const lines = cartItems
      .map((it) => `• ${it.name} — ${formatPrice(it.price)}`)
      .join('\n');
    return `Hola ${seller.name ?? ''}, quiero este pedido:\n${lines}\nTOTAL: ${formatPrice(
      total,
    )}`;
  };

  const colN = Number((seller.theme as Record<string, unknown> | null)?.cols);
  const gridStyle =
    colN >= 1 && colN <= 5
      ? { gridTemplateColumns: `repeat(${colN}, minmax(0, 1fr))` }
      : undefined;

  const sel = selected;
  const selGrad = sel ? gradOf(sel.ref || sel.id) : (['#1565FF', '#6D3DFF'] as const);

  return (
    <div className="vst">
      {/* Portada */}
      <header
        className="vst-cover"
        style={
          seller.cover_photo
            ? {
                background: `linear-gradient(180deg, rgba(7,26,82,0) 25%, rgba(7,26,82,.75)), url(${seller.cover_photo}) center/cover`,
              }
            : undefined
        }
      >
        <button className="vst-cartbtn" onClick={() => setCartOpen(true)}>
          🛒 Pedido{cart.length > 0 && <span className="vst-cb">{cart.length}</span>}
        </button>
        <div className="vst-kick">🛍️ {seller.name}</div>
        <h1 className="vst-h1">{seller.title || seller.name}</h1>
        {seller.subtitle && <p className="vst-sub">{seller.subtitle}</p>}
      </header>

      {/* Cómo pagar / Entrega */}
      <div className="vst-info">
        <div className="vst-infocard">
          <div className="vst-ic">💳</div>
          <div className="vst-il">Cómo pagar</div>
          <div className="vst-iv">Lo acuerdas directo con el vendedor por WhatsApp.</div>
        </div>
        <div className="vst-infocard">
          <div className="vst-ic">🚚</div>
          <div className="vst-il">Entrega</div>
          <div className="vst-iv">Coordinada con el vendedor al hacer el pedido.</div>
        </div>
      </div>

      {/* Rejilla */}
      <div className="vst-count">{items.length} artículos</div>
      <div className="vst-grid" style={gridStyle}>
        {items.map((it) => {
          const sold = it.estado === 'vend';
          const img = it.imgs?.[0];
          const g = gradOf(it.ref || it.id);
          const sub = [it.brand, it.dims].filter(Boolean).join(' · ');
          return (
            <article
              key={it.id}
              className={`vst-card${sold ? ' is-sold' : ''}`}
              onClick={() => setSelected(it)}
            >
              <div
                className="vst-media"
                style={
                  img
                    ? undefined
                    : { background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }
                }
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={it.name} loading="lazy" />
                ) : (
                  <>
                    <span className="vst-em">{emojiOf(it.name)}</span>
                    <span className="vst-wm">{it.name}</span>
                  </>
                )}
                <span className={`vst-badge vst-badge--${it.estado}`}>
                  {estadoLabel[it.estado]}
                </span>
              </div>
              <div className="vst-body">
                <div className="vst-name">{it.name}</div>
                {sub && <div className="vst-meta">{sub}</div>}
                <div className="vst-price">{formatPrice(it.price)}</div>
                <button
                  className="vst-add"
                  disabled={sold}
                  onClick={(e) => {
                    e.stopPropagation();
                    add(it.id);
                  }}
                >
                  {sold
                    ? 'Vendido'
                    : inCart(it.id)
                    ? '✓ En el pedido'
                    : '+ Añadir al pedido'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="vst-foot">
        Funciona con{' '}
        <a href="/" className="vst-link">
          Vendeloo
        </a>{' '}
        · vendeloo.shop
      </footer>

      {/* Detalle de producto */}
      {sel && (
        <div className="vst-modal" onClick={() => setSelected(null)}>
          <div className="vst-mcard" onClick={(e) => e.stopPropagation()}>
            <button className="vst-x" onClick={() => setSelected(null)}>
              ×
            </button>
            <div
              className="vst-hero"
              style={
                sel.imgs?.[0]
                  ? { background: `url(${sel.imgs[0]}) center/cover` }
                  : {
                      background: `linear-gradient(135deg, ${selGrad[0]}, ${selGrad[1]})`,
                    }
              }
            >
              {!sel.imgs?.[0] && (
                <span className="vst-em vst-em--big">{emojiOf(sel.name)}</span>
              )}
            </div>
            <div className="vst-mbody">
              <span
                className={`vst-badge vst-badge--${sel.estado} vst-badge--static`}
              >
                {estadoLabel[sel.estado]}
              </span>
              <h2 className="vst-mname">{sel.name}</h2>
              {[sel.brand, sel.dims].filter(Boolean).length > 0 && (
                <div className="vst-mmeta">
                  {[sel.brand, sel.dims].filter(Boolean).join(' · ')}
                </div>
              )}
              <div className="vst-mprice">{formatPrice(sel.price)}</div>
              {sel.note && <p className="vst-note">{sel.note}</p>}
              <div className="vst-mactions">
                <a
                  className="vst-wa"
                  href={waLink(
                    seller.whatsapp,
                    `Hola ${seller.name ?? ''}, me interesa "${sel.name}" (${formatPrice(
                      sel.price,
                    )}) de tu catálogo.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 Preguntar por WhatsApp
                </a>
                {sel.estado !== 'vend' && (
                  <button
                    className="vst-save"
                    onClick={() => {
                      add(sel.id);
                      setSelected(null);
                    }}
                  >
                    + Añadir al pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carrito */}
      {cartOpen && (
        <div className="vst-modal" onClick={() => setCartOpen(false)}>
          <div
            className="vst-mcard vst-mcard--pad"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="vst-x" onClick={() => setCartOpen(false)}>
              ×
            </button>
            <h2 className="vst-cart-title">Tu pedido</h2>
            {cartItems.length === 0 ? (
              <p className="vst-empty">
                Tu pedido está vacío. Toca un artículo y añádelo.
              </p>
            ) : (
              <>
                {cartItems.map((it) => (
                  <div key={it.id} className="vst-crow">
                    <span className="vst-cn">{it.name}</span>
                    <b className="vst-cp">{formatPrice(it.price)}</b>
                    <button className="vst-cx" onClick={() => remove(it.id)}>
                      ×
                    </button>
                  </div>
                ))}
                <div className="vst-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <a
                  className="vst-save vst-block"
                  href={waLink(seller.whatsapp, orderMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📲 Hacer pedido por WhatsApp
                </a>
                <p className="vst-fineprint">
                  Al hacer el pedido se abre WhatsApp con tu lista. El vendedor te
                  confirma pago y entrega.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.vst{--blue:#1565FF;--purple:#6D3DFF;--navy:#071A52;--ink:#0E1B3A;--soft:#5A6A8C;--line:#E8ECF7;--bg:#F4F7FF;background:var(--bg);min-height:100vh;color:var(--ink);font-family:Poppins,system-ui,-apple-system,sans-serif}
.vst h1,.vst h2{font-family:Montserrat,sans-serif;letter-spacing:-.02em;margin:0}
.vst-cover{position:relative;padding:34px 20px 30px;text-align:center;color:#fff;background:linear-gradient(135deg,var(--blue),var(--purple))}
.vst-cartbtn{position:absolute;top:16px;right:16px;background:#fff;color:var(--navy);border:0;border-radius:99px;padding:9px 15px;font-family:Montserrat;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18)}
.vst-cb{background:var(--blue);color:#fff;border-radius:99px;padding:1px 7px;margin-left:6px;font-size:12px}
.vst-kick{display:inline-block;font-family:Montserrat;font-weight:700;font-size:12px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);padding:5px 13px;border-radius:99px;margin-bottom:12px}
.vst-h1{font-size:clamp(26px,6vw,40px);font-weight:800;max-width:640px;margin:0 auto}
.vst-sub{font-size:15px;opacity:.93;max-width:560px;margin:10px auto 0}
.vst-info{max-width:1200px;margin:0 auto;display:flex;gap:12px;padding:16px 16px 4px;flex-wrap:wrap}
.vst-infocard{flex:1;min-width:200px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.vst-ic{font-size:18px}
.vst-il{font-family:Montserrat;font-weight:700;font-size:12px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em;margin:4px 0 5px}
.vst-iv{font-size:13.5px;line-height:1.5}
.vst-count{max-width:1200px;margin:0 auto;color:var(--soft);font-size:13px;padding:14px 18px 4px}
.vst-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding:6px 16px 40px}
.vst-card{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff;cursor:pointer;transition:transform .12s,box-shadow .12s}
.vst-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(7,26,82,.13)}
.vst-card.is-sold .vst-media{filter:grayscale(.7);opacity:.65}
.vst-media{height:170px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.vst-media img{width:100%;height:100%;object-fit:cover}
.vst-em{font-size:50px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.28))}
.vst-em--big{font-size:96px}
.vst-wm{position:absolute;bottom:8px;left:0;right:0;text-align:center;color:rgba(255,255,255,.92);font-family:Montserrat;font-weight:700;font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vst-badge{position:absolute;top:9px;left:9px;font-family:Montserrat;font-weight:700;font-size:10px;padding:4px 10px;border-radius:99px;background:#fff;color:var(--soft)}
.vst-badge--static{position:static;display:inline-block}
.vst-badge--disp{background:#DFF3EC;color:#11936A}
.vst-badge--apar{background:#FCEFD0;color:#B5780B}
.vst-badge--vend{background:#EAEDF5;color:#7A8699}
.vst-body{padding:12px 13px}
.vst-name{font-family:Montserrat;font-weight:700;font-size:14px;line-height:1.25}
.vst-meta{color:var(--soft);font-size:12px;margin-top:2px}
.vst-price{font-family:Montserrat;font-weight:800;font-size:17px;margin:7px 0 10px}
.vst-add{width:100%;background:var(--blue);color:#fff;border:0;border-radius:9px;padding:10px;font-size:12.5px;font-weight:700;font-family:Montserrat;cursor:pointer}
.vst-add:disabled{opacity:.4;cursor:default}
.vst-foot{text-align:center;padding:24px 20px 50px;color:#9aa6c2;font-size:12px}
.vst-link{color:var(--purple);font-weight:600;text-decoration:none}
.vst-modal{position:fixed;inset:0;background:rgba(7,26,82,.5);z-index:60;display:flex;align-items:center;justify-content:center;padding:18px}
.vst-mcard{background:#fff;border-radius:18px;width:440px;max-width:94vw;max-height:92vh;overflow:auto;position:relative;padding-bottom:22px}
.vst-mcard--pad{padding:22px}
.vst-x{position:absolute;top:12px;right:14px;border:0;background:rgba(255,255,255,.9);width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer;color:var(--soft);z-index:2}
.vst-hero{height:230px;display:flex;align-items:center;justify-content:center;border-radius:18px 18px 0 0}
.vst-mbody{padding:18px 22px 0}
.vst-mname{font-size:21px;font-weight:800;margin:8px 0 2px}
.vst-mmeta{color:var(--soft);font-size:13px;margin-bottom:8px}
.vst-mprice{font-family:Montserrat;font-weight:800;font-size:24px;margin-bottom:14px}
.vst-note{font-size:14px;line-height:1.5;margin-bottom:16px}
.vst-mactions{display:flex;gap:10px}
.vst-wa{flex:1;background:#25D366;color:#073d22;border:0;border-radius:11px;padding:12px;font-family:Montserrat;font-weight:700;cursor:pointer;text-align:center;text-decoration:none}
.vst-save{flex:1;background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;border:0;border-radius:11px;padding:12px;font-family:Montserrat;font-weight:700;cursor:pointer;text-align:center;text-decoration:none}
.vst-block{display:block;width:100%}
.vst-cart-title{font-size:20px;font-weight:800;margin-bottom:14px}
.vst-empty{color:var(--soft);font-size:14px}
.vst-crow{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}
.vst-cn{flex:1}
.vst-cp{font-family:Montserrat}
.vst-cx{border:0;background:#f4f4f4;width:24px;height:24px;border-radius:50%;cursor:pointer;color:#c0392b}
.vst-total{display:flex;justify-content:space-between;font-family:Montserrat;font-weight:800;font-size:17px;margin:12px 0 14px}
.vst-fineprint{color:#9aa6c2;font-size:11px;margin-top:10px;text-align:center}
@media(max-width:520px){.vst-grid{grid-template-columns:1fr 1fr;gap:11px}.vst-media{height:140px}}
`;
