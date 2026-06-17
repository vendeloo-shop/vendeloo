import type { Estado } from './supabase/types';

export function formatPrice(n: number | null): string {
  if (n === null || n === undefined) return 'Consultar';
  return '$' + n.toLocaleString('es-CO');
}

export const estadoLabel: Record<Estado, string> = {
  disp: 'Disponible',
  apar: 'Apartado',
  vend: 'Vendido',
};

export function waLink(phone: string | null | undefined, text: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
