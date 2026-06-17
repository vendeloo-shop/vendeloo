'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOut() {
  const router = useRouter();
  async function out() {
    await createClient().auth.signOut();
    router.push('/app/login');
    router.refresh();
  }
  return (
    <button onClick={out} className="btn btn--ghost" style={{ padding: '8px 14px', fontSize: 13 }}>
      Salir
    </button>
  );
}
