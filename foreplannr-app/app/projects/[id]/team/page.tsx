"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { rowToProject, type Project, type DbProjectRow } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProjectMembers,
  addProjectMember,
  removeProjectMember,
  initials,
  avatarColor,
  MEMBER_ROLES,
  type ProjectMember,
} from "@/lib/team";
import { ArrowLeft, Plus, Users, UserMinus, X, AlertTriangle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="px-8 py-8 flex flex-col gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 rounded-2xl" style={{ background: "#F5F5F4", height: 72 }} />
      ))}
    </div>
  );
}

// ─── Invite drawer ─────────────────────────────────────────────────────────────

function InviteDrawer({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, name: string, role: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    setSubmitting(true);
    try {
      await onInvite(email.trim(), name.trim(), role);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-shadow duration-150";
  const inputStyle = { border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#F59E0B";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E7E5E4";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(28,25,23,0.5)" }} onClick={onClose}>
      <div className="ml-auto w-full max-w-md h-full flex flex-col" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E7E5E4" }}>
          <h2 className="font-display font-700 text-[18px] tracking-[-0.02em]" style={{ color: "#1C1917" }}>Invite Team Member</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5F5F4", color: "#78716C" }}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ background: "#FFF1F2", color: "#BE123C" }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Email Address *</label>
            <input type="email" className={inputClass} style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contractor@example.com" onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Full Name</label>
            <input className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>Role</label>
            <select className={inputClass} style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} onFocus={onFocus} onBlur={onBlur}>
              {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}>
            This person will be added to your project team. They will not receive an automatic email invitation — you may need to notify them directly.
          </div>
        </div>

        <div className="px-6 py-5 flex gap-3" style={{ borderTop: "1px solid #E7E5E4" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150" style={{ background: "#F5F5F4", color: "#44403C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 2px 8px rgba(245,158,11,0.35)", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Adding…" : "Add to Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Remove confirmation dialog ────────────────────────────────────────────────

function RemoveDialog({
  member,
  onClose,
  onConfirm,
}: {
  member: ProjectMember;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,25,23,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-4" style={{ background: "white" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F2" }}>
          <UserMinus size={22} style={{ color: "#DC2626" }} />
        </div>
        <div>
          <h3 className="font-display font-700 text-[18px] tracking-[-0.02em] mb-1" style={{ color: "#1C1917" }}>Remove Team Member?</h3>
          <p className="text-sm" style={{ color: "#78716C" }}>
            <strong>{member.fullName || member.email}</strong> will be removed from this project. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#F5F5F4", color: "#44403C" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#DC2626", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  isCurrentUser,
  onRemove,
}: {
  member: ProjectMember;
  isCurrentUser: boolean;
  onRemove: () => void;
}) {
  const color = avatarColor(member.fullName || member.email);
  const ini = initials(member.fullName || member.email);

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-shadow duration-150"
      style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(28,25,23,0.1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(28,25,23,0.05)"; }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
        style={{ background: color }}
      >
        {ini}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: "#1C1917" }}>
            {member.fullName || member.email}
          </p>
          {isCurrentUser && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "#FFF7ED", color: "#F97316" }}>
              You
            </span>
          )}
        </div>
        <p className="text-[12px]" style={{ color: "#78716C" }}>{member.email}</p>
      </div>

      {/* Role badge */}
      <span className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#F5F5F4", color: "#57534E" }}>
        {member.role}
      </span>

      {/* Remove button */}
      {!isCurrentUser && (
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150"
          style={{ color: "#D6D3D1" }}
          title="Remove member"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#DC2626"; (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#D6D3D1"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <UserMinus size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { id } = useParams();
  const router = useRouter();
  const projectId = id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [{ data: { user } }, { data: projData, error: projErr }, teamMembers] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("projects").select("*").eq("id", projectId).single(),
        fetchProjectMembers(projectId, supabase),
      ]);
      setCurrentUser(user);
      if (projData && !projErr) setProject(rowToProject(projData as DbProjectRow));
      else { router.push("/dashboard"); return; }
      setMembers(teamMembers);
      setLoading(false);
    }
    load();
  }, [projectId, router]);

  async function handleInvite(email: string, name: string, role: string) {
    const supabase = createClient();
    if (!currentUser) return;
    const existing = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error("This person is already on the team.");
    const member = await addProjectMember(projectId, email, name, role, currentUser.id, supabase);
    if (!member) throw new Error("Failed to add member. Please try again.");
    setMembers((prev) => [...prev, member]);
  }

  async function handleRemove() {
    if (!removingMember) return;
    const supabase = createClient();
    const ok = await removeProjectMember(removingMember.id, supabase);
    if (ok) {
      setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
    } else {
      setError("Failed to remove member.");
    }
    setRemovingMember(null);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar project={project ? { id: project.id, name: project.name } : undefined} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Header */}
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
              <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>Team</h1>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(245,158,11,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(245,158,11,0.35)";
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Invite Member
          </button>
        </header>

        {loading ? (
          <TeamSkeleton />
        ) : (
          <div className="px-8 py-8 flex flex-col gap-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between" style={{ background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }}>
                {error}
                <button onClick={() => setError("")}><X size={14} /></button>
              </div>
            )}

            {/* Count */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-700 text-[16px] tracking-[-0.01em]" style={{ color: "#1C1917" }}>
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </h2>
            </div>

            {/* Empty state */}
            {members.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
                style={{ border: "1.5px dashed #E7E5E4", background: "#fff" }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#FFFBEB" }}>
                  <Users size={24} style={{ color: "#F59E0B" }} />
                </div>
                <p className="font-display font-700 text-[16px] mb-1" style={{ color: "#1C1917" }}>No team members yet</p>
                <p className="text-sm mb-6" style={{ color: "#A8A29E" }}>Invite subcontractors, engineers, and collaborators to this project.</p>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                >
                  <Plus size={16} />
                  Invite First Member
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isCurrentUser={currentUser?.id === member.userId || currentUser?.email === member.email}
                    onRemove={() => setRemovingMember(member)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {drawerOpen && (
        <InviteDrawer onClose={() => setDrawerOpen(false)} onInvite={handleInvite} />
      )}

      {removingMember && (
        <RemoveDialog
          member={removingMember}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleRemove}
        />
      )}
    </div>
  );
}
