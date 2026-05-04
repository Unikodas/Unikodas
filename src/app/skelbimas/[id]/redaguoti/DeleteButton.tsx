'use client';

import { useTransition } from 'react';
import { lt } from '@/lib/i18n/lt';
import { deleteListingAction } from './actions';

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(lt.listings.form.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deleteListingAction(id);
      // Server Action redirects on success; we only land here on error.
      if (result?.error) {
        const errs = lt.listings.errors as Record<string, string>;
        alert(errs[result.error] ?? lt.listings.errors.server_error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? lt.common.loading : lt.listings.delete}
    </button>
  );
}
