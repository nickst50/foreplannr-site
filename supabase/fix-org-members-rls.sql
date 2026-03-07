-- ============================================================
-- Fix: infinite recursion in organization_members RLS policies
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================
-- Root cause: the SELECT/INSERT/DELETE policies on
-- organization_members all query organization_members to check
-- org membership, which re-triggers the same policy → loop.
--
-- Fix: a SECURITY DEFINER function bypasses RLS when it runs,
-- so it can read organization_members directly without
-- triggering the policies that caused the recursion.
-- ============================================================


-- ── Drop the recursive policies ──────────────────────────────
drop policy if exists "Members can view org members"   on public.organization_members;
drop policy if exists "Admins can insert org members"  on public.organization_members;
drop policy if exists "Admins can delete org members"  on public.organization_members;


-- ── Helper: reads organization_members bypassing RLS ─────────
-- SECURITY DEFINER means this runs as the function owner (postgres),
-- not as the calling user, so it never triggers the RLS policies.
create or replace function public.get_my_org_memberships()
returns table(org_id uuid, role text) as $$
  select org_id, role
  from public.organization_members
  where user_id = auth.uid();
$$ language sql security definer stable;


-- ── Recreate policies using the helper ───────────────────────

-- Users can see their own row + any row in an org they belong to
create policy "Members can view org members"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or org_id in (
      select org_id from public.get_my_org_memberships()
    )
  );

-- Only org admins can add new members
create policy "Admins can insert org members"
  on public.organization_members for insert
  with check (
    org_id in (
      select org_id from public.get_my_org_memberships()
      where role = 'admin'
    )
  );

-- Only org admins can remove members
create policy "Admins can delete org members"
  on public.organization_members for delete
  using (
    org_id in (
      select org_id from public.get_my_org_memberships()
      where role = 'admin'
    )
  );


-- ── Also fix the organizations table policy ───────────────────
-- It had the same pattern — subquery on organization_members.
-- Replace it with the same helper function.
drop policy if exists "Members can view their organization" on public.organizations;

create policy "Members can view their organization"
  on public.organizations for select
  using (
    id in (
      select org_id from public.get_my_org_memberships()
    )
  );

-- ============================================================
-- END OF FIX
-- ============================================================
