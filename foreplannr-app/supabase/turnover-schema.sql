-- ============================================================
-- Foreplannr — Distribution / Turnover Schema (Phase 2)
-- Run in Supabase SQL Editor after the main schema.sql
-- ============================================================

-- ── Add distribution fields to projects ──────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS branch text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager text NOT NULL DEFAULT '';

-- ── turnover_meetings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnover_meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  organization_id uuid REFERENCES organizations(id),
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  scope_of_work text,
  key_exclusions text,
  special_order_items text,
  lead_time_concerns text,
  site_access text,
  delivery_requirements text,
  special_handling text,
  safety_requirements text,
  parking_staging text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── turnover_contacts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnover_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turnover_id uuid REFERENCES turnover_meetings(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── turnover_steps ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnover_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turnover_id uuid REFERENCES turnover_meetings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  notes text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE turnover_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project owner manages turnover" ON turnover_meetings;
CREATE POLICY "Project owner manages turnover" ON turnover_meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = turnover_meetings.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owner manages turnover_contacts" ON turnover_contacts;
CREATE POLICY "Project owner manages turnover_contacts" ON turnover_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM turnover_meetings tm
      JOIN projects p ON p.id = tm.project_id
      WHERE tm.id = turnover_contacts.turnover_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owner manages turnover_steps" ON turnover_steps;
CREATE POLICY "Project owner manages turnover_steps" ON turnover_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM turnover_meetings tm
      JOIN projects p ON p.id = tm.project_id
      WHERE tm.id = turnover_steps.turnover_id
        AND p.user_id = auth.uid()
    )
  );
