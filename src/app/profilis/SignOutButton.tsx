'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';

export default function SignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className="w-full rounded-lg border border-slate-300 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {submitting ? lt.common.loading : lt.nav.logout}
    </button>
  );
}
