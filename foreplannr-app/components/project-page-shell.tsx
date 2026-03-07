"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type ProjectStatus, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

// ─── Status badge ────────────────────────────────────────────────────────────

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
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.dot }}
      />
      {status}
    </span>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function ProjectPageShell({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) setProject(rowToProject(data as DbProjectRow));
        else router.push("/dashboard");
      });
  }, [projectId, router]);

  if (!project) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#E7E5E4";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#F5F5F4";
              }}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]"
                  style={{ color: "#1C1917" }}
                >
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <p
                className="text-[13px] font-medium mt-0.5"
                style={{ color: "#A8A29E" }}
              >
                {project.phase}
                {project.client ? ` · ${project.client}` : ""}
              </p>
            </div>
          </div>

          {project.contractValue && (
            <div className="text-right hidden sm:block">
              <div
                className="font-display font-700 text-[18px] tracking-[-0.02em]"
                style={{ color: "#1C1917" }}
              >
                {project.contractValue}
              </div>
              <div className="text-[12px] font-medium" style={{ color: "#A8A29E" }}>
                Contract Value
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

// ─── Coming soon state ────────────────────────────────────────────────────────

export function ComingSoonState({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "calc(100vh - 160px)" }}
    >
      <div className="flex flex-col items-center text-center max-w-xs">
        {/* Illustration */}
        <div
          className="relative w-52 h-40 rounded-2xl flex flex-col items-center justify-center gap-3 overflow-hidden mb-8"
          style={{
            background: iconBg,
            border: `1.5px solid ${iconColor}20`,
          }}
        >
          {/* Decorative dots */}
          {[
            { top: "14%", left: "12%", size: 6, opacity: 0.18 },
            { top: "22%", left: "78%", size: 4, opacity: 0.12 },
            { top: "72%", left: "8%",  size: 5, opacity: 0.14 },
            { top: "78%", left: "82%", size: 7, opacity: 0.1  },
            { top: "55%", left: "88%", size: 4, opacity: 0.16 },
            { top: "40%", left: "6%",  size: 4, opacity: 0.12 },
          ].map((dot, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: dot.size,
                height: dot.size,
                top: dot.top,
                left: dot.left,
                background: iconColor,
                opacity: dot.opacity,
              }}
            />
          ))}

          {/* Icon card */}
          <div
            className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "#fff",
              boxShadow: `0 4px 20px ${iconColor}28, 0 1px 4px rgba(28,25,23,0.08)`,
            }}
          >
            <Icon size={26} style={{ color: iconColor }} />
          </div>

          {/* Skeleton rows */}
          <div className="relative z-10 flex flex-col gap-1.5 w-28">
            {[100, 72, 50].map((w, i) => (
              <div
                key={i}
                className="h-[5px] rounded-full"
                style={{
                  width: `${w}%`,
                  background: iconColor,
                  opacity: 0.14 + i * 0.04,
                }}
              />
            ))}
          </div>
        </div>

        {/* Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase mb-4"
          style={{ background: iconBg, color: iconColor }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: iconColor }}
          />
          Coming Soon
        </span>

        {/* Title */}
        <h2
          className="font-display font-700 text-[22px] tracking-[-0.02em] mb-2"
          style={{ color: "#1C1917" }}
        >
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: "#78716C" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
