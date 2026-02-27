import type { Task } from "@shared/schema";

export interface ProjectStats {
  startDate: string | null;
  endDate: string | null;
  totalPlannedHours: number;
  status: "in_attesa" | "in_corso" | "terminato" | "nessuna_attivita";
  statusLabel: string;
}

export function computeProjectStats(tasks: Task[]): ProjectStats {
  if (tasks.length === 0) {
    return { startDate: null, endDate: null, totalPlannedHours: 0, status: "nessuna_attivita", statusLabel: "Nessuna attività" };
  }

  const startDates = tasks.map(t => t.startDate).filter(Boolean) as string[];
  const endDates = tasks.map(t => t.endDate).filter(Boolean) as string[];

  const startDate = startDates.length > 0 ? startDates.sort()[0] : null;
  const endDate = endDates.length > 0 ? endDates.sort().reverse()[0] : null;
  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);

  const today = new Date().toISOString().split("T")[0];

  let status: ProjectStats["status"] = "in_corso";
  let statusLabel = "In corso";

  if (startDate && today < startDate) {
    status = "in_attesa";
    statusLabel = "In attesa";
  } else if (endDate && today > endDate) {
    status = "terminato";
    statusLabel = "Terminato";
  } else {
    status = "in_corso";
    statusLabel = "In corso";
  }

  return { startDate, endDate, totalPlannedHours, status, statusLabel };
}

export function statusColor(status: ProjectStats["status"]): string {
  switch (status) {
    case "in_attesa": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    case "in_corso": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    case "terminato": return "bg-red-500/10 text-red-500 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}
