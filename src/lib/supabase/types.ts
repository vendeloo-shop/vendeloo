export type Estado = 'disp' | 'apar' | 'vend';
export type SellerStatus = 'pending' | 'active' | 'expired' | 'paused';

export type Template = {
  id: string;
  name: string;
  description: string | null;
  accent: string | null;
  is_default: boolean;
  sort_order: number;
};

export type Seller = {
  id: string;
  user_id: string | null;
  slug: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  status: SellerStatus;
  plan: string | null;
  started_at: string | null;
  expires_at: string | null;
  notes: string | null;
  // Fase 2 (branding)
  template: string;
  cover_photo: string | null;
  title: string | null;
  subtitle: string | null;
  theme: Record<string, unknown>;
  item_limit: number;
  created_at: string;
};

export type Item = {
  id: string;
  seller_id: string;
  name: string;
  price: number | null;
  cat: string | null;
  dims: string | null;
  brand: string | null;
  note: string | null;
  ref: string | null;
  estado: Estado;
  visible: boolean;
  avail_from: string | null;
  imgs: string[];
  updated_at: string;
  created_at: string;
};
