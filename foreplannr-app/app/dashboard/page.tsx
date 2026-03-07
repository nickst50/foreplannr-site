"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ProjectCard } from "@/components/project-card";
import { NewProjectModal } from "@/components/new-project-modal";
import { Plus, TrendingUp, AlertTriangle, Clock, Layers, Package, Truck, Bell } from "lucide-react";
import { rowToProject, type Project, type ProjectInput, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { useCompanyType } from "@/lib/company-type-context";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { companyType } = useCompanyType();

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      setUser(authUser);

      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setProjects(data.map((r) => rowToProject(r as DbProjectRow)));
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleNewProject(input: ProjectInput) {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const isDistribution = companyType === "distribution";
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: authUser.id,
        name: input.name,
        client: input.client,
        address: input.address,
        contract_value: input.contractValue,
        start_date: input.startDate || null,
        closeout_date: input.closeoutDate || null,
        status: "On Track",
        phase: isDistribution ? "Active" : "Pre-Construction",
        completion: 0,
        punch_list_resolved: 0,
        submittal_pct: 0,
        open_rfis: 0,
        open_submittals: 0,
        branch: input.branch ?? "",
        project_manager: input.projectManager ?? "",
      })
      .select()
      .single();

    if (data) {
      setProjects((prev) => [rowToProject(data as DbProjectRow), ...prev]);
    }

    if (error) throw new Error(error.message);
    setModalOpen(false);
  }

  const onTrackCount = projects.filter((p) => p.status === "On Track").length;
  const atRiskCount = projects.filter(
    (p) => p.status === "At Risk" || p.status === "Delayed"
  ).length;
  const avgDays =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (typeof p.daysToCloseout === "number" ? p.daysToCloseout : 0), 0) /
            projects.length
        )
      : 0;

  const contractorStats = [
    { label: "Total Projects",     value: String(projects.length), icon: Layers,        color: "#F97316", bg: "#FFF7ED" },
    { label: "On Track",           value: String(onTrackCount),    icon: TrendingUp,    color: "#16A34A", bg: "#F0FDF4" },
    { label: "At Risk / Delayed",  value: String(atRiskCount),     icon: AlertTriangle, color: "#DC2626", bg: "#FFF1F2" },
    { label: "Avg. Days to Close", value: String(avgDays),         icon: Clock,         color: "#0284C7", bg: "#F0F9FF" },
  ];

  const distributionStats = [
    { label: "Active Projects",       value: String(projects.length), icon: Layers,        color: "#0EA5E9", bg: "#F0F9FF" },
    { label: "Pending Submittals",    value: "—",                     icon: AlertTriangle, color: "#F97316", bg: "#FFF7ED" },
    { label: "Ship Schedules Due",    value: "—",                     icon: Clock,         color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Open Follow-ups",       value: "—",                     icon: TrendingUp,    color: "#16A34A", bg: "#F0FDF4" },
  ];

  const summaryStats = companyType === "distribution" ? distributionStats : contractorStats;

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar user={user} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Sticky top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(250,250,249,0.90)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E7E5E4",
          }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>
              Good morning, {firstName}.
            </p>
            <h1
              className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]"
              style={{ color: "#1C1917" }}
            >
              Dashboard
            </h1>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
            }}
            onClick={() => setModalOpen(true)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 14px rgba(249,115,22,0.45)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 2px 8px rgba(249,115,22,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Project
          </button>
        </header>

        {/* Page body */}
        <div className="px-8 py-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {summaryStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-card p-5 flex items-center gap-4"
                style={{
                  background: "#fff",
                  border: "1px solid #E7E5E4",
                  boxShadow: "0 1px 3px rgba(28,25,23,0.05)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <div
                    className="font-display font-700 text-[24px] leading-none tracking-[-0.02em]"
                    style={{ color: "#1C1917" }}
                  >
                    {value}
                  </div>
                  <div
                    className="text-[12px] font-medium mt-0.5"
                    style={{ color: "#A8A29E" }}
                  >
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section heading */}
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-display font-700 text-[16px] tracking-[-0.01em]"
              style={{ color: "#1C1917" }}
            >
              Active Projects
            </h2>
            <button
              className="text-[13px] font-semibold transition-colors duration-150"
              style={{ color: "#F97316" }}
            >
              View all
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-card h-[180px] animate-pulse"
                  style={{ background: "#F5F5F4", border: "1px solid #E7E5E4" }}
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div
              className="rounded-card flex flex-col items-center justify-center py-20 text-center"
              style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "#FFF7ED" }}
              >
                <Layers size={22} style={{ color: "#F97316" }} />
              </div>
              <p
                className="font-display font-700 text-[16px] mb-1"
                style={{ color: "#1C1917" }}
              >
                No projects yet
              </p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>
                Click &quot;New Project&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Distribution activity feed */}
          {companyType === "distribution" && !loading && (
            <div className="mt-8">
              <h2
                className="font-display font-700 text-[16px] tracking-[-0.01em] mb-5"
                style={{ color: "#1C1917" }}
              >
                Recent Activity
              </h2>
              <div
                className="rounded-card"
                style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
              >
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F0F9FF" }}>
                      <Package size={17} style={{ color: "#0EA5E9" }} />
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F5F3FF" }}>
                      <Truck size={17} style={{ color: "#7C3AED" }} />
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#FFF7ED" }}>
                      <Bell size={17} style={{ color: "#F97316" }} />
                    </div>
                  </div>
                  <p className="font-display font-700 text-[15px] mb-1" style={{ color: "#1C1917" }}>
                    Activity will appear here
                  </p>
                  <p className="text-[13px]" style={{ color: "#A8A29E" }}>
                    Submittal approvals, ship schedule updates, and follow-up reminders will show up as you use the platform.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleNewProject}
          companyType={companyType}
        />
      )}
    </div>
  );
}
