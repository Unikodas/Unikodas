import './globals.css';
import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { HOME_DESCRIPTION, HOME_TITLE, OG_IMAGE_PATH, SITE_NAME, SITE_URL } from '@/lib/seo';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CommunityCTA } from '@/components/CommunityCTA';

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  openGraph: {
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
    images: [OG_IMAGE_PATH],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  if (window.localStorage.getItem('unikodas-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (_) {}
`,
          }}
        />
      </head>
      <body>
        {children}

        <footer className="space-y-5 border-t border-[var(--border)] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-center text-sm text-[var(--muted)] sm:pb-6">
          <CommunityCTA placement="footer" />
          <a href="/taisykles" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Taisyklės
          </a>
          <a href="/privatumas" className="mx-2 inline-flex min-h-11 items-center hover:text-[var(--text)]">
            Privatumas
          </a>
        </footer>
        <MobileBottomNav />
        <GoogleAnalytics gaId="G-6HPX9Q9GLV" />
      </body>
    </html>
  );
}
