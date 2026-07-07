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
import { CommunityCTA } from '@/components/CommunityCTA';
import { ListingViewTracker } from './ListingViewTracker';

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
  if (!listing) notFound();

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
      {listing.status === 'active' && <ListingViewTracker listingId={listing.id} />}

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <article className="app-card overflow-hidden">
          <div className="flex min-h-64 items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_20%,var(--muted)),var(--background))] px-4 py-10">
            <PlatePreview
              plateText={listing.plate_text}
              plateType={listing.plate_type}
              flagType={listing.flag_type}
              size="lg"
              className="plate-preview--hero"
            />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">{typeLabel}</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-[var(--foreground)]">
                {listing.plate_text}
              </h1>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="text-4xl font-black text-[var(--primary)]">
                  {formatPrice(listing.price_eur)}
                </div>
                <div className="pb-1 text-base font-bold text-[var(--muted-foreground)]">
                  {listing.city}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--muted-foreground)]">
                  {formatDate(listing.created_at)}
                </span>
                {listing.is_verified_listing && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    {lt.listings.verifiedBadge}
                  </span>
                )}
              </div>
            </div>

            {!isOwner && listing.status === 'active' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                {canMessageSeller ? (
                  <a href="#zinute" className="app-button-primary px-5 py-3 text-center text-sm">
                    Rašyti pardavėjui
                  </a>
                ) : (
                  <Link href={loginHref} className="app-button-primary px-5 py-3 text-center text-sm">
                    Rašyti pardavėjui
                  </Link>
                )}
                {userData.user ? (
                  <button type="button" disabled className="app-button-secondary px-5 py-3 text-sm text-[var(--muted-foreground)] opacity-80">
                    Išsaugoti
                  </button>
                ) : (
                  <Link href={loginHref} className="app-button-secondary px-5 py-3 text-center text-sm">
                    Išsaugoti
                  </Link>
                )}
                <ShareButton
                  title={`Unikodas ${listing.plate_text}`}
                  text="Peržiūrėkite numerį Unikodas.lt"
                  className="app-button-secondary px-5 py-3 text-sm"
                />
              </div>
            )}
          </div>
        </article>

        <section className="app-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-black text-[var(--foreground)]">Informacija</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--muted)] p-3">
              <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                {lt.listings.plateType}
              </dt>
              <dd className="mt-1 font-bold text-[var(--foreground)]">{typeLabel}</dd>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-3">
              <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                {lt.listings.flagType}
              </dt>
              <dd className="mt-1 font-bold text-[var(--foreground)]">{flagLabel}</dd>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-3">
              <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                {lt.listings.city}
              </dt>
              <dd className="mt-1 font-bold text-[var(--foreground)]">{listing.city}</dd>
            </div>
          </dl>
        </section>

        {listing.description && (
          <section className="app-card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-black text-[var(--foreground)]">
              {lt.listings.description}
            </h2>
            <p className="whitespace-pre-wrap text-base leading-7 text-[var(--card-foreground)]">
              {listing.description}
            </p>
          </section>
        )}

        <section className="app-card p-5 sm:p-6">
          <h2 className="text-lg font-black text-[var(--foreground)]">Pardavėjas</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Pardavėjas pasiekiamas tik per vidines Unikodas žinutes. Telefono numeriai viešai nerodomi.
          </p>
        </section>

        {canMessageSeller && (
          <section id="zinute" className="app-card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-black text-[var(--foreground)]">Rašyti pardavėjui</h2>
            <MessageForm action={boundSendMessage} submitLabel={lt.messages.form.send} />
          </section>
        )}

        <CommunityCTA placement="listing" listingId={listing.id} />

        {!userData.user && <LoginPrompt redirectTo={detailPath} />}

        {isOwner && (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/skelbimas/${listing.id}/redaguoti`}
              className="app-button-secondary px-4 py-3 text-sm"
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
