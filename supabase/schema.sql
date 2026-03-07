-- ============================================================
-- Foreplannr — Supabase Schema (Full Migration)
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================
-- Order: extensions → tables → functions → RLS → triggers
-- ============================================================


-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLES (all created before any functions or policies)
-- ============================================================

-- ── Organizations ────────────────────────────────────────────
create table if not exists public.organizations (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now()
);

-- ── Organization Members ─────────────────────────────────────
create table if not exists public.organization_members (
  id         uuid default gen_random_uuid() primary key,
  org_id     uuid references public.organizations on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  role       text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  unique (org_id, user_id)
);

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade not null primary key,
  full_name  text,
  role       text default 'Project Manager',
  org_id     uuid references public.organizations on delete set null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Projects ─────────────────────────────────────────────────
create table if not exists public.projects (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users on delete cascade not null,
  org_id              uuid references public.organizations on delete set null,
  name                text not null,
  client              text default '',
  address             text default '',
  contract_value      text default '',
  start_date          date,
  closeout_date       date,
  status              text default 'On Track'
                        check (status in ('On Track', 'At Risk', 'Delayed')),
  phase               text default 'Pre-Construction',
  completion          integer default 0 check (completion between 0 and 100),
  punch_list_resolved integer default 0,
  submittal_pct       integer default 0 check (submittal_pct between 0 and 100),
  open_rfis           integer default 0,
  open_submittals     integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── RFIs ─────────────────────────────────────────────────────
create table if not exists public.rfis (
  id           uuid default gen_random_uuid() primary key,
  project_id   uuid references public.projects on delete cascade not null,
  number       integer not null,
  title        text not null,
  description  text default '',
  spec_section text default '',
  priority     text default 'Medium'
                 check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status       text default 'Open'
                 check (status in ('Open', 'In Review', 'Answered', 'Closed')),
  assigned_to  text default '',
  due_date     date,
  response     text default '',
  created_by   uuid references auth.users on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (project_id, number)
);

-- ── Submittals ───────────────────────────────────────────────
create table if not exists public.submittals (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references public.projects on delete cascade not null,
  number          text not null,
  spec_section    text default '',
  description     text not null,
  submitted_by    text default '',
  reviewer_name   text default '',
  submission_date date,
  review_due_date date,
  returned_date   date,
  status          text default 'Pending Submission'
                    check (status in (
                      'Pending Submission', 'Submitted', 'Under Review',
                      'Approved', 'Approved w/ Comments', 'Rejected', 'Resubmit Required'
                    )),
  notes           text default '',
  created_by      uuid references auth.users on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (project_id, number)
);

-- ── Punch List Items ─────────────────────────────────────────
create table if not exists public.punch_list_items (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references public.projects on delete cascade not null,
  number      integer not null,
  title       text not null,
  description text default '',
  location    text default '',
  trade       text default '',
  priority    text default 'Medium'
                check (priority in ('Low', 'Medium', 'High')),
  status      text default 'Open'
                check (status in ('Open', 'In Progress', 'Pending Verification', 'Resolved')),
  assignee    text default '',
  due_date    date,
  has_photo   boolean default false,
  comments    text default '',
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (project_id, number)
);

-- ── Handoff Steps ────────────────────────────────────────────
-- One row per project. milestones + permits stored as JSONB arrays.
create table if not exists public.handoff_steps (
  id                     uuid default gen_random_uuid() primary key,
  project_id             uuid references public.projects on delete cascade not null unique,

  -- Step 1: Scope Review
  scope_summary          text default '',
  key_exclusions         text default '',
  contract_doc_name      text default '',
  scope_reviewed         boolean default false,

  -- Step 2: Drawings & Specs
  drawing_set_name       text default '',
  drawing_revision       text default '',
  drawing_issues         text default '',
  drawings_reviewed      boolean default false,

  -- Step 3: Schedule & Milestones
  schedule_file_name     text default '',
  project_start          date,
  substantial_completion date,
  final_completion       date,
  milestones             jsonb default '[]'::jsonb,
  schedule_confirmed     boolean default false,

  -- Step 4: Permit Status
  permits                jsonb default '[]'::jsonb,
  permit_notes           text default '',
  permits_confirmed      boolean default false,

  -- Step 5: Site Logistics
  site_access            text default '',
  parking                text default '',
  staging_area           text default '',
  safety_requirements    text default '',
  key_contacts           text default '',
  site_reviewed          boolean default false,

  -- Metadata
  completed_at           timestamptz,
  created_by             uuid references auth.users on delete set null,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ── Closeout Items ───────────────────────────────────────────
create table if not exists public.closeout_items (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references public.projects on delete cascade not null,
  category    text not null
                check (category in (
                  'Punch List', 'Inspections & Permits',
                  'O&M Manuals', 'As-Built Drawings',
                  'Warranties', 'Attic Stock',
                  'Training', 'Financial', 'Other'
                )),
  title       text not null,
  description text default '',
  status      text default 'Pending'
                check (status in ('Pending', 'In Progress', 'Complete', 'N/A')),
  due_date    date,
  assigned_to text default '',
  notes       text default '',
  sort_order  integer default 0,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Tasks ────────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid default gen_random_uuid() primary key,
  project_id   uuid references public.projects on delete cascade not null,
  title        text not null,
  description  text default '',
  status       text default 'To Do'
                 check (status in ('To Do', 'In Progress', 'Done', 'Blocked')),
  priority     text default 'Medium'
                 check (priority in ('Low', 'Medium', 'High', 'Critical')),
  assignee     text default '',
  due_date     date,
  completed_at timestamptz,
  created_by   uuid references auth.users on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Attachments ──────────────────────────────────────────────
create table if not exists public.attachments (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references public.projects on delete cascade not null,
  entity_type text not null
                check (entity_type in (
                  'project', 'rfi', 'submittal',
                  'punch_list_item', 'task', 'closeout_item', 'handoff'
                )),
  entity_id   uuid not null,
  file_name   text not null,
  file_url    text not null,
  file_size   bigint,
  mime_type   text,
  uploaded_by uuid references auth.users on delete set null,
  created_at  timestamptz default now()
);

-- ── Comments ─────────────────────────────────────────────────
create table if not exists public.comments (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references public.projects on delete cascade not null,
  entity_type text not null
                check (entity_type in (
                  'project', 'rfi', 'submittal',
                  'punch_list_item', 'task', 'closeout_item'
                )),
  entity_id   uuid not null,
  parent_id   uuid references public.comments on delete cascade,
  body        text not null,
  created_by  uuid references auth.users on delete set null,
  edited_at   timestamptz,
  created_at  timestamptz default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists rfis_project_id_idx              on public.rfis (project_id);
create index if not exists submittals_project_id_idx        on public.submittals (project_id);
create index if not exists punch_list_items_project_id_idx  on public.punch_list_items (project_id);
create index if not exists closeout_items_project_id_idx    on public.closeout_items (project_id);
create index if not exists closeout_items_category_idx      on public.closeout_items (project_id, category);
create index if not exists tasks_project_id_idx             on public.tasks (project_id);
create index if not exists attachments_project_id_idx       on public.attachments (project_id);
create index if not exists attachments_entity_idx           on public.attachments (entity_type, entity_id);
create index if not exists comments_project_id_idx          on public.comments (project_id);
create index if not exists comments_entity_idx              on public.comments (entity_type, entity_id);


-- ============================================================
-- FUNCTIONS
-- (defined after all tables exist so forward-references work)
-- ============================================================

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Returns the org_id of the current user (first org if multiple)
create or replace function public.get_my_org_id()
returns uuid as $$
  select org_id
  from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;

-- Returns true if the current user owns or is in the same org as a project.
-- Defined AFTER public.projects exists.
create or replace function public.can_access_project(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id
      and (
        user_id = auth.uid()
        or org_id in (
          select org_id from public.organization_members
          where user_id = auth.uid()
        )
      )
  );
$$ language sql security definer stable;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.organizations         enable row level security;
alter table public.organization_members  enable row level security;
alter table public.profiles              enable row level security;
alter table public.projects              enable row level security;
alter table public.rfis                  enable row level security;
alter table public.submittals            enable row level security;
alter table public.punch_list_items      enable row level security;
alter table public.handoff_steps         enable row level security;
alter table public.closeout_items        enable row level security;
alter table public.tasks                 enable row level security;
alter table public.attachments           enable row level security;
alter table public.comments              enable row level security;


-- ── organizations ─────────────────────────────────────────────
create policy "Members can view their organization"
  on public.organizations for select
  using (
    id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- ── organization_members ──────────────────────────────────────
create policy "Members can view org members"
  on public.organization_members for select
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can insert org members"
  on public.organization_members for insert
  with check (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete org members"
  on public.organization_members for delete
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ── profiles ─────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Org members can view each other's profiles"
  on public.profiles for select
  using (
    org_id is not null
    and org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── projects ─────────────────────────────────────────────────
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Org members can view org projects"
  on public.projects for select
  using (
    org_id is not null
    and org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Org admins can update org projects"
  on public.projects for update
  using (
    org_id is not null
    and org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ── rfis ─────────────────────────────────────────────────────
create policy "Project members can view RFIs"
  on public.rfis for select
  using (public.can_access_project(project_id));

create policy "Project members can insert RFIs"
  on public.rfis for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update RFIs"
  on public.rfis for update
  using (public.can_access_project(project_id));

create policy "Project members can delete RFIs"
  on public.rfis for delete
  using (public.can_access_project(project_id));

-- ── submittals ───────────────────────────────────────────────
create policy "Project members can view submittals"
  on public.submittals for select
  using (public.can_access_project(project_id));

create policy "Project members can insert submittals"
  on public.submittals for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update submittals"
  on public.submittals for update
  using (public.can_access_project(project_id));

create policy "Project members can delete submittals"
  on public.submittals for delete
  using (public.can_access_project(project_id));

-- ── punch_list_items ─────────────────────────────────────────
create policy "Project members can view punch list items"
  on public.punch_list_items for select
  using (public.can_access_project(project_id));

create policy "Project members can insert punch list items"
  on public.punch_list_items for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update punch list items"
  on public.punch_list_items for update
  using (public.can_access_project(project_id));

create policy "Project members can delete punch list items"
  on public.punch_list_items for delete
  using (public.can_access_project(project_id));

-- ── handoff_steps ────────────────────────────────────────────
create policy "Project members can view handoff steps"
  on public.handoff_steps for select
  using (public.can_access_project(project_id));

create policy "Project members can insert handoff steps"
  on public.handoff_steps for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update handoff steps"
  on public.handoff_steps for update
  using (public.can_access_project(project_id));

create policy "Project members can delete handoff steps"
  on public.handoff_steps for delete
  using (public.can_access_project(project_id));

-- ── closeout_items ───────────────────────────────────────────
create policy "Project members can view closeout items"
  on public.closeout_items for select
  using (public.can_access_project(project_id));

create policy "Project members can insert closeout items"
  on public.closeout_items for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update closeout items"
  on public.closeout_items for update
  using (public.can_access_project(project_id));

create policy "Project members can delete closeout items"
  on public.closeout_items for delete
  using (public.can_access_project(project_id));

-- ── tasks ────────────────────────────────────────────────────
create policy "Project members can view tasks"
  on public.tasks for select
  using (public.can_access_project(project_id));

create policy "Project members can insert tasks"
  on public.tasks for insert
  with check (public.can_access_project(project_id));

create policy "Project members can update tasks"
  on public.tasks for update
  using (public.can_access_project(project_id));

create policy "Project members can delete tasks"
  on public.tasks for delete
  using (public.can_access_project(project_id));

-- ── attachments ──────────────────────────────────────────────
create policy "Project members can view attachments"
  on public.attachments for select
  using (public.can_access_project(project_id));

create policy "Project members can insert attachments"
  on public.attachments for insert
  with check (public.can_access_project(project_id));

create policy "Uploaders can delete their attachments"
  on public.attachments for delete
  using (uploaded_by = auth.uid());

-- ── comments ─────────────────────────────────────────────────
create policy "Project members can view comments"
  on public.comments for select
  using (public.can_access_project(project_id));

create policy "Project members can insert comments"
  on public.comments for insert
  with check (public.can_access_project(project_id));

create policy "Authors can update their comments"
  on public.comments for update
  using (created_by = auth.uid());

create policy "Authors can delete their comments"
  on public.comments for delete
  using (created_by = auth.uid());


-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger rfis_updated_at
  before update on public.rfis
  for each row execute procedure public.set_updated_at();

create trigger submittals_updated_at
  before update on public.submittals
  for each row execute procedure public.set_updated_at();

create trigger punch_list_items_updated_at
  before update on public.punch_list_items
  for each row execute procedure public.set_updated_at();

create trigger handoff_steps_updated_at
  before update on public.handoff_steps
  for each row execute procedure public.set_updated_at();

create trigger closeout_items_updated_at
  before update on public.closeout_items
  for each row execute procedure public.set_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- END OF MIGRATION
-- ============================================================
