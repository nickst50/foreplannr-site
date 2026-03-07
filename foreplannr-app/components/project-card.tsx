"use client";

import { useRouter } from "next/navigation";
import { FileQuestion, Package, Calendar } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/projects";

export type { Project, ProjectStatus };

const statusConfig: Record<
  ProjectStatus,
  { bg: string; text: string; dot: string }
> = {
  "On Track": { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  "At Risk":  { bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" },
  "Delayed":  { bg: "#FFE4E6", text: "#BE123C", dot: "#F43F5E" },
};

const progressColor: Record<ProjectStatus, string> = {
  "On Track": "#F97316",
  "At Risk":  "#F59E0B",
  "Delayed":  "#F43F5E",
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

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide" style={{ color: "#A8A29E" }}>
        <Icon size={12} />
        {label}
      </div>
      <div className="text-[22px] font-display font-700 leading-none" style={{ color: "#1C1917" }}>
        {value}
      </div>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const barColor = progressColor[project.status];

  return (
    <article
      className="bg-white rounded-card flex flex-col gap-5 p-6 cursor-pointer transition-all duration-200"
      style={{
        border: "1px solid #E7E5E4",
        boxShadow: "0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.04)",
      }}
      onClick={() => router.push(`/projects/${project.id}`)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 20px rgba(28,25,23,0.10), 0 1px 4px rgba(28,25,23,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      {/* Top row: status badge + phase pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <StatusBadge status={project.status} />
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "#F5F5F4", color: "#78716C" }}
        >
          {project.phase}
        </span>
      </div>

      {/* Project name */}
      <h3
        className="font-display font-700 text-[18px] leading-snug tracking-[-0.02em]"
        style={{ color: "#1C1917" }}
      >
        {project.name}
      </h3>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "#78716C" }}>Completion</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: "#1C1917" }}>
            {project.completion}%
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${project.completion}%`,
              background: `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "#F5F5F4" }} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatItem icon={FileQuestion} label="Open RFIs"   value={project.openRFIs} />
        <StatItem icon={Package}      label="Submittals"  value={project.openSubmittals} />
        <StatItem icon={Calendar}     label="Days Out"    value={project.daysToCloseout ?? "--"} />
      </div>
    </article>
  );
}
