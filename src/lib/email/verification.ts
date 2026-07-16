import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from './resend';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendEmailVerification(profileId: string, email: string) {
  const token = randomBytes(32).toString('hex');
  const supabase = createServiceRoleClient();
  await supabase.from('email_verification_tokens').delete().eq('profile_id', profileId);
  const { error } = await supabase.from('email_verification_tokens').insert({
    profile_id: profileId,
    email,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`Verification token insert failed: ${error.message}`);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://unikodas.lt');
  const verificationUrl = `${baseUrl.replace(/\/$/, '')}/api/profile/email/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Patvirtinkite el. paštą | Unikodas',
    text: `Sveiki,\n\nPatvirtinkite savo el. pašto adresą paspausdami šią nuorodą:\n${verificationUrl}\n\nNuoroda galioja 24 valandas. Jei šio veiksmo neatlikote, laišką ignoruokite.`,
  });
}

export { hashToken };
