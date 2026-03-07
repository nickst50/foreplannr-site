"use client";

import { Sidebar } from "@/components/sidebar";
import { Truck, Plus, Zap, FileSpreadsheet, ExternalLink } from "lucide-react";

export default function ShipSchedulesPage() {
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

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 opacity-50 cursor-not-allowed"
              style={{ background: "#F5F5F4", color: "#78716C" }}
            >
              <FileSpreadsheet size={15} />
              Import
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New Schedule
            </button>
          </div>
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
            style={{ background: "#F5F3FF", color: "#7C3AED" }}
          >
            <Zap size={10} />
            Coming in Phase 4
          </div>

          <h2
            className="font-display font-800 text-[24px] tracking-[-0.03em] mb-3"
            style={{ color: "#1C1917" }}
          >
            Live Ship Schedule Generator
          </h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#78716C" }}>
            Build and share real-time ship schedules with your contractor customers.
            Color-coded status tracking, Excel import, PDF export, and a live contractor
            portal that updates the moment you do.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full text-left">
            {[
              { label: "Build or import", desc: "Create line items manually or import from Excel/CSV" },
              { label: "Phase grouping", desc: "Organize items by phase with color-coded status indicators" },
              { label: "Live contractor portal", desc: "Share a unique URL — no login required for contractors" },
              { label: "Real-time updates", desc: "Status changes appear instantly via Supabase Realtime" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "#fff", border: "1px solid #E7E5E4" }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: "#7C3AED" }}
                />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "#1C1917" }}>{label}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Status colors preview */}
          <div className="mt-8 w-full p-4 rounded-xl" style={{ background: "#fff", border: "1px solid #E7E5E4" }}>
            <p className="text-[12px] font-semibold mb-3 text-left" style={{ color: "#78716C" }}>
              STATUS LEGEND
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Not Ordered", color: "#A8A29E", bg: "#F5F5F4" },
                { label: "On Order",    color: "#0284C7", bg: "#F0F9FF" },
                { label: "Partial Ship",color: "#D97706", bg: "#FFFBEB" },
                { label: "Shipped",     color: "#16A34A", bg: "#F0FDF4" },
                { label: "Delivered",   color: "#0F766E", bg: "#F0FDFA" },
              ].map(({ label, color, bg }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[12px] font-medium" style={{ color: "#44403C" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
