"use client";

import { Sidebar } from "@/components/sidebar";
import { ExternalLink, Zap } from "lucide-react";

export default function DistributionPortalPage() {
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
        </header>

        <div className="px-8 py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
              border: "1px solid #FED7AA",
            }}
          >
            <ExternalLink size={28} style={{ color: "#F97316" }} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-4"
            style={{ background: "#FFF7ED", color: "#EA580C" }}
          >
            <Zap size={10} />
            Coming Soon
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            Contractor Portal
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "#78716C" }}>
            Give contractors a dedicated view into their project materials, submittals,
            and ship schedules. Reduce back-and-forth and keep everyone aligned without
            sharing your internal tools.
          </p>
        </div>
      </main>
    </div>
  );
}
