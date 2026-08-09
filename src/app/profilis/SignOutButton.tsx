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
      className="flex w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
    >
      {submitting ? lt.common.loading : lt.nav.logout}
    </button>
  );
}
