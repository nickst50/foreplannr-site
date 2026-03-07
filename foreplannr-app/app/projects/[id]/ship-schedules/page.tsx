"use client";

import { useParams } from "next/navigation";
import { ProjectPageShell, ComingSoonState } from "@/components/project-page-shell";
import { Truck } from "lucide-react";

export default function ProjectShipSchedulesPage() {
  const { id } = useParams() as { id: string };

  return (
    <ProjectPageShell projectId={id}>
      <ComingSoonState
        icon={Truck}
        title="Ship Schedules"
        description="Track every shipment for this job — dates, carriers, line items, and delivery confirmations. Coming in Phase 3."
        iconColor="#0EA5E9"
        iconBg="#F0F9FF"
      />
    </ProjectPageShell>
  );
}
