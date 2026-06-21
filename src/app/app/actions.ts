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
  let paid = Math.round(Number(formData.get('paid') || 0));
  if (paid <= 0) paid = amount;
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
