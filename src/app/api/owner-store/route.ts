import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Carga una tienda concreta por slug para el DUENO (modo dueno desde la Cabina).
// Verifica en el servidor que quien llama es el owner antes de usar el cliente
// admin (service role), que salta RLS. Cualquier otro usuario recibe 403.
export async function GET(req: Request) {
  try {
    const slug = (new URL(req.url).searchParams.get('slug') || '').trim();
    if (!slug) return NextResponse.json({ error: 'Falta slug' }, { status: 400 });

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const owner = (process.env.OWNER_EMAIL || '').toLowerCase();
    if (!auth?.user || !owner || auth.user.email?.toLowerCase() !== owner) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: seller, error: sErr } = await admin
      .from('sellers')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: 'sellers: ' + sErr.message }, { status: 500 });
    if (!seller) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

    const sellerId = (seller as { id: string }).id;
    const { data: items } = await admin
      .from('items')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    let ventas: unknown[] = [];
    try {
      const r = await admin
        .from('ventas')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(50);
      ventas = r.data || [];
    } catch {
      ventas = [];
    }

    return NextResponse.json({ seller, items: items || [], ventas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'EXC: ' + msg }, { status: 500 });
  }
}
