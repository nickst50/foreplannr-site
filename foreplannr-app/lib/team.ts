import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string | null;
  email: string;
  fullName: string;
  role: string;
  invitedBy: string | null;
  createdAt: string;
}

export interface DbProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: string;
  invited_by: string | null;
  created_at: string;
}

export const MEMBER_ROLES = [
  "Project Manager",
  "Superintendent",
  "Foreman",
  "Subcontractor",
  "Owner Rep",
  "Architect",
  "Engineer",
  "Inspector",
  "Member",
] as const;

export function rowToMember(row: DbProjectMemberRow): ProjectMember {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id ?? null,
    email: row.email,
    fullName: row.full_name ?? "",
    role: row.role ?? "Member",
    invitedBy: row.invited_by ?? null,
    createdAt: row.created_at.split("T")[0],
  };
}

export async function fetchProjectMembers(
  projectId: string,
  supabase: SupabaseClient
): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => rowToMember(r as DbProjectMemberRow));
}

export async function addProjectMember(
  projectId: string,
  email: string,
  fullName: string,
  role: string,
  invitedBy: string,
  supabase: SupabaseClient
): Promise<ProjectMember | null> {
  const { data, error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      email: email.toLowerCase().trim(),
      full_name: fullName.trim(),
      role,
      invited_by: invitedBy,
    })
    .select()
    .single();
  if (error || !data) return null;
  return rowToMember(data as DbProjectMemberRow);
}

export async function removeProjectMember(
  memberId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId);
  return !error;
}

export function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = ["#F97316", "#0284C7", "#7C3AED", "#16A34A", "#DC2626", "#D97706", "#0891B2"];
export function avatarColor(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
