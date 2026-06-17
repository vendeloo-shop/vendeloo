# Vendeloo

SaaS de catálogos para vender por WhatsApp. App multiusuario, data-driven (Next.js + Supabase), instalable como PWA.

## Stack
- Next.js 15 (App Router, TypeScript)
- Supabase (Postgres + Auth + RLS)
- PWA (manifest + service worker) — instalable sin App Store / Play Store

## Rutas
- `/` — landing de Vendeloo
- `/{slug}` — catálogo público del vendedor (SSR, con Open Graph por vendedor → preview correcto en WhatsApp)
- `/alta` — formulario de solicitud (inserta en `applications`)
- `/app` — editor del vendedor (login con Supabase Auth)
- `/panel` — cabina del dueño (solo equipo Vendeloo)

## Variables de entorno
Copiar `.env.example` a `.env.local` (local) o configurarlas en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/publishable key (Settings → API)
- `NEXT_PUBLIC_SITE_URL` — URL pública (p. ej. https://vendeloo.shop)
- `OWNER_EMAIL` — correo con acceso a `/panel`

## Desarrollo
```bash
npm install
npm run dev
```

## Deploy (Vercel)
1. Conectar el repo a Vercel (OAuth de GitHub).
2. Setear las variables de entorno de arriba.
3. Cada push a `main` despliega solo.

## Pendiente (siguientes avances)
- Edición completa de artículos en `/app` (alta/baja, fotos, precios, estados).
- Acciones de la cabina `/panel` (aprobar, activar, renovar) + política de admin en RLS.
- Selector de plantilla y subida de portada en el editor.
