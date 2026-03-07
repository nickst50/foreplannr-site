import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TurnoverMeeting {
  id: string;
  projectId: string;
  completedAt: string | null;
  completedBy: string | null;
  scopeOfWork: string;
  keyExclusions: string;
  specialOrderItems: string;
  leadTimeConcerns: string;
  siteAccess: string;
  deliveryRequirements: string;
  specialHandling: string;
  safetyRequirements: string;
  parkingStaging: string;
}

export interface TurnoverContact {
  id: string;
  turnoverId: string;
  role: string;
  name: string;
  phone: string;
  email: string;
  sortOrder: number;
}

export interface TurnoverStep {
  id: string;
  turnoverId: string;
  title: string;
  status: "todo" | "done";
  dueDate: string;
  notes: string;
  sortOrder: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CONTACT_ROLES = [
  "Foreman",
  "Site Supervisor",
  "GC Contact",
  "Electrical Inspector",
];

export const DEFAULT_STEP_TITLES = [
  "Review submittal status and identify pending items",
  "Confirm job site delivery requirements",
  "Set up breakout pricing",
  "Generate initial ship schedule",
  "Send introduction email to foreman",
  "Schedule first follow-up call in 7 days",
  "Confirm purchase orders are placed",
  "Review lead times on special order items",
];

function rowToMeeting(row: Record<string, unknown>): TurnoverMeeting {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    completedAt: (row.completed_at as string) ?? null,
    completedBy: (row.completed_by as string) ?? null,
    scopeOfWork: (row.scope_of_work as string) ?? "",
    keyExclusions: (row.key_exclusions as string) ?? "",
    specialOrderItems: (row.special_order_items as string) ?? "",
    leadTimeConcerns: (row.lead_time_concerns as string) ?? "",
    siteAccess: (row.site_access as string) ?? "",
    deliveryRequirements: (row.delivery_requirements as string) ?? "",
    specialHandling: (row.special_handling as string) ?? "",
    safetyRequirements: (row.safety_requirements as string) ?? "",
    parkingStaging: (row.parking_staging as string) ?? "",
  };
}

function rowToContact(row: Record<string, unknown>): TurnoverContact {
  return {
    id: row.id as string,
    turnoverId: row.turnover_id as string,
    role: (row.role as string) ?? "",
    name: (row.name as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

function rowToStep(row: Record<string, unknown>): TurnoverStep {
  return {
    id: row.id as string,
    turnoverId: row.turnover_id as string,
    title: (row.title as string) ?? "",
    status: ((row.status as string) ?? "todo") as "todo" | "done",
    dueDate: (row.due_date as string) ?? "",
    notes: (row.notes as string) ?? "",
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Fetch (or create) the turnover meeting for a project. */
export async function fetchOrCreateTurnover(
  projectId: string,
  supabase: SupabaseClient
): Promise<TurnoverMeeting> {
  // Try to fetch existing
  const { data: existing } = await supabase
    .from("turnover_meetings")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (existing) return rowToMeeting(existing);

  // Create new — omit organization_id to avoid FK issues if org row doesn't exist
  const { data: created, error } = await supabase
    .from("turnover_meetings")
    .insert({ project_id: projectId })
    .select()
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create turnover meeting");
  return rowToMeeting(created);
}

/** Fetch contacts for a turnover. Returns [] if none. */
export async function fetchContacts(
  turnoverId: string,
  supabase: SupabaseClient
): Promise<TurnoverContact[]> {
  const { data } = await supabase
    .from("turnover_contacts")
    .select("*")
    .eq("turnover_id", turnoverId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => rowToContact(r as Record<string, unknown>));
}

/** Seed default contacts for a new turnover. */
export async function seedContacts(
  turnoverId: string,
  supabase: SupabaseClient
): Promise<TurnoverContact[]> {
  const rows = DEFAULT_CONTACT_ROLES.map((role, i) => ({
    turnover_id: turnoverId,
    role,
    name: "",
    phone: "",
    email: "",
    sort_order: i,
  }));
  const { data, error } = await supabase
    .from("turnover_contacts")
    .insert(rows)
    .select();
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToContact(r as Record<string, unknown>));
}

/** Fetch steps for a turnover. Returns [] if none. */
export async function fetchSteps(
  turnoverId: string,
  supabase: SupabaseClient
): Promise<TurnoverStep[]> {
  const { data } = await supabase
    .from("turnover_steps")
    .select("*")
    .eq("turnover_id", turnoverId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => rowToStep(r as Record<string, unknown>));
}

/** Seed default steps for a new turnover. */
export async function seedSteps(
  turnoverId: string,
  supabase: SupabaseClient
): Promise<TurnoverStep[]> {
  const rows = DEFAULT_STEP_TITLES.map((title, i) => ({
    turnover_id: turnoverId,
    title,
    status: "todo",
    sort_order: i,
  }));
  const { data, error } = await supabase
    .from("turnover_steps")
    .insert(rows)
    .select();
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToStep(r as Record<string, unknown>));
}

/** Save the main meeting fields. */
export async function saveTurnoverMeeting(
  meeting: TurnoverMeeting,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("turnover_meetings")
    .update({
      scope_of_work: meeting.scopeOfWork,
      key_exclusions: meeting.keyExclusions,
      special_order_items: meeting.specialOrderItems,
      lead_time_concerns: meeting.leadTimeConcerns,
      site_access: meeting.siteAccess,
      delivery_requirements: meeting.deliveryRequirements,
      special_handling: meeting.specialHandling,
      safety_requirements: meeting.safetyRequirements,
      parking_staging: meeting.parkingStaging,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meeting.id);
}

/** Upsert a single contact. */
export async function upsertContact(
  contact: TurnoverContact,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("turnover_contacts").upsert({
    id: contact.id,
    turnover_id: contact.turnoverId,
    role: contact.role,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    sort_order: contact.sortOrder,
  });
}

/** Delete a contact by id. */
export async function deleteContact(id: string, supabase: SupabaseClient): Promise<void> {
  await supabase.from("turnover_contacts").delete().eq("id", id);
}

/** Upsert a single step. */
export async function upsertStep(
  step: TurnoverStep,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("turnover_steps").upsert({
    id: step.id,
    turnover_id: step.turnoverId,
    title: step.title,
    status: step.status,
    due_date: step.dueDate || null,
    notes: step.notes,
    sort_order: step.sortOrder,
  });
}

/** Delete a step by id. */
export async function deleteStep(id: string, supabase: SupabaseClient): Promise<void> {
  await supabase.from("turnover_steps").delete().eq("id", id);
}

/** Mark the turnover as complete. */
export async function completeTurnover(
  meetingId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("turnover_meetings")
    .update({
      completed_at: new Date().toISOString(),
      completed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId);
}

/** Check if a turnover is complete. */
export async function checkTurnoverComplete(
  projectId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from("turnover_meetings")
    .select("completed_at")
    .eq("project_id", projectId)
    .single();
  return !!data?.completed_at;
}
