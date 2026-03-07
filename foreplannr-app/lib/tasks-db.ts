import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskStatus = "Open" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeEmail: string | null;
  assigneeName: string;
  dueDate: string;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  assigneeName?: string;
  dueDate: string;
}

export interface DbTaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  assignee_email: string | null;
  assignee_name: string;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  projects?: { name: string };
}

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

export const priorityConfig: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  "Low":      { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  "Medium":   { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  "High":     { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  "Critical": { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E" },
};

export const statusConfig: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  "Open":        { bg: "#F5F5F4", text: "#78716C", dot: "#A8A29E" },
  "In Progress": { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "Done":        { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
};

export function rowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name,
    title: row.title,
    description: row.description ?? "",
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assigneeId: row.assignee_id ?? null,
    assigneeEmail: row.assignee_email ?? null,
    assigneeName: row.assignee_name ?? "",
    dueDate: row.due_date ?? "",
    completedAt: row.completed_at ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at.split("T")[0],
  };
}

export async function fetchMyTasks(
  userId: string,
  supabase: SupabaseClient
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("assignee_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return data.map((r) => rowToTask(r as DbTaskRow));
}

export async function fetchProjectTasks(
  projectId: string,
  supabase: SupabaseClient
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => rowToTask(r as DbTaskRow));
}

export async function createTask(
  projectId: string,
  input: TaskInput,
  createdBy: string,
  supabase: SupabaseClient
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: input.title,
      description: input.description,
      status: "Open",
      priority: input.priority,
      assignee_id: input.assigneeId ?? null,
      assignee_email: input.assigneeEmail ?? null,
      assignee_name: input.assigneeName ?? "",
      due_date: input.dueDate || null,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToTask(data as DbTaskRow);
}

export async function completeTask(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "Done",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  return !error;
}

export async function reopenTask(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "Open",
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  return !error;
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function isDueToday(dueDate: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date().toDateString();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
