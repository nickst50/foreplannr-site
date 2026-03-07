"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverMessage = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(serverMessage ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0a0f1a 0%, #1C1917 60%, #111827 100%)",
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(249,115,22,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0,212,255,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Logo above card on dark background */}
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

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#fff",
            boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <h1
            className="font-display font-700 text-[22px] tracking-[-0.03em] mb-1"
            style={{ color: "#1C1917" }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: "#78716C" }}>
            Sign in to your account to continue.
          </p>

          {/* Error */}
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
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold"
                style={{ color: "#44403C" }}
              >
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
                style={{
                  border: "1.5px solid #E7E5E4",
                  background: "#FAFAF9",
                  color: "#1C1917",
                }}
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
              <label
                className="text-[13px] font-semibold"
                style={{ color: "#44403C" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all duration-150"
                  style={{
                    border: "1.5px solid #E7E5E4",
                    background: "#FAFAF9",
                    color: "#1C1917",
                  }}
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
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#78716C";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#A8A29E";
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                boxShadow: loading ? "none" : "0 2px 8px rgba(249,115,22,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 14px rgba(249,115,22,0.45)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 2px 8px rgba(249,115,22,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: "#A8A29E" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold transition-colors duration-150"
              style={{ color: "#F97316" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#EA580C";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#F97316";
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
