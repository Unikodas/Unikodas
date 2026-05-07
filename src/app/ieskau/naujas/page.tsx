import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { WantedForm } from '@/components/WantedForm';
import { LogoLink } from '@/components/LogoLink';
import { createWantedAction } from './actions';

export default async function NewWantedPage() {
  await requireUser('/ieskau/naujas');

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link href="/ieskau" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">{lt.wanted.createNew}</h1>
        <WantedForm action={createWantedAction} submitLabel={lt.wanted.form.submitCreate} />
      </main>
    </>
  );
}
