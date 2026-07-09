import type { Metadata } from 'next';

import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Žinutės | Unikodas',
  description: 'Privatūs Unikodas naudotojų pokalbiai.',
  path: '/zinutes',
});

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
