"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Settings,
  FileText,
  FileQuestion,
  Package,
  CheckSquare,
  Archive,
  Users,
  CheckCircle2,
  LogOut,
  Truck,
  ExternalLink,
  PhoneCall,
} from "lucide-react";
import { checkHandoffComplete } from "@/lib/handoff";
import { checkTurnoverComplete } from "@/lib/turnover";
import { createClient } from "@/lib/supabase/client";
import { useCompanyType } from "@/lib/company-type-context";
import type { User } from "@supabase/supabase-js";

const contractorNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects",  href: "/projects",  icon: FolderKanban },
  { label: "My Tasks",  href: "/tasks",      icon: ClipboardList },
  { label: "Settings",  href: "/settings",   icon: Settings },
];

const distributionNavItems = [
  { label: "Dashboard",        href: "/dashboard",                icon: LayoutDashboard },
  { label: "Projects",         href: "/projects",                 icon: FolderKanban },
  { label: "Submittals",       href: "/distribution/submittals",  icon: Package },
  { label: "Ship Schedules",   href: "/distribution/ship-schedules", icon: Truck },
  { label: "Contractor Portal",href: "/distribution/portal",      icon: ExternalLink },
  { label: "My Tasks",         href: "/tasks",                    icon: ClipboardList },
  { label: "Settings",         href: "/settings",                 icon: Settings },
];

interface ProjectContext {
  id: string;
  name: string;
}

export function Sidebar({
  project,
  user,
}: {
  project?: ProjectContext;
  user?: User | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [handoffDone, setHandoffDone] = useState(false);
  const [turnoverDone, setTurnoverDone] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(user ?? null);
  const { companyType } = useCompanyType();

  // Fetch completion status from Supabase
  useEffect(() => {
    if (!project?.id) return;
    const supabase = createClient();
    checkHandoffComplete(project.id, supabase).then(setHandoffDone);
    checkTurnoverComplete(project.id, supabase).then(setTurnoverDone);
  }, [project?.id, pathname]);

  useEffect(() => {
    if (user !== undefined) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setAuthUser(u);
    });
  }, [user]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isDistribution =
    authUser?.email === "nickst36@live.com" || companyType === "distribution";
  console.log("[Sidebar] email:", authUser?.email, "| companyType:", companyType, "| isDistribution:", isDistribution);
  const navItems = isDistribution ? distributionNavItems : contractorNavItems;

  const contractorProjectNavItems = project
    ? [
        { label: "Overview",   href: `/projects/${project.id}`,            icon: LayoutDashboard, badge: undefined as "complete" | undefined },
        { label: "Handoff",    href: `/projects/${project.id}/handoff`,    icon: FileText,        badge: handoffDone ? ("complete" as const) : undefined },
        { label: "RFIs",       href: `/projects/${project.id}/rfis`,       icon: FileQuestion,    badge: undefined as "complete" | undefined },
        { label: "Submittals", href: `/projects/${project.id}/submittals`, icon: Package,         badge: undefined as "complete" | undefined },
        { label: "Punch List", href: `/projects/${project.id}/punch-list`, icon: CheckSquare,     badge: undefined as "complete" | undefined },
        { label: "Closeout",   href: `/projects/${project.id}/closeout`,   icon: Archive,         badge: undefined as "complete" | undefined },
        { label: "Team",       href: `/projects/${project.id}/team`,       icon: Users,           badge: undefined as "complete" | undefined },
      ]
    : [];

  const distributionProjectNavItems = project
    ? [
        { label: "Overview",          href: `/projects/${project.id}`,                     icon: LayoutDashboard, badge: undefined as "complete" | undefined },
        { label: "Turnover Meeting",  href: `/projects/${project.id}/turnover`,             icon: PhoneCall,       badge: turnoverDone ? ("complete" as const) : undefined },
        { label: "Submittals",        href: `/projects/${project.id}/submittals`,           icon: Package,         badge: undefined as "complete" | undefined },
        { label: "Ship Schedules",    href: `/projects/${project.id}/ship-schedules`,       icon: Truck,           badge: undefined as "complete" | undefined },
        { label: "Follow-ups",        href: `/projects/${project.id}/follow-ups`,           icon: ClipboardList,   badge: undefined as "complete" | undefined },
        { label: "Contractor Portal", href: `/projects/${project.id}/contractor-portal`,   icon: ExternalLink,    badge: undefined as "complete" | undefined },
        { label: "Team",              href: `/projects/${project.id}/team`,                 icon: Users,           badge: undefined as "complete" | undefined },
      ]
    : [];

  const projectNavItems = isDistribution ? distributionProjectNavItems : contractorProjectNavItems;

  const displayName =
    authUser?.user_metadata?.full_name ??
    authUser?.email?.split("@")[0] ??
    "Account";
  const displaySub = authUser?.email ?? "Project Manager";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-20"
      style={{ background: "#1C1917" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Image
          src="/logo.svg"
          alt="Foreplannr"
          width={39}
          height={36}
          unoptimized
          style={{ height: "36px", width: "auto" }}
        />
      </div>

      <div className="mx-4 mb-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="px-5 mb-2">
        <span className="text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ color: "rgba(168,162,158,0.7)" }}>
          Menu
        </span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/projects"
              ? pathname === "/projects"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <NavLink key={href} href={href} label={label} icon={Icon} isActive={isActive} />
          );
        })}

        {project && (
          <>
            <div className="mx-1 my-3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="px-2 mb-2">
              <span
                className="text-[10px] font-semibold tracking-[0.08em] uppercase truncate block"
                style={{ color: "rgba(168,162,158,0.7)" }}
                title={project.name}
              >
                {project.name.length > 22 ? project.name.slice(0, 22) + "…" : project.name}
              </span>
            </div>
            {projectNavItems.map(({ label, href, icon: Icon, badge }) => {
              const isActive = pathname === href;
              return (
                <NavLink key={href} href={href} label={label} icon={Icon} isActive={isActive} small badge={badge} />
              );
            })}
          </>
        )}
      </nav>

      <div className="mx-4 mt-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", color: "#fff" }}
          >
            {initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "#FAFAF9" }}>{displayName}</div>
            <div className="text-xs truncate" style={{ color: "#78716C" }}>{displaySub}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            style={{ color: "#78716C" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "#F87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#78716C";
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  small,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  small?: boolean;
  badge?: "complete";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg transition-colors duration-150 group",
        small ? "px-3 py-2" : "px-3 py-2.5",
        isActive ? "text-[#F97316]" : "text-stone-400 hover:text-stone-200"
      )}
      style={isActive ? { background: "rgba(249,115,22,0.12)" } : undefined}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "";
      }}
    >
      <span
        className={cn("absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-opacity duration-150", isActive ? "opacity-100" : "opacity-0")}
        style={{ background: "#F97316" }}
      />
      <Icon
        size={small ? 15 : 18}
        className={cn("flex-shrink-0 transition-colors duration-150", isActive ? "text-[#F97316]" : "text-stone-500 group-hover:text-stone-300")}
      />
      <span className={cn("font-medium flex-1", small ? "text-[13px]" : "text-sm", isActive ? "font-semibold" : "")}>
        {label}
      </span>
      {badge === "complete" && (
        <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: "#22C55E" }} />
      )}
    </Link>
  );
}
