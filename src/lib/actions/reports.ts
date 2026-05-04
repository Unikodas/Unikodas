'use server';

import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { parseReportFormData } from '@/lib/validation/report';

export type ReportFormState = {
  error: string | null;
  success: boolean;
};


/**
 * File a report against a listing, wanted ad, or message.
 *
 * Defense in depth:
 *   - requireUser(): only signed-in users can report.
 *   - target_type / target_id come from form data and are validated as
 *     a discriminated enum + UUID. We don't dereference them here —
 *     storing a stale/invalid id is harmless because admins resolve the
 *     report manually and the unique-on-(reporter, target) DB constraint
 *     stops floods.
 *   - Rate limit: 10 reports per signed-in user per hour. This is the
 *     primary defense against the report system being weaponised as a
 *     DoS vector or notification-spam channel.
 *   - Insert goes through the user-bound client; RLS `reports_owner_insert`
 *     enforces reporter_id = auth.uid() at the DB.
 *   - The DB unique constraint on (reporter_id, target_type, target_id)
 *     prevents the same user from reporting the same target twice. We
 *     translate the resulting Postgres 23505 to a friendly 'duplicate'
 *     error code.
 */
export async function createReportAction(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const { supabase, user } = await requireUser();

  let parsed;
  try {
    parsed = parseReportFormData(formData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: err.issues[0]?.message ?? 'validation_error',
        success: false,
      };
    }
    return { error: 'validation_error', success: false };
  }

  const ok = await bumpRateLimit({
    bucket: 'report_user',
    key: user.id,
    ...RATE_LIMITS.REPORT_PER_USER,
  });
  if (!ok.allowed) {
    return { error: 'rate_limited', success: false };
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: parsed.target_type,
    target_id: parsed.target_id,
    reason: parsed.reason,
    details: parsed.details,
  });

  if (error) {
    // Postgres unique-violation code for the (reporter, target) constraint.
    if (error.code === '23505') {
      return { error: 'duplicate', success: false };
    }
    console.error('[reports] insert failed:', error);
    return { error: 'server_error', success: false };
  }

  return { error: null, success: true };
}
