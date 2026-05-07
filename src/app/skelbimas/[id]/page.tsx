import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import { MessageForm } from './MessageForm';
import { sendMessageAction } from './actions';
import { ReportButton } from '@/components/ReportButton';
import { LogoLink } from '@/components/LogoLink';
import { DeleteButton } from './redaguoti/DeleteButton';

type ListingRow = {
  id: string;
  seller_id: string;
  plate_text: string;
  plate_type: PlateType;
  flag_type: FlagType;
  city: string;
  price_eur: number | null;
  description: string | null;
  is_verified_listing: boolean;
  status: string;
  created_at: string;
};

function formatPrice(price: number | null): string {
  // Price is required at the schema/DB level after migration 0006;
  // null is only possible on pre-migration legacy rows. Show a dash
  // rather than the old "Kaina sutartinė" copy.
  if (price === null) return '—';
  return `${price.toLocaleString('lt-LT')} €`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS lets anon read active listings; the owner can also see their own
  // sold/removed rows. We do not surface seller phone or any contact info.
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      'id, seller_id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, status, created_at',
    )
    .eq('id', id)
    .maybeSingle<ListingRow>();

  if (error) {
    console.error('[detail] listing query failed:', error);
  }
  if (!listing) {
    notFound();
  }

  const { data: userData } = await supabase.auth.getUser();
  const isOwner = userData.user?.id === listing.seller_id;
  // Messaging is only available on active listings — matches the
  // sendMessageAction guard server-side.
  const canMessageSeller = !!userData.user && !isOwner && listing.status === 'active';
  const boundSendMessage = sendMessageAction.bind(null, listing.id);

  const typeLabel = lt.listings.types[listing.plate_type] ?? listing.plate_type;
  const flagLabel = lt.listings.flagTypes[listing.flag_type] ?? listing.flag_type;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider">
              {listing.plate_text}
            </div>
            {listing.is_verified_listing && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {lt.listings.verifiedBadge}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">{lt.listings.plateType}</dt>
              <dd className="mt-0.5">{typeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">{lt.listings.flagType}</dt>
              <dd className="mt-0.5">{flagLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">{lt.listings.city}</dt>
              <dd className="mt-0.5">{listing.city}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">{lt.listings.price}</dt>
              <dd className="mt-0.5 font-medium text-base text-slate-900">
                {formatPrice(listing.price_eur)}
              </dd>
            </div>
          </dl>

          {listing.description && (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                {lt.listings.description}
              </h2>
              <p className="whitespace-pre-wrap text-slate-800">{listing.description}</p>
            </div>
          )}

          <div className="text-xs text-slate-500">
            {lt.listings.postedAt}: {formatDate(listing.created_at)}
          </div>
        </div>

        {/* Contact section. Phone numbers stay hidden — buyers reach
            the seller through in-app messaging instead. */}
        {canMessageSeller && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-3">{lt.messages.contactSeller}</h2>
            <MessageForm action={boundSendMessage} submitLabel={lt.messages.form.send} />
          </div>
        )}
        {!userData.user && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            <Link
              href={`/prisijungti?redirect=${encodeURIComponent(`/skelbimas/${listing.id}`)}`}
              className="underline hover:text-slate-900"
            >
              {lt.messages.signInToContact}
            </Link>
          </div>
        )}

        {isOwner && (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/skelbimas/${listing.id}/redaguoti`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {lt.listings.edit}
            </Link>
            <DeleteButton id={listing.id} />
          </div>
        )}

        {!isOwner && userData.user && (
          <div className="pt-2">
            <ReportButton targetType="listing" targetId={listing.id} />
          </div>
        )}
      </main>
    </>
  );
}
