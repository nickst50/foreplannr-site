import type { SupabaseClient } from "@supabase/supabase-js";

export type PunchStatus = "Open" | "In Progress" | "Pending Verification" | "Resolved";
export type PunchPriority = "Low" | "Medium" | "High";

export interface PunchItem {
  id: string;
  number: number;
  title: string;
  description: string;
  location: string;
  trade: string;
  priority: PunchPriority;
  status: PunchStatus;
  assignee: string;
  dueDate: string;
  hasPhoto: boolean;
  projectId: string;
  createdAt: string;
  comments: string;
}

export interface PunchItemInput {
  title: string;
  description: string;
  location: string;
  trade: string;
  priority: PunchPriority;
  assignee: string;
  dueDate: string;
}

export const PUNCH_STATUSES: PunchStatus[] = [
  "Open",
  "In Progress",
  "Pending Verification",
  "Resolved",
];

export const statusConfig: Record<
  PunchStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  "Open":                 { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E", border: "#FECDD3" },
  "In Progress":          { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
  "Pending Verification": { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B", border: "#FDE68A" },
  "Resolved":             { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E", border: "#BBF7D0" },
};

export const priorityConfig: Record<
  PunchPriority,
  { dot: string; bg: string; text: string }
> = {
  "High":   { dot: "#EF4444", bg: "#FFF1F2", text: "#BE123C" },
  "Medium": { dot: "#F59E0B", bg: "#FFFBEB", text: "#B45309" },
  "Low":    { dot: "#22C55E", bg: "#F0FDF4", text: "#15803D" },
};

// ─── DB row type ──────────────────────────────────────────────────────────────

export interface DbPunchItemRow {
  id: string;
  project_id: string;
  number: number;
  title: string;
  description: string;
  location: string;
  trade: string;
  priority: string;
  status: string;
  assignee: string;
  due_date: string | null;
  has_photo: boolean;
  comments: string;
  created_at: string;
}

export function rowToPunchItem(row: DbPunchItemRow): PunchItem {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    trade: row.trade ?? "",
    priority: row.priority as PunchPriority,
    status: row.status as PunchStatus,
    assignee: row.assignee ?? "",
    dueDate: row.due_date ?? "",
    hasPhoto: row.has_photo ?? false,
    projectId: row.project_id,
    createdAt: row.created_at.split("T")[0],
    comments: row.comments ?? "",
  };
}

// ─── Supabase CRUD ────────────────────────────────────────────────────────────

export async function fetchPunchItems(
  projectId: string,
  supabase: SupabaseClient
): Promise<PunchItem[]> {
  const { data, error } = await supabase
    .from("punch_list_items")
    .select("*")
    .eq("project_id", projectId)
    .order("number", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => rowToPunchItem(row as DbPunchItemRow));
}

export async function createPunchItem(
  projectId: string,
  input: PunchItemInput,
  nextNumber: number,
  supabase: SupabaseClient
): Promise<PunchItem | null> {
  const { data, error } = await supabase
    .from("punch_list_items")
    .insert({
      project_id: projectId,
      number: nextNumber,
      title: input.title,
      description: input.description,
      location: input.location,
      trade: input.trade,
      priority: input.priority,
      status: "Open",
      assignee: input.assignee,
      due_date: input.dueDate || null,
      has_photo: false,
      comments: "",
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToPunchItem(data as DbPunchItemRow);
}

export async function updatePunchItem(
  id: string,
  changes: { status?: PunchStatus; comments?: string },
  supabase: SupabaseClient
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.comments !== undefined) payload.comments = changes.comments;
  const { error } = await supabase.from("punch_list_items").update(payload).eq("id", id);
  return !error;
}

export async function deletePunchItem(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase.from("punch_list_items").delete().eq("id", id);
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

export function isOverdue(dueDate: string, status: PunchStatus): boolean {
  if (!dueDate || status === "Resolved") return false;
  return new Date(dueDate) < new Date();
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

export function nextPunchNumber(items: PunchItem[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.number)) + 1;
}
