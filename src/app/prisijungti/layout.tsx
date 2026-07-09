import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Prisijungimas | Unikodas',
  description: 'Prisijunkite prie savo Unikodas paskyros telefonu.',
  path: '/prisijungti',
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
