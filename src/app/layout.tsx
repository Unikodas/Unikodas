import './globals.css';
import type { Metadata, Viewport } from 'next';
import { lt } from '@/lib/i18n/lt';

export const metadata: Metadata = {
  title: lt.appName,
  description: lt.tagline,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body>{children}</body>
    </html>
  );
}
