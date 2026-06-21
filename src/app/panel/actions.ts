'use server';

import { createClient } from '@/lib/supabase/server';
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
