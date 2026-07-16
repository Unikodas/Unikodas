import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function finalizeExpiredAuctions(): Promise<void> {
  const { error } = await createServiceRoleClient().rpc('finalize_expired_auctions');
  if (error && error.code !== 'PGRST202') console.error('[auctions/finalize]', error);
}
