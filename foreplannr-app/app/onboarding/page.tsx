"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { upsertOrg, type CompanyType } from "@/lib/organization";
import { HardHat, Zap, Check, ArrowRight, Building2 } from "lucide-react";

const COMPANY_TYPES: {
  id: CompanyType;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: string[];
  accent: string;
  accentLight: string;
}[] = [
  {
    id: "contractor",
    icon: HardHat,
    title: "General Contractor",
    subtitle: "Manage RFIs, submittals, punch lists and closeout",
    features: ["RFI tracking & management", "Submittal log", "Punch list", "Project closeout hub", "Kickoff handoff"],
    accent: "#F97316",
    accentLight: "#FFF7ED",
  },
  {
    id: "distribution",
    icon: Zap,
    title: "Electrical Distribution",
    subtitle: "Manage submittals, ship schedules, and contractor portals",
    features: ["Submittal analysis (AI)", "Ship schedule generator", "Contractor portal", "Follow-up reminders", "Turnover meetings"],
    accent: "#0EA5E9",
    accentLight: "#F0F9FF",
  },
];

function inputStyle(focused: boolean) {
  return {
    border: focused ? "1.5px solid #F97316" : "1.5px solid #E7E5E4",
    boxShadow: focused ? "0 0 0 3px rgba(249,115,22,0.12)" : "none",
    background: "#FAFAF9",
    color: "#1C1917",
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("");
  const [selectedType, setSelectedType] = useState<CompanyType | null>(null);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    if (!selectedType) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      await upsertOrg(supabase, user.id, companyName.trim(), selectedType);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0a0f1a 0%, #1C1917 60%, #111827 100%)",
      }}
    >
      {/* Radial glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(249,115,22,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-[560px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.svg"
            alt="Foreplannr"
            width={57}
            height={52}
            unoptimized
            style={{ height: "52px", width: "auto" }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
                style={{
                  background: step >= s ? "linear-gradient(135deg, #F97316, #EA580C)" : "rgba(255,255,255,0.08)",
                  color: step >= s ? "#fff" : "rgba(255,255,255,0.3)",
                  boxShadow: step >= s ? "0 2px 8px rgba(249,115,22,0.35)" : "none",
                }}
              >
                {step > s ? <Check size={11} strokeWidth={3} /> : s}
              </div>
              {s < 2 && (
                <div
                  className="w-10 h-px transition-all duration-300"
                  style={{ background: step > s ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.1)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Step 1 — Company name */}
          {step === 1 && (
            <div className="p-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "#FFF7ED" }}
              >
                <Building2 size={22} style={{ color: "#F97316" }} />
              </div>
              <h1
                className="font-display font-800 text-[22px] tracking-[-0.03em] mb-1"
                style={{ color: "#1C1917" }}
              >
                Set up your company
              </h1>
              <p className="text-sm mb-7" style={{ color: "#78716C" }}>
                We&apos;ll use this to personalise your workspace.
              </p>

              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                  Company name <span style={{ color: "#F97316" }}>*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Morrison Electric Supply"
                  autoFocus
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
                  style={inputStyle(focused)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && companyName.trim()) setStep(2);
                  }}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!companyName.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #F97316, #EA580C)",
                  boxShadow: companyName.trim() ? "0 2px 8px rgba(249,115,22,0.35)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (companyName.trim()) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                Continue
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Step 2 — Company type */}
          {step === 2 && (
            <div className="p-8">
              <h1
                className="font-display font-800 text-[22px] tracking-[-0.03em] mb-1"
                style={{ color: "#1C1917" }}
              >
                What kind of company?
              </h1>
              <p className="text-sm mb-6" style={{ color: "#78716C" }}>
                This controls which features you see in Foreplannr.
              </p>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm mb-4"
                  style={{ background: "#FFF1F2", color: "#BE123C" }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 mb-6">
                {COMPANY_TYPES.map(({ id, icon: Icon, title, subtitle, features, accent, accentLight }) => {
                  const selected = selectedType === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedType(id)}
                      className="w-full text-left rounded-xl p-5 transition-all duration-200"
                      style={{
                        border: selected ? `2px solid ${accent}` : "2px solid #E7E5E4",
                        background: selected ? accentLight : "#FAFAF9",
                        boxShadow: selected ? `0 0 0 4px ${accent}1A, 0 4px 16px rgba(0,0,0,0.06)` : "0 1px 3px rgba(28,25,23,0.04)",
                        transform: selected ? "translateY(-1px)" : "",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            background: selected ? accent : "#F5F5F4",
                            transition: "background 0.2s",
                          }}
                        >
                          <Icon
                            size={19}
                            style={{ color: selected ? "#fff" : "#78716C" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span
                              className="font-display font-700 text-[15px] tracking-[-0.01em]"
                              style={{ color: "#1C1917" }}
                            >
                              {title}
                            </span>
                            {selected && (
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: accent }}
                              >
                                <Check size={11} strokeWidth={3} color="#fff" />
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] mb-3" style={{ color: "#78716C" }}>
                            {subtitle}
                          </p>
                          <div className="flex flex-col gap-1">
                            {features.map((f) => (
                              <div key={f} className="flex items-center gap-2">
                                <div
                                  className="w-1 h-1 rounded-full flex-shrink-0"
                                  style={{ background: selected ? accent : "#A8A29E" }}
                                />
                                <span
                                  className="text-[12px] font-medium"
                                  style={{ color: selected ? "#44403C" : "#A8A29E" }}
                                >
                                  {f}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
                  style={{ background: "#F5F5F4", color: "#78716C" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!selectedType || loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #EA580C)",
                    boxShadow: selectedType ? "0 2px 8px rgba(249,115,22,0.35)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedType) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  {loading ? "Setting up…" : "Launch Foreplannr"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[12px] mt-5" style={{ color: "rgba(255,255,255,0.2)" }}>
          You can change this later in Settings.
        </p>
      </div>
    </div>
  );
}
