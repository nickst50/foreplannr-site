"use client";

import { Sidebar } from "@/components/sidebar";
import { Truck, Plus, Zap } from "lucide-react";

export default function DistributionShipSchedulesPage() {
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
              Ship Schedules
            </h1>
          </div>

          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white opacity-40 cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Schedule
          </button>
        </header>

        <div className="px-8 py-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
              border: "1px solid #DDD6FE",
            }}
          >
            <Truck size={28} style={{ color: "#7C3AED" }} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase mb-4"
            style={{ background: "#F5F3FF", color: "#6D28D9" }}
          >
            <Zap size={10} />
            Coming Soon
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            Ship Schedules
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "#78716C" }}>
            Create and track shipping schedules for every project. Log material
            releases, expected delivery dates, and confirm receipt — so nothing
            falls through the cracks.
          </p>
        </div>
      </main>
    </div>
  );
}
