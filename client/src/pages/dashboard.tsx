import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, FolderKanban, Clock, TrendingUp, ListChecks, Activity, Cpu, BarChart3, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import type { User, Client, Project, Task, TimeEntry } from "@shared/schema";
import { computeProjectStats, statusColor } from "@/lib/project-utils";

type DashboardFilter = "all" | "in_corso";

function StatCard({ title, value, icon: Icon, subtitle, loading }: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-[11px] font-mono font-medium text-muted-foreground tracking-wider uppercase">{title}</CardTitle>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold font-mono tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
            {subtitle && <p className="text-[10px] text-muted-foreground mt-1 font-mono tracking-wider uppercase">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCard({ title, value, subtitle, color, loading }: {
  title: string;
  value: string;
  subtitle: string;
  color: "cyan" | "orange";
  loading?: boolean;
}) {
  const borderClass = color === "cyan" ? "border-primary/40" : "border-orange-500/40";
  const titleClass = color === "cyan" ? "text-primary" : "text-orange-500";
  const glowClass = color === "cyan" ? "bg-primary/5" : "bg-orange-500/5";

  return (
    <Card className={`${borderClass} ${glowClass} border-2`} data-testid={`kpi-${color}`}>
      <CardContent className="pt-6 pb-6 px-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <p className={`text-sm font-mono font-semibold tracking-wider uppercase ${titleClass}`}>{title}</p>
            <p className="text-4xl font-bold font-mono tracking-tight mt-2" data-testid={`kpi-value-${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase mt-2">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BarChartRow({ name, hours, maxHours, planned, status }: {
  name: string;
  hours: number;
  maxHours: number;
  planned: number;
  status: string;
}) {
  const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0;
  const plannedPct = planned > 0 ? Math.min(100, (hours / planned) * 100) : 0;
  const overBudget = planned > 0 && hours > planned;

  return (
    <div className="space-y-1.5" data-testid={`bar-project-${name}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <Badge variant="outline" className={`${statusColor(status as any)} text-[9px] font-mono shrink-0`}>
            {status === "in_corso" ? "IN CORSO" : status === "in_attesa" ? "IN ATTESA" : status === "terminato" ? "TERMINATO" : "—"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-mono font-bold ${overBudget ? "text-red-500" : "text-primary"}`}>
            {hours.toFixed(1)}h
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">/ {planned.toFixed(1)}h</span>
        </div>
      </div>
      <div className="relative h-6 bg-muted/50 rounded-sm overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-sm transition-all duration-700 ease-out ${overBudget ? "bg-red-500/80" : "bg-primary/80"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
        {planned > 0 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/30"
            style={{ left: `${Math.min((planned / maxHours) * 100, 100)}%` }}
            title={`Previste: ${planned}h`}
          />
        )}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-[10px] font-mono font-bold text-foreground/80 drop-shadow-sm">
            {plannedPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: timeEntries = [], isLoading: loadingEntries } = useQuery<TimeEntry[]>({ queryKey: ["/api/time-entries"] });

  const [filter, setFilter] = useState<DashboardFilter>("all");

  const loading = loadingUsers || loadingClients || loadingProjects || loadingTasks || loadingEntries;

  const projectsWithStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const stats = computeProjectStats(projectTasks);
      const loggedHours = timeEntries
        .filter(e => e.projectId === project.id)
        .reduce((sum, e) => sum + e.hours, 0);
      return { ...project, stats, loggedHours, plannedHours: stats.totalPlannedHours };
    });
  }, [projects, tasks, timeEntries]);

  const filteredProjects = useMemo(() => {
    if (filter === "in_corso") {
      return projectsWithStats.filter(p => p.stats.status === "in_corso");
    }
    return projectsWithStats;
  }, [projectsWithStats, filter]);

  const totalPlanned = filteredProjects.reduce((sum, p) => sum + p.plannedHours, 0);
  const totalLogged = filteredProjects.reduce((sum, p) => sum + p.loggedHours, 0);
  const maxHours = Math.max(...filteredProjects.map(p => Math.max(p.loggedHours, p.plannedHours)), 1);

  const filteredProjectCount = filteredProjects.length;
  const inCorsoCount = projectsWithStats.filter(p => p.stats.status === "in_corso").length;

  const userMap = new Map(users.map(u => [u.id, u]));
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const recentEntries = [...timeEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">Numeri Chiave // Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Tabs value={filter} onValueChange={(v) => setFilter(v as DashboardFilter)}>
            <TabsList>
              <TabsTrigger value="all" data-testid="filter-all" className="text-xs font-mono">
                Tutti i progetti
              </TabsTrigger>
              <TabsTrigger value="in_corso" data-testid="filter-in-corso" className="text-xs font-mono">
                Solo "in corso"
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          title="Ore Previste"
          value={`${totalPlanned.toFixed(1)}h`}
          subtitle={`somma plannedHours — ${filteredProjectCount} progetti`}
          color="cyan"
          loading={loading}
        />
        <KpiCard
          title="Ore Rendicontate"
          value={`${totalLogged.toFixed(1)}h`}
          subtitle={`somma timeEntries.hours — ${filteredProjectCount} progetti`}
          color="orange"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Team" value={users.length} icon={Users} subtitle="operatori attivi" loading={loading} />
        <StatCard title="Clienti" value={clients.length} icon={Briefcase} subtitle="registrati" loading={loading} />
        <StatCard title="Progetti" value={projects.length} icon={FolderKanban} subtitle="totali" loading={loading} />
        <StatCard title="In Corso" value={inCorsoCount} icon={Activity} subtitle="progetti attivi" loading={loading} />
        <StatCard title="Tasks" value={tasks.length} icon={ListChecks} subtitle="assegnati" loading={loading} />
        <StatCard title="Completamento" value={totalPlanned > 0 ? `${Math.min(100, (totalLogged / totalPlanned) * 100).toFixed(0)}%` : "—"} icon={TrendingUp} subtitle="ore log/plan" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold tracking-wide">Ore Rendicontate per Progetto</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {filter === "all" ? "TUTTI" : "IN CORSO"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
              BARRA = ORE RENDICONTATE • LINEA = ORE PREVISTE
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Cpu className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-xs font-mono tracking-wider">NESSUN PROGETTO</p>
                <p className="text-[10px] mt-1 font-mono text-muted-foreground/60">
                  {filter === "in_corso" ? 'Nessun progetto "in corso" trovato' : "Inizia creando un progetto"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects
                  .sort((a, b) => b.loggedHours - a.loggedHours)
                  .map(project => (
                    <BarChartRow
                      key={project.id}
                      name={project.name}
                      hours={project.loggedHours}
                      maxHours={maxHours}
                      planned={project.plannedHours}
                      status={project.stats.status}
                    />
                  ))}
                <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
                  <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground">Totale</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-primary" data-testid="text-bar-total-logged">{totalLogged.toFixed(1)}h rendicontate</span>
                    <span className="text-sm font-mono text-muted-foreground">/ {totalPlanned.toFixed(1)}h previste</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide">Log Recenti</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">ULTIME REGISTRAZIONI</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Cpu className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-xs font-mono tracking-wider">NESSUN DATO</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentEntries.map((entry, i) => {
                  const user = userMap.get(entry.userId);
                  const project = projectMap.get(entry.projectId);
                  const task = entry.taskId ? taskMap.get(entry.taskId) : null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors" data-testid={`recent-entry-${entry.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 shrink-0">
                          <span className="text-[9px] font-mono font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {user ? `${user.name} ${user.surname}` : "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {project?.name}{task ? ` // ${task.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-mono text-primary">{entry.hours}h</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{entry.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
