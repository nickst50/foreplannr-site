import type { SupabaseClient } from "@supabase/supabase-js";

export type SubmittalStatus =
  | "Pending Submission"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Approved w/ Comments"
  | "Rejected"
  | "Resubmit Required";

export interface Submittal {
  id: string;
  number: string;
  specSection: string;
  description: string;
  submittedBy: string;
  reviewerName: string;
  submissionDate: string;
  reviewDueDate: string;
  returnedDate: string;
  status: SubmittalStatus;
  notes: string;
  projectId: string;
  createdAt: string;
}

export interface SubmittalInput {
  specSection: string;
  description: string;
  submittedBy: string;
  reviewerName: string;
  submissionDate: string;
  reviewDueDate: string;
}

export const ALL_STATUSES: SubmittalStatus[] = [
  "Pending Submission",
  "Submitted",
  "Under Review",
  "Approved",
  "Approved w/ Comments",
  "Rejected",
  "Resubmit Required",
];

// The 4 columns shown in kanban view
export const KANBAN_STATUSES: SubmittalStatus[] = [
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
];

export const statusConfig: Record<
  SubmittalStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  "Pending Submission": { bg: "#F5F5F4", text: "#78716C", dot: "#A8A29E", border: "#E7E5E4" },
  "Submitted":          { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
  "Under Review":       { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B", border: "#FDE68A" },
  "Approved":           { bg: "#F0FDFA", text: "#0F766E", dot: "#0D9488", border: "#99F6E4" },
  "Approved w/ Comments": { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E", border: "#BBF7D0" },
  "Rejected":           { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E", border: "#FECDD3" },
  "Resubmit Required":  { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", border: "#FED7AA" },
};

// Statuses that represent a "returned" item (returned date populated)
export const RETURNED_STATUSES: SubmittalStatus[] = [
  "Approved",
  "Approved w/ Comments",
  "Rejected",
  "Resubmit Required",
];

// ─── DB row type ──────────────────────────────────────────────────────────────

export interface DbSubmittalRow {
  id: string;
  project_id: string;
  number: string;
  spec_section: string;
  description: string;
  submitted_by: string;
  reviewer_name: string;
  submission_date: string | null;
  review_due_date: string | null;
  returned_date: string | null;
  status: string;
  notes: string;
  created_at: string;
}

export function rowToSubmittal(row: DbSubmittalRow): Submittal {
  return {
    id: row.id,
    number: row.number,
    specSection: row.spec_section ?? "",
    description: row.description,
    submittedBy: row.submitted_by ?? "",
    reviewerName: row.reviewer_name ?? "",
    submissionDate: row.submission_date ?? "",
    reviewDueDate: row.review_due_date ?? "",
    returnedDate: row.returned_date ?? "",
    status: row.status as SubmittalStatus,
    notes: row.notes ?? "",
    projectId: row.project_id,
    createdAt: row.created_at.split("T")[0],
  };
}

// ─── Supabase CRUD ────────────────────────────────────────────────────────────

export async function fetchSubmittals(
  projectId: string,
  supabase: SupabaseClient
): Promise<Submittal[]> {
  const { data, error } = await supabase
    .from("submittals")
    .select("*")
    .eq("project_id", projectId)
    .order("number", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => rowToSubmittal(row as DbSubmittalRow));
}

export async function createSubmittal(
  projectId: string,
  input: SubmittalInput,
  nextNumber: string,
  supabase: SupabaseClient
): Promise<Submittal | null> {
  const { data, error } = await supabase
    .from("submittals")
    .insert({
      project_id: projectId,
      number: nextNumber,
      spec_section: input.specSection,
      description: input.description,
      submitted_by: input.submittedBy,
      reviewer_name: input.reviewerName,
      submission_date: input.submissionDate || null,
      review_due_date: input.reviewDueDate || null,
      returned_date: null,
      status: input.submissionDate ? "Submitted" : "Pending Submission",
      notes: "",
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToSubmittal(data as DbSubmittalRow);
}

export async function updateSubmittal(
  id: string,
  changes: { status?: SubmittalStatus; notes?: string; returnedDate?: string },
  supabase: SupabaseClient
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.notes !== undefined) payload.notes = changes.notes;
  if (changes.returnedDate !== undefined) payload.returned_date = changes.returnedDate || null;
  const { error } = await supabase.from("submittals").update(payload).eq("id", id);
  return !error;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(reviewDueDate: string, status: SubmittalStatus): boolean {
  if (!reviewDueDate) return false;
  if (RETURNED_STATUSES.includes(status) || status === "Approved") return false;
  return new Date(reviewDueDate) < new Date();
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = ["#F97316", "#0284C7", "#7C3AED", "#16A34A", "#DC2626", "#D97706"];
export function avatarColor(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function nextSubmittalNumber(submittals: Submittal[]): string {
  const max = submittals.reduce((m, s) => {
    const n = parseInt(s.number.replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return String(max + 1).padStart(4, "0");
}
