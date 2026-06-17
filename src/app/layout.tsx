import type { Metadata, Viewport } from 'next';
import PWA from '@/components/PWA';
import './globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://vendeloo.shop';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Vendeloo · Tu catálogo para vender', template: '%s · Vendeloo' },
  description: 'Arma tu catálogo con tu marca y compártelo por WhatsApp. Hecho para vender rápido.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Vendeloo' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#FF6B5E',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <PWA />
      </body>
    </html>
  );
}
