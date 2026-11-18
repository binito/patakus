import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Patakus',
  description: 'Portal de administração e app de operações Patakus',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Patakus',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`
        }} />
      </body>
    </html>
  );
}
