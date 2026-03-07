"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCloseoutItems,
  createCloseoutItem,
  updateCloseoutItem,
  deleteCloseoutItem,
  closeoutPercent,
  formatDate,
  CLOSEOUT_CATEGORIES,
  CLOSEOUT_STATUSES,
  statusConfig,
  type CloseoutItem,
  type CloseoutCategory,
  type CloseoutStatus,
  type CloseoutItemInput,
} from "@/lib/closeout";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Archive,
  Check,
  X,
  Pencil,
} from "lucide-react";

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function CloseoutSkeleton() {
  return (
    <div className="px-8 py-8 flex flex-col gap-6 animate-pulse">
      <div className="h-[80px] rounded-2xl" style={{ background: "#F5F5F4" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[120px] rounded-2xl" style={{ background: "#F5F5F4" }} />
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CloseoutStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

// ─── Add item drawer ───────────────────────────────────────────────────────────

function AddItemDrawer({
  defaultCategory,
  onClose,
  onAdd,
}: {
  defaultCategory?: CloseoutCategory;
  onClose: () => void;
  onAdd: (input: CloseoutItemInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CloseoutItemInput>({
    title: "",
    category: defaultCategory ?? CLOSEOUT_CATEGORIES[0],
    responsibleParty: "",
    dueDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    try {
      await onAdd(form);
      onClose();
    } catch {
      setError("Failed to add item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-shadow duration-150";
  const inputStyle = { border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#DC2626";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.10)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E7E5E4";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(28,25,23,0.5)" }} onClick={onClose}>
      <div className="ml-auto w-full max-w-md h-full flex flex-col" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E7E5E4" }}>
          <h2 className="font-display font-700 text-[18px] tracking-[-0.02em]" style={{ color: "#1C1917" }}>Add Closeout Item</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5F5F4", color: "#78716C" }}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: "#FFF1F2", color: "#BE123C" }}>{error}</div>
          )}

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Title *</label>
            <input className={inputClass} style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. HVAC O&M Manual" onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Category</label>
            <select className={inputClass} style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CloseoutCategory })} onFocus={onFocus} onBlur={onBlur}>
              {CLOSEOUT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Responsible Party</label>
            <input className={inputClass} style={inputStyle} value={form.responsibleParty} onChange={(e) => setForm({ ...form, responsibleParty: e.target.value })} placeholder="e.g. HVAC Contractor" onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Due Date</label>
            <input type="date" className={inputClass} style={inputStyle} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Notes</label>
            <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional context…" onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        <div className="px-6 py-5 flex gap-3" style={{ borderTop: "1px solid #E7E5E4" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150" style={{ background: "#F5F5F4", color: "#44403C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)", boxShadow: "0 2px 8px rgba(220,38,38,0.35)", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit row inline ───────────────────────────────────────────────────────────

function CloseoutRow({
  item,
  onStatusChange,
  onDelete,
}: {
  item: CloseoutItem;
  onStatusChange: (status: CloseoutStatus) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cfg = statusConfig[item.status];

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150"
      style={{ borderBottom: "1px solid #F5F5F4" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF9"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Status dot */}
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#1C1917" }}>{item.title}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {item.responsibleParty && (
            <span className="text-[12px]" style={{ color: "#78716C" }}>{item.responsibleParty}</span>
          )}
          {item.dueDate && (
            <span className="text-[12px]" style={{ color: "#78716C" }}>Due {formatDate(item.dueDate)}</span>
          )}
          {item.notes && (
            <span className="text-[12px] italic truncate max-w-[200px]" style={{ color: "#A8A29E" }}>{item.notes}</span>
          )}
        </div>
      </div>

      {/* Status select */}
      <select
        value={item.status}
        onChange={(e) => onStatusChange(e.target.value as CloseoutStatus)}
        className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold outline-none cursor-pointer"
        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      >
        {CLOSEOUT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onDelete}
            className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
            style={{ background: "#FFF1F2", color: "#BE123C" }}
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
            style={{ background: "#F5F5F4", color: "#78716C" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
          style={{ color: "#D6D3D1" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#DC2626"; (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#D6D3D1"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  items,
  onAddItem,
  onStatusChange,
  onDelete,
}: {
  category: CloseoutCategory;
  items: CloseoutItem[];
  onAddItem: (cat: CloseoutCategory) => void;
  onStatusChange: (id: string, status: CloseoutStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const done = items.filter((i) => i.status === "Done").length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        style={{ borderBottom: expanded ? "1px solid #E7E5E4" : "none" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronDown size={16} style={{ color: "#A8A29E", flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: "#A8A29E", flexShrink: 0 }} />}
        <h3 className="font-display font-700 text-[15px] tracking-[-0.01em] flex-1" style={{ color: "#1C1917" }}>{category}</h3>
        {items.length > 0 && (
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: done === items.length ? "#F0FDF4" : "#F5F5F4", color: done === items.length ? "#15803D" : "#78716C" }}>
            {done}/{items.length} done
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onAddItem(category); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors duration-150"
          style={{ background: "#FFF1F2", color: "#DC2626" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FECDD3"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {/* Items */}
      {expanded && (
        <>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FFF1F2" }}>
                <Archive size={18} style={{ color: "#DC2626" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#44403C" }}>No items yet</p>
              <p className="text-[13px]" style={{ color: "#A8A29E" }}>Click &quot;Add&quot; to track a {category.toLowerCase()} document.</p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CloseoutRow
                  key={item.id}
                  item={item}
                  onStatusChange={(status) => onStatusChange(item.id, status)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CloseoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const projectId = id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<CloseoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<CloseoutCategory | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: projData, error: projErr }, closeoutItems] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        fetchCloseoutItems(projectId, supabase),
      ]);
      if (projData && !projErr) setProject(rowToProject(projData as DbProjectRow));
      else { router.push("/dashboard"); return; }
      setItems(closeoutItems);
      setLoading(false);
    }
    load();
  }, [projectId, router]);

  async function handleAdd(input: CloseoutItemInput) {
    const supabase = createClient();
    const created = await createCloseoutItem(projectId, input, supabase);
    if (created) {
      setItems((prev) => [...prev, created]);
      // If all done, update project phase
      const allItems = [...items, created];
      if (closeoutPercent(allItems) === 100) {
        await supabase.from("projects").update({ phase: "Complete" }).eq("id", projectId);
      }
    } else {
      throw new Error("Failed to create item");
    }
  }

  async function handleStatusChange(itemId: string, status: CloseoutStatus) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status } : i));
    const supabase = createClient();
    const ok = await updateCloseoutItem(itemId, { status }, supabase);
    if (!ok) {
      setError("Failed to update status.");
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i } : i));
    }
    // Check if all done
    const updated = items.map((i) => i.id === itemId ? { ...i, status } : i);
    if (closeoutPercent(updated) === 100) {
      await supabase.from("projects").update({ phase: "Complete" }).eq("id", projectId);
    }
  }

  async function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    const supabase = createClient();
    const ok = await deleteCloseoutItem(itemId, supabase);
    if (!ok) setError("Failed to delete item.");
  }

  function openDrawer(cat?: CloseoutCategory) {
    setDrawerCategory(cat);
    setDrawerOpen(true);
  }

  const pct = closeoutPercent(items);
  const totalItems = items.length;
  const doneItems = items.filter((i) => i.status === "Done").length;

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar project={project ? { id: project.id, name: project.name } : undefined} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
              style={{ background: "#F5F5F4", color: "#78716C" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              {project && <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>{project.name}</p>}
              <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>Closeout Hub</h1>
            </div>
          </div>

          <button
            onClick={() => openDrawer()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(220,38,38,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(220,38,38,0.35)";
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Item
          </button>
        </header>

        {loading ? (
          <CloseoutSkeleton />
        ) : (
          <div className="px-8 py-8 flex flex-col gap-6">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between" style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }}>
                {error}
                <button onClick={() => setError("")}><X size={14} /></button>
              </div>
            )}

            {/* Overall progress */}
            <div
              className="rounded-2xl p-6 flex items-center gap-6"
              style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
            >
              <div
                className="relative w-20 h-20 flex-shrink-0"
                style={{ borderRadius: "50%" }}
              >
                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F5F5F4" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={pct === 100 ? "#22C55E" : "#DC2626"}
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {pct === 100 ? (
                    <Check size={24} style={{ color: "#22C55E" }} strokeWidth={3} />
                  ) : (
                    <span className="font-display font-700 text-[18px]" style={{ color: "#1C1917" }}>{pct}%</span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="font-display font-700 text-[18px] tracking-[-0.02em] mb-1" style={{ color: "#1C1917" }}>
                  {pct === 100 ? "Closeout Complete!" : "Closeout Progress"}
                </h2>
                <p className="text-sm" style={{ color: "#78716C" }}>
                  {totalItems === 0
                    ? "No items tracked yet. Add your first closeout document above."
                    : `${doneItems} of ${totalItems} items complete`}
                </p>
                {pct === 100 && (
                  <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#DCFCE7", color: "#15803D" }}>
                    <Check size={11} strokeWidth={3} />
                    Project phase updated to Complete
                  </span>
                )}
              </div>
            </div>

            {/* Category sections */}
            {CLOSEOUT_CATEGORIES.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={items.filter((i) => i.category === category)}
                onAddItem={openDrawer}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {drawerOpen && (
        <AddItemDrawer
          defaultCategory={drawerCategory}
          onClose={() => setDrawerOpen(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
