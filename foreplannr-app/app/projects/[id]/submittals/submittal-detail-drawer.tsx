"use client";

import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  User,
  Users,
  Calendar,
  CalendarCheck,
  CalendarX,
  MessageSquare,
  PlusCircle,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  statusConfig,
  formatDate,
  addDays,
  initials,
  avatarColor,
  ALL_STATUSES,
  RETURNED_STATUSES,
  type Submittal,
  type SubmittalStatus,
} from "@/lib/submittals";

interface Props {
  submittal: Submittal | null;
  onClose: () => void;
  onUpdate: (s: Submittal) => void;
}

// ─── Activity generator ────────────────────────────────────────────────────────

interface ActivityItem {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  text: string;
  date: string;
}

function buildActivity(s: Submittal): ActivityItem[] {
  const items: ActivityItem[] = [];

  items.push({
    icon: PlusCircle,
    iconColor: "#F97316",
    iconBg: "#FFF7ED",
    text: "Submittal package created",
    date: s.createdAt,
  });

  if (s.submissionDate) {
    items.push({
      icon: RotateCcw,
      iconColor: "#1D4ED8",
      iconBg: "#EFF6FF",
      text: `Submitted to ${s.reviewerName || "reviewer"} for review`,
      date: s.submissionDate,
    });
  }

  if (s.status === "Under Review" || RETURNED_STATUSES.includes(s.status)) {
    const reviewStart = s.submissionDate
      ? addDays(s.submissionDate, 1)
      : addDays(s.createdAt, 3);
    items.push({
      icon: MessageSquare,
      iconColor: "#B45309",
      iconBg: "#FFFBEB",
      text: "Submittal logged as Under Review by reviewer",
      date: reviewStart,
    });
  }

  if (s.status === "Approved") {
    items.push({
      icon: CheckCircle,
      iconColor: "#0F766E",
      iconBg: "#F0FDFA",
      text: "Submittal approved — no further action required",
      date: s.returnedDate || addDays(s.createdAt, 10),
    });
  }

  if (s.status === "Approved w/ Comments") {
    items.push({
      icon: CheckCircle,
      iconColor: "#15803D",
      iconBg: "#F0FDF4",
      text: "Approved with comments — see reviewer notes",
      date: s.returnedDate || addDays(s.createdAt, 10),
    });
  }

  if (s.status === "Rejected") {
    items.push({
      icon: AlertCircle,
      iconColor: "#BE123C",
      iconBg: "#FFF1F2",
      text: "Submittal rejected — resubmission required",
      date: s.returnedDate || addDays(s.createdAt, 10),
    });
  }

  if (s.status === "Resubmit Required") {
    items.push({
      icon: RefreshCw,
      iconColor: "#C2410C",
      iconBg: "#FFF7ED",
      text: "Resubmittal requested — address reviewer comments",
      date: s.returnedDate || addDays(s.createdAt, 10),
    });
  }

  return items.reverse();
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

export function SubmittalDetailDrawer({ submittal, onClose, onUpdate }: Props) {
  const open = submittal !== null;

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<SubmittalStatus>("Pending Submission");
  const [returnedDate, setReturnedDate] = useState("");

  useEffect(() => {
    if (submittal) {
      setNotes(submittal.notes ?? "");
      setStatus(submittal.status);
      setReturnedDate(submittal.returnedDate ?? "");
    }
  }, [submittal?.id]);

  // Auto-fill returned date when changing to a "returned" status
  function handleStatusChange(next: SubmittalStatus) {
    setStatus(next);
    if (RETURNED_STATUSES.includes(next) && !returnedDate) {
      setReturnedDate(new Date().toISOString().split("T")[0]);
    }
  }

  function handleSave() {
    if (!submittal) return;
    onUpdate({ ...submittal, notes, status, returnedDate });
  }

  const cfg = statusConfig[status];
  const activity = submittal
    ? buildActivity({ ...submittal, notes, status, returnedDate })
    : [];

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
          width: 580,
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(28,25,23,0.14)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {!submittal ? null : (
          <>
            {/* Header */}
            <div
              className="flex items-start justify-between px-7 py-5 flex-shrink-0"
              style={{ borderBottom: "1px solid #F5F5F4" }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="text-[11px] font-bold font-mono px-2 py-0.5 rounded"
                    style={{ background: "#F5F5F4", color: "#78716C" }}
                  >
                    SUB-{submittal.number}
                  </span>
                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value as SubmittalStatus)}
                      className="appearance-none text-[11px] font-semibold px-2.5 py-0.5 rounded-full pr-7 cursor-pointer outline-none"
                      style={{
                        background: cfg.bg,
                        color: cfg.text,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px]"
                      style={{ color: cfg.text }}
                    >▾</span>
                  </div>
                </div>
                <p
                  className="font-display font-700 text-[16px] leading-snug tracking-[-0.02em]"
                  style={{ color: "#1C1917" }}
                >
                  {submittal.description}
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: "#78716C" }}>
                  {submittal.specSection}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                style={{ background: "#F5F5F4", color: "#78716C" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Meta grid */}
              <div
                className="grid grid-cols-2 gap-x-6 gap-y-4 px-7 py-5"
                style={{ borderBottom: "1px solid #F5F5F4" }}
              >
                <MetaItem
                  icon={User}
                  label="Submitted By"
                  value={
                    submittal.submittedBy ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: avatarColor(submittal.submittedBy) }}
                        >
                          {initials(submittal.submittedBy)}
                        </div>
                        {submittal.submittedBy}
                      </div>
                    ) : "—"
                  }
                />
                <MetaItem
                  icon={Users}
                  label="Reviewer"
                  value={submittal.reviewerName || "—"}
                />
                <MetaItem
                  icon={Calendar}
                  label="Submission Date"
                  value={formatDate(submittal.submissionDate)}
                />
                <MetaItem
                  icon={CalendarCheck}
                  label="Review Due"
                  value={
                    <span
                      style={{
                        color:
                          submittal.reviewDueDate &&
                          new Date(submittal.reviewDueDate) < new Date() &&
                          !RETURNED_STATUSES.includes(status)
                            ? "#DC2626"
                            : "inherit",
                      }}
                    >
                      {formatDate(submittal.reviewDueDate)}
                    </span>
                  }
                />
                <MetaItem
                  icon={CalendarX}
                  label="Returned Date"
                  value={
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={returnedDate}
                        onChange={(e) => setReturnedDate(e.target.value)}
                        className="rounded px-2 py-1 text-[12px] outline-none"
                        style={{
                          border: "1.5px solid #E7E5E4",
                          background: "#FAFAF9",
                          color: "#1C1917",
                          width: 150,
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; }}
                      />
                    </div>
                  }
                />
              </div>

              {/* Notes / Reviewer Response */}
              <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                <p
                  className="text-[12px] font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: "#A8A29E" }}
                >
                  Reviewer Notes / Response
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter reviewer comments or response notes…"
                  rows={5}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#F97316";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E7E5E4";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #F97316, #EA580C)",
                      boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.42)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.30)";
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Activity log */}
              <div className="px-7 py-5">
                <p
                  className="text-[12px] font-semibold uppercase tracking-wider mb-4"
                  style={{ color: "#A8A29E" }}
                >
                  Activity
                </p>
                <div className="flex flex-col gap-4">
                  {activity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: item.iconBg }}
                        >
                          <Icon size={13} style={{ color: item.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: "#1C1917" }}>
                            {item.text}
                          </p>
                          <p className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "#A8A29E" }}
      >
        <Icon size={11} />
        {label}
      </div>
      <div className="text-sm font-medium" style={{ color: "#1C1917" }}>
        {value}
      </div>
    </div>
  );
}
