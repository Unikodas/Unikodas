import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { WantedForm } from '@/components/WantedForm';
import { LogoLink } from '@/components/LogoLink';
import { updateWantedAction } from './actions';
import { DeleteButton } from './DeleteButton';
import { createNoIndexMetadata } from '@/lib/seo';

type WantedRow = {
  id: string;
  buyer_id: string;
  plate_pattern: string;
  description: string | null;
  max_price_eur: number | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return createNoIndexMetadata({
    title: 'Ieškomo numerio redagavimas | Unikodas',
    description: 'Privatus ieškomo numerio skelbimo redagavimo puslapis.',
    path: `/ieskau/${id}/redaguoti`,
  });
}

export default async function EditWantedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/ieskau/${id}/redaguoti`);

  // Even if a non-owner reaches this page, RLS would still block the
  // mutation. We redirect first for a better UX.
  const { data: wanted, error } = await supabase
    .from('wanted_listings')
    .select('id, buyer_id, plate_pattern, description, max_price_eur')
    .eq('id', id)
    .maybeSingle<WantedRow>();

  if (error) {
    console.error('[ieskau/redaguoti] fetch failed:', error);
  }
  if (!wanted) {
    notFound();
  }
  if (wanted.buyer_id !== user.id) {
    redirect(`/ieskau/${id}`);
  }

  const boundUpdate = updateWantedAction.bind(null, id);

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link
            href={`/ieskau/${id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">{lt.wanted.edit}</h1>

        <WantedForm
          initial={wanted}
          action={boundUpdate}
          submitLabel={lt.wanted.form.submitUpdate}
        />

        <div className="border-t border-slate-200 pt-6">
          <DeleteButton id={id} />
        </div>
      </main>
    </>
  );
}
