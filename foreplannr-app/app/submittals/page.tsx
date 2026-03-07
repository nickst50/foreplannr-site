"use client";

import { Sidebar } from "@/components/sidebar";
import { Package, Upload, Zap } from "lucide-react";
import Link from "next/link";

export default function SubmittalsPage() {
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
              Submittals
            </h1>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97] opacity-50 cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
              boxShadow: "0 2px 8px rgba(14,165,233,0.3)",
            }}
          >
            <Upload size={15} strokeWidth={2.5} />
            Upload Submittal
          </button>
        </header>

        <div className="px-8 py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
              border: "1px solid #BAE6FD",
            }}
          >
            <Package size={28} style={{ color: "#0EA5E9" }} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-4"
            style={{ background: "#F0F9FF", color: "#0284C7" }}
          >
            <Zap size={10} />
            Coming in Phase 3
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            AI-Powered Submittal Analysis
          </h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#78716C" }}>
            Upload electrical submittal PDFs and let AI extract fixture lists, approval
            statuses, and redlines — automatically. Generate approval reports and share
            with contractors in one click.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full text-left">
            {[
              { label: "AI fixture extraction", desc: "Automatically parse every item from any PDF format" },
              { label: "Approval status tracking", desc: "Approved, partial, rejected — at a glance" },
              { label: "Redline documentation", desc: "All comments and revision requests in one place" },
              { label: "One-click approval reports", desc: "Generate and share professional PDF reports" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "#fff", border: "1px solid #E7E5E4" }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: "#0EA5E9" }}
                />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "#1C1917" }}>{label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[13px] mt-8" style={{ color: "#A8A29E" }}>
            In the meantime, manage submittals within each{" "}
            <Link href="/projects" className="font-semibold" style={{ color: "#0EA5E9" }}>
              project
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
