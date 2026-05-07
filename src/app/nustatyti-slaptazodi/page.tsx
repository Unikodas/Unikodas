import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { LogoLink } from '@/components/LogoLink';
import { SetPasswordForm } from './SetPasswordForm';

/**
 * Set or change the signed-in user's password.
 *
 * Two entry paths:
 *   - First-time set: routed here after a successful OTP verify
 *     (either as opt-in onboarding or via "forgot password" reset).
 *     `has_password` is false → form shows just the new-password fields.
 *   - Change: linked from /profilis. `has_password` is true → form
 *     also asks for the current password (reauth gate).
 */
export default async function SetPasswordPage() {
  const { supabase, user } = await requireUser('/nustatyti-slaptazodi');

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_password')
    .eq('id', user.id)
    .maybeSingle();

  const hasPassword = profile?.has_password ?? false;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <Link href="/profilis" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">
          {hasPassword ? lt.auth.changePasswordTitle : lt.auth.setPasswordTitle}
        </h1>
        <SetPasswordForm hasPassword={hasPassword} />
      </main>
    </>
  );
}
