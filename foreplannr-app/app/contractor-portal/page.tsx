"use client";

import { Sidebar } from "@/components/sidebar";
import { ExternalLink, Zap, Eye, Shield, RefreshCw, Link as LinkIcon } from "lucide-react";

export default function ContractorPortalPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar />

      <main className="flex-1 ml-[260px] min-h-screen">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(250,250,249,0.90)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E7E5E4",
          }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>
              Electrical Distribution
            </p>
            <h1
              className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]"
              style={{ color: "#1C1917" }}
            >
              Contractor Portal
            </h1>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white opacity-50 cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #16A34A, #15803D)",
              boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
            }}
          >
            <LinkIcon size={15} strokeWidth={2.5} />
            Share Portal Link
          </button>
        </header>

        <div className="px-8 py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
              border: "1px solid #BBF7D0",
            }}
          >
            <ExternalLink size={28} style={{ color: "#16A34A" }} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-4"
            style={{ background: "#F0FDF4", color: "#16A34A" }}
          >
            <Zap size={10} />
            Coming in Phase 6
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            Public Contractor Portal
          </h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#78716C" }}>
            Give your contractors a live, branded window into their project. Share a unique
            link — no login required. They see ship schedules, submittals, and documents.
            You control exactly what's visible.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full text-left">
            {[
              { icon: Eye,        label: "Read-only access",     desc: "Contractors see status and dates — never pricing or internal notes", color: "#16A34A" },
              { icon: RefreshCw,  label: "Real-time updates",    desc: "Supabase Realtime pushes changes the instant you make them",          color: "#0284C7" },
              { icon: Shield,     label: "Revocable access",     desc: "Set an expiry date or revoke the link at any time",                    color: "#7C3AED" },
              { icon: LinkIcon,   label: "Unique per project",   desc: "Each project generates its own shareable token URL",                   color: "#D97706" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: "#fff", border: "1px solid #E7E5E4" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "#1C1917" }}>{label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Portal tabs preview */}
          <div className="mt-8 w-full rounded-xl overflow-hidden" style={{ border: "1px solid #E7E5E4" }}>
            <div className="flex border-b" style={{ borderColor: "#E7E5E4", background: "#F5F5F4" }}>
              {["Ship Schedule", "Submittals", "Documents"].map((tab, i) => (
                <div
                  key={tab}
                  className="px-4 py-2.5 text-[12px] font-semibold"
                  style={{
                    color: i === 0 ? "#1C1917" : "#A8A29E",
                    borderBottom: i === 0 ? "2px solid #16A34A" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="p-5 text-center" style={{ background: "#fff" }}>
              <div className="flex items-center gap-2 mb-2 justify-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#F0FDF4" }}>
                  <ExternalLink size={10} style={{ color: "#16A34A" }} />
                </div>
                <span className="text-[12px] font-semibold" style={{ color: "#44403C" }}>Powered by Foreplannr</span>
              </div>
              <p className="text-[12px]" style={{ color: "#A8A29E" }}>
                Contractors see this view at <span style={{ color: "#16A34A", fontFamily: "monospace" }}>/portal/[token]</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
