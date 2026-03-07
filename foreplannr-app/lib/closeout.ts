import type { SupabaseClient } from "@supabase/supabase-js";

export type CloseoutStatus =
  | "Not Started"
  | "In Progress"
  | "Uploaded"
  | "Submitted"
  | "Done";

export const CLOSEOUT_STATUSES: CloseoutStatus[] = [
  "Not Started",
  "In Progress",
  "Uploaded",
  "Submitted",
  "Done",
];

export const CLOSEOUT_CATEGORIES = [
  "O&M Manuals",
  "As-Built Drawings",
  "Warranty Documentation",
  "Commissioning Reports",
  "Lien Waivers",
  "Certificate of Occupancy",
  "Final Inspections",
] as const;

export type CloseoutCategory = (typeof CLOSEOUT_CATEGORIES)[number];

export interface CloseoutItem {
  id: string;
  projectId: string;
  title: string;
  category: CloseoutCategory;
  status: CloseoutStatus;
  responsibleParty: string;
  dueDate: string;
  notes: string;
  sortOrder: number;
  createdAt: string;
}

export interface CloseoutItemInput {
  title: string;
  category: CloseoutCategory;
  responsibleParty: string;
  dueDate: string;
  notes: string;
}

export interface DbCloseoutItemRow {
  id: string;
  project_id: string;
  title: string;
  category: string;
  status: string;
  responsible_party: string;
  due_date: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
}

export const statusConfig: Record<
  CloseoutStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  "Not Started": { bg: "#F5F5F4", text: "#78716C", dot: "#A8A29E", border: "#E7E5E4" },
  "In Progress": { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
  "Uploaded":    { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E", border: "#BBF7D0" },
  "Submitted":   { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B", border: "#FDE68A" },
  "Done":        { bg: "#F0FDFA", text: "#0F766E", dot: "#0D9488", border: "#99F6E4" },
};

export function rowToCloseoutItem(row: DbCloseoutItemRow): CloseoutItem {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    category: row.category as CloseoutCategory,
    status: row.status as CloseoutStatus,
    responsibleParty: row.responsible_party ?? "",
    dueDate: row.due_date ?? "",
    notes: row.notes ?? "",
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at.split("T")[0],
  };
}

export async function fetchCloseoutItems(
  projectId: string,
  supabase: SupabaseClient
): Promise<CloseoutItem[]> {
  const { data, error } = await supabase
    .from("closeout_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => rowToCloseoutItem(r as DbCloseoutItemRow));
}

export async function createCloseoutItem(
  projectId: string,
  input: CloseoutItemInput,
  supabase: SupabaseClient
): Promise<CloseoutItem | null> {
  const { data, error } = await supabase
    .from("closeout_items")
    .insert({
      project_id: projectId,
      title: input.title,
      category: input.category,
      status: "Not Started",
      responsible_party: input.responsibleParty,
      due_date: input.dueDate || null,
      notes: input.notes,
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToCloseoutItem(data as DbCloseoutItemRow);
}

export async function updateCloseoutItem(
  id: string,
  changes: Partial<{
    status: CloseoutStatus;
    responsibleParty: string;
    dueDate: string;
    notes: string;
    title: string;
  }>,
  supabase: SupabaseClient
): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.responsibleParty !== undefined) payload.responsible_party = changes.responsibleParty;
  if (changes.dueDate !== undefined) payload.due_date = changes.dueDate || null;
  if (changes.notes !== undefined) payload.notes = changes.notes;
  if (changes.title !== undefined) payload.title = changes.title;
  const { error } = await supabase.from("closeout_items").update(payload).eq("id", id);
  return !error;
}

export async function deleteCloseoutItem(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase.from("closeout_items").delete().eq("id", id);
  return !error;
}

export function closeoutPercent(items: CloseoutItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.status === "Done").length;
  return Math.round((done / items.length) * 100);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
