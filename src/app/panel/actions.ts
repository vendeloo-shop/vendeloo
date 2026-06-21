'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const DAY = 86400000;
const PLAN_LIMITS: Record<string, number> = { basico: 10, medio: 25, grande: 50 };

async function ownerClient() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const owner = (process.env.OWNER_EMAIL || '').toLowerCase();
  if (!auth?.user || !owner || auth.user.email?.toLowerCase() !== owner) {
    throw new Error('No autorizado');
  }
  return supabase;
}

export async function activar(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await ownerClient();
  const now = new Date();
  const expires = new Date(now.getTime() + 28 * DAY);
  await supabase
    .from('sellers')
    .update({ status: 'active', started_at: now.toISOString(), expires_at: expires.toISOString() })
    .eq('id', id);
  revalidatePath('/panel');
}

export async function renovar(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await ownerClient();
  const { data } = await supabase.from('sellers').select('expires_at').eq('id', id).single();
  const cur = data?.expires_at ? new Date(data.expires_at) : null;
  const base = cur && cur.getTime() > Date.now() ? cur : new Date();
  const expires = new Date(base.getTime() + 28 * DAY);
  await supabase
    .from('sellers')
    .update({ status: 'active', expires_at: expires.toISOString() })
    .eq('id', id);
  revalidatePath('/panel');
}

export async function pausar(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  const supabase = await ownerClient();
  await supabase.from('sellers').update({ status: 'paused' }).eq('id', id);
  revalidatePath('/panel');
}

export async function cambiarPlan(formData: FormData) {
  const id = String(formData.get('id') || '');
  const plan = String(formData.get('plan') || '');
  if (!id || !(plan in PLAN_LIMITS)) return;
  const supabase = await ownerClient();
  await supabase
    .from('sellers')
    .update({ plan, item_limit: PLAN_LIMITS[plan] })
    .eq('id', id);
  revalidatePath('/panel');
}

export async function crearCliente(formData: FormData) {
  await ownerClient();
  const nombre = String(formData.get('nombre') || '').trim();
  const slug = String(formData.get('slug') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const plan = String(formData.get('plan') || 'medio');
  const limit = PLAN_LIMITS[plan] ?? 25;
  if (!slug || !email || password.length < 6) {
    throw new Error('Faltan datos: slug, correo y contrasena de 6+ caracteres');
  }

  const admin = createAdminClient();
  const { data: created, error: e1 } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (e1 || !created?.user) {
    throw new Error('No se pudo crear el usuario: ' + (e1?.message || 'desconocido'));
  }

  const { error: e2 } = await admin.from('sellers').insert({
    user_id: created.user.id,
    slug,
    name: nombre || slug,
    email,
    status: 'active',
    plan,
    item_limit: limit,
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 28 * DAY).toISOString(),
  });
  if (e2) {
    throw new Error('Usuario creado, pero fallo la tienda: ' + e2.message);
  }
  revalidatePath('/panel');
}
