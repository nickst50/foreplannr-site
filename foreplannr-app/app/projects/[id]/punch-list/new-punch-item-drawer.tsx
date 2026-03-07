"use client";

import { useState } from "react";
import { X, Camera, Upload } from "lucide-react";
import { priorityConfig, type PunchItemInput, type PunchPriority } from "@/lib/punch-list";

const PRIORITIES: PunchPriority[] = ["Low", "Medium", "High"];

interface Props {
  open: boolean;
  nextNumber: number;
  projectId: string;
  onClose: () => void;
  onSubmit: (input: PunchItemInput) => void;
}

export function NewPunchItemDrawer({ open, nextNumber, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    trade: "",
    assignee: "",
    dueDate: "",
    priority: "Medium" as PunchPriority,
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      trade: form.trade.trim(),
      priority: form.priority,
      assignee: form.assignee.trim(),
      dueDate: form.dueDate,
    });
    setForm({ title: "", description: "", location: "", trade: "", assignee: "", dueDate: "", priority: "Medium" });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          background: "rgba(28,25,23,0.45)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 500,
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(28,25,23,0.14)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #F5F5F4" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded font-mono"
                style={{ background: "#FFF1F2", color: "#BE123C" }}
              >
                PLI-{String(nextNumber).padStart(3, "0")}
              </span>
            </div>
            <h2
              className="font-display font-700 text-[17px] tracking-[-0.02em]"
              style={{ color: "#1C1917" }}
            >
              New Punch List Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
            style={{ background: "#F5F5F4", color: "#78716C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable form */}
        <form
          id="new-punch-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5"
        >
          {/* Title */}
          <FormField label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Replace damaged ceiling tile — Room 204"
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the deficiency in detail…"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Location */}
          <FormField label="Location (Building / Floor / Room)">
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Level 2 / Room 204"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Responsible Trade */}
          <FormField label="Responsible Trade">
            <input
              type="text"
              value={form.trade}
              onChange={(e) => set("trade", e.target.value)}
              placeholder="e.g. Painting Contractor"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Priority */}
          <FormField label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map((p) => {
                const cfg = priorityConfig[p];
                const active = form.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150"
                    style={{
                      background: active ? cfg.bg : "#F5F5F4",
                      color: active ? cfg.text : "#78716C",
                      border: active ? `1.5px solid ${cfg.text}30` : "1.5px solid transparent",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: active ? cfg.dot : "#A8A29E" }}
                    />
                    {p}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assignee">
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => set("assignee", e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
            <FormField label="Due Date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#16A34A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
          </div>

          {/* Photo upload placeholder */}
          <FormField label="Photos">
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-xl py-7 cursor-not-allowed"
              style={{
                border: "1.5px dashed #D1D5DB",
                background: "#FAFAF9",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#F0FDF4" }}
              >
                <Camera size={20} style={{ color: "#16A34A" }} />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                  Attach photos
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>
                  Photo upload coming soon
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ background: "#F0FDF4", color: "#15803D" }}
              >
                <Upload size={12} />
                Browse files
              </div>
            </div>
          </FormField>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-5 flex-shrink-0"
          style={{ borderTop: "1px solid #F5F5F4" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
            style={{ background: "#F5F5F4", color: "#78716C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-punch-form"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #16A34A, #15803D)",
              boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(22,163,74,0.45)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            Add to Punch List
          </button>
        </div>
      </div>
    </>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
        {label}
        {required && <span style={{ color: "#16A34A" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
