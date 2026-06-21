import { createClient } from '@supabase/supabase-js';

// Cliente con permisos de administrador (service role). SOLO se usa en el
// servidor, nunca se expone al navegador. Salta RLS, por eso quien lo invoca
// debe verificar antes que es el dueno.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
