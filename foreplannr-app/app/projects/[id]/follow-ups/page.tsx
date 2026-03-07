"use client";

import { useParams } from "next/navigation";
import { ProjectPageShell, ComingSoonState } from "@/components/project-page-shell";
import { Bell } from "lucide-react";

export default function ProjectFollowUpsPage() {
  const { id } = useParams() as { id: string };

  return (
    <ProjectPageShell projectId={id}>
      <ComingSoonState
        icon={Bell}
        title="Follow-ups"
        description="Log and track every follow-up call, email, and action item for this job — with reminders and status tracking. Coming in Phase 3."
        iconColor="#7C3AED"
        iconBg="#F5F3FF"
      />
    </ProjectPageShell>
  );
}
