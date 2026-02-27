import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, FolderKanban, Clock, TrendingUp, ListChecks } from "lucide-react";
import type { User, Client, Project, Task, TimeEntry } from "@shared/schema";

function StatCard({ title, value, icon: Icon, subtitle, loading }: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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
        <Clock className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">Nessuna registrazione ore ancora</p>
        <p className="text-xs mt-1">Inizia a tracciare il tempo nella sezione Time Tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recent.map((entry) => {
        const user = userMap.get(entry.userId);
        const project = projectMap.get(entry.projectId);
        const task = entry.taskId ? taskMap.get(entry.taskId) : null;
        return (
          <div key={entry.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0" data-testid={`row-entry-${entry.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user ? `${user.name} ${user.surname}` : "Utente"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {project?.name}{task ? ` / ${task.name}` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{entry.hours}h</p>
              <p className="text-xs text-muted-foreground">{entry.date}</p>
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
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Panoramica del tuo progetto e attivit&agrave;</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Team" value={users.length} icon={Users} subtitle="membri attivi" loading={loading} />
        <StatCard title="Clienti" value={clients.length} icon={Briefcase} subtitle="totali" loading={loading} />
        <StatCard title="Progetti" value={projects.length} icon={FolderKanban} subtitle="in corso" loading={loading} />
        <StatCard title="Attivit&agrave;" value={tasks.length} icon={ListChecks} subtitle="totali" loading={loading} />
        <StatCard title="Ore Lavorate" value={totalHours.toFixed(1)} icon={Clock} subtitle="registrate" loading={loading} />
        <StatCard title="Ore Pianificate" value={totalPlanned.toFixed(1)} icon={TrendingUp} subtitle="stimate" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ultime Registrazioni</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-base">Ore per Progetto</CardTitle>
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
                <FolderKanban className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Nessun progetto ancora</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => {
                  const projectHours = timeEntries
                    .filter(e => e.projectId === project.id)
                    .reduce((sum, e) => sum + e.hours, 0);
                  const projectPlanned = tasks
                    .filter(t => t.projectId === project.id)
                    .reduce((sum, t) => sum + (t.plannedHours || 0), 0);
                  const pct = projectPlanned > 0 ? Math.min(100, (projectHours / projectPlanned) * 100) : 0;
                  return (
                    <div key={project.id} className="space-y-1.5" data-testid={`project-hours-${project.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground shrink-0">{projectHours.toFixed(1)}h / {projectPlanned.toFixed(1)}h</p>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
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
