"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSwitchCompanyType } from "./actions";
import type { CompanyType } from "@/lib/organization";

export default function AdminSwitchCompanyTypePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType>("contractor");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await adminSwitchCompanyType(password, companyType);

    if (res.success) {
      setResult({ success: true, message: `Switched to "${companyType}" successfully. Redirecting to dashboard…` });
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setResult({ success: false, message: res.error ?? "Unknown error." });
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#0a0f1a" }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl p-8"
        style={{
          background: "#1C1917",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "#F97316" }}>
          Admin
        </p>
        <h1 className="text-[20px] font-bold tracking-tight mb-1" style={{ color: "#FAFAF9" }}>
          Switch Company Type
        </h1>
        <p className="text-[13px] mb-7" style={{ color: "#78716C" }}>
          Updates the organization for the currently logged-in account.
        </p>

        {result && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-[13px] font-medium"
            style={{
              background: result.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: result.success ? "#4ADE80" : "#F87171",
              border: `1px solid ${result.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#78716C" }}>
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#FAFAF9",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#78716C" }}>
              Company Type
            </label>
            <div className="flex gap-2">
              {(["contractor", "distribution"] as CompanyType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCompanyType(type)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-150"
                  style={{
                    background: companyType === type ? "#F97316" : "rgba(255,255,255,0.05)",
                    color: companyType === type ? "#fff" : "#A8A29E",
                    border: companyType === type ? "1px solid #F97316" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {type === "contractor" ? "🏗️ Contractor" : "⚡ Distribution"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
          >
            {loading ? "Switching…" : "Switch Company Type"}
          </button>
        </form>
      </div>
    </div>
  );
}
