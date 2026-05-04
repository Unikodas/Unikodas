import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { ListingForm } from '@/components/ListingForm';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import type { LithuanianCity } from '@/lib/locations/lithuania-cities';
import { updateListingAction } from './actions';
import { DeleteButton } from './DeleteButton';

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
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            {lt.appName}
          </Link>
          <Link
            href={`/skelbimas/${id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">{lt.listings.edit}</h1>

        <ListingForm
          initial={listing}
          action={boundUpdate}
          submitLabel={lt.listings.form.submitUpdate}
        />

        <div className="border-t border-slate-200 pt-6">
          <DeleteButton id={id} />
        </div>
      </main>
    </>
  );
}
