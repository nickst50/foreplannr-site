"use client";

import { CompanyTypeProvider } from "@/lib/company-type-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CompanyTypeProvider>{children}</CompanyTypeProvider>;
}
