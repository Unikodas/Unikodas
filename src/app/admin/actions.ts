'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';

type ActionResult = { error: string | null };

/**
 * Mark a report as resolved (admin handled it elsewhere) without
 * touching the target. Logs to admin_actions.
 */
export async function resolveReportAction(reportId: string): Promise<ActionResult> {
  const { user, admin } = await requireAdmin();

  const { error: updateError } = await admin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('[admin/resolve] update failed:', updateError);
    return { error: 'server_error' };
  }

  await admin.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'resolve_report',
    report_id: reportId,
  });

  revalidatePath('/admin');
  return { error: null };
}

/**
 * Mark a report as dismissed (no action needed). Logs to admin_actions.
 */
export async function dismissReportAction(reportId: string): Promise<ActionResult> {
  const { user, admin } = await requireAdmin();

  const { error: updateError } = await admin
    .from('reports')
    .update({
      status: 'dismissed',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('[admin/dismiss] update failed:', updateError);
    return { error: 'server_error' };
  }

  await admin.from('admin_actions').insert({
    admin_id: user.id,
    action_type: 'dismiss_report',
    report_id: reportId,
  });

  revalidatePath('/admin');
  return { error: null };
}

type RemoveRpcRow = {
  success: boolean;
  error_code: string | null;
  target_type: string | null;
  target_id: string | null;
};

/**
 * Take action on the report's target and close it out, all in one
 * transaction:
 *   - listing / wanted: set status='removed'
 *   - message:          delete the row
 *   - mark report resolved
 *   - insert admin_actions row
 *
 * Atomicity is provided by the `admin_remove_and_resolve_report`
 * Postgres function (see migration 0005). plpgsql functions execute
 * inside a single transaction, so a crash midway can no longer leave
 * the system half-updated (target removed but report still pending,
 * report resolved without an audit row, etc.).
 *
 * Path revalidation is driven by the target_type returned from the
 * RPC, so we don't have to re-fetch the report.
 */
export async function removeAndResolveReportAction(
  reportId: string,
): Promise<ActionResult> {
  const { user, admin } = await requireAdmin();

  const { data, error } = await admin.rpc('admin_remove_and_resolve_report', {
    p_report_id: reportId,
    p_admin_id: user.id,
  });

  if (error) {
    console.error('[admin/remove] rpc failed:', error);
    return { error: 'server_error' };
  }

  // The function returns SETOF (success, error_code, target_type, target_id).
  // supabase-js usually surfaces it as an array; tolerate both shapes.
  const row: RemoveRpcRow | undefined = Array.isArray(data) ? data[0] : data;

  if (!row?.success) {
    // Map plpgsql error codes to the same set the rest of the app uses.
    const code = row?.error_code ?? 'server_error';
    return { error: code };
  }

  // Revalidate the appropriate path(s) for the affected target.
  switch (row.target_type) {
    case 'listing':
      revalidatePath('/');
      if (row.target_id) revalidatePath(`/skelbimas/${row.target_id}`);
      break;
    case 'wanted':
      revalidatePath('/ieskau');
      if (row.target_id) revalidatePath(`/ieskau/${row.target_id}`);
      break;
    case 'message':
      revalidatePath('/zinutes');
      break;
  }
  revalidatePath('/admin');

  return { error: null };
}
