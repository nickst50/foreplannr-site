"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type ProjectStatus, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { useCompanyType } from "@/lib/company-type-context";
import {
  ArrowLeft,
  FileQuestion,
  Package,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Users,
  FileText,
  Archive,
  ClipboardList,
  PhoneCall,
  Truck,
  Bell,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<ProjectStatus, { bg: string; text: string; dot: string }> = {
  "On Track": { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  "At Risk":  { bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" },
  "Delayed":  { bg: "#FFE4E6", text: "#BE123C", dot: "#F43F5E" },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "#78716C" }}>{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "#1C1917" }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F5F5F4" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
        />
      </div>
    </div>
  );
}

// ─── Contractor stats ──────────────────────────────────────────────────────────

interface ProjectStats {
  openRFIs: number;
  submittalPct: number;
  punchResolved: number;
  projectCompletion: number;
  closeoutPct: number;
}

async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  const supabase = createClient();

  const [
    { data: rfis },
    { data: submittals },
    { data: punch },
    { data: closeout },
  ] = await Promise.all([
    supabase.from("rfis").select("status").eq("project_id", projectId),
    supabase.from("submittals").select("status").eq("project_id", projectId),
    supabase.from("punch_list_items").select("status").eq("project_id", projectId),
    supabase.from("closeout_items").select("status").eq("project_id", projectId),
  ]);

  const openRFIs = (rfis ?? []).filter((r) => r.status !== "Answered" && r.status !== "Closed").length;
  const totalSubmittals = (submittals ?? []).length;
  const approvedSubmittals = (submittals ?? []).filter(
    (s) => s.status === "Approved" || s.status === "Approved w/ Comments"
  ).length;
  const submittalPct = totalSubmittals > 0 ? Math.round((approvedSubmittals / totalSubmittals) * 100) : 0;
  const totalPunch = (punch ?? []).length;
  const resolvedPunch = (punch ?? []).filter((p) => p.status === "Resolved").length;
  const punchResolved = totalPunch > 0 ? Math.round((resolvedPunch / totalPunch) * 100) : 0;
  const totalCloseout = (closeout ?? []).length;
  const doneCloseout = (closeout ?? []).filter((c) => c.status === "Done").length;
  const closeoutPct = totalCloseout > 0 ? Math.round((doneCloseout / totalCloseout) * 100) : 0;
  const hasData = totalSubmittals > 0 || totalPunch > 0 || totalCloseout > 0;
  const projectCompletion = hasData
    ? Math.round((submittalPct + punchResolved + closeoutPct) / 3)
    : 0;

  return { openRFIs, submittalPct, punchResolved, projectCompletion, closeoutPct };
}

// ─── Distribution stats ────────────────────────────────────────────────────────

interface DistributionStats {
  submittalsPending: number;
  shipSchedulesSent: number;
  openFollowUps: number;
  daysSinceAward: number;
  turnoverComplete: boolean;
}

async function fetchDistributionStats(projectId: string, createdAt: string): Promise<DistributionStats> {
  const supabase = createClient();

  const [{ data: submittals }, { data: turnover }] = await Promise.all([
    supabase.from("submittals").select("status").eq("project_id", projectId),
    supabase
      .from("turnover_meetings")
      .select("completed_at")
      .eq("project_id", projectId)
      .single(),
  ]);

  const submittalsPending = (submittals ?? []).filter(
    (s) => s.status !== "Approved" && s.status !== "Approved w/ Comments"
  ).length;

  const daysSinceAward = createdAt
    ? Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    submittalsPending,
    shipSchedulesSent: 0, // placeholder until ship_schedules table is built
    openFollowUps: 0,     // placeholder until follow_ups table is built
    daysSinceAward,
    turnoverComplete: !!turnover?.completed_at,
  };
}

// ─── Activity ─────────────────────────────────────────────────────────────────

interface ActivityItem {
  type: string;
  text: string;
  time: string;
}

