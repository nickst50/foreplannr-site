"use server";

import { createClient } from "@/lib/supabase/server";
import type { CompanyType } from "@/lib/organization";

export async function adminSwitchCompanyType(
  password: string,
  companyType: CompanyType
): Promise<{ success: boolean; error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { success: false, error: "ADMIN_PASSWORD is not set in environment variables." };
  }
  if (password !== adminPassword) {
    return { success: false, error: "Incorrect password." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated. Please log in first." };
  }

  const { error } = await supabase
    .from("organizations")
    .upsert({ id: user.id, company_type: companyType }, { onConflict: "id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
