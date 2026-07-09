import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Profilis | Unikodas',
  description: 'Tvarkykite savo Unikodas profilį, skelbimus ir pranešimų nustatymus.',
  path: '/profilis',
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
