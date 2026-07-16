'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function approveAuctionAction(id: string) {
  const { admin } = await requireAdmin();
  const starts = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const { data } = await admin.from('auctions').select('starts_at,ends_at').eq('id', id).eq('status','pending').single();
  if (!data) return;
  const duration = Math.max(3 * 86400000, new Date(data.ends_at).getTime() - new Date(data.starts_at).getTime());
  await admin.from('auctions').update({ status:'scheduled', starts_at:starts.toISOString(), ends_at:new Date(starts.getTime()+duration).toISOString() }).eq('id',id).eq('status','pending');
  revalidatePath('/admin'); revalidatePath('/aukcionai');
}

export async function rejectAuctionAction(id: string) {
  const { admin } = await requireAdmin();
  await admin.from('auctions').update({ status:'rejected' }).eq('id',id).eq('status','pending');
  revalidatePath('/admin');
}

