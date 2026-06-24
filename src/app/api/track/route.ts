import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Registra eventos de la tienda publica (visitas y clics a WhatsApp).
// Endpoint publico: lo llaman visitantes anonimos. Solo inserta; nunca lee.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      slug?: string;
      type?: string;
      item?: string;
    };
    const slug = String(body.slug || '').trim().slice(0, 120);
    const type = String(body.type || '').trim();
    if (!slug || (type !== 'visit' && type !== 'wa_click')) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const item = body.item ? String(body.item).slice(0, 200) : null;
    const admin = createAdminClient();
    await admin.from('stats_events').insert({ slug, type, item });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
