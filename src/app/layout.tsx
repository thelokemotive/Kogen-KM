import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: { default: 'Kogen KM', template: '%s · Kogen KM' },
  description: 'Trail running & mountain biking at Harrow Appi International School',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  appleWebApp: { capable: true, title: 'Kogen KM', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0f3226',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
