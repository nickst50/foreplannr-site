"use client";

import { Sidebar } from "@/components/sidebar";
import { Package, Upload, Zap } from "lucide-react";

export default function DistributionSubmittalsPage() {
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
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white opacity-40 cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
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
            Coming Soon
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            Submittals
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "#78716C" }}>
            Track and manage submittals across all your distribution projects. Upload
            PDFs, monitor approval status, and share with contractors — all in one place.
          </p>
        </div>
      </main>
    </div>
  );
}
