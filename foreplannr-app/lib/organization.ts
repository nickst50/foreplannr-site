import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyType = "contractor" | "distribution";

export interface OrgData {
  company_name: string;
  company_type: CompanyType;
}

export async function fetchOrgData(supabase: SupabaseClient): Promise<OrgData | null> {
  // Step 1: get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[fetchOrgData] auth user id:", user?.id ?? "none");
  if (!user) return null;

  // Step 2: get org_id from profiles for this user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  console.log("[fetchOrgData] profile:", profile, "| profileError:", profileError);
  if (!profile?.org_id) return null;

  // Step 3: fetch org using org_id
  const { data, error } = await supabase
    .from("organizations")
    .select("company_name, company_type")
    .eq("id", profile.org_id)
    .single();
  console.log("[fetchOrgData] organization:", data, "| error:", error);
  if (!data) return null;

  return {
    company_name: data.company_name ?? "",
    company_type: (data.company_type as CompanyType) ?? "contractor",
  };
}

export async function fetchCompanyType(supabase: SupabaseClient): Promise<CompanyType> {
  const org = await fetchOrgData(supabase);
  return org?.company_type ?? "contractor";
}

export async function upsertOrg(
  supabase: SupabaseClient,
  userId: string,
  companyName: string,
  companyType: CompanyType
): Promise<void> {
  const { error } = await supabase.from("organizations").upsert(
    {
      id: userId,
      company_name: companyName,
      company_type: companyType,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}

export async function updateCompanyType(
  supabase: SupabaseClient,
  userId: string,
  companyType: CompanyType
): Promise<void> {
  console.log("[updateCompanyType] saving company_type:", companyType, "for user:", userId);

  // Upsert so this works even if the org row was never created (e.g. onboarding skipped)
  const { data, error } = await supabase
    .from("organizations")
    .upsert({ id: userId, company_type: companyType }, { onConflict: "id" })
    .select();

  if (error) {
    console.error("[updateCompanyType] failed — message:", error.message, "| code:", error.code, "| details:", error.details);
    throw new Error(error.message || "Supabase update failed");
  }

  console.log("[updateCompanyType] saved successfully:", data?.[0]);
}
