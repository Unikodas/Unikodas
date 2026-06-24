import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { createPageMetadata, getListingSeo, HOME_DESCRIPTION, SITE_NAME } from '@/lib/seo';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import { MessageForm } from './MessageForm';
import { sendMessageAction } from './actions';
import { ReportButton } from '@/components/ReportButton';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
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

async function getListing(id: string): Promise<ListingRow | null> {
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

  return listing ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return createPageMetadata({
      title: `Skelbimas nerastas | ${SITE_NAME}`,
      description: HOME_DESCRIPTION,
      path: `/skelbimas/${id}`,
    });
  }

  return createPageMetadata(getListingSeo(listing.id, listing.plate_text));
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const listing = await getListing(id);
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
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="mb-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-start">
            <div className="flex min-h-36 items-center justify-center rounded-lg bg-[var(--surface-muted)] p-4">
              <PlatePreview
                plateText={listing.plate_text}
                plateType={listing.plate_type}
                flagType={listing.flag_type}
                size="lg"
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium uppercase text-[var(--muted-soft)]">
                  {lt.listings.price}
                </div>
                <div className="mt-1 text-3xl font-semibold text-[var(--text)]">
                  {formatPrice(listing.price_eur)}
                </div>
              </div>

              {listing.is_verified_listing && (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {lt.listings.verifiedBadge}
                </span>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 mb-6">
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--muted-soft)]">{lt.listings.plateType}</dt>
              <dd className="mt-0.5 text-[var(--text)]">{typeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--muted-soft)]">{lt.listings.flagType}</dt>
              <dd className="mt-0.5 text-[var(--text)]">{flagLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-[var(--muted-soft)]">{lt.listings.city}</dt>
              <dd className="mt-0.5 text-[var(--text)]">{listing.city}</dd>
            </div>
          </dl>

          {listing.description && (
            <div className="mb-6">
              <h2 className="mb-1 text-xs font-medium uppercase text-[var(--muted-soft)]">
                {lt.listings.description}
              </h2>
              <p className="whitespace-pre-wrap text-[var(--text)]">{listing.description}</p>
            </div>
          )}

          <div className="text-xs text-[var(--muted)]">
            {lt.listings.postedAt}: {formatDate(listing.created_at)}
          </div>
        </div>

        {/* Contact section. Phone numbers stay hidden — buyers reach
            the seller through in-app messaging instead. */}
        {canMessageSeller && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold mb-3">{lt.messages.contactSeller}</h2>
            <MessageForm action={boundSendMessage} submitLabel={lt.messages.form.send} />
          </div>
        )}
        {!userData.user && (
          <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--muted)]">
            <Link
              href={`/prisijungti?redirect=${encodeURIComponent(`/skelbimas/${listing.id}`)}`}
              className="underline hover:text-[var(--text)]"
            >
              {lt.messages.signInToContact}
            </Link>
          </div>
        )}

        {isOwner && (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/skelbimas/${listing.id}/redaguoti`}
              className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
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
