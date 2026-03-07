"use client";

import { useState, useEffect } from "react";
import { X, Clock, User, BookOpen, Tag, Calendar, MessageSquare, CheckCircle, RotateCcw, PlusCircle } from "lucide-react";
import {
  statusConfig,
  priorityConfig,
  formatDate,
  daysOpen,
  isOverdue,
  addDays,
  initials,
  avatarColor,
  RFI_STATUSES,
  type RFI,
  type RFIStatus,
} from "@/lib/rfis";

interface Props {
  rfi: RFI | null;
  onClose: () => void;
  onUpdate: (rfi: RFI) => void;
}

// ─── Activity log generator ────────────────────────────────────────────────────

interface ActivityItem {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  text: string;
  date: string;
}

function buildActivity(rfi: RFI): ActivityItem[] {
  const items: ActivityItem[] = [];

  items.push({
    icon: PlusCircle,
    iconColor: "#F97316",
    iconBg: "#FFF7ED",
    text: "RFI created and submitted",
    date: rfi.createdAt,
  });

  if (rfi.assignedTo) {
    items.push({
      icon: User,
      iconColor: "#0284C7",
      iconBg: "#EFF6FF",
      text: `Assigned to ${rfi.assignedTo}`,
      date: rfi.createdAt,
    });
  }

  if (rfi.status !== "Open") {
    items.push({
      icon: RotateCcw,
      iconColor: "#1D4ED8",
      iconBg: "#EFF6FF",
      text: "Status changed to In Review",
      date: addDays(rfi.createdAt, 2),
    });
  }

  if (rfi.status === "Answered" || rfi.status === "Closed") {
    items.push({
      icon: MessageSquare,
      iconColor: "#0F766E",
      iconBg: "#F0FDFA",
      text: "Response submitted by design team",
      date: addDays(rfi.createdAt, 6),
    });
    items.push({
      icon: RotateCcw,
      iconColor: "#0F766E",
      iconBg: "#F0FDFA",
      text: "Status changed to Answered",
      date: addDays(rfi.createdAt, 6),
    });
  }

  if (rfi.status === "Closed") {
    items.push({
      icon: CheckCircle,
      iconColor: "#78716C",
      iconBg: "#F5F5F4",
      text: "RFI closed by Jake Morrison",
      date: addDays(rfi.createdAt, 9),
    });
  }

  return items.reverse();
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

export function RFIDetailDrawer({ rfi, onClose, onUpdate }: Props) {
  const open = rfi !== null;
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<RFIStatus>("Open");

  // Sync local state when a different RFI is selected
  useEffect(() => {
    if (rfi) {
      setResponse(rfi.response ?? "");
      setStatus(rfi.status);
    }
  }, [rfi?.id]);

  function handleSave() {
    if (!rfi) return;
    onUpdate({ ...rfi, response, status });
  }

  const days = rfi ? daysOpen(rfi.createdAt) : 0;
  const overdue = rfi ? isOverdue(rfi.dueDate, rfi.status) : false;
  const activity = rfi ? buildActivity({ ...rfi, status, response }) : [];
  const statusCfg = status ? statusConfig[status] : null;
  const priorityCfg = rfi ? priorityConfig[rfi.priority] : null;

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
          width: 560,
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(28,25,23,0.14)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {!rfi ? null : (
          <>
            {/* Header */}
            <div
              className="flex items-start justify-between px-7 py-5 flex-shrink-0"
              style={{ borderBottom: "1px solid #F5F5F4" }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded font-mono"
                    style={{ background: "#F5F5F4", color: "#78716C" }}
                  >
                    RFI #{String(rfi.number).padStart(2, "0")}
                  </span>
                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as RFIStatus)}
                      className="appearance-none text-[11px] font-semibold px-2.5 py-0.5 rounded-full pr-6 cursor-pointer outline-none"
                      style={{
                        background: statusCfg?.bg,
                        color: statusCfg?.text,
                        border: `1px solid ${statusCfg?.border}`,
                      }}
                    >
                      {RFI_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[9px]"
                      style={{ color: statusCfg?.text }}
                    >▾</span>
                  </div>
                </div>
                <h2
                  className="font-display font-700 text-[17px] leading-snug tracking-[-0.02em]"
                  style={{ color: "#1C1917" }}
                >
                  {rfi.title}
                </h2>
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
                <MetaItem icon={BookOpen} label="Spec Section" value={rfi.specSection || "—"} />
                <MetaItem
                  icon={Tag}
                  label="Priority"
                  value={
                    <span
                      className="text-[12px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: priorityCfg?.bg, color: priorityCfg?.text }}
                    >
                      {rfi.priority}
                    </span>
                  }
                />
                <MetaItem
                  icon={User}
                  label="Assigned To"
                  value={
                    rfi.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: avatarColor(rfi.assignedTo) }}
                        >
                          {initials(rfi.assignedTo)}
                        </div>
                        <span>{rfi.assignedTo}</span>
                      </div>
                    ) : "—"
                  }
                />
                <MetaItem
                  icon={Calendar}
                  label="Due Date"
                  value={
                    <span style={{ color: overdue ? "#DC2626" : "inherit" }}>
                      {formatDate(rfi.dueDate)}
                      {overdue && " · Overdue"}
                    </span>
                  }
                />
                <MetaItem
                  icon={Clock}
                  label="Days Open"
                  value={
                    <span style={{ color: days > 14 ? "#DC2626" : days > 7 ? "#D97706" : "#1C1917" }}>
                      {days} {days === 1 ? "day" : "days"}
                    </span>
                  }
                />
              </div>

              {/* Description */}
              <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#A8A29E" }}>
                  Description
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                  {rfi.description || <span style={{ color: "#A8A29E" }}>No description provided.</span>}
                </p>
              </div>

              {/* Response */}
              <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#A8A29E" }}>
                  Response
                </p>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter the design team's response here…"
                  rows={5}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
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
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#A8A29E" }}>
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
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#A8A29E" }}>
        <Icon size={11} />
        {label}
      </div>
      <div className="text-sm font-medium" style={{ color: "#1C1917" }}>
        {value}
      </div>
    </div>
  );
}
