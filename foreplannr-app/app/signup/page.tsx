"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, Mail, Check } from "lucide-react";
import type { CompanyType } from "@/lib/organization";

const COMPANY_TYPES: {
  id: CompanyType;
  emoji: string;
  title: string;
  description: string;
  accent: string;
  accentBg: string;
}[] = [
  {
    id: "contractor",
    emoji: "🏗️",
    title: "General Contractor",
    description: "Manage RFIs, submittals, punch lists and closeout",
    accent: "#F97316",
    accentBg: "#FFF7ED",
  },
  {
    id: "distribution",
    emoji: "⚡",
    title: "Electrical Distribution",
    description: "Manage submittals, ship schedules and contractor portals",
    accent: "#0EA5E9",
    accentBg: "#F0F9FF",
  },
];

function inputStyle() {
  return {
    border: "1.5px solid #E7E5E4",
    background: "#FAFAF9",
    color: "#1C1917",
  };
}

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!companyType) {
      setError("Please select your company type.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          company_type: companyType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      // Session available immediately — create org now, then go straight to dashboard
      const { error: orgError } = await supabase.from("organizations").upsert(
        {
          id: data.user.id,
          company_name: companyName.trim(),
          company_type: companyType,
        },
        { onConflict: "id" }
      );
      if (orgError) {
        // Non-fatal — onboarding can recover, still proceed
        console.warn("Org insert error (non-fatal):", orgError.message);
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      // Email confirmation required — org will be created after they confirm + complete onboarding
      setEmailSent(true);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(135deg, #0a0f1a 0%, #1C1917 60%, #111827 100%)",
        }}
      >
        <div
          className="relative w-full max-w-[420px] rounded-2xl p-8 text-center"
          style={{
            background: "#fff",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "#FFF7ED" }}
          >
            <Mail size={26} style={{ color: "#F97316" }} />
          </div>
          <h2
            className="font-display font-700 text-[20px] tracking-[-0.02em] mb-2"
            style={{ color: "#1C1917" }}
          >
            Check your email
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#78716C" }}>
            We sent a confirmation link to{" "}
            <span className="font-semibold" style={{ color: "#1C1917" }}>
              {email}
            </span>
            . Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
            }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0f1a 0%, #1C1917 60%, #111827 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(249,115,22,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0,212,255,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-[500px]">
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

        <div
          className="rounded-2xl p-8"
          style={{
            background: "#fff",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <h1
            className="font-display font-700 text-[22px] tracking-[-0.03em] mb-1"
            style={{ color: "#1C1917" }}
          >
            Create your account
          </h1>
          <p className="text-sm mb-7" style={{ color: "#78716C" }}>
            Start managing your projects in minutes.
          </p>

          {error && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ background: "#FFF1F2", color: "#BE123C" }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jake Morrison"
                required
                autoComplete="name"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
                style={inputStyle()}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#F97316";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E7E5E4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
                style={inputStyle()}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#F97316";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E7E5E4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all duration-150"
                  style={inputStyle()}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#F97316";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E7E5E4";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{ color: "#A8A29E" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#78716C"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A8A29E"; }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Company name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Construction LLC"
                required
                autoComplete="organization"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
                style={inputStyle()}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#F97316";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E7E5E4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Company type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                Company type
              </label>
              <div className="flex flex-col gap-2">
                {COMPANY_TYPES.map(({ id, emoji, title, description, accent, accentBg }) => {
                  const selected = companyType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCompanyType(id)}
                      className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-150"
                      style={{
                        border: selected ? `2px solid ${accent}` : "2px solid #E7E5E4",
                        background: selected ? accentBg : "#FAFAF9",
                        boxShadow: selected ? `0 0 0 3px ${accent}1A` : "none",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[22px] leading-none">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: selected ? accent : "#1C1917" }}
                            >
                              {title}
                            </span>
                            {selected && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: accent }}
                              >
                                <Check size={9} strokeWidth={3} color="#fff" />
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] mt-0.5" style={{ color: "#78716C" }}>
                            {description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !companyType}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                boxShadow: loading || !companyType ? "none" : "0 2px 8px rgba(249,115,22,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading && companyType) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: "#A8A29E" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors duration-150"
              style={{ color: "#F97316" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EA580C"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#F97316"; }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
