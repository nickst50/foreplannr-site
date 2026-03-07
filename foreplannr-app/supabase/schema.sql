-- ============================================================
-- Foreplannr — complete schema
-- Run this in your Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Project Manager',
  notification_prefs jsonb NOT NULL DEFAULT '{"email_rfis":true,"email_submittals":true,"email_punch":true,"email_handoff":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── organizations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL DEFAULT '',
  company_type text NOT NULL DEFAULT 'contractor', -- 'contractor' | 'distribution'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Migration: add company_type to existing databases
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_type text NOT NULL DEFAULT 'contractor';
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own org" ON organizations;
CREATE POLICY "Users manage own org" ON organizations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── projects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  client text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  contract_value text NOT NULL DEFAULT '',
  start_date date,
  closeout_date date,
  status text NOT NULL DEFAULT 'On Track',
  phase text NOT NULL DEFAULT 'Pre-Construction',
  completion int NOT NULL DEFAULT 0,
  punch_list_resolved int NOT NULL DEFAULT 0,
  submittal_pct int NOT NULL DEFAULT 0,
  open_rfis int NOT NULL DEFAULT 0,
  open_submittals int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own projects" ON projects;
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Project members can view projects" ON projects;
CREATE POLICY "Project members can view projects" ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

-- ── handoff_records ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS handoff_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE handoff_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages handoff" ON handoff_records;
CREATE POLICY "Project owner manages handoff" ON handoff_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = handoff_records.project_id AND projects.user_id = auth.uid())
  );

-- ── rfis ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  spec_section text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  assigned_to text NOT NULL DEFAULT '',
  due_date date,
  response text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, number)
);
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages rfis" ON rfis;
CREATE POLICY "Project owner manages rfis" ON rfis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = rfis.project_id AND projects.user_id = auth.uid())
  );

-- ── submittals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submittals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  number text NOT NULL,
  spec_section text NOT NULL DEFAULT '',
  description text NOT NULL,
  submitted_by text NOT NULL DEFAULT '',
  reviewer_name text NOT NULL DEFAULT '',
  submission_date date,
  review_due_date date,
  returned_date date,
  status text NOT NULL DEFAULT 'Pending Submission',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages submittals" ON submittals;
CREATE POLICY "Project owner manages submittals" ON submittals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = submittals.project_id AND projects.user_id = auth.uid())
  );

-- ── punch_list_items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS punch_list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  trade text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  assignee text NOT NULL DEFAULT '',
  due_date date,
  has_photo boolean NOT NULL DEFAULT false,
  comments text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, number)
);
ALTER TABLE punch_list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages punch list" ON punch_list_items;
CREATE POLICY "Project owner manages punch list" ON punch_list_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = punch_list_items.project_id AND projects.user_id = auth.uid())
  );

-- ── closeout_items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS closeout_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'Not Started',
  responsible_party text NOT NULL DEFAULT '',
  due_date date,
  notes text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE closeout_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages closeout" ON closeout_items;
CREATE POLICY "Project owner manages closeout" ON closeout_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = closeout_items.project_id AND projects.user_id = auth.uid())
  );

-- ── project_members ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Member',
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, email)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages members" ON project_members;
CREATE POLICY "Project owner manages members" ON project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Members can view their own membership" ON project_members;
CREATE POLICY "Members can view their own membership" ON project_members
  FOR SELECT USING (auth.uid() = user_id);

-- ── tasks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  priority text NOT NULL DEFAULT 'Medium',
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_email text,
  assignee_name text NOT NULL DEFAULT '',
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner manages tasks" ON tasks;
CREATE POLICY "Project owner manages tasks" ON tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Assignees can view and update their tasks" ON tasks;
CREATE POLICY "Assignees can view and update their tasks" ON tasks
  FOR ALL USING (auth.uid() = assignee_id);

-- ── activity_log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'rfi' | 'submittal' | 'punch' | 'handoff' | 'team' | 'closeout' | 'task'
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project owner views activity" ON activity_log;
CREATE POLICY "Project owner views activity" ON activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = activity_log.project_id AND projects.user_id = auth.uid())
  );
