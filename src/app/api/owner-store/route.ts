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

    const stats = {
      visits: 0,
      waClicks: 0,
      topItems: [] as { item: string; n: number }[],
      byDay: [] as { day: string; visits: number; clicks: number }[],
    };
    try {
      const { data: ev } = await admin
        .from('stats_events')
        .select('type,item,created_at')
        .eq('slug', slug);
      const events =
        (ev as { type: string; item: string | null; created_at: string }[]) || [];
      stats.visits = events.filter((e) => e.type === 'visit').length;
      stats.waClicks = events.filter((e) => e.type === 'wa_click').length;
      const ic: Record<string, number> = {};
      events
        .filter((e) => e.type === 'wa_click' && e.item)
        .forEach((e) => {
          ic[e.item as string] = (ic[e.item as string] || 0) + 1;
        });
      stats.topItems = Object.entries(ic)
        .map(([item, n]) => ({ item, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 5);
      const dc: Record<string, { visits: number; clicks: number }> = {};
      events.forEach((e) => {
        const d = e.created_at.slice(0, 10);
        if (!dc[d]) dc[d] = { visits: 0, clicks: 0 };
        if (e.type === 'visit') dc[d].visits++;
        else dc[d].clicks++;
      });
      stats.byDay = Object.entries(dc)
        .map(([day, v]) => ({ day, visits: v.visits, clicks: v.clicks }))
        .sort((a, b) => (a.day < b.day ? 1 : -1))
        .slice(0, 14);
    } catch {}

    return NextResponse.json({ seller, items: items || [], ventas, stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'EXC: ' + msg }, { status: 500 });
  }
}
