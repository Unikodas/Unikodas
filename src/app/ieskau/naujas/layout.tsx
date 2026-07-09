import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Įdėti ieškomą numerį | Unikodas',
  description: 'Prisijunkite ir paskelbkite, kokio automobilio numerio ieškote.',
  path: '/ieskau/naujas',
});

export default function NewWantedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
