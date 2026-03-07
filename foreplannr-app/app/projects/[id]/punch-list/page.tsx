"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPunchItems,
  createPunchItem,
  updatePunchItem,
  deletePunchItem,
  nextPunchNumber,
  formatDate,
  isOverdue,
  initials,
  avatarColor,
  statusConfig,
  priorityConfig,
  PUNCH_STATUSES,
  type PunchItem,
  type PunchItemInput,
  type PunchStatus,
  type PunchPriority,
} from "@/lib/punch-list";
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
  MapPin,
  Wrench,
  Camera,
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { NewPunchItemDrawer } from "./new-punch-item-drawer";
import { PunchDetailDrawer } from "./punch-detail-drawer";

// ─── Animation styles ───────────────────────────────────────────────────────────

const ANIM_STYLES = `
  @keyframes high-pulse {
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
  .high-dot  { animation: high-pulse 1.1s ease-in-out infinite; }
  .drop-line { animation: drop-line-breathe 0.9s ease-in-out infinite; }
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
          gridTemplateColumns: "60px 1fr 150px 140px 80px 155px 120px 100px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>#</div>
        <div>Title</div>
        <div>Location</div>
        <div>Trade</div>
        <div>Priority</div>
        <div>Status</div>
        <div>Assignee</div>
        <div>Due Date</div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid items-center px-5 py-4"
          style={{
            gridTemplateColumns: "60px 1fr 150px 140px 80px 155px 120px 100px",
            borderBottom: i < 4 ? "1px solid #F5F5F4" : "none",
          }}
        >
          <div className="shimmer h-4 w-10 rounded" />
          <div className="pr-4">
            <div className="shimmer h-4 rounded" style={{ width: `${50 + (i * 11) % 35}%` }} />
          </div>
          <div className="shimmer h-3 rounded w-3/4" />
          <div className="shimmer h-3 rounded w-2/3" />
          <div className="shimmer h-5 w-14 rounded" />
          <div className="shimmer h-6 w-32 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="shimmer w-6 h-6 rounded-full flex-shrink-0" />
            <div className="shimmer h-4 rounded w-16" />
          </div>
          <div className="shimmer h-4 rounded w-20" />
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
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F0FDF4" }}>
        <ClipboardCheck size={22} style={{ color: "#16A34A" }} />
      </div>
      <p className="font-display font-700 text-[16px] mb-1" style={{ color: "#1C1917" }}>No punch list items yet</p>
      <p className="text-sm mb-5" style={{ color: "#A8A29E" }}>
        Add your first item to start tracking deficiencies.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #16A34A, #15803D)", boxShadow: "0 2px 8px rgba(22,163,74,0.35)" }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Add Item
      </button>
    </div>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: PunchPriority }) {
  const isHigh = priority === "High";
  const cfg = priorityConfig[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded font-semibold"
      style={{
        background: isHigh ? "#DC2626" : cfg.bg,
        color: isHigh ? "#fff" : cfg.text,
        fontSize: isHigh ? "12px" : "11px",
        padding: isHigh ? "3px 9px" : "2px 7px",
      }}
    >
      {isHigh ? (
        <>
          <AlertTriangle size={11} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <span
            className="high-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#fca5a5" }}
          />
        </>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      )}
      {priority}
    </span>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PunchStatus }) {
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

// ─── Kanban card inner (shared between draggable and overlay) ───────────────────

function PunchCardInner({
  item,
  onSelect,
  isDragOverlay = false,
}: {
  item: PunchItem;
  onSelect: (i: PunchItem) => void;
  isDragOverlay?: boolean;
}) {
  const overdue = isOverdue(item.dueDate, item.status);
  const isHigh = item.priority === "High";

  return (
    <article
      className="bg-white rounded-xl p-4 flex flex-col gap-3 select-none"
      style={{
        border: "1px solid #E7E5E4",
        borderLeft: isHigh ? "4px solid #DC2626" : "1px solid #E7E5E4",
        boxShadow: isDragOverlay
          ? "0 20px 48px rgba(28,25,23,0.20), 0 4px 16px rgba(28,25,23,0.12)"
          : "0 1px 3px rgba(28,25,23,0.06)",
        transform: isDragOverlay ? "rotate(2.5deg) scale(1.03)" : undefined,
        cursor: isDragOverlay ? "grabbing" : "grab",
        transition: isDragOverlay ? undefined : "box-shadow 0.15s, transform 0.15s",
      }}
      onClick={isDragOverlay ? undefined : () => onSelect(item)}
      onMouseEnter={
        isDragOverlay
          ? undefined
          : (e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(28,25,23,0.10)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }
      }
      onMouseLeave={
        isDragOverlay
          ? undefined
          : (e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(28,25,23,0.06)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }
      }
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={item.priority} />
          <span className="text-[11px] font-bold font-mono" style={{ color: "#A8A29E" }}>
            #{String(item.number).padStart(3, "0")}
          </span>
        </div>
        {item.hasPhoto && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{ background: "#F5F5F4", color: "#78716C" }}
          >
            <Camera size={11} />
            Photo
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-[13px] font-semibold leading-snug" style={{ color: "#1C1917" }}>
        {isHigh && (
          <AlertTriangle
            size={13}
            style={{ color: "#DC2626", marginRight: 4, display: "inline", verticalAlign: "middle" }}
          />
        )}
        {item.title}
      </p>

      {/* Location + Trade */}
      <div className="flex flex-col gap-1.5">
        {item.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: "#A8A29E", flexShrink: 0 }} />
            <span className="text-[12px] truncate" style={{ color: "#78716C" }}>
              {item.location}
            </span>
          </div>
        )}
        {item.trade && (
          <div className="flex items-center gap-1.5">
            <Wrench size={11} style={{ color: "#A8A29E", flexShrink: 0 }} />
            <span className="text-[12px] truncate" style={{ color: "#78716C" }}>
              {item.trade}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #F5F5F4" }}>
        {item.assignee ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: avatarColor(item.assignee) }}
            >
              {initials(item.assignee)}
            </div>
            <span className="text-[12px]" style={{ color: "#78716C" }}>
              {item.assignee.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: "#A8A29E" }}>Unassigned</span>
        )}
        {item.dueDate && (
          <span
            className="text-[12px] font-medium"
            style={{ color: overdue ? "#DC2626" : "#78716C" }}
          >
            {formatDate(item.dueDate)}
          </span>
        )}
      </div>
    </article>
  );
}

// ─── Draggable card wrapper ─────────────────────────────────────────────────────

function DraggableCard({
  item,
  onSelect,
}: {
  item: PunchItem;
  onSelect: (i: PunchItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
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
      <PunchCardInner item={item} onSelect={onSelect} />
    </div>
  );
}

// ─── Droppable column ───────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  items,
  onSelect,
}: {
  status: PunchStatus;
  items: PunchItem[];
  onSelect: (i: PunchItem) => void;
}) {
  const cfg = statusConfig[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 280 }}>
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
          {items.length}
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
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} onSelect={onSelect} />
        ))}

        {/* Empty state */}
        {items.length === 0 && !isOver && (
          <div
            className="rounded-xl py-10 flex items-center justify-center"
            style={{ border: `1.5px dashed ${cfg.border}`, background: `${cfg.bg}60` }}
          >
            <p className="text-[12px] font-medium" style={{ color: cfg.dot }}>
              None
            </p>
          </div>
        )}

        {/* Drop indicator line */}
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
  items,
  onSelect,
  onStatusChange,
}: {
  items: PunchItem[];
  onSelect: (item: PunchItem) => void;
  onStatusChange: (item: PunchItem, newStatus: PunchStatus) => void;
}) {
  const [activeItem, setActiveItem] = useState<PunchItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const found = items.find((i) => i.id === event.active.id);
    setActiveItem(found ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    const item = items.find((i) => i.id === active.id);
    const newStatus = over.id as PunchStatus;
    if (item && item.status !== newStatus && PUNCH_STATUSES.includes(newStatus)) {
      onStatusChange(item, newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {PUNCH_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            items={items.filter((i) => i.status === status)}
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
        {activeItem ? (
          <PunchCardInner item={activeItem} onSelect={() => {}} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── List view ──────────────────────────────────────────────────────────────────

function ListView({
  items,
  onSelect,
}: {
  items: PunchItem[];
  onSelect: (item: PunchItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-xl text-center"
        style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: "#F0FDF4" }}>
          <AlertCircle size={20} style={{ color: "#16A34A" }} />
        </div>
        <p className="font-display font-700 text-[15px] mb-1" style={{ color: "#1C1917" }}>
          No items found
        </p>
        <p className="text-sm" style={{ color: "#A8A29E" }}>
          Try a different filter or add a new punch list item.
        </p>
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
          gridTemplateColumns: "60px 1fr 150px 140px 80px 155px 120px 100px",
          background: "#FAFAF9",
          borderBottom: "1px solid #E7E5E4",
          color: "#A8A29E",
        }}
      >
        <div>#</div>
        <div>Title</div>
        <div>Location</div>
        <div>Trade</div>
        <div>Priority</div>
        <div>Status</div>
        <div>Assignee</div>
        <div>Due Date</div>
      </div>

      {/* Rows */}
      {items.map((item, idx) => {
        const overdue = isOverdue(item.dueDate, item.status);
        const isHigh = item.priority === "High";

        return (
          <div
            key={item.id}
            className="grid items-center px-5 py-3.5 cursor-pointer transition-colors duration-150"
            style={{
              gridTemplateColumns: "60px 1fr 150px 140px 80px 155px 120px 100px",
              borderBottom: idx < items.length - 1 ? "1px solid #F5F5F4" : "none",
              background: isHigh ? "#FFF5F5" : undefined,
              borderLeft: isHigh ? "4px solid #DC2626" : "4px solid transparent",
            }}
            onClick={() => onSelect(item)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isHigh ? "#FEE2E2" : "#FAFAF9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isHigh ? "#FFF5F5" : "";
            }}
          >
            {/* # */}
            <div className="text-[12px] font-bold font-mono" style={{ color: "#A8A29E" }}>
              {String(item.number).padStart(3, "0")}
            </div>

            {/* Title */}
            <div className="pr-4 min-w-0">
              <div className="flex items-center gap-1.5">
                {isHigh && <AlertTriangle size={13} style={{ color: "#DC2626", flexShrink: 0 }} />}
                <p className="text-sm font-medium truncate" style={{ color: "#1C1917" }}>
                  {item.title}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="pr-3 min-w-0">
              <p className="text-[12px] truncate" style={{ color: "#78716C" }}>
                {item.location || "—"}
              </p>
            </div>

            {/* Trade */}
            <div className="pr-3 min-w-0">
              <p className="text-[12px] truncate" style={{ color: "#78716C" }}>
                {item.trade || "—"}
              </p>
            </div>

            {/* Priority */}
            <div>
              <PriorityBadge priority={item.priority} />
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={item.status} />
            </div>

            {/* Assignee */}
            <div>
              {item.assignee ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: avatarColor(item.assignee) }}
                  >
                    {initials(item.assignee)}
                  </div>
                  <span className="text-sm truncate" style={{ color: "#44403C" }}>
                    {item.assignee.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <span style={{ color: "#A8A29E" }}>—</span>
              )}
            </div>

            {/* Due Date */}
            <div className="text-sm" style={{ color: overdue ? "#DC2626" : "#44403C" }}>
              {formatDate(item.dueDate)}
            </div>
          </div>
        );
      })}
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
          background: active ? (activeColor ? `${activeColor}18` : "#E7E5E4") : "#F5F5F4",
          color: active ? (activeColor ?? "#44403C") : "#A8A29E",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function PunchListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [filter, setFilter] = useState<PunchStatus | "All">("All");
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<PunchItem | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      fetchPunchItems(projectId, supabase),
    ]).then(([{ data, error }, itemData]) => {
      if (data && !error) setProject(rowToProject(data as DbProjectRow));
      else router.push("/dashboard");
      setItems(itemData);
      setLoading(false);
    });
  }, [projectId, router]);

  async function handleCreate(input: PunchItemInput) {
    const supabase = createClient();
    const nextNum = nextPunchNumber(items);
    const item = await createPunchItem(projectId, input, nextNum, supabase);
    if (item) {
      setItems((prev) => [...prev, item]);
      setNewDrawerOpen(false);
    }
  }

  async function handleUpdate(updated: PunchItem) {
    const supabase = createClient();
    await updatePunchItem(updated.id, { status: updated.status, comments: updated.comments }, supabase);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelected(updated);
  }

  async function handleStatusChange(item: PunchItem, newStatus: PunchStatus) {
    const updated = { ...item, status: newStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    const supabase = createClient();
    await updatePunchItem(item.id, { status: newStatus }, supabase);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const ok = await deletePunchItem(id, supabase);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelected(null);
    }
  }

  if (!project) return null;

  const counts = Object.fromEntries(
    PUNCH_STATUSES.map((s) => [s, items.filter((i) => i.status === s).length])
  ) as Record<PunchStatus, number>;

  const displayed = filter === "All" ? items : items.filter((i) => i.status === filter);

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
                Punch List
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg p-1" style={{ background: "#F5F5F4" }}>
              {(["kanban", "list"] as const).map((v) => (
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
                  {v === "kanban" ? <Columns size={14} /> : <List size={14} />}
                  {v === "kanban" ? "Kanban" : "List"}
                </button>
              ))}
            </div>

            {/* Add Item button */}
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
              }}
              onClick={() => setNewDrawerOpen(true)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(22,163,74,0.45)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Item
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Filter bar — only when data is loaded */}
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBtn
                label="All"
                count={items.length}
                active={filter === "All"}
                onClick={() => setFilter("All")}
                dotColor="#A8A29E"
              />
              {PUNCH_STATUSES.map((s) => (
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
          ) : items.length === 0 ? (
            <EmptyState onNew={() => setNewDrawerOpen(true)} />
          ) : view === "kanban" ? (
            <KanbanView
              items={displayed}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <ListView items={displayed} onSelect={setSelected} />
          )}
        </div>
      </main>

      {/* Drawers */}
      <NewPunchItemDrawer
        open={newDrawerOpen}
        nextNumber={nextPunchNumber(items)}
        projectId={projectId}
        onClose={() => setNewDrawerOpen(false)}
        onSubmit={handleCreate}
      />
      <PunchDetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
