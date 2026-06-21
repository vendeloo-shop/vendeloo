import { createClient } from '@/lib/supabase/server';

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('key, value');
  const out: Settings = {};
  (data || []).forEach((r: { key: string; value: string | null }) => {
    out[r.key] = r.value ?? '';
  });
  return out;
}
