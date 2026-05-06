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
      <body>
        {children}

        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          <a href="/taisykles" className="mx-2 hover:text-slate-900">
            Taisyklės
          </a>
          <a href="/privatumas" className="mx-2 hover:text-slate-900">
            Privatumas
          </a>
        </footer>
      </body>
    </html>
  );
}
