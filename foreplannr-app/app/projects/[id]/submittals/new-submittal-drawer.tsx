"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { type SubmittalInput } from "@/lib/submittals";

interface Props {
  open: boolean;
  nextNumber: string;
  projectId: string;
  onClose: () => void;
  onSubmit: (input: SubmittalInput) => void;
}

export function NewSubmittalDrawer({ open, nextNumber, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    specSection: "",
    description: "",
    submittedBy: "",
    reviewerName: "",
    submissionDate: "",
    reviewDueDate: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.specSection.trim() && !form.description.trim()) return;
    onSubmit({
      specSection: form.specSection.trim(),
      description: form.description.trim(),
      submittedBy: form.submittedBy.trim(),
      reviewerName: form.reviewerName.trim(),
      submissionDate: form.submissionDate,
      reviewDueDate: form.reviewDueDate,
    });
    setForm({ specSection: "", description: "", submittedBy: "", reviewerName: "", submissionDate: "", reviewDueDate: "" });
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
            <div className="flex items-center gap-2.5 mb-1">
              <span
                className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded font-mono"
                style={{ background: "#EFF6FF", color: "#1D4ED8" }}
              >
                SUB-{nextNumber}
              </span>
            </div>
            <h2
              className="font-display font-700 text-[17px] tracking-[-0.02em]"
              style={{ color: "#1C1917" }}
            >
              New Submittal
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
          id="new-submittal-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5"
        >
          <FormField label="Spec Section" required>
            <input
              type="text"
              value={form.specSection}
              onChange={(e) => set("specSection", e.target.value)}
              placeholder="e.g. 03 30 00 – Cast-In-Place Concrete"
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          <FormField label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Concrete Mix Design – Elevated Slab (4,000 psi)"
              rows={3}
              required
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Submitted By">
              <input
                type="text"
                value={form.submittedBy}
                onChange={(e) => set("submittedBy", e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
            <FormField label="Reviewer Name">
              <input
                type="text"
                value={form.reviewerName}
                onChange={(e) => set("reviewerName", e.target.value)}
                placeholder="e.g. EOR – Patel Structural"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Submission Date">
              <input
                type="date"
                value={form.submissionDate}
                onChange={(e) => set("submissionDate", e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
            <FormField label="Review Due Date">
              <input
                type="date"
                value={form.reviewDueDate}
                onChange={(e) => set("reviewDueDate", e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormField>
          </div>

          {/* Status hint */}
          <div
            className="rounded-lg px-4 py-3 text-[13px]"
            style={{ background: "#F5F5F4", color: "#78716C" }}
          >
            Status will be set to{" "}
            <strong style={{ color: "#1C1917" }}>
              {form.submissionDate ? "Submitted" : "Pending Submission"}
            </strong>{" "}
            based on whether a submission date is provided.
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
            form="new-submittal-form"
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
            Create Submittal
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
        {required && <span style={{ color: "#F97316" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
