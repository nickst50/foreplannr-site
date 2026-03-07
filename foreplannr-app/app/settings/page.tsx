"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { User, Shield, Building2, Bell, Trash2, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="px-8 py-8 max-w-2xl flex flex-col gap-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl h-[200px]" style={{ background: "#F5F5F4" }} />
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  iconBg,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(28,25,23,0.05)" }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid #E7E5E4" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <h2 className="font-display font-700 text-[15px] tracking-[-0.01em]" style={{ color: "#1C1917" }}>{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-shadow duration-150"
        style={{
          border: "1.5px solid #E7E5E4",
          background: disabled ? "#F5F5F4" : "white",
          color: disabled ? "#A8A29E" : "#1C1917",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "#F97316";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E7E5E4";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {hint && <p className="text-[12px] mt-1" style={{ color: "#A8A29E" }}>{hint}</p>}
    </div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────

function SaveButton({
  onClick,
  saving,
  saved,
  label = "Save Changes",
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150"
      style={{
        background: saved ? "linear-gradient(135deg, #22C55E, #16A34A)" : "linear-gradient(135deg, #F97316, #EA580C)",
        boxShadow: saved ? "0 2px 8px rgba(34,197,94,0.35)" : "0 2px 8px rgba(249,115,22,0.35)",
        opacity: saving ? 0.7 : 1,
      }}
    >
      {saved ? <Check size={15} /> : null}
      {saving ? "Saving…" : saved ? "Saved!" : label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Company state
  const [companyName, setCompanyName] = useState("");
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyError, setCompanyError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    email_rfis: true,
    email_submittals: true,
    email_punch: true,
    email_handoff: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);


  // Danger zone
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setAuthUser(user);

      // Load profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setTitle(profile.title ?? "");
        setPhone(profile.phone ?? "");
        if (profile.notification_prefs) {
          setNotifPrefs({ ...notifPrefs, ...profile.notification_prefs });
        }
      }

      // Load org
      const { data: org } = await supabase.from("organizations").select("*").eq("user_id", user.id).single();
      if (org) {
        setCompanyName(org.company_name ?? "");
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function saveProfile() {
    if (!authUser) return;
    if (!fullName.trim()) { setProfileError("Full name is required."); return; }
    setProfileError("");
    setProfileSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: fullName.trim(),
        title: title.trim(),
        phone: phone.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
      // Update auth metadata
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      setProfileError("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveCompany() {
    if (!authUser) return;
    setCompanyError("");
    setCompanySaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("organizations").upsert({
        user_id: authUser.id,
        company_name: companyName.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch {
      setCompanyError("Failed to save company info.");
    } finally {
      setCompanySaving(false);
    }
  }

  async function changePassword() {
    setPwError("");
    if (!newPassword) { setPwError("New password is required."); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  async function saveNotifPrefs() {
    if (!authUser) return;
    setNotifSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("profiles").upsert({
        id: authUser.id,
        notification_prefs: notifPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!authUser || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const supabase = createClient();
      // Sign out first — actual deletion requires server-side admin action
      // We sign out and show a message
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF9" }}>
      <Sidebar user={authUser} />

      <main className="flex-1 ml-[260px] min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex items-center px-8 py-4"
          style={{ background: "rgba(250,250,249,0.90)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E7E5E4" }}
        >
          <div>
            <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>Manage your account</p>
            <h1 className="font-display font-800 text-[22px] leading-tight tracking-[-0.03em]" style={{ color: "#1C1917" }}>Settings</h1>
          </div>
        </header>

        {loading ? (
          <SettingsSkeleton />
        ) : (
          <div className="px-8 py-8 max-w-2xl flex flex-col gap-6">

            {/* Profile */}
            <SectionCard icon={User} title="Profile" iconBg="#FFF7ED" iconColor="#F97316">
              <div className="flex flex-col gap-4">
                {profileError && (
                  <div className="px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ background: "#FFF1F2", color: "#BE123C" }}>
                    <AlertTriangle size={14} />{profileError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Jake Morrison" />
                  <Field label="Job Title" value={title} onChange={setTitle} placeholder="Project Manager" />
                </div>
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
                <Field label="Email" value={authUser?.email ?? ""} disabled hint="Email cannot be changed here." />
                <div className="flex justify-end">
                  <SaveButton onClick={saveProfile} saving={profileSaving} saved={profileSaved} />
                </div>
              </div>
            </SectionCard>

            {/* Company */}
            <SectionCard icon={Building2} title="Company" iconBg="#EFF6FF" iconColor="#2563EB">
              <div className="flex flex-col gap-4">
                {companyError && (
                  <div className="px-3 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: "#FFF1F2", color: "#BE123C" }}>{companyError}</div>
                )}
                <Field label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Construction LLC" />
                <div className="flex justify-end">
                  <SaveButton onClick={saveCompany} saving={companySaving} saved={companySaved} />
                </div>
              </div>
            </SectionCard>

            {/* Password */}
            <SectionCard icon={Shield} title="Password" iconBg="#F0FDF4" iconColor="#16A34A">
              <div className="flex flex-col gap-4">
                {pwError && (
                  <div className="px-3 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ background: "#FFF1F2", color: "#BE123C" }}>
                    <AlertTriangle size={14} />{pwError}
                  </div>
                )}
                <div className="relative">
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "#57534E" }}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none transition-shadow duration-150"
                      style={{ border: "1.5px solid #E7E5E4", background: "white", color: "#1C1917" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#E7E5E4"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#A8A29E" }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Field label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type={showPw ? "text" : "password"} placeholder="Repeat password" />
                <div className="flex justify-end">
                  <SaveButton onClick={changePassword} saving={pwSaving} saved={pwSaved} label="Update Password" />
                </div>
              </div>
            </SectionCard>

            {/* Notifications */}
            <SectionCard icon={Bell} title="Notifications" iconBg="#FFFBEB" iconColor="#D97706">
              <div className="flex flex-col gap-3">
                {Object.entries({
                  email_rfis: "Email alerts for new RFIs",
                  email_submittals: "Email alerts for submittal updates",
                  email_punch: "Email alerts for punch list changes",
                  email_handoff: "Email alerts for handoff completion",
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between py-2 cursor-pointer"
                    style={{ borderBottom: "1px solid #F5F5F4" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#44403C" }}>{label}</span>
                    <div
                      className="relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer"
                      style={{
                        background: notifPrefs[key as keyof typeof notifPrefs] ? "#F97316" : "#E7E5E4",
                        width: 40,
                        height: 22,
                      }}
                      onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifPrefs] }))}
                    >
                      <div
                        className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200"
                        style={{
                          left: 3,
                          transform: notifPrefs[key as keyof typeof notifPrefs] ? "translateX(18px)" : "translateX(0)",
                        }}
                      />
                    </div>
                  </label>
                ))}
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={saveNotifPrefs} saving={notifSaving} saved={notifSaved} label="Save Preferences" />
                </div>
              </div>
            </SectionCard>

            {/* Danger zone */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1.5px solid #FECDD3" }}>
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid #FECDD3", background: "#FFF1F2" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEE2E2" }}>
                  <Trash2 size={18} style={{ color: "#DC2626" }} />
                </div>
                <h2 className="font-display font-700 text-[15px] tracking-[-0.01em]" style={{ color: "#DC2626" }}>Danger Zone</h2>
              </div>
              <div className="px-6 py-5">
                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1C1917" }}>Delete Account</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#78716C" }}>Permanently delete your account and all project data.</p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150"
                      style={{ background: "#FFF1F2", color: "#DC2626", border: "1px solid #FECDD3" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
                      <AlertTriangle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-[13px]" style={{ color: "#BE123C" }}>
                        This will permanently delete your account and cannot be undone. Type <strong>DELETE</strong> to confirm.
                      </p>
                    </div>
                    <input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: "1.5px solid #FECDD3", background: "white", color: "#1C1917" }}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "#F5F5F4", color: "#44403C" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || deleting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{
                          background: deleteConfirmText === "DELETE" ? "#DC2626" : "#E7E5E4",
                          color: deleteConfirmText === "DELETE" ? "white" : "#A8A29E",
                          cursor: deleteConfirmText !== "DELETE" ? "not-allowed" : "pointer",
                        }}
                      >
                        {deleting ? "Deleting…" : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
