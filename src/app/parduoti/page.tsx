import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { ListingForm } from '@/components/ListingForm';
import { LoginPrompt } from '@/components/LoginPrompt';
import { LogoLink } from '@/components/LogoLink';
import { createListingAction } from './actions';

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto min-h-screen max-w-2xl px-4 py-6 sm:px-6">
        {!userData.user ? (
          <LoginPrompt redirectTo="/parduoti" />
        ) : (
          <>
            <h1 className="mb-5 text-3xl font-black text-[var(--foreground)]">
              Įdėti skelbimą
            </h1>
            <ListingForm action={createListingAction} submitLabel={lt.listings.form.submitCreate} />
          </>
        )}
      </main>
    </>
  );
}
