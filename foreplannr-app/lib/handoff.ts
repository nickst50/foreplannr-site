import type { SupabaseClient } from "@supabase/supabase-js";

export interface Milestone {
  id: string;
  name: string;
  date: string;
}

export type PermitStatus = "Pending" | "Issued" | "Expired";

export interface Permit {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expDate: string;
  status: PermitStatus;
}

export interface HandoffData {
  // Step 1 – Scope Review
  scopeSummary: string;
  keyExclusions: string;
  contractDocName: string;
  scopeReviewed: boolean;

  // Step 2 – Drawings & Specs
  drawingSetName: string;
  drawingRevision: string;
  drawingIssues: string;
  drawingsReviewed: boolean;

  // Step 3 – Schedule & Milestones
  scheduleFileName: string;
  projectStart: string;
  substantialCompletion: string;
  finalCompletion: string;
  milestones: Milestone[];
  scheduleConfirmed: boolean;

  // Step 4 – Permit Status
  permits: Permit[];
  permitNotes: string;
  permitsConfirmed: boolean;

  // Step 5 – Site Logistics
  siteAccess: string;
  parking: string;
  stagingArea: string;
  safetyRequirements: string;
  keyContacts: string;
  siteReviewed: boolean;

  // Metadata
  completedAt: string | null;
}

export const DEFAULT_HANDOFF: HandoffData = {
  scopeSummary: "",
  keyExclusions: "",
  contractDocName: "",
  scopeReviewed: false,
  drawingSetName: "",
  drawingRevision: "",
  drawingIssues: "",
  drawingsReviewed: false,
  scheduleFileName: "",
  projectStart: "",
  substantialCompletion: "",
  finalCompletion: "",
  milestones: [],
  scheduleConfirmed: false,
  permits: [],
  permitNotes: "",
  permitsConfirmed: false,
  siteAccess: "",
  parking: "",
  stagingArea: "",
  safetyRequirements: "",
  keyContacts: "",
  siteReviewed: false,
  completedAt: null,
};

// ─── Supabase CRUD ────────────────────────────────────────────────────────────

export async function fetchHandoff(
  projectId: string,
  supabase: SupabaseClient
): Promise<HandoffData> {
  const { data } = await supabase
    .from("handoff_records")
    .select("data, completed_at")
    .eq("project_id", projectId)
    .single();

  if (!data) return { ...DEFAULT_HANDOFF };
  return {
    ...DEFAULT_HANDOFF,
    ...(data.data as Partial<HandoffData>),
    completedAt: data.completed_at ?? null,
  };
}

export async function saveHandoff(
  projectId: string,
  handoffData: HandoffData,
  supabase: SupabaseClient
): Promise<void> {
  const { completedAt, ...rest } = handoffData;
  await supabase.from("handoff_records").upsert(
    {
      project_id: projectId,
      data: rest,
      completed_at: completedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  );
}

export async function checkHandoffComplete(
  projectId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from("handoff_records")
    .select("completed_at")
    .eq("project_id", projectId)
    .single();
  return !!data?.completed_at;
}

// ─── Legacy localStorage helpers (kept for compatibility) ─────────────────────
// These are no-ops now — data lives in Supabase.
export function getHandoff(_projectId: string): HandoffData {
  return { ...DEFAULT_HANDOFF };
}

export function isHandoffComplete(_projectId: string): boolean {
  return false;
}
