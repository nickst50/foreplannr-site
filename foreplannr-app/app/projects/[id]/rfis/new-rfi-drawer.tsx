"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { priorityConfig, type RFI, type RFIPriority } from "@/lib/rfis";

const PRIORITIES: RFIPriority[] = ["Low", "Medium", "High", "Critical"];

interface Props {
  open: boolean;
  nextNumber: number;
  projectId: string;
  onClose: () => void;
  onSubmit: (rfi: RFI) => void;
}

export function NewRFIDrawer({ open, nextNumber, projectId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    specSection: "",
    assignedTo: "",
    dueDate: "",
    priority: "Medium" as RFIPriority,
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const rfi: RFI = {
      id: `${projectId}-rfi-${Date.now()}`,
      number: nextNumber,
      title: form.title.trim(),
      description: form.description.trim(),
      specSection: form.specSection.trim(),
      priority: form.priority,
      status: "Open",
      assignedTo: form.assignedTo.trim(),
      dueDate: form.dueDate,
      createdAt: new Date().toISOString().split("T")[0],
      response: "",
      projectId,
    };

    onSubmit(rfi);
    setForm({ title: "", description: "", specSection: "", assignedTo: "", dueDate: "", priority: "Medium" });
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
            <div className="flex items-center gap-2.5">
              <span
                className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded"
                style={{ background: "#FFF7ED", color: "#C2410C" }}
              >
                RFI #{String(nextNumber).padStart(2, "0")}
              </span>
            </div>
            <h2
              className="font-display font-700 text-[17px] tracking-[-0.02em] mt-1"
              style={{ color: "#1C1917" }}
            >
              New Request for Information
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

        {/* Scrollable form body */}
        <form
          id="new-rfi-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5"
        >
          {/* Title */}
          <FormField label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Roof drain pipe size clarification"
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the issue or question in detail…"
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Spec Section */}
          <FormField label="Spec Section">
            <input
              type="text"
              value={form.specSection}
              onChange={(e) => set("specSection", e.target.value)}
              placeholder="e.g. 22 14 00 – Storm Drainage"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          {/* Priority */}
          <FormField label="Priority">
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => {
                const cfg = priorityConfig[p];
                const active = form.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150"
                    style={{
                      background: active ? cfg.bg : "#F5F5F4",
                      color: active ? cfg.text : "#78716C",
                      border: active ? `1.5px solid ${cfg.text}30` : "1.5px solid transparent",
                      boxShadow: active ? `0 0 0 1px ${cfg.text}20` : "none",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Assigned To + Due Date side by side */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assigned To">
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) => set("assignedTo", e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
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
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
          </div>
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
            form="new-rfi-form"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            Create RFI
          </button>
        </div>
      </div>
    </>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
        {label}
        {required && <span style={{ color: "#F97316" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
