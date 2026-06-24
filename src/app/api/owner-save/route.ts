import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Guarda la configuracion de una tienda (modo dueno). Verifica que quien llama
// es el owner antes de escribir con el cliente admin (service role, salta RLS).
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const owner = (process.env.OWNER_EMAIL || '').toLowerCase();
    if (!auth?.user || !owner || auth.user.email?.toLowerCase() !== owner) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const slug = ((body.slug as string) || '').trim();
    if (!slug) return NextResponse.json({ error: 'Falta slug' }, { status: 400 });

    const admin = createAdminClient();
    const { data: cur } = await admin
      .from('sellers')
      .select('theme')
      .eq('slug', slug)
      .maybeSingle();

    const theme: Record<string, unknown> = Object.assign(
      {},
      (cur && (cur as { theme?: Record<string, unknown> }).theme) || {},
    );
    if (body.cols != null) theme.cols = Number(body.cols);
    if (Array.isArray(body.metodos)) theme.metodos = body.metodos;
    if (body.envio && typeof body.envio === 'object') theme.envio = body.envio;
    if (body.perfil && typeof body.perfil === 'object') theme.perfil = body.perfil;

    const patch: Record<string, unknown> = { theme };
    if (typeof body.name === 'string') patch.name = body.name;
    if (typeof body.subtitle === 'string') patch.subtitle = body.subtitle;
    if (typeof body.whatsapp === 'string') patch.whatsapp = body.whatsapp;
    // template tiene FK a la tabla de plantillas; no se actualiza aqui por ahora

    const { error } = await admin.from('sellers').update(patch).eq('slug', slug);
    if (error) return NextResponse.json({ error: 'update: ' + error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'EXC: ' + msg }, { status: 500 });
  }
}
