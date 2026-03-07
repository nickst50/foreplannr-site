"use client";

import { useParams } from "next/navigation";
import { ProjectPageShell, ComingSoonState } from "@/components/project-page-shell";
import { ExternalLink } from "lucide-react";

export default function ProjectContractorPortalPage() {
  const { id } = useParams() as { id: string };

  return (
    <ProjectPageShell projectId={id}>
      <ComingSoonState
        icon={ExternalLink}
        title="Contractor Portal"
        description="Give contractors a dedicated view of their submittals, ship schedules, and delivery status — no login required. Coming in Phase 3."
        iconColor="#F97316"
        iconBg="#FFF7ED"
      />
    </ProjectPageShell>
  );
}
