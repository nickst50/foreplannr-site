"use client";

import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  MapPin,
  Wrench,
  User,
  Calendar,
  Camera,
  ImageIcon,
  PlusCircle,
  RotateCcw,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  statusConfig,
  priorityConfig,
  formatDate,
  isOverdue,
  addDays,
  initials,
  avatarColor,
  PUNCH_STATUSES,
  type PunchItem,
  type PunchStatus,
} from "@/lib/punch-list";

interface Props {
  item: PunchItem | null;
  onClose: () => void;
  onUpdate: (item: PunchItem) => void;
  onDelete: (id: string) => void;
}

// ─── Activity generator ────────────────────────────────────────────────────────

interface ActivityItem {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  text: string;
  date: string;
}

function buildActivity(item: PunchItem): ActivityItem[] {
  const entries: ActivityItem[] = [];

  entries.push({
    icon: PlusCircle,
    iconColor: "#16A34A",
    iconBg: "#F0FDF4",
    text: "Punch list item created",
    date: item.createdAt,
  });

  if (item.assignee) {
    entries.push({
      icon: User,
      iconColor: "#0284C7",
      iconBg: "#EFF6FF",
      text: `Assigned to ${item.assignee}`,
      date: item.createdAt,
    });
  }

  if (item.status !== "Open") {
    entries.push({
      icon: RotateCcw,
      iconColor: "#1D4ED8",
      iconBg: "#EFF6FF",
      text: `Status changed to In Progress`,
      date: addDays(item.createdAt, 3),
    });
  }

  if (item.status === "Pending Verification" || item.status === "Resolved") {
    entries.push({
      icon: Clock,
      iconColor: "#B45309",
      iconBg: "#FFFBEB",
      text: "Work completed — verification requested",
      date: addDays(item.createdAt, 7),
    });
  }

  if (item.status === "Resolved") {
    entries.push({
      icon: CheckCircle,
      iconColor: "#15803D",
      iconBg: "#F0FDF4",
      text: "Item verified and resolved by Jake Morrison",
      date: addDays(item.createdAt, 10),
    });
  }

  if (item.comments) {
    entries.push({
      icon: MessageSquare,
      iconColor: "#78716C",
      iconBg: "#F5F5F4",
      text: "Comment added",
      date: addDays(item.createdAt, 4),
    });
  }

  return entries.reverse();
}

// ─── Photo gallery placeholder ─────────────────────────────────────────────────

