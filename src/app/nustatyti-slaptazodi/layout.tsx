import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Slaptažodžio nustatymas | Unikodas',
  description: 'Saugiai nustatykite arba pakeiskite Unikodas paskyros slaptažodį.',
  path: '/nustatyti-slaptazodi',
});

export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
