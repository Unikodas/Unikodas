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
      className="flex w-full items-center justify-center rounded-3xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-bold text-red-300 hover:bg-red-500/15 disabled:opacity-60"
    >
      {submitting ? lt.common.loading : lt.nav.logout}
    </button>
  );
}
