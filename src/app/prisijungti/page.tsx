'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { isValidLithuanianMobile } from '@/lib/validation/phone';
import { safeRedirectPath } from '@/lib/auth/redirect-path';
import { Turnstile } from '@/components/Turnstile';

type Tab = 'password' | 'otp';
type OtpStep = 'phone' | 'code';

/**
 * Resolve the post-login redirect target from the current URL.
 * Reads ?redirect=… from window.location to avoid useSearchParams
 * (which would require a Suspense boundary at the page level).
 * Validation is shared with require-user.ts via safeRedirectPath
 * so server and client agree on what's safe.
 */
function getPostLoginTarget(): string {
  if (typeof window === 'undefined') return '/profilis';
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return safeRedirectPath(raw) ?? '/profilis';
}

export default function SignInPage() {
  const router = useRouter();

  // Default to the password tab — returning users (the majority of
  // logins after the first month or two) get the cheapest path. New
  // users and forgot-password flows go through the SMS tab.
  const [tab, setTab] = useState<Tab>('password');

  // OTP-tab state.
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  /**
   * True when the user got to the SMS tab via "Pamiršote slaptažodį?"
   * In that case, after a successful OTP verify we route them to
   * /nustatyti-slaptazodi instead of /profilis so they can set the
   * new password while still signed in via the OTP-minted session.
   */
  const [resetMode, setResetMode] = useState(false);

  // Password-tab state.
  const [pwPhone, setPwPhone] = useState('');
  const [pwPassword, setPwPassword] = useState('');

  // Cloudflare Turnstile token. Shared between password sign-in and
  // OTP request — both paths require it. Reset to null whenever the
  // user switches tabs so a stale token from one form doesn't get
  // submitted by the other.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Stable identity so Turnstile's internal effect doesn't re-render.
  const handleCaptchaToken = useCallback(
    (token: string | null) => setCaptchaToken(token),
    [],
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearError() {
    setError(null);
  }

  function otpErrorMessage(key: string | null): string | null {
    if (!key) return null;
    switch (key) {
      case 'invalid_phone':
        return lt.auth.phoneInvalid;
      case 'rate_limited':
        return lt.auth.rateLimited;
      case 'invalid_code':
      case 'too_many_attempts':
        return lt.auth.codeIncorrect;
      case 'captcha_required':
      case 'captcha_failed':
        return lt.auth.captchaRequired;
      default:
        return lt.common.error;
    }
  }

  function passwordErrorMessage(key: string | null): string | null {
    if (!key) return null;
    if (key === 'captcha_required' || key === 'captcha_failed') {
      return lt.auth.captchaRequired;
    }
    const errs = lt.auth.passwordErrors as Record<string, string>;
    return errs[key] ?? lt.common.error;
  }

  // ---------- OTP tab handlers ----------------------------------------

  async function handleOtpRequest(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (!isValidLithuanianMobile(otpPhone)) {
      setError('invalid_phone');
      return;
    }
    if (!captchaToken) {
      setError('captcha_required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, captcha_token: captchaToken }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'server_error');
        // Token is single-use; force the user to solve again on retry.
        setCaptchaToken(null);
        return;
      }
      setOtpStep('code');
      // Clear the consumed token so the next form (which doesn't show
      // the widget) can't accidentally submit it.
      setCaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpVerify(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (!/^\d{6}$/.test(otpCode)) {
      setError('invalid_code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'server_error');
        return;
      }
      // Forgot-password flow: route to set-password page so the user
      // can immediately replace the password while signed in.
      const target = resetMode ? '/nustatyti-slaptazodi' : getPostLoginTarget();
      router.push(target);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Password tab handler ------------------------------------

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (!isValidLithuanianMobile(pwPhone)) {
      setError('invalid_credentials'); // generic — don't reveal phone-format issue
      return;
    }
    if (!captchaToken) {
      setError('captcha_required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: pwPhone,
          password: pwPassword,
          captcha_token: captchaToken,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'server_error');
        // Token is single-use — force the user to re-solve on retry.
        setCaptchaToken(null);
        return;
      }
      router.push(getPostLoginTarget());
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- "Pamiršote slaptažodį?" --------------------------------

  function startResetFlow() {
    clearError();
    setResetMode(true);
    setOtpStep('phone');
    // Carry the phone the user already typed in the password tab.
    if (pwPhone) setOtpPhone(pwPhone);
    setTab('otp');
  }

  // ---------- Render --------------------------------------------------

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-semibold mb-1">{lt.nav.login}</h1>
        <p className="text-sm text-slate-600 mb-4">{lt.appName}</p>

        {/* Tab selector */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-5 text-sm">
          <button
            type="button"
            onClick={() => {
              setTab('password');
              setCaptchaToken(null);
              clearError();
            }}
            className={
              tab === 'password'
                ? 'flex-1 rounded-md bg-white shadow-sm py-1.5 font-medium'
                : 'flex-1 rounded-md py-1.5 text-slate-600 hover:text-slate-900'
            }
          >
            {lt.auth.tabPassword}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('otp');
              setResetMode(false);
              setCaptchaToken(null);
              clearError();
            }}
            className={
              tab === 'otp'
                ? 'flex-1 rounded-md bg-white shadow-sm py-1.5 font-medium'
                : 'flex-1 rounded-md py-1.5 text-slate-600 hover:text-slate-900'
            }
          >
            {lt.auth.tabOtp}
          </button>
        </div>

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="pw-phone" className="block text-sm font-medium mb-1">
                {lt.auth.phoneLabel}
              </label>
              <input
                id="pw-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={lt.auth.phonePlaceholder}
                value={pwPhone}
                onChange={(e) => setPwPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label htmlFor="pw-password" className="block text-sm font-medium mb-1">
                {lt.auth.passwordLabel}
              </label>
              <input
                id="pw-password"
                type="password"
                autoComplete="current-password"
                value={pwPassword}
                onChange={(e) => setPwPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                disabled={submitting}
                required
              />
            </div>

            <Turnstile onToken={handleCaptchaToken} />

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {passwordErrorMessage(error)}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? lt.common.loading : lt.auth.signIn}
            </button>

            <button
              type="button"
              onClick={startResetFlow}
              className="w-full text-sm text-slate-600 hover:text-slate-900"
              disabled={submitting}
            >
              {lt.auth.forgotPassword}
            </button>
          </form>
        )}

        {/* OTP tab — phone step */}
        {tab === 'otp' && otpStep === 'phone' && (
          <form onSubmit={handleOtpRequest} className="space-y-4">
            <div>
              <label htmlFor="otp-phone" className="block text-sm font-medium mb-1">
                {lt.auth.phoneLabel}
              </label>
              <input
                id="otp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={lt.auth.phonePlaceholder}
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                disabled={submitting}
                required
              />
              <p className="mt-1 text-xs text-slate-500">{lt.auth.phoneHint}</p>
            </div>

            <p className="text-xs text-slate-500">
              {resetMode ? lt.auth.resetHint : lt.auth.signupHint}
            </p>

            <Turnstile onToken={handleCaptchaToken} />

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {otpErrorMessage(error)}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? lt.common.loading : lt.auth.sendCode}
            </button>
          </form>
        )}

        {/* OTP tab — code step */}
        {tab === 'otp' && otpStep === 'code' && (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div>
              <label htmlFor="otp-code" className="block text-sm font-medium mb-1">
                {lt.auth.codeLabel}
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder={lt.auth.codePlaceholder}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center tracking-[0.5em] text-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                disabled={submitting}
                required
              />
              <p className="mt-1 text-xs text-slate-500">{otpPhone}</p>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {otpErrorMessage(error)}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? lt.common.loading : lt.auth.verify}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpStep('phone');
                setOtpCode('');
                clearError();
              }}
              className="w-full text-sm text-slate-600 hover:text-slate-900"
              disabled={submitting}
            >
              {lt.common.back}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
