import './globals.css';
import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import {
  DEFAULT_INDEX_ROBOTS,
  HOME_DESCRIPTION,
  HOME_TITLE,
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CommunityCTA } from '@/components/CommunityCTA';

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL.toString() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'marketplace',
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  robots: DEFAULT_INDEX_ROBOTS,
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    locale: 'lt_LT',
    type: 'website',
    images: [
      {
        url: OG_IMAGE_PATH,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  other: {
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050816',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className="dark" suppressHydrationWarning>
      <head>
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb" />
      </head>
      <body>
        {children}

        <footer className="space-y-5 border-t border-[var(--border)] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-center text-sm text-[var(--muted-foreground)] sm:pb-6">
          <CommunityCTA placement="footer" />
          <a href="/" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Numeriai
          </a>
          <a href="/apie" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Apie
          </a>
          <a href="/parduoti" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Parduoti
          </a>
          <a href="/aukcionai" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Aukcionai
          </a>
          <a href="/kaip-parduoti-numeri" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Kaip parduoti
          </a>
          <a href="/vardiniai-numeriai" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Vardiniai numeriai
          </a>
          <a href="/motociklu-numeriai" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Motociklų numeriai
          </a>
          <a href="/numerio-analize" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Numerio analizė
          </a>
          <a href="/taisykles" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Taisyklės
          </a>
          <a href="/privatumas" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Privatumas
          </a>
          <a href="/idomiausi-numeriai" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Įdomiausi numeriai
          </a>
        </footer>
        <MobileBottomNav />
        <GoogleAnalytics gaId="G-6HPX9Q9GLV" />
      </body>
    </html>
  );
}
