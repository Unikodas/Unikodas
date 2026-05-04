'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { PASSWORD_MIN, PASSWORD_MAX } from '@/lib/validation/password';

interface SetPasswordFormProps {
  /** True if the user already has a password set; we'll require the current one. */
  hasPassword: boolean;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.auth.passwordErrors as Record<string, string>;
  return errs[code] ?? lt.auth.passwordErrors.server_error;
}

export function SetPasswordForm({ hasPassword }: SetPasswordFormProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side checks before round-tripping. Server re-validates.
    if (newPassword.length < PASSWORD_MIN) {
      setError('password_too_short');
      return;
    }
    if (newPassword.length > PASSWORD_MAX) {
      setError('password_too_long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('passwords_dont_match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: hasPassword ? currentPassword : undefined,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'server_error');
        return;
      }
      router.push('/profilis');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasPassword && (
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            {lt.auth.currentPasswordLabel}
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={PASSWORD_MAX}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            disabled={submitting}
          />
        </label>
      )}

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.auth.newPasswordLabel}</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          disabled={submitting}
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.auth.passwordHint}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">
          {lt.auth.confirmPasswordLabel}
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          disabled={submitting}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage(error)}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto rounded-lg bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? lt.common.loading : lt.common.save}
      </button>
    </form>
  );
}
