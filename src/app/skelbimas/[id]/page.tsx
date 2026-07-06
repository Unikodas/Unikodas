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
import { LoginPrompt } from '@/components/LoginPrompt';
import { ShareButton } from '@/components/ShareButton';

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
  if (price === null) return '-';
  return `${price.toLocaleString('lt-LT')} EUR`;
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
  const canMessageSeller = !!userData.user && !isOwner && listing.status === 'active';
  const boundSendMessage = sendMessageAction.bind(null, listing.id);

  const typeLabel = lt.listings.types[listing.plate_type] ?? listing.plate_type;
  const flagLabel = lt.listings.flagTypes[listing.flag_type] ?? listing.flag_type;
  const detailPath = `/skelbimas/${listing.id}`;
  const loginHref = `/prisijungti?redirect=${encodeURIComponent(detailPath)}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_92%,transparent)] backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <article className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/10">
          <div className="flex min-h-52 items-center justify-center bg-[var(--muted)] px-4 py-8">
            <PlatePreview
              plateText={listing.plate_text}
              plateType={listing.plate_type}
              flagType={listing.flag_type}
              size="lg"
            />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--muted-soft)]">{typeLabel}</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-[var(--foreground)]">
                {listing.plate_text}
              </h1>
              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="text-3xl font-black text-[var(--foreground)]">
                  {formatPrice(listing.price_eur)}
                </div>
                <div className="pb-1 text-base font-semibold text-[var(--muted-foreground)]">
                  {listing.city}
                </div>
              </div>
              {listing.is_verified_listing && (
                <span className="mt-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {lt.listings.verifiedBadge}
                </span>
              )}
            </div>

            {!isOwner && listing.status === 'active' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                {canMessageSeller ? (
                  <a
                    href="#zinute"
                    className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-center text-sm font-bold text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20 hover:bg-[var(--primary-hover)]"
                  >
                    Rašyti pardavėjui
                  </a>
                ) : (
                  <Link
                    href={loginHref}
                    className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-center text-sm font-bold text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20 hover:bg-[var(--primary-hover)]"
                  >
                    Rašyti pardavėjui
                  </Link>
                )}
                {userData.user ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-[var(--border-strong)] px-5 py-3 text-sm font-bold text-[var(--muted-foreground)]"
                  >
                    Išsaugoti
                  </button>
                ) : (
                  <Link
                    href={loginHref}
                    className="rounded-2xl border border-[var(--border-strong)] px-5 py-3 text-center text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)]"
                  >
                    Išsaugoti
                  </Link>
                )}
                <ShareButton
                  title={`Unikodas ${listing.plate_text}`}
                  text="Peržiūrėkite numerį Unikodas.lt"
                  className="rounded-2xl border border-[var(--border-strong)] px-5 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)]"
                />
              </div>
            )}

            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--muted-soft)]">
                  {lt.listings.plateType}
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">{typeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--muted-soft)]">
                  {lt.listings.flagType}
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">{flagLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--muted-soft)]">
                  {lt.listings.city}
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">{listing.city}</dd>
              </div>
            </dl>

            {listing.description && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase text-[var(--muted-soft)]">
                  {lt.listings.description}
                </h2>
                <p className="whitespace-pre-wrap text-base leading-7 text-[var(--card-foreground)]">
                  {listing.description}
                </p>
              </div>
            )}

            <div className="text-xs text-[var(--muted-foreground)]">
              {lt.listings.postedAt}: {formatDate(listing.created_at)}
            </div>
          </div>
        </article>

        {canMessageSeller && (
          <section
            id="zinute"
            className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg shadow-black/10 sm:p-6"
          >
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Rašyti pardavėjui</h2>
            <MessageForm action={boundSendMessage} submitLabel={lt.messages.form.send} />
          </section>
        )}

        {!userData.user && <LoginPrompt redirectTo={detailPath} />}

        {isOwner && (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/skelbimas/${listing.id}/redaguoti`}
              className="rounded-2xl border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
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
