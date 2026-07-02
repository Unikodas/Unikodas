import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';
import { getEmailEnvironmentStatus, sendEmail } from '@/lib/email/resend';
import { ProfileEmailSchema } from '@/lib/validation/profile';

const TestEmailBodySchema = z
  .object({
    to: ProfileEmailSchema.optional(),
  })
  .optional();

type AdminEmailProfile = {
  email: string | null;
};

function diagnosticPayload() {
  return {
    env: getEmailEnvironmentStatus(),
  };
}

export async function GET() {
  await requireAdmin();

  return NextResponse.json({
    ok: true,
    ...diagnosticPayload(),
  });
}

export async function POST(request: NextRequest) {
  const { admin, user } = await requireAdmin();

  let parsed: z.infer<typeof TestEmailBodySchema>;
  try {
    const raw = await request.text();
    parsed = raw ? TestEmailBodySchema.parse(JSON.parse(raw)) : undefined;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_body', ...diagnosticPayload() },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .maybeSingle<AdminEmailProfile>();

  if (profileError) {
    console.error('[admin/email-test] profile lookup failed:', profileError);
    return NextResponse.json(
      { ok: false, error: 'profile_lookup_failed', ...diagnosticPayload() },
      { status: 500 },
    );
  }

  const to = parsed?.to ?? profile?.email?.trim() ?? null;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: 'missing_test_recipient_email', ...diagnosticPayload() },
      { status: 400 },
    );
  }

  try {
    await sendEmail({
      to,
      subject: 'Unikodas.lt testinis el. laiškas',
      text: `Sveiki,

Tai testinis Unikodas.lt el. laiškas.

Jei jį gavote, Resend integracija ir aplinkos kintamieji veikia.`,
    });
  } catch (err) {
    console.error('[admin/email-test] send failed:', err);
    return NextResponse.json(
      { ok: false, error: 'email_send_failed', ...diagnosticPayload() },
      { status: 502 },
    );
  }

  console.info('[admin/email-test] send success', {
    usedProfileEmail: !parsed?.to,
  });

  return NextResponse.json({
    ok: true,
    sent: true,
    usedProfileEmail: !parsed?.to,
    ...diagnosticPayload(),
  });
}
