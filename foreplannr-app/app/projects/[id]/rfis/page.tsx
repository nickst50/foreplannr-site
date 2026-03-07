"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchRFIs,
  createRFI,
  updateRFI,
  deleteRFI,
  daysOpen,
  isOverdue,
  formatDate,
  initials,
  avatarColor,
  statusConfig,
  priorityConfig,
  RFI_STATUSES,
  type RFI,
  type RFIInput,
  type RFIStatus,
  type RFIPriority,
} from "@/lib/rfis";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  List,
  Columns,
  AlertCircle,
  Flame,
  FileQuestion,
} from "lucide-react";
import { NewRFIDrawer } from "./new-rfi-drawer";
import { RFIDetailDrawer } from "./rfi-detail-drawer";

// ─── Animation styles ───────────────────────────────────────────────────────────

const ANIM_STYLES = `
  @keyframes critical-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes drop-line-breathe {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .critical-dot { animation: critical-pulse 1.1s ease-in-out infinite; }
  .drop-line    { animation: drop-line-breathe 0.9s ease-in-out infinite; }
  .shimmer {
    background: linear-gradient(90deg, #F5F5F4 25%, #EBEBEA 50%, #F5F5F4 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
`;

// ─── Loading skeleton ───────────────────────────────────────────────────────────

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
          gridTemplateColumns: "64px 1fr 130px 150px 110px 90px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>RFI #</div>
        <div>Title</div>
        <div>Status</div>
        <div>Assigned To</div>
        <div>Due Date</div>
        <div>Days Open</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid items-center px-5 py-4"
          style={{
            gridTemplateColumns: "64px 1fr 130px 150px 110px 90px",
            borderBottom: i < 4 ? "1px solid #F5F5F4" : "none",
          }}
        >
          <div className="shimmer h-4 w-10 rounded" />
          <div className="pr-4 flex flex-col gap-1.5">
            <div className="shimmer h-4 rounded" style={{ width: `${55 + (i * 13) % 30}%` }} />
            <div className="shimmer h-3 rounded w-1/3" />
          </div>
          <div className="shimmer h-6 w-24 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="shimmer w-6 h-6 rounded-full flex-shrink-0" />
            <div className="shimmer h-4 rounded w-20" />
          </div>
          <div className="shimmer h-4 rounded w-20" />
          <div className="shimmer h-4 rounded w-8" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 rounded-xl text-center"
      style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#FFF7ED" }}>
        <FileQuestion size={22} style={{ color: "#F97316" }} />
      </div>
      <p className="font-display font-700 text-[16px] mb-1" style={{ color: "#1C1917" }}>No RFIs yet</p>
      <p className="text-sm mb-5" style={{ color: "#A8A29E" }}>
        Create your first Request for Information to get started.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 2px 8px rgba(249,115,22,0.35)" }}
      >
        <Plus size={15} strokeWidth={2.5} />
        New RFI
      </button>
    </div>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: RFIPriority }) {
  const isCritical = priority === "Critical";
  const cfg = priorityConfig[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded font-semibold"
      style={{
        background: isCritical ? "#DC2626" : cfg.bg,
        color: isCritical ? "#fff" : cfg.text,
        fontSize: isCritical ? "12px" : "11px",
        padding: isCritical ? "3px 9px" : "2px 7px",
      }}
    >
      {isCritical ? (
        <>
          <Flame size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <span
            className="critical-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#fca5a5" }}
          />
        </>
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.text }}
        />
      )}
      {priority}
    </span>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RFIStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

// ─── Assignee ───────────────────────────────────────────────────────────────────

function Assignee({ name }: { name: string }) {
  if (!name) return <span style={{ color: "#A8A29E" }}>Unassigned</span>;
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: avatarColor(name) }}
      >
        {initials(name)}
      </div>
      <span className="text-sm" style={{ color: "#44403C" }}>{name}</span>
    </div>
  );
}

// ─── List view ──────────────────────────────────────────────────────────────────

