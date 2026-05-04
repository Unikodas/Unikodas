import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { ListingForm } from '@/components/ListingForm';
import { createListingAction } from './actions';

export default async function NewListingPage() {
  // Auth-gate the page. Pass the current path so the sign-in page can
  // bring the user back here after verification.
  await requireUser('/parduoti');

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            {lt.appName}
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">{lt.listings.createNew}</h1>
        <ListingForm action={createListingAction} submitLabel={lt.listings.form.submitCreate} />
      </main>
    </>
  );
}
