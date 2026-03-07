"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchHandoff,
  saveHandoff,
  type HandoffData,
  type Milestone,
  type Permit,
  type PermitStatus,
} from "@/lib/handoff";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  Calendar,
  MapPin,
  ShieldCheck,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { generateKickoffPDF } from "@/lib/generate-kickoff-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function fmtDate(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: "Scope Review",
    short: "Scope",
    icon: ClipboardList,
    description: "Review the full project scope, exclusions, and contract documents.",
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
  },
  {
    id: 2,
    label: "Drawings & Specs",
    short: "Drawings",
    icon: FileText,
    description: "Confirm the drawing set, revision date, and any known issues.",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
  },
  {
    id: 3,
    label: "Schedule & Milestones",
    short: "Schedule",
    icon: Calendar,
    description: "Lock in project dates and key milestone targets.",
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
  },
  {
    id: 4,
    label: "Permit Status",
    short: "Permits",
    icon: ShieldCheck,
    description: "Document all permits — numbers, dates, and current status.",
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
  },
  {
    id: 5,
    label: "Site Logistics",
    short: "Site",
    icon: MapPin,
    description: "Access, parking, staging, safety, and key on-site contacts.",
    iconBg: "#FDF4FF",
    iconColor: "#9333EA",
  },
];

const PERMIT_STATUSES: PermitStatus[] = ["Pending", "Issued", "Expired"];

const permitStatusStyle: Record<PermitStatus, { bg: string; color: string }> = {
  Pending: { bg: "#FEF9C3", color: "#A16207" },
  Issued:  { bg: "#DCFCE7", color: "#15803D" },
  Expired: { bg: "#FFE4E6", color: "#BE123C" },
};

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function HandoffSkeleton() {
  return (
    <div className="px-8 py-7 flex flex-col gap-6 max-w-4xl animate-pulse">
      <div className="bg-white rounded-2xl px-7 py-6 h-[100px]" style={{ border: "1px solid #E7E5E4" }} />
      <div className="bg-white rounded-2xl h-[480px]" style={{ border: "1px solid #E7E5E4" }} />
      <div className="flex justify-between">
        <div className="w-24 h-10 rounded-xl" style={{ background: "#F5F5F4" }} />
        <div className="w-32 h-10 rounded-xl" style={{ background: "#F5F5F4" }} />
      </div>
    </div>
  );
}

// ─── Shared field components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>
      {children}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-shadow duration-150"
        style={{ border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" }}
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
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-shadow duration-150 resize-none"
        style={{ border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" }}
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
  );
}

function FileUpload({
  label,
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip",
  hint = "PDF, DWG, XLS, DOC",
}: {
  label: string;
  value: string;
  onChange: (filename: string) => void;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#DCFCE7" }}>
            <FileText size={15} style={{ color: "#16A34A" }} />
          </div>
          <span className="flex-1 text-sm font-medium truncate" style={{ color: "#15803D" }}>{value}</span>
          <button
            onClick={() => onChange("")}
            className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors duration-150"
            style={{ background: "#FEE2E2", color: "#DC2626" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FECACA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer transition-all duration-150"
          style={{ border: "1.5px dashed #D6D3D1", background: "#FAFAF9" }}
          onClick={() => inputRef.current?.click()}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#F97316";
            (e.currentTarget as HTMLElement).style.background = "#FFF7ED";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#D6D3D1";
            (e.currentTarget as HTMLElement).style.background = "#FAFAF9";
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FFF7ED" }}>
            <UploadCloud size={20} style={{ color: "#F97316" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "#44403C" }}>Click to upload</p>
          <p className="text-[12px] mt-1" style={{ color: "#A8A29E" }}>{hint}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0].name); }}
      />
    </div>
  );
}

