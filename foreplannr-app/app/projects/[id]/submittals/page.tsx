"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchSubmittals,
  createSubmittal,
  updateSubmittal,
  formatDate,
  isOverdue,
  initials,
  avatarColor,
  nextSubmittalNumber,
  statusConfig,
  ALL_STATUSES,
  KANBAN_STATUSES,
  RETURNED_STATUSES,
  type Submittal,
  type SubmittalInput,
  type SubmittalStatus,
} from "@/lib/submittals";
import { ArrowLeft, Plus, List, Columns, AlertCircle, ClipboardList } from "lucide-react";
import { NewSubmittalDrawer } from "./new-submittal-drawer";
import { SubmittalDetailDrawer } from "./submittal-detail-drawer";

// ─── Animation styles ──────────────────────────────────────────────────────────

const ANIM_STYLES = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, #F5F5F4 25%, #EBEBEA 50%, #F5F5F4 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
`;

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #E7E5E4", background: "#fff", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
    >
      {/* Header */}
      <div
        className="grid text-[11px] font-semibold uppercase tracking-wider px-5 py-3"
        style={{
          gridTemplateColumns: "72px 180px 1fr 170px 140px 110px 110px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>Sub #</div>
        <div>Spec Section</div>
        <div>Description</div>
        <div>Status</div>
        <div>Submitted By</div>
        <div>Review Due</div>
        <div>Returned</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid items-center px-5 py-4"
          style={{
            gridTemplateColumns: "72px 180px 1fr 170px 140px 110px 110px",
            borderBottom: i < 4 ? "1px solid #F5F5F4" : "none",
          }}
        >
          <div className="shimmer h-4 w-10 rounded" />
          <div className="shimmer h-3 rounded w-3/4" />
          <div className="pr-4">
            <div className="shimmer h-4 rounded" style={{ width: `${50 + (i * 11) % 35}%` }} />
          </div>
          <div className="shimmer h-6 w-28 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="shimmer w-6 h-6 rounded-full flex-shrink-0" />
            <div className="shimmer h-4 rounded w-20" />
          </div>
          <div className="shimmer h-4 rounded w-20" />
          <div className="shimmer h-4 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 rounded-xl text-center"
      style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#EFF6FF" }}>
        <ClipboardList size={22} style={{ color: "#1D4ED8" }} />
      </div>
      <p className="font-display font-700 text-[16px] mb-1" style={{ color: "#1C1917" }}>No submittals yet</p>
      <p className="text-sm mb-5" style={{ color: "#A8A29E" }}>
        Create your first submittal to start tracking review status.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 2px 8px rgba(249,115,22,0.35)" }}
      >
        <Plus size={15} strokeWidth={2.5} />
        New Submittal
      </button>
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SubmittalStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function Assignee({ name }: { name: string }) {
  if (!name) return <span style={{ color: "#A8A29E" }}>—</span>;
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: avatarColor(name) }}
      >
        {initials(name)}
      </div>
      <span className="text-sm truncate" style={{ color: "#44403C" }}>{name}</span>
    </div>
  );
}

// ─── List view ─────────────────────────────────────────────────────────────────

function ListView({
  submittals,
  onSelect,
}: {
  submittals: Submittal[];
  onSelect: (s: Submittal) => void;
}) {
  if (submittals.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-xl text-center"
        style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
          style={{ background: "#EFF6FF" }}
        >
          <AlertCircle size={20} style={{ color: "#1D4ED8" }} />
        </div>
        <p className="font-display font-700 text-[15px] mb-1" style={{ color: "#1C1917" }}>
          No submittals found
        </p>
        <p className="text-sm" style={{ color: "#A8A29E" }}>
          Try a different filter or create a new submittal.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid #E7E5E4",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(28,25,23,0.05)",
      }}
    >
      {/* Table header */}
      <div
        className="grid text-[11px] font-semibold uppercase tracking-wider px-5 py-3"
        style={{
          gridTemplateColumns: "72px 180px 1fr 170px 140px 110px 110px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>Sub #</div>
        <div>Spec Section</div>
        <div>Description</div>
        <div>Status</div>
        <div>Submitted By</div>
        <div>Review Due</div>
        <div>Returned</div>
      </div>

      {/* Rows */}
      {submittals.map((sub, idx) => {
        const overdue = isOverdue(sub.reviewDueDate, sub.status);
        const isReturned = RETURNED_STATUSES.includes(sub.status);

        return (
          <div
            key={sub.id}
            className="grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
            style={{
              gridTemplateColumns: "72px 180px 1fr 170px 140px 110px 110px",
              borderBottom: idx < submittals.length - 1 ? "1px solid #F5F5F4" : "none",
            }}
            onClick={() => onSelect(sub)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            {/* Sub # */}
            <div
              className="text-[13px] font-bold font-mono"
              style={{ color: "#1D4ED8" }}
            >
              {sub.number}
            </div>

            {/* Spec section */}
            <div className="pr-3 min-w-0">
              <p className="text-[12px] truncate" style={{ color: "#78716C" }}>
                {sub.specSection || "—"}
              </p>
            </div>

            {/* Description */}
            <div className="pr-4 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#1C1917" }}>
                {sub.description}
              </p>
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={sub.status} />
            </div>

            {/* Submitted By */}
            <div>
              <Assignee name={sub.submittedBy} />
            </div>

            {/* Review Due */}
            <div
              className="text-sm"
              style={{ color: overdue ? "#DC2626" : "#44403C" }}
            >
              {formatDate(sub.reviewDueDate)}
            </div>

            {/* Returned */}
            <div className="text-sm" style={{ color: isReturned ? "#44403C" : "#A8A29E" }}>
              {formatDate(sub.returnedDate)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Kanban view ───────────────────────────────────────────────────────────────

function KanbanView({
  submittals,
  onSelect,
}: {
  submittals: Submittal[];
  onSelect: (s: Submittal) => void;
}) {
  return (
    <div>
      <p className="text-[12px] mb-4" style={{ color: "#A8A29E" }}>
        Showing active workflow statuses. Items in Pending Submission, Approved w/ Comments, and Resubmit Required are visible in List view.
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ minHeight: 400 }}>
        {KANBAN_STATUSES.map((status) => {
          const col = submittals.filter((s) => s.status === status);
          const cfg = statusConfig[status];
          return (
            <div key={status} className="flex flex-col gap-3 flex-shrink-0" style={{ width: 270 }}>
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-[13px] font-semibold" style={{ color: "#1C1917" }}>
                    {status}
                  </span>
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.text }}
                >
                  {col.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5">
                {col.map((sub) => (
                  <KanbanCard key={sub.id} sub={sub} onSelect={onSelect} />
                ))}
                {col.length === 0 && (
                  <div
                    className="rounded-xl py-8 flex items-center justify-center"
                    style={{
                      border: `1.5px dashed ${cfg.border}`,
                      background: `${cfg.bg}60`,
                    }}
                  >
                    <p className="text-[12px] font-medium" style={{ color: cfg.dot }}>
                      None
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ sub, onSelect }: { sub: Submittal; onSelect: (s: Submittal) => void }) {
  const overdue = isOverdue(sub.reviewDueDate, sub.status);

  return (
    <div
      className="bg-white rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-150"
      style={{
        border: "1px solid #E7E5E4",
        boxShadow: "0 1px 3px rgba(28,25,23,0.06)",
      }}
      onClick={() => onSelect(sub)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(28,25,23,0.10)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(28,25,23,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      {/* Sub number + spec */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[11px] font-bold font-mono flex-shrink-0"
          style={{ color: "#1D4ED8" }}
        >
          {sub.number}
        </span>
        <span
          className="text-[11px] truncate text-right"
          style={{ color: "#A8A29E" }}
        >
          {sub.specSection.split("–")[0].trim()}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] font-semibold leading-snug" style={{ color: "#1C1917" }}>
        {sub.description}
      </p>

      {/* Footer: assignee + due date */}
      <div
        className="flex items-center justify-between pt-1"
        style={{ borderTop: "1px solid #F5F5F4" }}
      >
        {sub.submittedBy ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: avatarColor(sub.submittedBy) }}
            >
              {initials(sub.submittedBy)}
            </div>
            <span className="text-[12px]" style={{ color: "#78716C" }}>
              {sub.submittedBy.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: "#A8A29E" }}>—</span>
        )}
        {sub.reviewDueDate && (
          <span
            className="text-[12px] font-medium"
            style={{ color: overdue ? "#DC2626" : "#78716C" }}
          >
            Due {formatDate(sub.reviewDueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Filter button ─────────────────────────────────────────────────────────────

function FilterBtn({
  label,
  count,
  active,
  onClick,
  dotColor,
  activeColor,
  activeBg,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dotColor: string;
  activeColor?: string;
  activeBg?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 whitespace-nowrap"
      style={{
        background: active ? (activeBg ?? "#F5F5F4") : "#fff",
        color: active ? (activeColor ?? "#1C1917") : "#78716C",
        border: active
          ? `1.5px solid ${activeColor ?? "#E7E5E4"}30`
          : "1.5px solid #E7E5E4",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
      {label}
      <span
        className="ml-0.5 text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
        style={{
          background: active
            ? activeColor
              ? `${activeColor}18`
              : "#E7E5E4"
            : "#F5F5F4",
          color: active ? (activeColor ?? "#44403C") : "#A8A29E",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SubmittalsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<SubmittalStatus | "All">("All");
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Submittal | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      fetchSubmittals(projectId, supabase),
    ]).then(([{ data, error }, submittalData]) => {
      if (data && !error) setProject(rowToProject(data as DbProjectRow));
      else router.push("/dashboard");
      setSubmittals(submittalData);
      setLoading(false);
    });
  }, [projectId, router]);

  async function handleCreate(input: SubmittalInput) {
    const supabase = createClient();
    const nextNum = nextSubmittalNumber(submittals);
    const submittal = await createSubmittal(projectId, input, nextNum, supabase);
    if (submittal) {
      setSubmittals((prev) => [...prev, submittal]);
      setNewDrawerOpen(false);
    }
  }

  async function handleUpdate(updated: Submittal) {
    const supabase = createClient();
    await updateSubmittal(
      updated.id,
      { status: updated.status, notes: updated.notes, returnedDate: updated.returnedDate },
      supabase
    );
    setSubmittals((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  }

  if (!project) return null;

  const counts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, submittals.filter((sub) => sub.status === s).length])
  ) as Record<SubmittalStatus, number>;

  const displayed =
    filter === "All" ? submittals : submittals.filter((s) => s.status === filter);

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <style>{ANIM_STYLES}</style>
      <Sidebar project={{ id: project.id, name: project.name }} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(250,250,249,0.90)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E7E5E4",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
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
              <h1
                className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]"
                style={{ color: "#1C1917" }}
              >
                Submittals
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg p-1" style={{ background: "#F5F5F4" }}>
              {(["list", "kanban"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-150"
                  style={{
                    background: view === v ? "#fff" : "transparent",
                    color: view === v ? "#1C1917" : "#78716C",
                    boxShadow: view === v ? "0 1px 3px rgba(28,25,23,0.08)" : "none",
                  }}
                >
                  {v === "list" ? <List size={14} /> : <Columns size={14} />}
                  {v === "list" ? "List" : "Kanban"}
                </button>
              ))}
            </div>

            {/* New Submittal button */}
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
              }}
              onClick={() => setNewDrawerOpen(true)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Submittal
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Filter bar — list view only, when data is loaded */}
          {view === "list" && !loading && submittals.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBtn
                label="All"
                count={submittals.length}
                active={filter === "All"}
                onClick={() => setFilter("All")}
                dotColor="#A8A29E"
              />
              {ALL_STATUSES.map((s) => (
                <FilterBtn
                  key={s}
                  label={s}
                  count={counts[s]}
                  active={filter === s}
                  onClick={() => setFilter(s)}
                  dotColor={statusConfig[s].dot}
                  activeColor={statusConfig[s].text}
                  activeBg={statusConfig[s].bg}
                />
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <SkeletonList />
          ) : submittals.length === 0 ? (
            <EmptyState onNew={() => setNewDrawerOpen(true)} />
          ) : view === "list" ? (
            <ListView submittals={displayed} onSelect={setSelected} />
          ) : (
            <KanbanView submittals={submittals} onSelect={setSelected} />
          )}
        </div>
      </main>

      {/* Drawers */}
      <NewSubmittalDrawer
        open={newDrawerOpen}
        nextNumber={nextSubmittalNumber(submittals)}
        projectId={projectId}
        onClose={() => setNewDrawerOpen(false)}
        onSubmit={handleCreate}
      />
      <SubmittalDetailDrawer
        submittal={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
