"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchOrCreateTurnover,
  fetchContacts,
  fetchSteps,
  seedContacts,
  seedSteps,
  saveTurnoverMeeting,
  upsertContact,
  deleteContact,
  upsertStep,
  deleteStep,
  completeTurnover,
  type TurnoverMeeting,
  type TurnoverContact,
  type TurnoverStep,
} from "@/lib/turnover";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Phone,
  Mail,
  User,
  MapPin,
  Package,
  ShieldCheck,
  ClipboardList,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Loader2,
  Download,
} from "lucide-react";
import { generateTurnoverPDF } from "@/lib/generate-turnover-pdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clientId(): string {
  return crypto.randomUUID();
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  number,
  title,
  icon: Icon,
  iconColor,
  iconBg,
  children,
  defaultOpen = true,
}: {
  number: number;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-card overflow-hidden"
      style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-5 transition-colors duration-150 text-left"
        style={{ borderBottom: open ? "1px solid #F5F5F4" : "none" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ background: iconBg, color: iconColor }}
        >
          {number}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <span className="font-display font-700 text-[15px] tracking-[-0.01em] flex-1" style={{ color: "#1C1917" }}>
          {title}
        </span>
        {open ? <ChevronUp size={16} style={{ color: "#A8A29E" }} /> : <ChevronDown size={16} style={{ color: "#A8A29E" }} />}
      </button>
      {open && <div className="px-6 py-6">{children}</div>}
    </div>
  );
}

