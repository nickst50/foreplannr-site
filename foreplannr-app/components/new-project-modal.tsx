"use client";

import { useEffect, useState } from "react";
import { X, Building2, MapPin } from "lucide-react";
import type { ProjectInput } from "@/lib/projects";
import type { CompanyType } from "@/lib/organization";
import { createClient } from "@/lib/supabase/client";

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
  companyType?: CompanyType;
}

export function NewProjectModal({ onClose, onSubmit, companyType = "contractor" }: NewProjectModalProps) {
  const [form, setForm] = useState({
    name: "",
    client: "",
    address: "",
    contractValue: "",
    startDate: "",
    closeoutDate: "",
    projectManager: "",
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);

  // Fetch profiles for PM dropdown (distribution only)
  useEffect(() => {
    if (companyType !== "distribution") return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, full_name")
      .then(({ data }) => {
        if (data) setProfiles(data.filter((p) => p.full_name));
      });
  }, [companyType]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        client: form.client.trim(),
        address: form.address.trim(),
        contractValue: form.contractValue.trim(),
        startDate: form.startDate,
        closeoutDate: form.closeoutDate,
        branch: form.branch.trim(),
        projectManager: form.projectManager.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setLoading(false);
    }
  }

  const isDistribution = companyType === "distribution";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(28,25,23,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[540px] rounded-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        style={{
          background: "#fff",
          boxShadow: "0 24px 80px rgba(28,25,23,0.22)",
          border: "1px solid #E7E5E4",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-7 pt-6 pb-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #F5F5F4" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isDistribution && (
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: "#F0F9FF" }}
                >
                  <Building2 size={13} style={{ color: "#0EA5E9" }} />
                </div>
              )}
              <h2
                className="font-display font-700 text-[18px] tracking-[-0.02em]"
                style={{ color: "#1C1917" }}
              >
                New {isDistribution ? "Distribution " : ""}Project
              </h2>
            </div>
            <p className="text-[13px] mt-0.5" style={{ color: "#A8A29E" }}>
              {isDistribution
                ? "Enter the job details for this distribution project."
                : "Fill in the details to create a new project."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 flex-shrink-0"
            style={{ background: "#F5F5F4", color: "#78716C" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "#FFF1F2", color: "#BE123C" }}
            >
              {error}
            </div>
          )}

          <Field
            label="Project Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={isDistribution ? "e.g. Westside Hospital Electrical" : "e.g. Downtown Office Fit-Out"}
            required
          />

          {isDistribution ? (
            <>
              <Field
                label="Customer / Contractor Name"
                name="client"
                value={form.client}
                onChange={handleChange}
                placeholder="e.g. Summit Electric Co."
              />
              <Field
                label="Job Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 500 Commerce Blvd, Dallas, TX 75201"
                icon={<MapPin size={14} style={{ color: "#A8A29E" }} />}
              />
              <Field
                label="Contract Value"
                name="contractValue"
                value={form.contractValue}
                onChange={handleChange}
                placeholder="e.g. $485,000"
              />
              <Field
                label="Estimated Start Date"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
              />

              {/* PM dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
                  Project Manager
                </label>
                {profiles.length > 0 ? (
                  <select
                    name="projectManager"
                    value={form.projectManager}
                    onChange={handleChange}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150 appearance-none"
                    style={{
                      border: "1.5px solid #E7E5E4",
                      background: "#FAFAF9",
                      color: form.projectManager ? "#1C1917" : "#A8A29E",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#F97316";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#E7E5E4";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select PM…</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.full_name}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Field
                    label=""
                    name="projectManager"
                    value={form.projectManager}
                    onChange={handleChange}
                    placeholder="Project manager name"
                    noLabel
                  />
                )}
              </div>

              <Field
                label="Branch / Location"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                placeholder="e.g. Dallas Branch"
              />
            </>
          ) : (
            <>
              <Field
                label="Client / Owner Name"
                name="client"
                value={form.client}
                onChange={handleChange}
                placeholder="e.g. Acme Properties LLC"
              />
              <Field
                label="Project Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 100 Main St, Chicago, IL 60601"
              />
              <Field
                label="Contract Value"
                name="contractValue"
                value={form.contractValue}
                onChange={handleChange}
                placeholder="e.g. $1,200,000"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Target Start Date"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />
                <Field
                  label="Target Closeout Date"
                  name="closeoutDate"
                  type="date"
                  value={form.closeoutDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
              style={{ background: "#F5F5F4", color: "#78716C" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E7E5E4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F5F5F4"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #F97316, #EA580C)",
                boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.45)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(249,115,22,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              {loading ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  icon,
  noLabel,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  noLabel?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!noLabel && label && (
        <label className="text-[13px] font-semibold" style={{ color: "#44403C" }}>
          {label}
          {required && <span style={{ color: "#F97316" }}> *</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-150"
          style={{
            border: "1.5px solid #E7E5E4",
            background: "#FAFAF9",
            color: "#1C1917",
            paddingLeft: icon ? "2rem" : undefined,
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
    </div>
  );
}
