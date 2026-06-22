import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Seller, Item } from '@/lib/supabase/types';
import { formatPrice, estadoLabel, waLink } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function getSeller(slug: string): Promise<Seller | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sellers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return (data as Seller) ?? null;
}

async function getItems(sellerId: string): Promise<Item[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('seller_id', sellerId)
    .eq('visible', true)
    .order('created_at', { ascending: false });
  return (data as Item[]) ?? [];
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) return { title: 'Catálogo no encontrado' };

  const title = seller.title || `${seller.name} en Vendeloo`;
  const description = seller.subtitle || 'Mira lo que tengo a la venta y escríbeme por WhatsApp.';
  const images = seller.cover_photo ? [seller.cover_photo] : [];

  return {
    title,
    description,
    openGraph: { title, description, images, type: 'website', url: `/${slug}` },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function CatalogPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) notFound();

  const expired = seller.expires_at && new Date(seller.expires_at) < new Date();
  const items = expired ? [] : await getItems(seller.id);

  const accent = (seller.theme?.accent as string) || undefined;
  const accentStyle = accent
    ? ({ ['--accent' as string]: accent, ['--accent-deep' as string]: accent } as React.CSSProperties)
    : undefined;

  return (
    <main style={accentStyle}>
      {/* Portada */}
      <header
        style={{
          position: 'relative',
          minHeight: 280,
          display: 'flex',
          alignItems: 'flex-end',
          background: seller.cover_photo
            ? `linear-gradient(180deg, rgba(34,27,25,0) 30%, rgba(34,27,25,.72)), url(${seller.cover_photo}) center/cover`
            : 'linear-gradient(135deg, var(--blue), var(--purple))',
          color: '#fff',
        }}
      >
        <div className="wrap" style={{ padding: '0 20px 28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 13,
              background: 'rgba(255,255,255,.18)',
              backdropFilter: 'blur(6px)',
              padding: '5px 12px',
              borderRadius: 'var(--r-pill)',
              marginBottom: 14,
            }}
          >
            🛍️ {seller.name}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', maxWidth: 620 }}>
            {seller.title || seller.name}
          </h1>
          {seller.subtitle && (
            <p style={{ fontSize: 17, opacity: 0.92, maxWidth: 560, marginTop: 10 }}>
              {seller.subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Artículos */}
      <section className="wrap" style={{ padding: '32px 20px 80px' }}>
        {expired ? (
          <div className="empty">
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Este catálogo está en pausa</h2>
            <p>Vuelve pronto o escribe al vendedor por WhatsApp.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Aún no hay artículos publicados</h2>
            <p>Este vendedor todavía está armando su catálogo.</p>
          </div>
        ) : (
          <div className="grid">
            {items.map((it) => {
              const isGone = it.estado === 'vend';
              const img = it.imgs?.[0];
              const msg = `Hola ${seller.name}, me interesa "${it.name}" (${formatPrice(it.price)}) de tu catálogo.`;
              return (
                <article key={it.id} className={`card ${isGone ? 'is-gone' : ''}`}>
                  <div className="card__media">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={it.name} loading="lazy" />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)',
                          fontSize: 34,
                        }}
                      >
                        🏷️
                      </div>
                    )}
                    <span className={`badge badge--${it.estado} card__badge`}>
                      {estadoLabel[it.estado]}
                    </span>
                  </div>
                  <div className="card__body">
                    <div className="card__name">{it.name}</div>
                    {(it.brand || it.dims) && (
                      <div className="card__meta">
                        {[it.brand, it.dims].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="card__price">{formatPrice(it.price)}</div>
                    {!isGone && (
                      <a
                        className="btn btn--wa btn--block"
                        style={{ marginTop: 8 }}
                        href={waLink(seller.whatsapp, msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preguntar por WhatsApp
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer style={{ textAlign: 'center', padding: '24px 20px 48px', color: 'var(--ink-soft)', fontSize: 13 }}>
        Hecho con <a href="/" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>Vendeloo</a>
      </footer>
    </main>
  );
}