// ─── Textarea field ───────────────────────────────────────────────────────────

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#44403C" }}>
        {Icon && <Icon size={13} style={{ color: "#A8A29E" }} />}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150 resize-none"
        style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917", lineHeight: "1.6" }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#F97316";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E7E5E4";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={13} style={{ color: "#C7C3C0" }} />
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg py-2 text-sm outline-none transition-all duration-150"
        style={{
          border: "1.5px solid #E7E5E4",
          background: "#FAFAF9",
          color: "#1C1917",
          paddingLeft: Icon ? "2rem" : "0.75rem",
          paddingRight: "0.75rem",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#F97316";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E7E5E4";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  onChange,
  onDelete,
  canDelete,
}: {
  contact: TurnoverContact;
  onChange: (updated: TurnoverContact) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div
      className="grid gap-2 p-4 rounded-xl"
      style={{ background: "#FAFAF9", border: "1px solid #F0EFEE" }}
    >
      {/* Role + delete */}
      <div className="flex items-center gap-2">
        <InputField
          value={contact.role}
          onChange={(v) => onChange({ ...contact, role: v })}
          placeholder="Role (e.g. Foreman)"
          icon={User}
        />
        {canDelete && (
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{ color: "#C7C3C0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FFF1F2";
              (e.currentTarget as HTMLElement).style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#C7C3C0";
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {/* Name */}
      <InputField
        value={contact.name}
        onChange={(v) => onChange({ ...contact, name: v })}
        placeholder="Full name"
        icon={User}
      />
      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-2">
        <InputField
          value={contact.phone}
          onChange={(v) => onChange({ ...contact, phone: v })}
          placeholder="Phone number"
          icon={Phone}
        />
        <InputField
          value={contact.email}
          onChange={(v) => onChange({ ...contact, email: v })}
          placeholder="Email address"
          icon={Mail}
        />
      </div>
    </div>
  );
}

// ─── Step row ─────────────────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  onChange,
  onDelete,
}: {
  step: TurnoverStep;
  index: number;
  onChange: (updated: TurnoverStep) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = step.status === "done";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-150"
      style={{
        border: isDone ? "1px solid #BBFBD0" : "1px solid #E7E5E4",
        background: isDone ? "#F0FDF4" : "#fff",
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Status toggle */}
        <button
          onClick={() => onChange({ ...step, status: isDone ? "todo" : "done" })}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150"
          style={{
            borderColor: isDone ? "#22C55E" : "#D4D0CB",
            background: isDone ? "#22C55E" : "transparent",
          }}
        >
          {isDone && <Check size={11} strokeWidth={3} style={{ color: "#fff" }} />}
        </button>

        {/* Step number + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span
              className="text-[11px] font-bold mt-0.5 flex-shrink-0"
              style={{ color: isDone ? "#86EFAC" : "#C7C3C0" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              {/* If it's a custom step (sort_order >= 8), make title editable */}
              {step.sortOrder >= 8 ? (
                <input
                  value={step.title}
                  onChange={(e) => onChange({ ...step, title: e.target.value })}
                  placeholder="Step description…"
                  className="w-full text-sm font-medium bg-transparent outline-none"
                  style={{
                    color: isDone ? "#15803D" : "#1C1917",
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                />
              ) : (
                <p
                  className="text-sm font-medium"
                  style={{
                    color: isDone ? "#15803D" : "#1C1917",
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {step.title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="date"
            value={step.dueDate}
            onChange={(e) => onChange({ ...step, dueDate: e.target.value })}
            className="text-[12px] rounded-lg px-2 py-1 outline-none transition-all duration-150"
            style={{
              border: "1.5px solid #E7E5E4",
              background: "#FAFAF9",
              color: step.dueDate ? "#44403C" : "#C7C3C0",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; }}
          />
          <button
            onClick={() => setExpanded((x) => !x)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: "#A8A29E" }}
            title="Add notes"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <FileText size={13} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: "#C7C3C0" }}
            title="Remove step"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FFF1F2";
              (e.currentTarget as HTMLElement).style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#C7C3C0";
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Notes expansion */}
      {expanded && (
        <div className="px-4 pb-4">
          <textarea
            value={step.notes}
            onChange={(e) => onChange({ ...step, notes: e.target.value })}
            placeholder="Add notes for this step…"
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all duration-150"
            style={{
              border: "1.5px solid #E7E5E4",
              background: isDone ? "#fff" : "#FAFAF9",
              color: "#44403C",
              lineHeight: "1.6",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F97316";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E7E5E4";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({
  meeting,
  contacts,
  steps,
  pmName,
  onBack,
}: {
  meeting: TurnoverMeeting;
  contacts: TurnoverContact[];
  steps: TurnoverStep[];
  pmName: string;
  onBack: () => void;
}) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const filledContacts = contacts.filter((c) => c.name.trim());

  return (
    <div className="px-8 py-8 flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center"
        style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          border: "1.5px solid #BBFBD0",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "#22C55E", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}
        >
          <CheckCircle2 size={30} style={{ color: "#fff" }} strokeWidth={2.5} />
        </div>
        <h2 className="font-display font-800 text-[24px] tracking-[-0.03em] mb-1" style={{ color: "#15803D" }}>
          Turnover Complete
        </h2>
        <p className="text-[14px]" style={{ color: "#16A34A" }}>
          Completed by {pmName} on {meeting.completedAt ? fmtDateTime(meeting.completedAt) : "—"}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Contacts", value: filledContacts.length, color: "#0EA5E9", bg: "#F0F9FF" },
          { label: "Steps Done", value: `${doneCount}/${steps.length}`, color: "#F97316", bg: "#FFF7ED" },
          { label: "Sections", value: 4, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ background: bg, border: `1px solid ${color}20` }}
          >
            <div className="font-display font-800 text-[22px]" style={{ color }}>{value}</div>
            <div className="text-[12px] font-medium mt-0.5" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Contacts summary */}
      {filledContacts.length > 0 && (
        <div
          className="rounded-card p-5"
          style={{ background: "#fff", border: "1px solid #E7E5E4" }}
        >
          <h3 className="font-display font-700 text-[14px] mb-4" style={{ color: "#1C1917" }}>Job Contacts</h3>
          <div className="flex flex-col gap-3">
            {filledContacts.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F0F9FF" }}
                >
                  <User size={14} style={{ color: "#0EA5E9" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: "#1C1917" }}>
                    {c.name} <span className="font-normal" style={{ color: "#A8A29E" }}>— {c.role}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.phone && <span className="text-[12px]" style={{ color: "#78716C" }}>{c.phone}</span>}
                    {c.email && <span className="text-[12px]" style={{ color: "#78716C" }}>{c.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope summary */}
      {(meeting.scopeOfWork || meeting.keyExclusions) && (
        <div className="rounded-card p-5" style={{ background: "#fff", border: "1px solid #E7E5E4" }}>
          <h3 className="font-display font-700 text-[14px] mb-4" style={{ color: "#1C1917" }}>Project Details</h3>
          <div className="flex flex-col gap-3">
            {meeting.scopeOfWork && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: "#A8A29E" }}>Confirmed Scope</div>
                <p className="text-sm" style={{ color: "#44403C", lineHeight: "1.6" }}>{meeting.scopeOfWork}</p>
              </div>
            )}
            {meeting.keyExclusions && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: "#A8A29E" }}>Key Exclusions</div>
                <p className="text-sm" style={{ color: "#44403C", lineHeight: "1.6" }}>{meeting.keyExclusions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PM steps summary */}
      <div className="rounded-card p-5" style={{ background: "#fff", border: "1px solid #E7E5E4" }}>
        <h3 className="font-display font-700 text-[14px] mb-4" style={{ color: "#1C1917" }}>PM Checklist</h3>
        <div className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: s.status === "done" ? "#22C55E" : "#F5F5F4" }}
              >
                {s.status === "done" ? (
                  <Check size={10} strokeWidth={3} style={{ color: "#fff" }} />
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: "#A8A29E" }}>{i + 1}</span>
                )}
              </div>
              <span
                className="text-[13px] font-medium"
                style={{
                  color: s.status === "done" ? "#15803D" : "#44403C",
                  textDecoration: s.status === "done" ? "line-through" : "none",
                }}
              >
                {s.title}
              </span>
              {s.dueDate && (
                <span className="text-[11px] ml-auto flex-shrink-0" style={{ color: "#A8A29E" }}>
                  Due {new Date(s.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
        style={{ background: "#F5F5F4", color: "#44403C" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
      >
        <ArrowLeft size={15} />
        Back to Project Overview
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TurnoverPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<TurnoverMeeting | null>(null);
  const [contacts, setContacts] = useState<TurnoverContact[]>([]);
  const [steps, setSteps] = useState<TurnoverStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pmName, setPmName] = useState("");
  const [userId, setUserId] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);

  // Debounce timer ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{
    meeting: TurnoverMeeting;
    contacts: TurnoverContact[];
    steps: TurnoverStep[];
  } | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: projData }, { data: { user: authUser } }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.auth.getUser(),
      ]);

      if (!projData || !authUser) { router.push("/dashboard"); return; }

      setProject(rowToProject(projData as DbProjectRow));
      setUserId(authUser.id);
      const name =
        authUser.user_metadata?.full_name ??
        authUser.email?.split("@")[0] ??
        "PM";
      setPmName(name);

      // Fetch/create turnover meeting
      const tmtg = await fetchOrCreateTurnover(id, supabase);
      setMeeting(tmtg);

      // If already complete, show completion screen
      if (tmtg.completedAt) {
        const [c, s] = await Promise.all([
          fetchContacts(tmtg.id, supabase),
          fetchSteps(tmtg.id, supabase),
        ]);
        setContacts(c);
        setSteps(s);
        setShowCompletion(true);
        setLoading(false);
        return;
      }

      // Fetch or seed contacts
      let c = await fetchContacts(tmtg.id, supabase);
      if (c.length === 0) c = await seedContacts(tmtg.id, supabase);

      // Fetch or seed steps
      let s = await fetchSteps(tmtg.id, supabase);
      if (s.length === 0) s = await seedSteps(tmtg.id, supabase);

      setContacts(c);
      setSteps(s);
      setLoading(false);
    }

    load();
  }, [id, router]);

  // ── Auto-save (debounced 1.5s) ────────────────────────────────────────────────

  const triggerSave = useCallback(
    (m: TurnoverMeeting, c: TurnoverContact[], s: TurnoverStep[]) => {
      pendingSave.current = { meeting: m, contacts: c, steps: s };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const snap = pendingSave.current;
        if (!snap) return;
        setSaving(true);
        const supabase = createClient();
        await saveTurnoverMeeting(snap.meeting, supabase);
        await Promise.all(snap.contacts.map((ct) => upsertContact(ct, supabase)));
        await Promise.all(snap.steps.map((st) => upsertStep(st, supabase)));
        setSaving(false);
        pendingSave.current = null;
      }, 1500);
    },
    []
  );

  // ── Meeting field update ──────────────────────────────────────────────────────

  function updateMeeting(patch: Partial<TurnoverMeeting>) {
    if (!meeting) return;
    const updated = { ...meeting, ...patch };
    setMeeting(updated);
    triggerSave(updated, contacts, steps);
  }

  // ── Contact handlers ──────────────────────────────────────────────────────────

  function updateContact(updated: TurnoverContact) {
    const next = contacts.map((c) => (c.id === updated.id ? updated : c));
    setContacts(next);
    if (meeting) triggerSave(meeting, next, steps);
  }

  async function removeContact(contactId: string) {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    const supabase = createClient();
    await deleteContact(contactId, supabase);
  }

  async function addContact() {
    if (!meeting) return;
    const newContact: TurnoverContact = {
      id: clientId(),
      turnoverId: meeting.id,
      role: "",
      name: "",
      phone: "",
      email: "",
      sortOrder: contacts.length,
    };
    const supabase = createClient();
    await upsertContact(newContact, supabase);
    setContacts((prev) => [...prev, newContact]);
  }

  // ── Step handlers ─────────────────────────────────────────────────────────────

  function updateStep(updated: TurnoverStep) {
    const next = steps.map((s) => (s.id === updated.id ? updated : s));
    setSteps(next);
    if (meeting) triggerSave(meeting, contacts, next);
  }

  async function removeStep(stepId: string) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    const supabase = createClient();
    await deleteStep(stepId, supabase);
  }

  async function addStep() {
    if (!meeting) return;
    const newStep: TurnoverStep = {
      id: clientId(),
      turnoverId: meeting.id,
      title: "",
      status: "todo",
      dueDate: "",
      notes: "",
      sortOrder: steps.length,
    };
    const supabase = createClient();
    await upsertStep(newStep, supabase);
    setSteps((prev) => [...prev, newStep]);
  }

  // ── PDF handler ───────────────────────────────────────────────────────────────

  async function handleGeneratePDF() {
    if (!project || !meeting) return;
    setGeneratingPDF(true);
    try {
      await generateTurnoverPDF(project, meeting, contacts, steps, pmName);
    } finally {
      setGeneratingPDF(false);
    }
  }

  // ── Complete handler ──────────────────────────────────────────────────────────

  async function handleComplete() {
    if (!meeting) return;
    setCompleting(true);
    const supabase = createClient();

    // Flush any pending saves first
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveTurnoverMeeting(meeting, supabase);
    await Promise.all(contacts.map((c) => upsertContact(c, supabase)));
    await Promise.all(steps.map((s) => upsertStep(s, supabase)));

    // Mark complete
    await completeTurnover(meeting.id, userId, supabase);

    // Auto-generate follow-up tasks
    const followUpTasks = [
      { title: "Follow-up call with foreman", priority: "High" },
      { title: "Confirm all purchase orders are placed", priority: "High" },
      { title: "Send ship schedule to foreman", priority: "Medium" },
    ];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    await Promise.all(
      followUpTasks.map((t) =>
        supabase.from("tasks").insert({
          project_id: id,
          title: t.title,
          status: "Open",
          priority: t.priority,
          due_date: dueDateStr,
          created_by: userId,
        })
      )
    );

    // Refresh meeting state with completed_at
    const updated = { ...meeting, completedAt: new Date().toISOString(), completedBy: userId };
    setMeeting(updated);
    setCompleting(false);
    setShowCompletion(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  if (!project || loading) {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar project={project ? { id: project.id, name: project.name } : undefined} />
        <main className="flex-1 ml-[260px] min-h-screen">
          <header
            className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4"
            style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
          >
            <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: "#F5F5F4" }} />
            <div className="flex flex-col gap-1.5">
              <div className="w-32 h-3 rounded-full animate-pulse" style={{ background: "#F5F5F4" }} />
              <div className="w-48 h-5 rounded-full animate-pulse" style={{ background: "#F5F5F4" }} />
            </div>
          </header>
          <div className="px-8 py-8 flex flex-col gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] rounded-card animate-pulse" style={{ background: "#F5F5F4" }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const doneStepCount = steps.filter((s) => s.status === "done").length;
  const isAlreadyComplete = !!meeting?.completedAt;

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar project={{ id: project.id, name: project.name }} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${id}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 flex-shrink-0"
              style={{ background: "#F5F5F4", color: "#78716C" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>
                {project.name}
              </p>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>
                  Turnover Meeting
                </h1>
                {isAlreadyComplete && (
                  <CheckCircle2 size={18} style={{ color: "#22C55E" }} />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save indicator */}
            {saving && (
              <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "#A8A29E" }}>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </div>
            )}
            {!saving && !isAlreadyComplete && (
              <div className="text-[13px]" style={{ color: "#C7C3C0" }}>
                Auto-saved
              </div>
            )}

            {/* Steps progress pill */}
            {!isAlreadyComplete && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{ background: "#F0FDF4", color: "#15803D" }}
              >
                <Check size={12} strokeWidth={3} />
                {doneStepCount}/{steps.length} steps done
              </div>
            )}

            {/* Generate PDF button */}
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
              }}
              onMouseEnter={(e) => {
                if (!generatingPDF) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.40)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.30)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              {generatingPDF ? (
                <><Loader2 size={14} className="animate-spin" /> Generating…</>
              ) : (
                <><Download size={14} strokeWidth={2.5} /> Generate Turnover Sheet</>
              )}
            </button>
          </div>
        </header>

        {/* Completion screen or form */}
        {showCompletion && meeting ? (
          <CompletionScreen
            meeting={meeting}
            contacts={contacts}
            steps={steps}
            pmName={pmName}
            onBack={() => router.push(`/projects/${id}`)}
          />
        ) : (
          <div className="px-8 py-8 flex flex-col gap-5 max-w-3xl">

            {/* ─── Section 1: Job Contacts ───────────────────────────────── */}
            <Section
              number={1}
              title="Job Contacts"
              icon={Phone}
              iconColor="#0EA5E9"
              iconBg="#F0F9FF"
            >
              <div className="flex flex-col gap-3">
                {contacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onChange={updateContact}
                    onDelete={() => removeContact(contact.id)}
                    canDelete={contacts.length > 1}
                  />
                ))}
                <button
                  onClick={addContact}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 self-start"
                  style={{ background: "#F0F9FF", color: "#0EA5E9", border: "1.5px dashed #BAE6FD" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E0F2FE"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F0F9FF"; }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Add Contact
                </button>
              </div>
            </Section>

            {/* ─── Section 2: Job Site Requirements ────────────────────────── */}
            <Section
              number={2}
              title="Job Site Requirements"
              icon={MapPin}
              iconColor="#7C3AED"
              iconBg="#F5F3FF"
            >
              <div className="flex flex-col gap-4">
                <TextareaField
                  label="Site Access Instructions"
                  icon={MapPin}
                  value={meeting?.siteAccess ?? ""}
                  onChange={(v) => updateMeeting({ siteAccess: v })}
                  placeholder="How to access the job site, gate codes, check-in procedures…"
                />
                <TextareaField
                  label="Delivery Requirements"
                  icon={Package}
                  value={meeting?.deliveryRequirements ?? ""}
                  onChange={(v) => updateMeeting({ deliveryRequirements: v })}
                  placeholder="Delivery hours, dock locations, contact for receiving…"
                />
                <TextareaField
                  label="Special Handling"
                  icon={ShieldCheck}
                  value={meeting?.specialHandling ?? ""}
                  onChange={(v) => updateMeeting({ specialHandling: v })}
                  placeholder="Fragile items, temperature requirements, equipment needed…"
                />
                <TextareaField
                  label="Safety Requirements"
                  icon={ShieldCheck}
                  value={meeting?.safetyRequirements ?? ""}
                  onChange={(v) => updateMeeting({ safetyRequirements: v })}
                  placeholder="PPE requirements, safety orientation, restricted areas…"
                />
                <TextareaField
                  label="Parking and Staging Area"
                  icon={MapPin}
                  value={meeting?.parkingStaging ?? ""}
                  onChange={(v) => updateMeeting({ parkingStaging: v })}
                  placeholder="Where to park, designated staging area for materials…"
                />
              </div>
            </Section>

            {/* ─── Section 3: Project Details ────────────────────────────────── */}
            <Section
              number={3}
              title="Project Details"
              icon={ClipboardList}
              iconColor="#F97316"
              iconBg="#FFF7ED"
            >
              <div className="flex flex-col gap-4">
                <TextareaField
                  label="Confirmed Scope of Work"
                  icon={ClipboardList}
                  value={meeting?.scopeOfWork ?? ""}
                  onChange={(v) => updateMeeting({ scopeOfWork: v })}
                  placeholder="Detailed description of the electrical scope for this job…"
                />
                <TextareaField
                  label="Key Exclusions"
                  icon={FileText}
                  value={meeting?.keyExclusions ?? ""}
                  onChange={(v) => updateMeeting({ keyExclusions: v })}
                  placeholder="What is explicitly NOT included in this contract…"
                />
                <TextareaField
                  label="Special Order Items to Flag"
                  icon={Package}
                  value={meeting?.specialOrderItems ?? ""}
                  onChange={(v) => updateMeeting({ specialOrderItems: v })}
                  placeholder="Long lead items, custom gear, anything that needs early ordering…"
                />
                <TextareaField
                  label="Lead Time Concerns"
                  icon={Clock}
                  value={meeting?.leadTimeConcerns ?? ""}
                  onChange={(v) => updateMeeting({ leadTimeConcerns: v })}
                  placeholder="Known supply chain issues, items with extended lead times…"
                />
              </div>
            </Section>

            {/* ─── Section 4: PM Step by Step ──────────────────────────────── */}
            <Section
              number={4}
              title="PM Step by Step Instructions"
              icon={CheckCircle2}
              iconColor="#16A34A"
              iconBg="#F0FDF4"
            >
              <div className="flex flex-col gap-2">
                {steps.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    index={i}
                    onChange={updateStep}
                    onDelete={() => removeStep(step.id)}
                  />
                ))}

                {/* Add custom step */}
                <button
                  onClick={addStep}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 self-start mt-1"
                  style={{ background: "#F0FDF4", color: "#16A34A", border: "1.5px dashed #BBFBD0" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#DCFCE7"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F0FDF4"; }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Add Custom Step
                </button>
              </div>
            </Section>

            {/* ─── Complete button ──────────────────────────────────────────── */}
            {!isAlreadyComplete && (
              <div
                className="rounded-card p-6 flex flex-col items-center gap-4 text-center"
                style={{ background: "#fff", border: "1.5px solid #BBFBD0" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)" }}
                >
                  <PhoneCall size={22} style={{ color: "#16A34A" }} />
                </div>
                <div>
                  <h3 className="font-display font-700 text-[16px] tracking-[-0.01em] mb-1" style={{ color: "#1C1917" }}>
                    Ready to mark this turnover complete?
                  </h3>
                  <p className="text-[13px]" style={{ color: "#78716C" }}>
                    This will save all data, log the completion time, and auto-generate 3 follow-up tasks.
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #22C55E, #16A34A)",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    if (!completing) {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(34,197,94,0.45)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(34,197,94,0.35)";
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  {completing ? (
                    <><Loader2 size={16} className="animate-spin" /> Completing…</>
                  ) : (
                    <><CheckCircle2 size={16} strokeWidth={2.5} /> Mark Turnover Complete</>
                  )}
                </button>
              </div>
            )}

            {/* Already complete — view summary */}
            {isAlreadyComplete && (
              <div
                className="rounded-card p-5 flex items-center gap-4"
                style={{ background: "#F0FDF4", border: "1px solid #BBFBD0" }}
              >
                <CheckCircle2 size={22} style={{ color: "#22C55E" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#15803D" }}>
                    Turnover completed on {meeting?.completedAt ? fmtDateTime(meeting.completedAt) : "—"}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "#16A34A" }}>
                    Follow-up tasks have been created in My Tasks.
                  </p>
                </div>
                <button
                  onClick={() => setShowCompletion(true)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold flex-shrink-0"
                  style={{ color: "#16A34A" }}
                >
                  View Summary
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
