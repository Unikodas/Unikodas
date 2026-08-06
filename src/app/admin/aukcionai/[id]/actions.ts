'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/require-admin';

const QualificationSchema = z.object({
  participation_id: z.string().uuid(),
  auction_id: z.string().uuid(),
  call_status: z.enum(['not_called', 'qualified', 'unreachable', 'not_serious']),
  call_note: z.string().trim().max(500).transform((value) => value || null),
});

export async function updateBuyerQualification(formData: FormData) {
  const parsed = QualificationSchema.safeParse({
    participation_id: formData.get('participation_id'),
    auction_id: formData.get('auction_id'),
    call_status: formData.get('call_status'),
    call_note: formData.get('call_note'),
  });
  if (!parsed.success) return;

  const { admin } = await requireAdmin();
  const { participation_id, auction_id, call_status, call_note } = parsed.data;
  const { error } = await admin.from('auction_participations').update({
    call_status,
    call_note,
    called_at: call_status === 'not_called' ? null : new Date().toISOString(),
  }).eq('id', participation_id).eq('auction_id', auction_id);

  if (error) throw new Error('Nepavyko atnaujinti pirkėjo patikros.');
  revalidatePath(`/admin/aukcionai/${auction_id}`);
}
