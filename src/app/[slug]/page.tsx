import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Seller, Item } from '@/lib/supabase/types';
import StoreClient from './StoreClient';

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

  const expired = !!seller.expires_at && new Date(seller.expires_at) < new Date();
  const items = expired ? [] : await getItems(seller.id);

  if (expired) {
    return (
      <main
        style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 20px',
          fontFamily: 'Poppins, system-ui, sans-serif',
          color: '#0E1B3A',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
        <h1 style={{ fontSize: 24, fontFamily: 'Montserrat, sans-serif', marginBottom: 8 }}>
          Este catálogo está en pausa
        </h1>
        <p style={{ color: '#5A6A8C' }}>
          Vuelve pronto o escribe al vendedor por WhatsApp.
        </p>
      </main>
    );
  }

  return <StoreClient seller={seller} items={items} />;
}