function PhotoGallery({ hasPhoto }: { hasPhoto: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {hasPhoto && (
        <div className="flex gap-2">
          {[
            { w: "120px", label: "IMG_0421.jpg" },
            { w: "90px",  label: "IMG_0422.jpg" },
          ].map((ph, i) => (
            <div
              key={i}
              className="rounded-lg flex flex-col items-center justify-center gap-1.5 flex-shrink-0"
              style={{
                width: ph.w,
                height: 80,
                background: "#F5F5F4",
                border: "1px solid #E7E5E4",
              }}
            >
              <ImageIcon size={18} style={{ color: "#A8A29E" }} />
              <span className="text-[10px] font-medium" style={{ color: "#A8A29E" }}>
                {ph.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload placeholder */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed"
        style={{
          border: "1.5px dashed #D1D5DB",
          background: "#FAFAF9",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#F0FDF4" }}
        >
          <Camera size={15} style={{ color: "#16A34A" }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
            {hasPhoto ? "Add more photos" : "Attach photos"}
          </p>
          <p className="text-[11px]" style={{ color: "#A8A29E" }}>
            Photo upload coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

export function PunchDetailDrawer({ item, onClose, onUpdate, onDelete }: Props) {
  const open = item !== null;

  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<PunchStatus>("Open");

  useEffect(() => {
    if (item) {
      setComments(item.comments ?? "");
      setStatus(item.status);
    }
  }, [item?.id]);

  function handleSave() {
    if (!item) return;
    onUpdate({ ...item, comments, status });
  }

  const cfg = status ? statusConfig[status] : null;
  const priCfg = item ? priorityConfig[item.priority] : null;
  const overdue = item ? isOverdue(item.dueDate, status) : false;
  const activity = item ? buildActivity({ ...item, status, comments }) : [];

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
        {!item ? null : (
          <>
            {/* Header */}
            <div
              className="flex items-start justify-between px-7 py-5 flex-shrink-0"
              style={{ borderBottom: "1px solid #F5F5F4" }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {/* Number badge */}
                  <span
                    className="text-[11px] font-bold font-mono px-2 py-0.5 rounded"
                    style={{ background: "#F5F5F4", color: "#78716C" }}
                  >
                    PLI-{String(item.number).padStart(3, "0")}
                  </span>

                  {/* Priority dot + label */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    style={{ background: priCfg?.bg, color: priCfg?.text }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: priCfg?.dot }}
                    />
                    {item.priority} Priority
                  </span>

                  {/* Status selector */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PunchStatus)}
                      className="appearance-none text-[11px] font-semibold px-2.5 py-0.5 rounded-full pr-7 cursor-pointer outline-none"
                      style={{
                        background: cfg?.bg,
                        color: cfg?.text,
                        border: `1px solid ${cfg?.border}`,
                      }}
                    >
                      {PUNCH_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px]"
                      style={{ color: cfg?.text }}
                    >▾</span>
                  </div>
                </div>

                <h2
                  className="font-display font-700 text-[16px] leading-snug tracking-[-0.02em]"
                  style={{ color: "#1C1917" }}
                >
                  {item.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onDelete(item.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{ background: "#FFF1F2", color: "#BE123C" }}
                  title="Delete item"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FECDD3"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
                >
                  <Trash2 size={14} />
                </button>
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
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Meta grid */}
              <div
                className="grid grid-cols-2 gap-x-6 gap-y-4 px-7 py-5"
                style={{ borderBottom: "1px solid #F5F5F4" }}
              >
                <MetaItem icon={MapPin} label="Location" value={item.location || "—"} />
                <MetaItem icon={Wrench} label="Responsible Trade" value={item.trade || "—"} />
                <MetaItem
                  icon={User}
                  label="Assignee"
                  value={
                    item.assignee ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: avatarColor(item.assignee) }}
                        >
                          {initials(item.assignee)}
                        </div>
                        {item.assignee}
                      </div>
                    ) : "—"
                  }
                />
                <MetaItem
                  icon={Calendar}
                  label="Due Date"
                  value={
                    <span style={{ color: overdue ? "#DC2626" : "inherit" }}>
                      {formatDate(item.dueDate)}
                      {overdue && " · Overdue"}
                    </span>
                  }
                />
              </div>

              {/* Description */}
              {item.description && (
                <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                  <p
                    className="text-[12px] font-semibold uppercase tracking-wider mb-2.5"
                    style={{ color: "#A8A29E" }}
                  >
                    Description
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                    {item.description}
                  </p>
                </div>
              )}

              {/* Photos */}
              <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                <p
                  className="text-[12px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "#A8A29E" }}
                >
                  Photos
                </p>
                <PhotoGallery hasPhoto={item.hasPhoto} />
              </div>

              {/* Comments */}
              <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F5F4" }}>
                <p
                  className="text-[12px] font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: "#A8A29E" }}
                >
                  Comments / Notes
                </p>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add notes, field observations, or resolution details…"
                  rows={4}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #E7E5E4", background: "#FAFAF9", color: "#1C1917" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#16A34A";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.10)";
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
                      background: "linear-gradient(135deg, #16A34A, #15803D)",
                      boxShadow: "0 2px 8px rgba(22,163,74,0.30)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(22,163,74,0.42)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.30)";
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
                  {activity.map((entry, i) => {
                    const Icon = entry.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: entry.iconBg }}
                        >
                          <Icon size={13} style={{ color: entry.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: "#1C1917" }}>
                            {entry.text}
                          </p>
                          <p className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>
                            {formatDate(entry.date)}
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
