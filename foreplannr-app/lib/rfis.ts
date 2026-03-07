import type { SupabaseClient } from "@supabase/supabase-js";

export type RFIStatus = "Open" | "In Review" | "Answered" | "Closed";
export type RFIPriority = "Low" | "Medium" | "High" | "Critical";

export interface RFI {
  id: string;
  number: number;
  title: string;
  description: string;
  specSection: string;
  priority: RFIPriority;
  status: RFIStatus;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  response: string;
  projectId: string;
}

export interface RFIInput {
  title: string;
  description: string;
  specSection: string;
  priority: RFIPriority;
  assignedTo: string;
  dueDate: string;
}

export const RFI_STATUSES: RFIStatus[] = ["Open", "In Review", "Answered", "Closed"];

export const statusConfig: Record<RFIStatus, { bg: string; text: string; dot: string; border: string }> = {
  "Open":      { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", border: "#FED7AA" },
  "In Review": { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
  "Answered":  { bg: "#F0FDFA", text: "#0F766E", dot: "#0D9488", border: "#99F6E4" },
  "Closed":    { bg: "#F5F5F4", text: "#78716C", dot: "#A8A29E", border: "#E7E5E4" },
};

export const priorityConfig: Record<RFIPriority, { bg: string; text: string }> = {
  "Low":      { bg: "#F0FDF4", text: "#15803D" },
  "Medium":   { bg: "#FFFBEB", text: "#D97706" },
  "High":     { bg: "#FFF7ED", text: "#C2410C" },
  "Critical": { bg: "#FFF1F2", text: "#BE123C" },
};

// ─── DB row type ───────────────────────────────────────────────────────────────

export interface DbRFIRow {
  id: string;
  project_id: string;
  number: number;
  title: string;
  description: string;
  spec_section: string;
  priority: string;
  status: string;
  assigned_to: string;
  due_date: string | null;
  response: string;
  created_at: string;
}

export function rowToRFI(row: DbRFIRow): RFI {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description ?? "",
    specSection: row.spec_section ?? "",
    priority: row.priority as RFIPriority,
    status: row.status as RFIStatus,
    assignedTo: row.assigned_to ?? "",
    dueDate: row.due_date ?? "",
    createdAt: row.created_at.split("T")[0],
    response: row.response ?? "",
    projectId: row.project_id,
  };
}

// ─── Supabase CRUD ─────────────────────────────────────────────────────────────

export async function fetchRFIs(projectId: string, supabase: SupabaseClient): Promise<RFI[]> {
  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .order("number", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => rowToRFI(row as DbRFIRow));
}

export async function createRFI(
  projectId: string,
  input: RFIInput,
  nextNumber: number,
  supabase: SupabaseClient
): Promise<RFI | null> {
  const { data, error } = await supabase
    .from("rfis")
    .insert({
      project_id: projectId,
      number: nextNumber,
      title: input.title,
      description: input.description,
      spec_section: input.specSection,
      priority: input.priority,
      status: "Open",
      assigned_to: input.assignedTo,
      due_date: input.dueDate || null,
      response: "",
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToRFI(data as DbRFIRow);
}

export async function updateRFI(
  id: string,
  changes: { status?: RFIStatus; response?: string },
  supabase: SupabaseClient
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.response !== undefined) payload.response = changes.response;
  const { error } = await supabase.from("rfis").update(payload).eq("id", id);
  return !error;
}

export async function deleteRFI(id: string, supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("rfis").delete().eq("id", id);
  return !error;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function daysOpen(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
}

export function isOverdue(dueDate: string, status: RFIStatus): boolean {
  if (status === "Closed" || status === "Answered") return false;
  return new Date(dueDate) < new Date();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