interface DbActivityRow {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

const activityTypeStyles: Record<string, { bg: string; color: string }> = {
  rfi:      { bg: "#FFF7ED", color: "#F97316" },
  submittal:{ bg: "#F0FDF4", color: "#16A34A" },
  punch:    { bg: "#F5F3FF", color: "#7C3AED" },
  alert:    { bg: "#FFF1F2", color: "#DC2626" },
  team:     { bg: "#F0F9FF", color: "#0284C7" },
  handoff:  { bg: "#FAFAF9", color: "#78716C" },
  closeout: { bg: "#FFF1F2", color: "#DC2626" },
  task:     { bg: "#FFFBEB", color: "#D97706" },
  turnover: { bg: "#F0FDF4", color: "#16A34A" },
};

const activityIcons: Record<string, React.ElementType> = {
  rfi:      FileQuestion,
  submittal: Package,
  punch:    CheckSquare,
  alert:    AlertTriangle,
  team:     Users,
  handoff:  FileText,
  closeout: Archive,
  task:     ClipboardList,
  turnover: PhoneCall,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <div className="px-8 py-8 flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-card h-[96px]" style={{ background: "#F5F5F4" }} />)}
      </div>
      <div className="rounded-card h-[180px]" style={{ background: "#F5F5F4" }} />
      <div className="rounded-card h-[300px]" style={{ background: "#F5F5F4" }} />
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
  sublabel?: string;
}) {
  return (
    <div
      className="rounded-card p-5 flex items-center gap-4"
      style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <div className="font-display font-700 text-[26px] leading-none tracking-[-0.02em]" style={{ color: "#1C1917" }}>
          {value}
        </div>
        <div className="text-[12px] font-medium mt-0.5" style={{ color: "#A8A29E" }}>{label}</div>
        {sublabel && <div className="text-[11px] mt-0.5" style={{ color: "#C7C3C0" }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const { companyType } = useCompanyType();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [distStats, setDistStats] = useState<DistributionStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [
        { data: projData, error },
        { data: activityData },
      ] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("activity_log")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (!projData || error) { setNotFound(true); return; }
      const proj = rowToProject(projData as DbProjectRow);
      setProject(proj);

      if (companyType === "distribution") {
        const ds = await fetchDistributionStats(id, proj.createdAt);
        setDistStats(ds);
      } else {
        const ps = await fetchProjectStats(id);
        setStats(ps);
      }

      if (activityData && activityData.length > 0) {
        setActivity(
          activityData.map((row: DbActivityRow) => ({
            type: row.type,
            text: row.description,
            time: timeAgo(row.created_at),
          }))
        );
      }
      setLoading(false);
    }

    load();
  }, [id, companyType]);

  if (notFound) {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar />
        <main className="flex-1 ml-[260px] flex items-center justify-center">
          <div className="text-center">
            <p className="font-display font-700 text-[20px] mb-2" style={{ color: "#1C1917" }}>Project not found</p>
            <button onClick={() => router.push("/dashboard")} className="text-sm font-semibold" style={{ color: "#F97316" }}>
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar />
        <main className="flex-1 ml-[260px] min-h-screen">
          <header
            className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4"
            style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
          >
            <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: "#F5F5F4" }} />
            <div className="flex flex-col gap-1.5">
              <div className="w-40 h-4 rounded-full animate-pulse" style={{ background: "#F5F5F4" }} />
              <div className="w-56 h-6 rounded-full animate-pulse" style={{ background: "#F5F5F4" }} />
            </div>
          </header>
          <ProjectSkeleton />
        </main>
      </div>
    );
  }

  // ── Distribution hub ───────────────────────────────────────────────────────
  if (companyType === "distribution") {
    return (
      <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
        <Sidebar project={{ id: project.id, name: project.name }} />

        <main className="flex-1 ml-[260px] min-h-screen">
          {/* Header */}
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
            style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 flex-shrink-0"
                style={{ background: "#F5F5F4", color: "#78716C" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
              >
                <ArrowLeft size={15} />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} />
                </div>
                {project.client && (
                  <p className="text-[13px] font-medium mt-0.5" style={{ color: "#A8A29E" }}>
                    {project.client}
                    {project.branch ? ` · ${project.branch}` : ""}
                  </p>
                )}
              </div>
            </div>

            {project.contractValue && (
              <div className="text-right hidden sm:block">
                <div className="font-display font-700 text-[18px] tracking-[-0.02em]" style={{ color: "#1C1917" }}>
                  {project.contractValue}
                </div>
                <div className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>Contract Value</div>
              </div>
            )}
          </header>

          {loading ? (
            <ProjectSkeleton />
          ) : (
            <div className="px-8 py-8 flex flex-col gap-6">
              {/* Distribution stat tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                  icon={Package}
                  label="Submittals Pending"
                  value={distStats?.submittalsPending ?? 0}
                  iconBg="#FFF7ED"
                  iconColor="#F97316"
                />
                <StatTile
                  icon={Truck}
                  label="Ship Schedules Sent"
                  value={distStats?.shipSchedulesSent ?? "—"}
                  iconBg="#F0F9FF"
                  iconColor="#0EA5E9"
                  sublabel="Coming soon"
                />
                <StatTile
                  icon={Bell}
                  label="Open Follow-ups"
                  value={distStats?.openFollowUps ?? "—"}
                  iconBg="#F5F3FF"
                  iconColor="#7C3AED"
                  sublabel="Coming soon"
                />
                <StatTile
                  icon={Clock}
                  label="Days Since Award"
                  value={distStats?.daysSinceAward ?? 0}
                  iconBg="#F0FDF4"
                  iconColor="#16A34A"
                />
              </div>

              {/* Turnover meeting card */}
              <div
                className="rounded-card p-5 flex items-center justify-between cursor-pointer transition-all duration-150"
                style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
                onClick={() => router.push(`/projects/${project.id}/turnover`)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#F97316";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(249,115,22,0.08), 0 1px 3px rgba(28,25,23,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E7E5E4";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(28,25,23,0.05)";
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: distStats?.turnoverComplete ? "#F0FDF4" : "#FFF7ED" }}
                  >
                    <PhoneCall size={20} style={{ color: distStats?.turnoverComplete ? "#16A34A" : "#F97316" }} />
                  </div>
                  <div>
                    <div className="font-display font-700 text-[15px] tracking-[-0.01em]" style={{ color: "#1C1917" }}>
                      Turnover Meeting
                    </div>
                    <div className="text-[13px] mt-0.5" style={{ color: "#A8A29E" }}>
                      {distStats?.turnoverComplete
                        ? "Complete — contacts, scope, and PM checklist saved"
                        : "Set up job contacts, site requirements, and PM checklist"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {distStats?.turnoverComplete && (
                    <CheckCircle2 size={18} style={{ color: "#22C55E" }} />
                  )}
                  <ChevronRight size={18} style={{ color: "#A8A29E" }} />
                </div>
              </div>

              {/* Project details */}
              {(project.projectManager || project.branch || project.address) && (
                <div
                  className="rounded-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
                  style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
                >
                  {project.projectManager && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: "#A8A29E" }}>Project Manager</div>
                      <div className="text-sm font-semibold" style={{ color: "#1C1917" }}>{project.projectManager}</div>
                    </div>
                  )}
                  {project.branch && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: "#A8A29E" }}>Branch</div>
                      <div className="text-sm font-semibold" style={{ color: "#1C1917" }}>{project.branch}</div>
                    </div>
                  )}
                  {project.address && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: "#A8A29E" }}>Job Address</div>
                      <div className="text-sm font-semibold" style={{ color: "#1C1917" }}>{project.address}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent activity */}
              <ActivityCard activity={activity} />
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Contractor hub (original) ──────────────────────────────────────────────
  const progressColor =
    project.status === "On Track" ? "#F97316" : project.status === "At Risk" ? "#F59E0B" : "#F43F5E";

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
              onClick={() => router.push("/dashboard")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 flex-shrink-0"
              style={{ background: "#F5F5F4", color: "#78716C" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-[13px] font-medium mt-0.5" style={{ color: "#A8A29E" }}>
                {project.phase}{project.client ? ` · ${project.client}` : ""}
              </p>
            </div>
          </div>

          {project.contractValue && (
            <div className="text-right hidden sm:block">
              <div className="font-display font-700 text-[18px] tracking-[-0.02em]" style={{ color: "#1C1917" }}>
                {project.contractValue}
              </div>
              <div className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>Contract Value</div>
            </div>
          )}
        </header>

        {/* Page body */}
        {loading ? (
          <ProjectSkeleton />
        ) : (
          <div className="px-8 py-8 flex flex-col gap-6">
            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile icon={FileQuestion} label="Open RFIs" value={stats?.openRFIs ?? project.openRFIs} iconBg="#FFF7ED" iconColor="#F97316" />
              <StatTile icon={Package} label="Submittal %" value={`${stats?.submittalPct ?? project.submittalPct}%`} iconBg="#F0FDF4" iconColor="#16A34A" />
              <StatTile icon={Calendar} label="Days to Closeout" value={project.daysToCloseout} iconBg="#F0F9FF" iconColor="#0284C7" />
            </div>

            {/* Progress bars */}
            <div
              className="rounded-card p-6 flex flex-col gap-5"
              style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
            >
              <h2 className="font-display font-700 text-[15px] tracking-[-0.01em]" style={{ color: "#1C1917" }}>Progress</h2>
              <ProgressBar label="Project Completion" value={stats?.projectCompletion ?? project.completion} color={progressColor} />
              <ProgressBar label="Punch List Resolved" value={stats?.punchResolved ?? project.punchListResolved} color="#7C3AED" />
              {stats && stats.closeoutPct > 0 && (
                <ProgressBar label="Closeout" value={stats.closeoutPct} color="#DC2626" />
              )}
            </div>

            {/* Recent activity */}
            <ActivityCard activity={activity} />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Activity card (shared) ───────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <div
      className="rounded-card flex flex-col"
      style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
    >
      <div className="px-6 py-4" style={{ borderBottom: "1px solid #F5F5F4" }}>
        <h2 className="font-display font-700 text-[15px] tracking-[-0.01em]" style={{ color: "#1C1917" }}>Recent Activity</h2>
      </div>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#F5F5F4" }}>
            <FileText size={18} style={{ color: "#A8A29E" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#44403C" }}>No activity yet</p>
          <p className="text-[13px]" style={{ color: "#A8A29E" }}>
            Activity will appear here as you use the project.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "#F5F5F4" }}>
          {activity.map((item, i) => {
            const Icon = activityIcons[item.type] ?? FileText;
            const style = activityTypeStyles[item.type] ?? activityTypeStyles.handoff;
            return (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: style.bg }}>
                  <Icon size={15} style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: "#1C1917" }}>{item.text}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "#A8A29E" }}>{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
