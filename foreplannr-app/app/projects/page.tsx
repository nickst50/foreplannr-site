"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ProjectCard } from "@/components/project-card";
import { NewProjectModal } from "@/components/new-project-modal";
import { Plus, FolderKanban, Search } from "lucide-react";
import {
  rowToProject,
  type Project,
  type ProjectInput,
  type DbProjectRow,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type StatusFilter = "All" | "On Track" | "At Risk" | "Delayed";

const STATUS_FILTERS: StatusFilter[] = ["All", "On Track", "At Risk", "Delayed"];

const filterDot: Record<StatusFilter, string> = {
  All: "#A8A29E",
  "On Track": "#22C55E",
  "At Risk": "#EAB308",
  Delayed: "#F43F5E",
};

export default function ProjectsPage() {
  console.log("[ProjectsPage] rendering");

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw new Error(fetchError.message);
        if (data) setProjects(data.map((r) => rowToProject(r as DbProjectRow)));
      } catch (err) {
        console.error("[ProjectsPage] load error:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleNewProject(input: ProjectInput) {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error: insertError } = await supabase
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
        phase: "Pre-Construction",
        completion: 0,
        punch_list_resolved: 0,
        submittal_pct: 0,
        open_rfis: 0,
        open_submittals: 0,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    if (data) setProjects((prev) => [rowToProject(data as DbProjectRow), ...prev]);
    setModalOpen(false);
  }

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== "All") list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, statusFilter, search]);

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar user={user} />

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
          <div>
            <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>
              All projects
            </p>
            <h1
              className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]"
              style={{ color: "#1C1917" }}
            >
              Projects
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

        <div className="px-8 py-8">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-7">
            <div
              className="relative flex-1 max-w-sm"
            >
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#A8A29E" }}
              />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-150"
                style={{
                  border: "1.5px solid #E7E5E4",
                  background: "#fff",
                  color: "#1C1917",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#F97316";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E7E5E4";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: active ? "#FFF7ED" : "#fff",
                      color: active ? "#F97316" : "#78716C",
                      border: active ? "1.5px solid #FED7AA" : "1.5px solid #E7E5E4",
                    }}
                  >
                    {f !== "All" && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: filterDot[f] }}
                      />
                    )}
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div
              className="rounded-xl px-5 py-4 text-sm mb-6"
              style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }}
            >
              <strong>Error loading projects:</strong> {error}
            </div>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-card h-[200px] animate-pulse"
                  style={{ background: "#F5F5F4", border: "1px solid #E7E5E4" }}
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            /* Empty state — no projects at all */
            <div
              className="rounded-card flex flex-col items-center justify-center py-24 text-center"
              style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#FFF7ED" }}
              >
                <FolderKanban size={26} style={{ color: "#F97316" }} />
              </div>
              <p
                className="font-display font-700 text-[18px] mb-1.5 tracking-[-0.02em]"
                style={{ color: "#1C1917" }}
              >
                No projects yet
              </p>
              <p className="text-sm mb-6 max-w-[260px]" style={{ color: "#A8A29E" }}>
                Create your first project to start tracking RFIs, submittals, and closeout.
              </p>
              <button
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
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
                Create your first project
              </button>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state — filters returned nothing */
            <div
              className="rounded-card flex flex-col items-center justify-center py-20 text-center"
              style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
            >
              <p
                className="font-display font-700 text-[16px] mb-1"
                style={{ color: "#1C1917" }}
              >
                No matches
              </p>
              <p className="text-sm" style={{ color: "#A8A29E" }}>
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium mb-5" style={{ color: "#A8A29E" }}>
                {filtered.length} {filtered.length === 1 ? "project" : "projects"}
                {statusFilter !== "All" ? ` · ${statusFilter}` : ""}
                {search.trim() ? ` · "${search.trim()}"` : ""}
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleNewProject}
        />
      )}
    </div>
  );
}
