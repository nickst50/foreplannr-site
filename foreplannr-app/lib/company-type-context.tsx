"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchCompanyType, type CompanyType } from "@/lib/organization";

interface CompanyTypeContextValue {
  companyType: CompanyType;
  loading: boolean;
  refresh: () => void;
}

const CompanyTypeContext = createContext<CompanyTypeContextValue>({
  companyType: "contractor",
  loading: true,
  refresh: () => {},
});

export function CompanyTypeProvider({ children }: { children: React.ReactNode }) {
  const [companyType, setCompanyType] = useState<CompanyType>("contractor");
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[CompanyTypeProvider] auth user:", user?.id ?? "none");
    if (!user) {
      setLoading(false);
      return;
    }
    const type = await fetchCompanyType(supabase);
    console.log("[CompanyTypeProvider] resolved company_type:", type);
    setCompanyType(type);
    setLoading(false);
  }

  useEffect(() => {
    load();

    // Re-fetch if the user signs in/out
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        load();
      } else if (event === "SIGNED_OUT") {
        setCompanyType("contractor");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CompanyTypeContext.Provider value={{ companyType, loading, refresh: load }}>
      {children}
    </CompanyTypeContext.Provider>
  );
}

export function useCompanyType(): CompanyTypeContextValue {
  return useContext(CompanyTypeContext);
}
