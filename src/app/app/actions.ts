'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function registrarVenta(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');

  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!seller) return;

  const amount = Math.round(Number(formData.get('amount') || 0));
  const qty = Math.max(1, Math.round(Number(formData.get('qty') || 1)));
  const pagado = String(formData.get('pagado') || 'si');
  const paid = pagado === 'no' ? 0 : amount;
  const itemName = String(formData.get('item') || '').trim();
  const buyer = String(formData.get('buyer') || '').trim();
  if (amount <= 0) return;

  await supabase.from('ventas').insert({
    seller_id: seller.id,
    item_name: itemName || null,
    amount,
    qty,
    paid,
    buyer: buyer || null,
  });
  revalidatePath('/app');
}

export async function crearItem(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, item_limit')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!seller) return;
  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', seller.id);
  if ((count ?? 0) >= (seller.item_limit ?? 0)) return;
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const priceRaw = formData.get('price');
  const price = priceRaw ? Math.round(Number(priceRaw)) : null;
  const estado = String(formData.get('estado') || 'disp');
  const brand = String(formData.get('brand') || '').trim() || null;
  const dims = String(formData.get('dims') || '').trim() || null;
  const note = String(formData.get('note') || '').trim() || null;
  await supabase.from('items').insert({
    seller_id: seller.id,
    name,
    price,
    estado,
    brand,
    dims,
    note,
    visible: true,
  });
  revalidatePath('/app');
}

export async function editarItem(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const id = String(formData.get('id') || '');
  if (!id) return;
  const name = String(formData.get('name') || '').trim();
  const priceRaw = formData.get('price');
  const price = priceRaw ? Math.round(Number(priceRaw)) : null;
  const estado = String(formData.get('estado') || 'disp');
  const brand = String(formData.get('brand') || '').trim() || null;
  const dims = String(formData.get('dims') || '').trim() || null;
  const note = String(formData.get('note') || '').trim() || null;
  const patch: Record<string, unknown> = {
    estado,
    price,
    brand,
    dims,
    note,
    updated_at: new Date().toISOString(),
  };
  if (name) patch.name = name;
  await supabase.from('items').update(patch).eq('id', id);
  revalidatePath('/app');
}

export async function toggleItem(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const id = String(formData.get('id') || '');
  const visible = String(formData.get('visible') || '') === 'true';
  if (!id) return;
  await supabase
    .from('items')
    .update({ visible: !visible, updated_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/app');
}

export async function guardarTienda(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!seller) return;
  const name = String(formData.get('name') || '').trim();
  const title = String(formData.get('title') || '').trim() || null;
  const subtitle = String(formData.get('subtitle') || '').trim() || null;
  const whatsapp = String(formData.get('whatsapp') || '').trim() || null;
  const patch: Record<string, unknown> = { title, subtitle, whatsapp };
  if (name) patch.name = name;
  await supabase.from('sellers').update(patch).eq('id', seller.id);
  revalidatePath('/app');
}
