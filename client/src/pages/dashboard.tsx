import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, FolderKanban, Clock, TrendingUp, ListChecks, Activity, Cpu } from "lucide-react";
import type { User, Client, Project, Task, TimeEntry } from "@shared/schema";

function StatCard({ title, value, icon: Icon, subtitle, loading, accent }: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  loading?: boolean;
  accent?: string;
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

function RecentEntriesTable({ entries, users, projects, tasks }: {
  entries: TimeEntry[];
  users: User[];
  projects: Project[];
  tasks: Task[];
}) {
  const userMap = new Map(users.map(u => [u.id, u]));
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Cpu className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-xs font-mono tracking-wider">NO DATA AVAILABLE</p>
        <p className="text-[10px] mt-1 font-mono text-muted-foreground/60">Initialize time tracking module</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((entry, i) => {
        const user = userMap.get(entry.userId);
        const project = projectMap.get(entry.projectId);
        const task = entry.taskId ? taskMap.get(entry.taskId) : null;
        return (
          <div key={entry.id} className="flex items-center justify-between gap-2 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors group" data-testid={`row-entry-${entry.id}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <span className="text-[10px] font-mono font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user ? `${user.name} ${user.surname}` : "Utente"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {project?.name}{task ? ` // ${task.name}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-primary">{entry.hours}h</p>
              <p className="text-[10px] text-muted-foreground font-mono">{entry.date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: timeEntries = [], isLoading: loadingEntries } = useQuery<TimeEntry[]>({ queryKey: ["/api/time-entries"] });

  const loading = loadingUsers || loadingClients || loadingProjects || loadingTasks || loadingEntries;

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalPlanned = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">System Overview // Real-Time Metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Team" value={users.length} icon={Users} subtitle="operatori attivi" loading={loading} />
        <StatCard title="Clienti" value={clients.length} icon={Briefcase} subtitle="registrati" loading={loading} />
        <StatCard title="Progetti" value={projects.length} icon={FolderKanban} subtitle="in esecuzione" loading={loading} />
        <StatCard title="Tasks" value={tasks.length} icon={ListChecks} subtitle="assegnati" loading={loading} />
        <StatCard title="Ore Log" value={totalHours.toFixed(1)} icon={Clock} subtitle="tracked" loading={loading} />
        <StatCard title="Ore Plan" value={totalPlanned.toFixed(1)} icon={TrendingUp} subtitle="stimate" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide">Log Recenti</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">LATEST TIME ENTRIES</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between py-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <RecentEntriesTable entries={timeEntries} users={users} projects={projects} tasks={tasks} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide">Carico Progetto</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">HOURS ALLOCATION MAP</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between py-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Cpu className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-xs font-mono tracking-wider">NO PROJECTS INITIALIZED</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map(project => {
                  const projectHours = timeEntries
                    .filter(e => e.projectId === project.id)
                    .reduce((sum, e) => sum + e.hours, 0);
                  const projectPlanned = tasks
                    .filter(t => t.projectId === project.id)
                    .reduce((sum, t) => sum + (t.plannedHours || 0), 0);
                  const pct = projectPlanned > 0 ? Math.min(100, (projectHours / projectPlanned) * 100) : 0;
                  return (
                    <div key={project.id} className="space-y-2" data-testid={`project-hours-${project.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs font-mono text-primary shrink-0">{projectHours.toFixed(1)}h / {projectPlanned.toFixed(1)}h</p>
                      </div>
                      <div className="relative h-2 bg-muted rounded-sm">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary rounded-sm transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/30 rounded-sm blur-sm transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono tracking-wider text-right">{pct.toFixed(0)}% COMPLETE</p>
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
