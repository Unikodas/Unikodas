import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Įdėti skelbimą | Unikodas',
  description: 'Prisijunkite ir įkelkite automobilio numerio skelbimą į Unikodas.',
  path: '/parduoti',
});

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
