export type ProjectStatus = "On Track" | "At Risk" | "Delayed";

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  contractValue: string;
  startDate: string;
  closeoutDate: string;
  status: ProjectStatus;
  phase: string;
  completion: number;
  punchListResolved: number;
  submittalPct: number;
  openRFIs: number;
  openSubmittals: number;
  daysToCloseout: number | string;
  branch: string;
  projectManager: string;
  createdAt: string;
}

export interface ProjectInput {
  name: string;
  client: string;
  address: string;
  contractValue: string;
  startDate: string;
  closeoutDate: string;
  branch?: string;
  projectManager?: string;
}

export interface DbProjectRow {
  id: string;
  user_id: string;
  name: string;
  client: string;
  address: string;
  contract_value: string;
  start_date: string | null;
  closeout_date: string | null;
  status: string;
  phase: string;
  completion: number;
  punch_list_resolved: number;
  submittal_pct: number;
  open_rfis: number;
  open_submittals: number;
  branch?: string | null;
  project_manager?: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToProject(row: DbProjectRow): Project {
  const now = Date.now();
  let daysToCloseout: number | string = "--";
  if (row.closeout_date) {
    const closeoutMs = new Date(row.closeout_date).getTime();
    if (!isNaN(closeoutMs)) {
      daysToCloseout = Math.max(0, Math.round((closeoutMs - now) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    id: row.id,
    name: row.name,
    client: row.client ?? "",
    address: row.address ?? "",
    contractValue: row.contract_value ?? "",
    startDate: row.start_date ?? "",
    closeoutDate: row.closeout_date ?? "",
    status: row.status as ProjectStatus,
    phase: row.phase ?? "Pre-Construction",
    completion: row.completion ?? 0,
    punchListResolved: row.punch_list_resolved ?? 0,
    submittalPct: row.submittal_pct ?? 0,
    openRFIs: row.open_rfis ?? 0,
    openSubmittals: row.open_submittals ?? 0,
    daysToCloseout,
    branch: row.branch ?? "",
    projectManager: row.project_manager ?? "",
    createdAt: row.created_at ?? "",
  };
}
