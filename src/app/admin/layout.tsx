import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Administravimas | Unikodas',
  description: 'Vidinis Unikodas administravimo puslapis.',
  path: '/admin',
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
