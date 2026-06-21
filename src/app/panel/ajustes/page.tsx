import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { guardarAjustes } from '../actions';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect('/app/login');
  const isOwner = OWNER_EMAIL && auth.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  if (!isOwner) redirect('/panel');

  const s = await getSettings();

  return (
    <main className="wrap" style={{ maxWidth: 640, padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28 }}>Ajustes de la web</h1>
        <Link href="/panel" className="btn btn--ghost" style={{ padding: '7px 12px', fontSize: 13 }}>Volver</Link>
      </div>
      <p style={{ color: 'var(--ink-soft)', margin: '6px 0 0' }}>
        Estos valores se usan en el landing y en el alta. Los cambios se aplican al guardar.
      </p>

      <form action={guardarAjustes} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <Group title="Precios de los planes (COP)">
          <Field label="Básico" name="price_basico" value={s.price_basico} />
          <Field label="Medio" name="price_medio" value={s.price_medio} />
          <Field label="Grande" name="price_grande" value={s.price_grande} />
        </Group>

        <Group title="Datos de pago por país">
          <Field label="Link de pago online (PSE / tarjeta), reutilizable" name="pse_link" value={s.pse_link} placeholder="https://..." />
          <Field label="Prefijo de referencia" name="vnd_prefijo" value={s.vnd_prefijo} />
          <Area label="Colombia (un método por línea, formato Nombre: valor)" name="pago_co" value={s.pago_co} />
          <Area label="España" name="pago_es" value={s.pago_es} />
          <Area label="México" name="pago_mx" value={s.pago_mx} />
          <Area label="Argentina" name="pago_ar" value={s.pago_ar} />
          <Area label="Estados Unidos" name="pago_us" value={s.pago_us} />
          <Area label="Otro país" name="pago_otro" value={s.pago_otro} />
        </Group>

        <Group title="Textos del landing">
          <Field label="Subtítulo del encabezado" name="landing_sub" value={s.landing_sub} />
          <Area label="Mensaje del formulario de contacto" name="contacto_msg" value={s.contacto_msg} />
        </Group>

        <Group title="Correo">
          <Field label="Remitente" name="remitente" value={s.remitente} />
        </Group>

        <button type="submit" className="btn btn--primary" style={{ alignSelf: 'flex-start', padding: '10px 22px' }}>
          Guardar ajustes
        </button>
      </form>
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-btn)', padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, name, value, placeholder }: { label: string; name: string; value?: string; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <input name={name} defaultValue={value || ''} placeholder={placeholder || ''} style={inp} />
    </label>
  );
}

function Area({ label, name, value }: { label: string; name: string; value?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <textarea name={name} defaultValue={value || ''} rows={3} style={{ ...inp, resize: 'vertical' }} />
    </label>
  );
}

const inp: React.CSSProperties = {
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--r-btn)',
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'var(--body)',
  background: '#fff',
  color: 'var(--ink)',
};
