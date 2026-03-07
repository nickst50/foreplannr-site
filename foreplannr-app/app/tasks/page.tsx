"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMyTasks,
  completeTask,
  reopenTask,
  isOverdue,
  isDueToday,
  formatDate,
  priorityConfig,
  type Task,
  type TaskStatus,
} from "@/lib/tasks-db";
import type { User } from "@supabase/supabase-js";
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Calendar,
  FolderOpen,
} from "lucide-react";

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterTab = "All" | "Today" | "Overdue" | "Upcoming";

const FILTERS: FilterTab[] = ["All", "Today", "Overdue", "Upcoming"];

function filterTasks(tasks: Task[], filter: FilterTab): Task[] {
  switch (filter) {
    case "Today":
      return tasks.filter((t) => isDueToday(t.dueDate) && t.status !== "Done");
    case "Overdue":
      return tasks.filter((t) => isOverdue(t.dueDate, t.status));
    case "Upcoming": {
      const today = new Date(new Date().toDateString());
      return tasks.filter((t) => {
        if (!t.dueDate || t.status === "Done") return false;
        const due = new Date(t.dueDate);
        return due > today && !isDueToday(t.dueDate);
      });
    }
    default:
      return tasks;
  }
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function TasksSkeleton() {
  return (
    <div className="px-8 py-8 flex flex-col gap-3 animate-pulse">
      <div className="h-10 w-72 rounded-xl mb-4" style={{ background: "#F5F5F4" }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-[76px] rounded-2xl" style={{ background: "#F5F5F4" }} />
      ))}
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const done = task.status === "Done";
  const overdue = isOverdue(task.dueDate, task.status);
  const today = isDueToday(task.dueDate);
  const pCfg = priorityConfig[task.priority];

  async function handleToggle() {
    setToggling(true);
    await onToggle();
    setToggling(false);
  }

  let dateColor = "#A8A29E";
  if (overdue) dateColor = "#BE123C";
  else if (today) dateColor = "#C2410C";

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-150"
      style={{
        background: done ? "#FAFAF9" : overdue ? "#FFF8F8" : today ? "#FFFBEB" : "#fff",
        border: `1px solid ${done ? "#F5F5F4" : overdue ? "#FECDD3" : today ? "#FDE68A" : "#E7E5E4"}`,
        opacity: done ? 0.65 : 1,
        boxShadow: done ? "none" : "0 1px 3px rgba(28,25,23,0.05)",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className="flex-shrink-0 transition-all duration-150"
        title={done ? "Mark as open" : "Mark as done"}
        style={{ color: done ? "#22C55E" : "#D6D3D1", opacity: toggling ? 0.5 : 1 }}
        onMouseEnter={(e) => { if (!done) (e.currentTarget as HTMLElement).style.color = "#22C55E"; }}
        onMouseLeave={(e) => { if (!done) (e.currentTarget as HTMLElement).style.color = "#D6D3D1"; }}
      >
        {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p
            className="text-sm font-semibold"
            style={{
              color: done ? "#A8A29E" : "#1C1917",
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {task.title}
          </p>
          {/* Priority badge */}
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: pCfg.bg, color: pCfg.text }}
          >
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project name */}
          {task.projectName && (
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "#78716C" }}>
              <FolderOpen size={11} />
              {task.projectName}
            </span>
          )}
          {/* Due date */}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: dateColor }}>
              {overdue ? <AlertCircle size={11} /> : today ? <Clock size={11} /> : <Calendar size={11} />}
              {overdue ? "Overdue · " : today ? "Due today · " : ""}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Status tag */}
      <div className="flex-shrink-0">
        {overdue && !done && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#FFF1F2", color: "#BE123C" }}>Overdue</span>
        )}
        {today && !done && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#FFF7ED", color: "#C2410C" }}>Due Today</span>
        )}
        {done && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#F0FDF4", color: "#15803D" }}>Done</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("All");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }
      setUser(authUser);
      const myTasks = await fetchMyTasks(authUser.id, supabase);
      setTasks(myTasks);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleToggle(task: Task) {
    const supabase = createClient();
    if (task.status === "Done") {
      const ok = await reopenTask(task.id, supabase);
      if (ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "Open" as TaskStatus, completedAt: null } : t));
    } else {
      const ok = await completeTask(task.id, supabase);
      if (ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "Done" as TaskStatus, completedAt: new Date().toISOString() } : t));
    }
  }

  const filtered = filterTasks(tasks, filter);

  // Count badges
  const todayCount = filterTasks(tasks, "Today").length;
  const overdueCount = filterTasks(tasks, "Overdue").length;
  const upcomingCount = filterTasks(tasks, "Upcoming").length;

  const badgeCount: Record<FilterTab, number> = {
    All: tasks.length,
    Today: todayCount,
    Overdue: overdueCount,
    Upcoming: upcomingCount,
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar user={user} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>Your task list</p>
            <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>My Tasks</h1>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
              <AlertCircle size={14} style={{ color: "#DC2626" }} />
              <span className="text-[13px] font-semibold" style={{ color: "#BE123C" }}>{overdueCount} overdue</span>
            </div>
          )}
        </header>

        {loading ? (
          <TasksSkeleton />
        ) : (
          <div className="px-8 py-8 flex flex-col gap-5">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map((tab) => {
                const active = filter === tab;
                const count = badgeCount[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
                    style={{
                      background: active ? (tab === "Overdue" ? "#FFF1F2" : "#FFF7ED") : "#fff",
                      color: active ? (tab === "Overdue" ? "#BE123C" : "#F97316") : "#78716C",
                      border: `1.5px solid ${active ? (tab === "Overdue" ? "#FECDD3" : "#FDBA74") : "#E7E5E4"}`,
                    }}
                  >
                    {tab}
                    {count > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center"
                        style={{
                          background: active ? (tab === "Overdue" ? "#FECDD3" : "#FDBA74") : "#F5F5F4",
                          color: active ? (tab === "Overdue" ? "#BE123C" : "#9A3412") : "#78716C",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
                style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#FFF7ED" }}>
                  <ClipboardList size={24} style={{ color: "#F97316" }} />
                </div>
                <p className="font-display font-700 text-[16px] mb-1" style={{ color: "#1C1917" }}>
                  {filter === "All" ? "No tasks assigned to you" : `No ${filter.toLowerCase()} tasks`}
                </p>
                <p className="text-sm" style={{ color: "#A8A29E" }}>
                  {filter === "All"
                    ? "Tasks assigned to you across all projects will appear here."
                    : `You're all caught up on ${filter.toLowerCase()} tasks.`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={() => handleToggle(task)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
