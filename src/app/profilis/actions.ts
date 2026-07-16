'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import {
  parseDisplayNameFormData,
  parseEmailSettingsFormData,
} from '@/lib/validation/profile';
import { sendEmailVerification } from '@/lib/email/verification';

export type DisplayNameFormState = {
  error: string | null;
  success: boolean;
};

export type EmailSettingsFormState = {
  error: string | null;
  success: boolean;
  verificationSent?: boolean;
};

/**
 * Update the signed-in user's display_name.
 *
 * RLS `profiles_update_self` enforces `auth.uid() = id` at the DB,
 * so even without the explicit `eq('id', user.id)` filter the update
 * could only ever touch the caller's own row. We pass it anyway as
 * defense in depth.
 */
export async function updateDisplayNameAction(
  _prev: DisplayNameFormState,
  formData: FormData,
): Promise<DisplayNameFormState> {
  const { supabase, user } = await requireUser('/profilis');

  let displayName: string;
  try {
    displayName = parseDisplayNameFormData(formData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: err.issues[0]?.message ?? 'validation_error',
        success: false,
      };
    }
    return { error: 'validation_error', success: false };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id);

  if (error) {
    // Postgres unique-violation on the case-insensitive
    // profiles_display_name_unique_idx. Surface as a friendly
    // "name already taken" instead of a generic server error.
    if (error.code === '23505') {
      return { error: 'display_name_taken', success: false };
    }
    console.error('[profilis] display_name update failed:', error);
    return { error: 'server_error', success: false };
  }

  // The inbox renders display names from public_profiles; refresh that
  // path so the new name appears next time the user opens it.
  revalidatePath('/profilis');
  revalidatePath('/zinutes');
  return { error: null, success: true };
}

export async function updateEmailSettingsAction(
  _prev: EmailSettingsFormState,
  formData: FormData,
): Promise<EmailSettingsFormState> {
  const { supabase, user } = await requireUser('/profilis');

  let parsed: ReturnType<typeof parseEmailSettingsFormData>;
  try {
    parsed = parseEmailSettingsFormData(formData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: err.issues[0]?.message ?? 'validation_error',
        success: false,
      };
    }
    return { error: 'validation_error', success: false };
  }

  const { data: currentProfile } = await supabase
    .from('profiles').select('email, email_verified_at').eq('id', user.id)
    .maybeSingle<{ email: string | null; email_verified_at: string | null }>();
  const emailChanged = (currentProfile?.email?.toLowerCase() ?? null) !== parsed.email;

  const { error } = await supabase
    .from('profiles')
    .update({
      email: parsed.email,
      email_notifications_enabled: parsed.emailNotificationsEnabled,
      ...(emailChanged ? { email_verified_at: null } : {}),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[profilis] email settings update failed:', error);
    return { error: 'server_error', success: false };
  }

  let verificationSent = false;
  const needsVerification = Boolean(parsed.email) && (emailChanged || !currentProfile?.email_verified_at);
  if (parsed.email && needsVerification) {
    try {
      await sendEmailVerification(user.id, parsed.email);
      verificationSent = true;
    } catch (verificationError) {
      console.error('[profilis] email verification send failed:', verificationError);
      return { error: 'verification_send_failed', success: false };
    }
  }

  revalidatePath('/profilis');
  return { error: null, success: true, verificationSent };
}