function ListView({ rfis, onSelect }: { rfis: RFI[]; onSelect: (rfi: RFI) => void }) {
  if (rfis.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-xl text-center"
        style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FFF7ED" }}>
          <AlertCircle size={20} style={{ color: "#F97316" }} />
        </div>
        <p className="font-display font-700 text-[15px] mb-1" style={{ color: "#1C1917" }}>No RFIs found</p>
        <p className="text-sm" style={{ color: "#A8A29E" }}>Try a different filter or create a new RFI.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #E7E5E4", background: "#fff", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
    >
      {/* Header */}
      <div
        className="grid text-[11px] font-semibold uppercase tracking-wider px-5 py-3"
        style={{
          gridTemplateColumns: "64px 1fr 130px 150px 110px 90px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>RFI #</div>
        <div>Title</div>
        <div>Status</div>
        <div>Assigned To</div>
        <div>Due Date</div>
        <div>Days Open</div>
      </div>

      {/* Rows */}
      {rfis.map((rfi, idx) => {
        const days = daysOpen(rfi.createdAt);
        const overdue = isOverdue(rfi.dueDate, rfi.status);
        const isCritical = rfi.priority === "Critical";
        const daysColor =
          rfi.status === "Closed" || rfi.status === "Answered"
            ? "#A8A29E"
            : overdue
            ? "#DC2626"
            : days > 10
            ? "#D97706"
            : "#44403C";

        return (
          <div
            key={rfi.id}
            className="grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
            style={{
              gridTemplateColumns: "64px 1fr 130px 150px 110px 90px",
              borderBottom: idx < rfis.length - 1 ? "1px solid #F5F5F4" : "none",
              background: isCritical ? "#FFF5F5" : undefined,
              borderLeft: isCritical ? "4px solid #DC2626" : "4px solid transparent",
            }}
            onClick={() => onSelect(rfi)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isCritical ? "#FEE2E2" : "#FAFAF9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isCritical ? "#FFF5F5" : "";
            }}
          >
            {/* RFI # */}
            <div className="text-[13px] font-bold font-mono" style={{ color: "#C2410C" }}>
              #{String(rfi.number).padStart(4, "0")}
            </div>

            {/* Title */}
            <div className="pr-4 min-w-0">
              <div className="flex items-center gap-1.5">
                {isCritical && <Flame size={13} style={{ color: "#DC2626", flexShrink: 0 }} />}
                <p className="text-sm font-medium truncate" style={{ color: "#1C1917" }}>{rfi.title}</p>
              </div>
              {rfi.specSection && (
                <p className="text-[12px] truncate mt-0.5" style={{ color: "#A8A29E" }}>{rfi.specSection}</p>
              )}
            </div>

            {/* Status */}
            <div><StatusBadge status={rfi.status} /></div>

            {/* Assigned To */}
            <div><Assignee name={rfi.assignedTo} /></div>

            {/* Due Date */}
            <div
              className="text-sm"
              style={{ color: overdue && rfi.status !== "Closed" ? "#DC2626" : "#44403C" }}
            >
              {formatDate(rfi.dueDate)}
            </div>

            {/* Days Open */}
            <div className="text-sm font-semibold tabular-nums" style={{ color: daysColor }}>
              {days}d
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Kanban card inner (used in draggable wrapper AND drag overlay) ─────────────

function KanbanCardInner({
  rfi,
  onSelect,
  isDragOverlay = false,
}: {
  rfi: RFI;
  onSelect: (rfi: RFI) => void;
  isDragOverlay?: boolean;
}) {
  const overdue = isOverdue(rfi.dueDate, rfi.status);
  const isCritical = rfi.priority === "Critical";

  return (
    <div
      className="bg-white rounded-xl p-4 flex flex-col gap-3 select-none"
      style={{
        border: "1px solid #E7E5E4",
        borderLeft: isCritical ? "4px solid #DC2626" : "1px solid #E7E5E4",
        boxShadow: isDragOverlay
          ? "0 20px 48px rgba(28,25,23,0.20), 0 4px 16px rgba(28,25,23,0.12)"
          : "0 1px 3px rgba(28,25,23,0.06)",
        transform: isDragOverlay ? "rotate(2.5deg) scale(1.03)" : undefined,
        cursor: isDragOverlay ? "grabbing" : "grab",
        transition: isDragOverlay ? undefined : "box-shadow 0.15s, transform 0.15s",
      }}
      onClick={isDragOverlay ? undefined : () => onSelect(rfi)}
      onMouseEnter={
        isDragOverlay
          ? undefined
          : (e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(28,25,23,0.10)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }
      }
      onMouseLeave={
        isDragOverlay
          ? undefined
          : (e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 1px 3px rgba(28,25,23,0.06)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }
      }
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold font-mono" style={{ color: "#C2410C" }}>
          #{String(rfi.number).padStart(4, "0")}
        </span>
        <PriorityBadge priority={rfi.priority} />
      </div>

      {/* Title */}
      <p className="text-[13px] font-semibold leading-snug" style={{ color: "#1C1917" }}>
        {isCritical && (
          <Flame
            size={13}
            style={{ color: "#DC2626", marginRight: 4, display: "inline", verticalAlign: "middle" }}
          />
        )}
        {rfi.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #F5F5F4" }}>
        {rfi.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: avatarColor(rfi.assignedTo) }}
            >
              {initials(rfi.assignedTo)}
            </div>
            <span className="text-[12px]" style={{ color: "#78716C" }}>
              {rfi.assignedTo.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: "#A8A29E" }}>Unassigned</span>
        )}
        {rfi.dueDate && (
          <span className="text-[12px] font-medium" style={{ color: overdue ? "#DC2626" : "#78716C" }}>
            {formatDate(rfi.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Draggable card wrapper ─────────────────────────────────────────────────────

function DraggableCard({ rfi, onSelect }: { rfi: RFI; onSelect: (rfi: RFI) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: rfi.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1,
        transition: isDragging ? undefined : "opacity 0.12s",
      }}
      {...listeners}
      {...attributes}
    >
      <KanbanCardInner rfi={rfi} onSelect={onSelect} />
    </div>
  );
}

// ─── Droppable column ───────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  rfis,
  onSelect,
}: {
  status: RFIStatus;
  rfis: RFI[];
  onSelect: (rfi: RFI) => void;
}) {
  const cfg = statusConfig[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 270 }}>
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
          {rfis.length}
        </span>
      </div>

      {/* Droppable zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 rounded-xl p-2 transition-all duration-200"
        style={{
          minHeight: 80,
          border: isOver ? `2px solid ${cfg.dot}` : "2px solid transparent",
          background: isOver ? `${cfg.dot}14` : "transparent",
          boxShadow: isOver ? `0 0 0 4px ${cfg.dot}1A, inset 0 0 20px ${cfg.dot}08` : "none",
        }}
      >
        {rfis.map((rfi) => (
          <DraggableCard key={rfi.id} rfi={rfi} onSelect={onSelect} />
        ))}

        {/* Empty state */}
        {rfis.length === 0 && !isOver && (
          <div
            className="rounded-xl py-8 flex items-center justify-center"
            style={{ border: `1.5px dashed ${cfg.border}`, background: `${cfg.bg}50` }}
          >
            <p className="text-[12px] font-medium" style={{ color: `${cfg.dot}99` }}>
              No RFIs
            </p>
          </div>
        )}

        {/* Drop indicator line — appears at bottom of card stack */}
        {isOver && (
          <div
            className="drop-line rounded-full"
            style={{ height: 3, background: cfg.dot, margin: "2px 4px" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Kanban view ────────────────────────────────────────────────────────────────

function KanbanView({
  rfis,
  onSelect,
  onStatusChange,
}: {
  rfis: RFI[];
  onSelect: (rfi: RFI) => void;
  onStatusChange: (rfi: RFI, newStatus: RFIStatus) => void;
}) {
  const [activeRFI, setActiveRFI] = useState<RFI | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const found = rfis.find((r) => r.id === event.active.id);
    setActiveRFI(found ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveRFI(null);
    if (!over) return;
    const rfi = rfis.find((r) => r.id === active.id);
    const newStatus = over.id as RFIStatus;
    if (rfi && rfi.status !== newStatus && RFI_STATUSES.includes(newStatus)) {
      onStatusChange(rfi, newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ minHeight: 400 }}>
        {RFI_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            rfis={rfis.filter((r) => r.status === status)}
            onSelect={onSelect}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {activeRFI ? (
          <KanbanCardInner rfi={activeRFI} onSelect={() => {}} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function RFIsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<RFIStatus | "All">("All");
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      fetchRFIs(projectId, supabase),
    ]).then(([{ data, error }, rfiData]) => {
      if (data && !error) setProject(rowToProject(data as DbProjectRow));
      else router.push("/dashboard");
      setRFIs(rfiData);
      setLoading(false);
    });
  }, [projectId, router]);

  async function handleCreate(input: RFIInput) {
    const supabase = createClient();
    const nextNumber = rfis.length > 0 ? Math.max(...rfis.map((r) => r.number)) + 1 : 1;
    const rfi = await createRFI(projectId, input, nextNumber, supabase);
    if (rfi) {
      setRFIs((prev) => [...prev, rfi]);
      setNewDrawerOpen(false);
    }
  }

  async function handleUpdate(updated: RFI) {
    const supabase = createClient();
    await updateRFI(updated.id, { status: updated.status, response: updated.response }, supabase);
    setRFIs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRFI(updated);
  }

  async function handleStatusChange(rfi: RFI, newStatus: RFIStatus) {
    const updated = { ...rfi, status: newStatus };
    setRFIs((prev) => prev.map((r) => (r.id === rfi.id ? updated : r)));
    const supabase = createClient();
    await updateRFI(rfi.id, { status: newStatus }, supabase);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const ok = await deleteRFI(id, supabase);
    if (ok) {
      setRFIs((prev) => prev.filter((r) => r.id !== id));
      setSelectedRFI(null);
    }
  }

  if (!project) return null;

  const nextNumber = rfis.length > 0 ? Math.max(...rfis.map((r) => r.number)) + 1 : 1;

  const counts = Object.fromEntries(
    RFI_STATUSES.map((s) => [s, rfis.filter((r) => r.status === s).length])
  ) as Record<RFIStatus, number>;

  const displayed = filter === "All" ? rfis : rfis.filter((r) => r.status === filter);

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
                RFIs
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

            {/* New RFI button */}
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
              New RFI
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Filter bar (list view only) */}
          {view === "list" && !loading && rfis.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBtn
                label="All"
                count={rfis.length}
                active={filter === "All"}
                onClick={() => setFilter("All")}
                dotColor="#A8A29E"
              />
              {RFI_STATUSES.map((s) => (
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
          ) : rfis.length === 0 ? (
            <EmptyState onNew={() => setNewDrawerOpen(true)} />
          ) : view === "list" ? (
            <ListView rfis={displayed} onSelect={setSelectedRFI} />
          ) : (
            <KanbanView
              rfis={rfis}
              onSelect={setSelectedRFI}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </main>

      {/* Drawers */}
      <NewRFIDrawer
        open={newDrawerOpen}
        nextNumber={nextNumber}
        projectId={projectId}
        onClose={() => setNewDrawerOpen(false)}
        onSubmit={handleCreate}
      />
      <RFIDetailDrawer
        rfi={selectedRFI}
        onClose={() => setSelectedRFI(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

// ─── Filter button ──────────────────────────────────────────────────────────────

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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150"
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
          background: active ? (activeColor ? `${activeColor}18` : "#E7E5E4") : "#F5F5F4",
          color: active ? (activeColor ?? "#44403C") : "#A8A29E",
        }}
      >
        {count}
      </span>
    </button>
  );
}
