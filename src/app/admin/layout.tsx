import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createNoIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = createNoIndexMetadata({
  title: 'Administravimas | Unikodas',
  description: 'Vidinis Unikodas administravimo puslapis.',
  path: '/admin',
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Route-wide authorization boundary. Individual pages and mutations also
  // call requireAdmin(), but keeping the check here ensures every current and
  // future /admin/* page is inaccessible unless the signed-in profile has
  // is_admin = true.
  await requireAdmin();

  return children;
}
