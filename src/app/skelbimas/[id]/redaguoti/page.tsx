import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { ListingForm } from '@/components/ListingForm';
import { LogoLink } from '@/components/LogoLink';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import type { LithuanianCity } from '@/lib/locations/lithuania-cities';
import { updateListingAction } from './actions';
import { DeleteButton } from './DeleteButton';
import { createNoIndexMetadata } from '@/lib/seo';

type ListingRow = {
  id: string;
  seller_id: string;
  plate_text: string;
  plate_type: PlateType;
  flag_type: FlagType;
  city: LithuanianCity;
  price_eur?: number;
  description: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return createNoIndexMetadata({
    title: 'Skelbimo redagavimas | Unikodas',
    description: 'Privatus automobilio numerio skelbimo redagavimo puslapis.',
    path: `/skelbimas/${id}/redaguoti`,
  });
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/skelbimas/${id}/redaguoti`);

  // Fetch with owner-only filter to short-circuit the not-owner case
  // before ever rendering the form. Even if this leaked, RLS on
  // `listings_owner_update` would still block the mutation.
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, seller_id, plate_text, plate_type, flag_type, city, price_eur, description')
    .eq('id', id)
    .maybeSingle<ListingRow>();

  if (error) {
    console.error('[redaguoti] fetch failed:', error);
  }
  if (!listing) {
    notFound();
  }
  if (listing.seller_id !== user.id) {
    // Not the owner — bounce back to the public detail page rather than
    // showing an editable form.
    redirect(`/skelbimas/${id}`);
  }

  // Bind the listing id into the action so the form's submit signature
  // stays (state, formData) — matching ListingFormProps.action.
  const boundUpdate = updateListingAction.bind(null, id);

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href={`/skelbimas/${id}`}
            className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-black text-[var(--foreground)]">{lt.listings.edit}</h1>

        <ListingForm
          initial={listing}
          action={boundUpdate}
          submitLabel={lt.listings.form.submitUpdate}
        />

        <div className="border-t border-[var(--border)] pt-6">
          <DeleteButton id={id} />
        </div>
      </main>
    </>
  );
}