function MarkComplete({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200"
      style={{
        background: checked ? "#F0FDF4" : "#FAFAF9",
        border: `2px solid ${checked ? "#86EFAC" : "#E7E5E4"}`,
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          background: checked ? "#22C55E" : "white",
          border: `2px solid ${checked ? "#22C55E" : "#D6D3D1"}`,
        }}
      >
        {checked && <Check size={13} strokeWidth={3} color="white" />}
      </div>
      <span className="font-semibold text-[13px]" style={{ color: checked ? "#15803D" : "#78716C" }}>
        {label}
      </span>
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, idx) => {
        const done = completedSteps.has(step.id);
        const active = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStepClick(step.id)}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  background: done ? "#22C55E" : active ? "#F97316" : "white",
                  borderColor: done ? "#22C55E" : active ? "#F97316" : "#D6D3D1",
                  color: done || active ? "white" : "#A8A29E",
                  boxShadow: active ? "0 0 0 4px rgba(249,115,22,0.15)" : "none",
                  cursor: "pointer",
                }}
              >
                {done ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <span className="text-[13px] font-bold">{step.id}</span>
                )}
              </button>
              <p
                className="text-[11px] font-semibold mt-2 text-center leading-tight"
                style={{
                  color: done ? "#15803D" : active ? "#F97316" : "#A8A29E",
                  maxWidth: 58,
                }}
              >
                {step.short}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-[2px] mt-5 mx-2"
                style={{
                  background: done ? "#22C55E" : "#E7E5E4",
                  minWidth: 12,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step content components ──────────────────────────────────────────────────

type StepProps = { data: HandoffData; onChange: (u: Partial<HandoffData>) => void };

function Step1({ data, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <TextareaField
        label="Scope Summary"
        value={data.scopeSummary}
        onChange={(v) => onChange({ scopeSummary: v })}
        placeholder="Describe the full scope of work as outlined in the contract..."
        rows={5}
      />
      <TextareaField
        label="Key Exclusions / Clarifications"
        value={data.keyExclusions}
        onChange={(v) => onChange({ keyExclusions: v })}
        placeholder="List any items explicitly excluded from scope, or items needing clarification..."
        rows={4}
      />
      <FileUpload
        label="Contract Document"
        value={data.contractDocName}
        onChange={(v) => onChange({ contractDocName: v })}
        accept=".pdf,.doc,.docx"
        hint="PDF, DOC, DOCX"
      />
      <MarkComplete
        checked={data.scopeReviewed}
        onChange={(v) => onChange({ scopeReviewed: v })}
        label="I have reviewed the full contract scope"
      />
    </div>
  );
}

function Step2({ data, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <FileUpload
        label="Drawing Set and Spec Book"
        value={data.drawingSetName}
        onChange={(v) => onChange({ drawingSetName: v })}
        accept=".pdf,.dwg,.zip"
        hint="PDF, DWG, ZIP"
      />
      <InputField
        label="Drawing Revision / Date Confirmed"
        value={data.drawingRevision}
        onChange={(v) => onChange({ drawingRevision: v })}
        placeholder="e.g. Rev 3 — March 15, 2025"
      />
      <TextareaField
        label="Known Drawing Issues or RFIs to Flag"
        value={data.drawingIssues}
        onChange={(v) => onChange({ drawingIssues: v })}
        placeholder="List any conflicts, unclear details, or anticipated RFIs..."
        rows={4}
      />
      <MarkComplete
        checked={data.drawingsReviewed}
        onChange={(v) => onChange({ drawingsReviewed: v })}
        label="I have reviewed the drawing set"
      />
    </div>
  );
}

function Step3({ data, onChange }: StepProps) {
  function addMilestone() {
    onChange({ milestones: [...data.milestones, { id: uid(), name: "", date: "" }] });
  }
  function updateMilestone(id: string, updates: Partial<Milestone>) {
    onChange({ milestones: data.milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)) });
  }
  function removeMilestone(id: string) {
    onChange({ milestones: data.milestones.filter((m) => m.id !== id) });
  }

  return (
    <div className="flex flex-col gap-5">
      <FileUpload
        label="Project Schedule"
        value={data.scheduleFileName}
        onChange={(v) => onChange({ scheduleFileName: v })}
        accept=".pdf,.mpp,.xls,.xlsx"
        hint="PDF, MPP, XLS, P6"
      />

      <div className="grid grid-cols-3 gap-4">
        <InputField label="Project Start" value={data.projectStart} onChange={(v) => onChange({ projectStart: v })} type="date" />
        <InputField label="Substantial Completion" value={data.substantialCompletion} onChange={(v) => onChange({ substantialCompletion: v })} type="date" />
        <InputField label="Final Completion" value={data.finalCompletion} onChange={(v) => onChange({ finalCompletion: v })} type="date" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Key Milestones</Label>
          <button
            onClick={addMilestone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150"
            style={{ background: "#FFF7ED", color: "#F97316", border: "1px solid #FDBA74" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFEDD5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF7ED"; }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Milestone
          </button>
        </div>

        {data.milestones.length === 0 ? (
          <div
            className="flex items-center justify-center py-8 rounded-xl text-center"
            style={{ border: "1.5px dashed #E7E5E4", background: "#FAFAF9" }}
          >
            <p className="text-sm font-medium" style={{ color: "#A8A29E" }}>
              No milestones yet — add key dates like concrete pour, MEP rough-in, inspections.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.milestones.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                onUpdate={(updates) => updateMilestone(m.id, updates)}
                onRemove={() => removeMilestone(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MarkComplete
        checked={data.scheduleConfirmed}
        onChange={(v) => onChange({ scheduleConfirmed: v })}
        label="I have confirmed the project schedule"
      />
    </div>
  );
}

function MilestoneRow({
  milestone,
  onUpdate,
  onRemove,
}: {
  milestone: Milestone;
  onUpdate: (u: Partial<Milestone>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}
    >
      <input
        type="text"
        value={milestone.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Milestone name"
        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-shadow duration-150"
        style={{ border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <input
        type="date"
        value={milestone.date}
        onChange={(e) => onUpdate({ date: e.target.value })}
        className="px-3 py-2 rounded-lg text-sm outline-none transition-shadow duration-150"
        style={{ border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917", width: 164 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
        style={{ background: "#FEE2E2", color: "#DC2626" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FECACA"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Step4({ data, onChange }: StepProps) {
  function addPermit() {
    onChange({
      permits: [...data.permits, { id: uid(), type: "", number: "", issueDate: "", expDate: "", status: "Pending" }],
    });
  }
  function updatePermit(id: string, updates: Partial<Permit>) {
    onChange({ permits: data.permits.map((p) => (p.id === id ? { ...p, ...updates } : p)) });
  }
  function removePermit(id: string) {
    onChange({ permits: data.permits.filter((p) => p.id !== id) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Permits</Label>
          <button
            onClick={addPermit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150"
            style={{ background: "#FFF7ED", color: "#F97316", border: "1px solid #FDBA74" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFEDD5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF7ED"; }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Permit
          </button>
        </div>

        {data.permits.length === 0 ? (
          <div className="flex items-center justify-center py-8 rounded-xl" style={{ border: "1.5px dashed #E7E5E4", background: "#FAFAF9" }}>
            <p className="text-sm font-medium" style={{ color: "#A8A29E" }}>
              No permits added — click Add Permit to document each required permit.
            </p>
          </div>
        ) : (
          <div>
            <div
              className="grid items-center px-3 py-2 mb-1 rounded-lg"
              style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 96px 36px", gap: "8px", background: "#F5F5F4" }}
            >
              {["Permit Type", "Number", "Issue Date", "Exp. Date", "Status", ""].map((h) => (
                <span key={h} className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>{h}</span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {data.permits.map((permit) => (
                <PermitRow
                  key={permit.id}
                  permit={permit}
                  onUpdate={(updates) => updatePermit(permit.id, updates)}
                  onRemove={() => removePermit(permit.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <TextareaField
        label="Permit Notes"
        value={data.permitNotes}
        onChange={(v) => onChange({ permitNotes: v })}
        placeholder="Notes about pending applications, upcoming expirations, or outstanding inspections..."
        rows={3}
      />
      <MarkComplete
        checked={data.permitsConfirmed}
        onChange={(v) => onChange({ permitsConfirmed: v })}
        label="I have confirmed current permit status"
      />
    </div>
  );
}

function PermitRow({
  permit,
  onUpdate,
  onRemove,
}: {
  permit: Permit;
  onUpdate: (u: Partial<Permit>) => void;
  onRemove: () => void;
}) {
  const inlineInput = "px-2.5 py-2 rounded-lg text-[13px] w-full outline-none transition-shadow duration-150";
  const inlineStyle = { border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#F97316";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#E7E5E4";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="grid items-center p-3 rounded-xl"
      style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 96px 36px", gap: "8px", background: "#FAFAF9", border: "1px solid #E7E5E4" }}
    >
      <input type="text" value={permit.type} onChange={(e) => onUpdate({ type: e.target.value })} placeholder="Building, Electrical…" className={inlineInput} style={inlineStyle} onFocus={onFocus} onBlur={onBlur} />
      <input type="text" value={permit.number} onChange={(e) => onUpdate({ number: e.target.value })} placeholder="BLD-2025-001" className={inlineInput} style={inlineStyle} onFocus={onFocus} onBlur={onBlur} />
      <input type="date" value={permit.issueDate} onChange={(e) => onUpdate({ issueDate: e.target.value })} className={inlineInput} style={inlineStyle} onFocus={onFocus} onBlur={onBlur} />
      <input type="date" value={permit.expDate} onChange={(e) => onUpdate({ expDate: e.target.value })} className={inlineInput} style={inlineStyle} onFocus={onFocus} onBlur={onBlur} />
      <select
        value={permit.status}
        onChange={(e) => onUpdate({ status: e.target.value as PermitStatus })}
        className="px-2 py-2 rounded-lg text-[12px] font-semibold outline-none w-full cursor-pointer"
        style={{ background: permitStatusStyle[permit.status].bg, color: permitStatusStyle[permit.status].color, border: "1.5px solid transparent" }}
      >
        {PERMIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
        style={{ background: "#FEE2E2", color: "#DC2626" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FECACA"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function Step5({ data, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Site Access Instructions" value={data.siteAccess} onChange={(v) => onChange({ siteAccess: v })} placeholder="Gate code, key box location, entry hours…" />
        <InputField label="Parking" value={data.parking} onChange={(v) => onChange({ parking: v })} placeholder="Designated lot, street parking, visitor spots…" />
      </div>
      <InputField label="Staging Area" value={data.stagingArea} onChange={(v) => onChange({ stagingArea: v })} placeholder="Laydown yard location, material staging zone…" />
      <TextareaField label="Safety Requirements" value={data.safetyRequirements} onChange={(v) => onChange({ safetyRequirements: v })} placeholder="Required PPE, site-specific safety protocols, emergency procedures, sign-in process…" rows={4} />
      <TextareaField label="Key On-Site Contacts" value={data.keyContacts} onChange={(v) => onChange({ keyContacts: v })} placeholder="Owner's rep, security, superintendent, GC foreman, utility contacts…" rows={4} />
      <MarkComplete
        checked={data.siteReviewed}
        onChange={(v) => onChange({ siteReviewed: v })}
        label="I have reviewed site logistics"
      />
    </div>
  );
}

// ─── Celebration screen ────────────────────────────────────────────────────────

function SummaryCard({
  stepNum,
  label,
  items,
  colSpan2,
}: {
  stepNum: number;
  label: string;
  items: { label: string; value: string }[];
  colSpan2?: boolean;
}) {
  const palette = [
    { iconBg: "#FFEDD5", iconText: "#C2410C" },
    { iconBg: "#DBEAFE", iconText: "#1D4ED8" },
    { iconBg: "#DCFCE7", iconText: "#15803D" },
    { iconBg: "#FEF3C7", iconText: "#92400E" },
    { iconBg: "#F3E8FF", iconText: "#7E22CE" },
  ];
  const pal = palette[(stepNum - 1) % palette.length];

  return (
    <div
      className={`p-5 rounded-2xl${colSpan2 ? " col-span-2" : ""}`}
      style={{ background: "white", border: "1.5px solid #E7E5E4", boxShadow: "0 1px 4px rgba(28,25,23,0.05)" }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: pal.iconBg, color: pal.iconText }}>
          {stepNum}
        </div>
        <span className="text-[13px] font-bold" style={{ color: "#1C1917" }}>{label}</span>
        <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
      </div>
      {items.length === 0 ? (
        <p className="text-[13px]" style={{ color: "#A8A29E" }}>No details provided</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#A8A29E" }}>{item.label}</p>
              <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#44403C" }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CelebrationScreen({
  data,
  project,
  onGoToProject,
}: {
  data: HandoffData;
  project: Project;
  onGoToProject: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      let logoDataUrl: string | undefined;
      try {
        const resp = await fetch("/logo.png");
        const blob = await resp.blob();
        logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* skip logo */ }
      generateKickoffPDF(project, data, undefined, logoDataUrl);
    } finally {
      setDownloading(false);
    }
  }

  const [confetti] = useState(() =>
    Array.from({ length: 65 }, (_, i) => {
      const colors = ["#F97316", "#22C55E", "#EAB308", "#3B82F6", "#EC4899", "#8B5CF6", "#14B8A6", "#F43F5E"];
      return {
        id: i,
        color: colors[i % colors.length],
        left: Math.random() * 100,
        delay: Math.random() * 3.5,
        duration: 3 + Math.random() * 2,
        size: 5 + Math.random() * 9,
        isRect: Math.random() > 0.45,
        rotate: Math.random() * 360,
      };
    })
  );

  const completedDate = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  const summaryItems1 = [
    data.scopeSummary ? { label: "Scope", value: data.scopeSummary.slice(0, 100) + (data.scopeSummary.length > 100 ? "…" : "") } : null,
    data.contractDocName ? { label: "Contract doc", value: data.contractDocName } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const summaryItems2 = [
    data.drawingSetName ? { label: "Drawing set", value: data.drawingSetName } : null,
    data.drawingRevision ? { label: "Revision", value: data.drawingRevision } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const summaryItems3 = [
    data.projectStart ? { label: "Start date", value: fmtDate(data.projectStart) } : null,
    data.substantialCompletion ? { label: "Substantial completion", value: fmtDate(data.substantialCompletion) } : null,
    data.milestones.length > 0 ? { label: "Milestones", value: `${data.milestones.length} milestone${data.milestones.length !== 1 ? "s" : ""} added` } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const issued = data.permits.filter((p) => p.status === "Issued").length;
  const pending = data.permits.filter((p) => p.status === "Pending").length;
  const summaryItems4 = [
    data.permits.length > 0 ? { label: "Total permits", value: `${data.permits.length} on record` } : null,
    issued > 0 ? { label: "Issued", value: `${issued}` } : null,
    pending > 0 ? { label: "Pending", value: `${pending}` } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const summaryItems5 = [
    data.siteAccess ? { label: "Site access", value: data.siteAccess.slice(0, 70) + (data.siteAccess.length > 70 ? "…" : "") } : null,
    data.parking ? { label: "Parking", value: data.parking } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#FAFAF9" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: -16,
              width: p.isRect ? p.size * 0.6 : p.size,
              height: p.isRect ? p.size * 1.6 : p.size,
              background: p.color,
              borderRadius: p.isRect ? 2 : "50%",
              opacity: 0.88,
              transform: `rotate(${p.rotate}deg)`,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(250,250,249,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <Check size={16} strokeWidth={3} style={{ color: "#16A34A" }} />
          </div>
          <div>
            <p className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>{project.name}</p>
            <p className="text-[15px] font-bold" style={{ color: "#1C1917" }}>Kickoff Complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150"
            style={{ background: "#FFF7ED", color: "#F97316", border: "1.5px solid #FDBA74", opacity: downloading ? 0.75 : 1 }}
            onMouseEnter={(e) => { if (!downloading) (e.currentTarget as HTMLElement).style.background = "#FFEDD5"; }}
            onMouseLeave={(e) => { if (!downloading) (e.currentTarget as HTMLElement).style.background = "#FFF7ED"; }}
          >
            <Download size={14} />
            {downloading ? "Generating…" : "Download Report"}
          </button>
          <button
            onClick={onGoToProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-150"
            style={{ background: "#F5F5F4", color: "#44403C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
          >
            <ArrowLeft size={14} />
            Project Overview
          </button>
        </div>
      </header>

      <div
        className="relative z-10 flex flex-col items-center py-16 px-8"
        style={{ animation: "celebration-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", boxShadow: "0 8px 40px rgba(34,197,94,0.45), 0 0 0 8px rgba(34,197,94,0.12)" }}
        >
          <Check size={44} strokeWidth={3} color="white" />
        </div>

        <h1 className="font-display font-800 text-[38px] tracking-[-0.04em] text-center mb-2" style={{ color: "#1C1917" }}>
          Kickoff Complete!
        </h1>
        <p className="text-[18px] text-center mb-1" style={{ color: "#57534E" }}>You&apos;re ready to build.</p>
        <p className="text-[13px] mb-12" style={{ color: "#A8A29E" }}>Completed on {completedDate}</p>

        <div className="w-full max-w-3xl grid grid-cols-2 gap-4 mb-10">
          <SummaryCard stepNum={1} label="Scope Review" items={summaryItems1} />
          <SummaryCard stepNum={2} label="Drawings & Specs" items={summaryItems2} />
          <SummaryCard stepNum={3} label="Schedule & Milestones" items={summaryItems3} />
          <SummaryCard stepNum={4} label="Permit Status" items={summaryItems4} />
          <SummaryCard stepNum={5} label="Site Logistics" items={summaryItems5} colSpan2 />
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-150 active:scale-[0.97]"
            style={{
              background: downloading ? "#FFEDD5" : "linear-gradient(135deg, #F97316, #EA580C)",
              color: downloading ? "#EA580C" : "white",
              boxShadow: downloading ? "none" : "0 4px 20px rgba(249,115,22,0.4)",
              cursor: downloading ? "wait" : "pointer",
              border: downloading ? "2px solid #FDBA74" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(249,115,22,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!downloading) {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.4)";
              }
            }}
          >
            <Download size={18} />
            {downloading ? "Generating PDF…" : "Download Kickoff Report"}
          </button>

          <button
            onClick={onGoToProject}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
            style={{ background: "#F5F5F4", color: "#44403C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
          >
            <ExternalLink size={15} />
            Go to Project Overview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HandoffPage() {
  const { id } = useParams();
  const router = useRouter();
  const projectId = id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [data, setData] = useState<HandoffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: projData, error }, handoffData] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        fetchHandoff(projectId, supabase),
      ]);
      if (projData && !error) setProject(rowToProject(projData as DbProjectRow));
      else { router.push("/dashboard"); return; }
      setData(handoffData);
      setLoading(false);
    }
    load();
  }, [projectId, router]);

  // Debounced auto-save to Supabase
  const persistData = useCallback((next: HandoffData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const supabase = createClient();
      await saveHandoff(projectId, next, supabase);
      setSaving(false);
    }, 800);
  }, [projectId]);

  function update(updates: Partial<HandoffData>) {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      persistData(next);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar project={project ? { id: project.id, name: project.name } : undefined} />
        <main className="flex-1 ml-[260px] min-h-screen">
          <header
            className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4"
            style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
          >
            <div className="w-8 h-8 rounded-lg" style={{ background: "#F5F5F4" }} />
            <div className="flex flex-col gap-1.5">
              <div className="w-32 h-3 rounded-full animate-pulse" style={{ background: "#E7E5E4" }} />
              <div className="w-48 h-5 rounded-full animate-pulse" style={{ background: "#E7E5E4" }} />
            </div>
          </header>
          <HandoffSkeleton />
        </main>
      </div>
    );
  }

  if (!project || !data) return null;

  const stepIsComplete = (s: number): boolean => {
    switch (s) {
      case 1: return data.scopeReviewed;
      case 2: return data.drawingsReviewed;
      case 3: return data.scheduleConfirmed;
      case 4: return data.permitsConfirmed;
      case 5: return data.siteReviewed;
      default: return false;
    }
  };

  const completedSteps = new Set([1, 2, 3, 4, 5].filter(stepIsComplete));
  const allComplete = completedSteps.size === 5;

  if (data.completedAt) {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar project={{ id: project.id, name: project.name }} />
        <main className="flex-1 ml-[260px] min-h-screen overflow-auto">
          <CelebrationScreen
            data={data}
            project={project}
            onGoToProject={() => router.push(`/projects/${project.id}`)}
          />
        </main>
      </div>
    );
  }

  const step = STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const remainingCount = 5 - completedSteps.size;

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar project={{ id: project.id, name: project.name }} />

      <main className="flex-1 ml-[260px] min-h-screen">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
              style={{ background: "#F5F5F4", color: "#78716C" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>{project.name}</p>
              <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>
                Kickoff Handoff
              </h1>
            </div>
          </div>
          {saving && (
            <span className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>Saving…</span>
          )}
        </header>

        <div className="px-8 py-7 flex flex-col gap-6 max-w-4xl">
          <div className="bg-white rounded-2xl px-7 py-6" style={{ border: "1px solid #E7E5E4", boxShadow: "0 1px 4px rgba(28,25,23,0.05)" }}>
            <ProgressBar currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />
          </div>

          <div
            key={currentStep}
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: "1px solid #E7E5E4",
              borderLeft: `4px solid ${step.iconColor}`,
              boxShadow: "0 1px 8px rgba(28,25,23,0.06)",
              animation: "step-in 0.22s ease-out both",
            }}
          >
            <div className="px-7 py-5 flex items-start gap-4" style={{ borderBottom: "1px solid #F5F5F4" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.iconBg }}>
                <StepIcon size={21} style={{ color: step.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
                  <span className="text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: "#A8A29E" }}>
                    Step {currentStep} of 5
                  </span>
                  {completedSteps.has(currentStep) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#DCFCE7", color: "#15803D" }}>
                      <Check size={10} strokeWidth={3} />
                      Complete
                    </span>
                  )}
                </div>
                <h2 className="font-display font-700 text-[20px] tracking-[-0.025em]" style={{ color: "#1C1917" }}>{step.label}</h2>
                <p className="text-[13px] mt-0.5" style={{ color: "#78716C" }}>{step.description}</p>
              </div>
            </div>

            <div className="px-7 py-6">
              {currentStep === 1 && <Step1 data={data} onChange={update} />}
              {currentStep === 2 && <Step2 data={data} onChange={update} />}
              {currentStep === 3 && <Step3 data={data} onChange={update} />}
              {currentStep === 4 && <Step4 data={data} onChange={update} />}
              {currentStep === 5 && <Step5 data={data} onChange={update} />}
            </div>
          </div>

          <div className="flex items-center justify-between pb-8">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150"
              style={{
                background: "white",
                color: currentStep === 1 ? "#D6D3D1" : "#44403C",
                border: `1.5px solid ${currentStep === 1 ? "#F5F5F4" : "#E7E5E4"}`,
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 2px 8px rgba(249,115,22,0.35)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                }}
              >
                Next Step
                <ArrowRight size={14} />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                {!allComplete && (
                  <p className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>
                    {remainingCount} step{remainingCount !== 1 ? "s" : ""} still need{remainingCount === 1 ? "s" : ""} to be marked complete
                  </p>
                )}
                <button
                  onClick={async () => {
                    if (allComplete) {
                      const completedAt = new Date().toISOString();
                      const next = { ...data, completedAt };
                      setData(next);
                      const supabase = createClient();
                      await saveHandoff(projectId, next, supabase);
                    }
                  }}
                  disabled={!allComplete}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: allComplete ? "linear-gradient(135deg, #22C55E, #16A34A)" : "#E7E5E4",
                    color: allComplete ? "white" : "#A8A29E",
                    boxShadow: allComplete ? "0 2px 8px rgba(34,197,94,0.35)" : "none",
                    cursor: allComplete ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (allComplete) {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(34,197,94,0.45)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (allComplete) {
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(34,197,94,0.35)";
                    }
                  }}
                >
                  <CheckCircle2 size={15} />
                  Complete Kickoff
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes step-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1;   }
          80%  { opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0;   }
        }
        @keyframes celebration-in {
          0%   { opacity: 0; transform: scale(0.94) translateY(16px); }
          60%  { transform: scale(1.02) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
