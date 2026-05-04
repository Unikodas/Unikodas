-- =====================================================================
-- 0005_admin_remove_rpc.sql
-- Atomic "remove target + resolve report + audit" admin operation.
--
-- Replaces three sequential mutations from Server Action code with a
-- single transactional plpgsql function, so a crash partway through
-- can no longer leave a half-resolved report (e.g., listing removed
-- but report still pending, or report resolved without an audit row).
--
-- Apply via Supabase SQL Editor after 0004.
-- =====================================================================

-- Returns one row:
--   success      = true if the operation completed successfully
--   error_code   = null on success; otherwise one of:
--                    'not_found'           — no report with that id
--                    'already_resolved'    — report is already not pending
--                    'invalid_target_type' — report has an unknown target_type
--   target_type  = the target_type of the affected report
--   target_id    = the target_id of the affected report
--
-- target_type / target_id are returned even on the 'already_resolved'
-- error so the caller can revalidate paths if the original action did
-- in fact go through (idempotent retries from a UI double-click).
--
-- Service role only — RLS doesn't apply to functions, but we still
-- revoke from public/anon/authenticated as defense in depth.

create or replace function public.admin_remove_and_resolve_report(
  p_report_id uuid,
  p_admin_id  uuid
) returns table(
  success      boolean,
  error_code   text,
  target_type  text,
  target_id    uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_type text;
  v_target_id   uuid;
  v_status      text;
begin
  -- Lock the report row so concurrent admins clicking "remove" on the
  -- same report can't both succeed.
  select r.target_type, r.target_id, r.status
    into v_target_type, v_target_id, v_status
  from public.reports r
   where r.id = p_report_id
   for update;

  if v_target_type is null then
    return query select false, 'not_found'::text, null::text, null::uuid;
    return;
  end if;

  if v_status <> 'pending' then
    return query select false, 'already_resolved'::text, v_target_type, v_target_id;
    return;
  end if;

  -- Mutate the target. If the target row no longer exists (e.g., the
  -- listing was already deleted by its owner), the UPDATE / DELETE
  -- becomes a no-op — we still want to close out the report.
  if v_target_type = 'listing' then
    update public.listings set status = 'removed' where id = v_target_id;
  elsif v_target_type = 'wanted' then
    update public.wanted_listings set status = 'removed' where id = v_target_id;
  elsif v_target_type = 'message' then
    delete from public.messages where id = v_target_id;
  else
    return query select false, 'invalid_target_type'::text, v_target_type, v_target_id;
    return;
  end if;

  -- Mark the report resolved.
  update public.reports
     set status      = 'resolved',
         resolved_by = p_admin_id,
         resolved_at = now()
   where id = p_report_id;

  -- Insert audit row.
  insert into public.admin_actions (
    admin_id, action_type, target_type, target_id, report_id
  ) values (
    p_admin_id, 'remove_target', v_target_type, v_target_id, p_report_id
  );

  return query select true, null::text, v_target_type, v_target_id;
end;
$$;

revoke all on function public.admin_remove_and_resolve_report(uuid, uuid)
  from public, anon, authenticated;
