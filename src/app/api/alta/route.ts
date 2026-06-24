import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Recibe el formulario de /alta (datos + comprobante), sube el comprobante a un
// bucket privado y crea la solicitud en 'signups' (estado pendiente). Todo con
// service role desde el servidor: nada de esto queda expuesto al publico.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const get = (k: string) => (form.get(k) ? String(form.get(k)).trim() : '');

    const email = get('email');
    if (!email) return NextResponse.json({ error: 'Falta el correo' }, { status: 400 });

    const admin = createAdminClient();

    let proof_path: string | null = null;
    const proof = form.get('proof');
    if (proof && typeof (proof as { arrayBuffer?: unknown }).arrayBuffer === 'function') {
      const file = proof as File;
      const buf = Buffer.from(await file.arrayBuffer());
      const safe = (file.name || 'comprobante').replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${Date.now()}-${safe}`;
      const up = await admin.storage
        .from('comprobantes')
        .upload(path, buf, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
      if (up.error) return NextResponse.json({ error: 'upload: ' + up.error.message }, { status: 500 });
      proof_path = up.data?.path || path;
    }

    const { error } = await admin.from('signups').insert({
      plan: get('plan') || 'medio',
      first_name: get('first_name'),
      last_name: get('last_name'),
      country: get('country'),
      doc_type: get('doc_type'),
      doc_number: get('doc_number'),
      email,
      ref_code: get('ref_code'),
      proof_path,
      status: 'pendiente',
    });
    if (error) return NextResponse.json({ error: 'insert: ' + error.message }, { status: 500 });

    return NextResponse.json({ ok: true, ref: get('ref_code') });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'EXC: ' + msg }, { status: 500 });
  }
}
