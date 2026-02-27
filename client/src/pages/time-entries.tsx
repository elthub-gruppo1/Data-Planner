import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Timer, ChevronLeft, ChevronRight, Ban, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTimeEntrySchema, type TimeEntry, type InsertTimeEntry, type Project, type Task, type User, type Absence } from "@shared/schema";

type ViewMode = "day" | "week" | "month";

const WEEKDAY_NAMES_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTH_NAMES = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday;
}

function getWeekDays(baseDate: Date): Date[] {
  const monday = getMonday(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startOffset);

  const days: Date[] = [];
  const current = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export default function TimeEntriesPage() {
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useQuery<TimeEntry[]>({ queryKey: ["/api/time-entries"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: absences = [] } = useQuery<Absence[]>({ queryKey: ["/api/absences"] });
  const { data: currentUser } = useQuery<User | null>({ queryKey: ["/api/auth/me"], queryFn: getQueryFn({ on401: "returnNull" }) });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  const form = useForm<InsertTimeEntry>({
    resolver: zodResolver(insertTimeEntrySchema),
    defaultValues: { userId: "", date: selectedDate, projectId: "", taskId: "", hours: 0, note: "" },
  });

  const watchProjectId = form.watch("projectId");
  const filteredTasks = tasks.filter(t => t.projectId === watchProjectId);

  const createMutation = useMutation({
    mutationFn: (data: InsertTimeEntry) => apiRequest("POST", "/api/time-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Registrazione creata" });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTimeEntry> }) =>
      apiRequest("PATCH", `/api/time-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Registrazione aggiornata" });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Registrazione eliminata" });
      setDeleteTarget(null);
    },
  });

  const absenceMutation = useMutation({
    mutationFn: (data: { userId: string; date: string; absent: boolean }) => {
      if (data.absent) {
        return apiRequest("POST", "/api/absences", { userId: data.userId, date: data.date });
      } else {
        return apiRequest("DELETE", `/api/absences/${data.userId}/${data.date}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/absences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [entries]);

  const absenceSet = useMemo(() => {
    const set = new Set<string>();
    for (const a of absences) {
      set.add(`${a.userId}:${a.date}`);
    }
    return set;
  }, [absences]);

  function isUserAbsent(userId: string, date: string): boolean {
    return absenceSet.has(`${userId}:${date}`);
  }

  function getDateHours(dateStr: string): number {
    return (entriesByDate.get(dateStr) || []).reduce((s, e) => s + e.hours, 0);
  }

  function getDateEntryCount(dateStr: string): number {
    return (entriesByDate.get(dateStr) || []).length;
  }

  function closeDialog() {
    setOpen(false);
    setEditEntry(null);
    form.reset({ userId: currentUser?.id || "", date: selectedDate, projectId: "", taskId: "", hours: 0, note: "" });
  }

  function openNew(forDate?: string) {
    const d = forDate || selectedDate;
    setEditEntry(null);
    form.reset({ userId: currentUser?.id || "", date: d, projectId: "", taskId: "", hours: 0, note: "" });
    setOpen(true);
  }

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry);
    form.reset({
      userId: entry.userId,
      date: entry.date,
      projectId: entry.projectId,
      taskId: entry.taskId || "",
      hours: entry.hours,
      note: entry.note || "",
    });
    setOpen(true);
  }

  function onSubmit(data: InsertTimeEntry) {
    const cleanData = { ...data, taskId: data.taskId || null };
    if (editEntry) {
      updateMutation.mutate({ id: editEntry.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  }

  function navigatePeriod(offset: number) {
    const d = parseDate(selectedDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + offset);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + offset * 7);
    } else {
      d.setMonth(d.getMonth() + offset);
    }
    setSelectedDate(toDateStr(d));
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr);
    setViewMode("day");
  }

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const userMap = new Map(users.map(u => [u.id, u]));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const dayEntries = entries.filter(e => e.date === selectedDate);
  const dayTotalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);

  const dateObj = parseDate(selectedDate);
  const currentUserAbsent = currentUser ? isUserAbsent(currentUser.id, selectedDate) : false;

  const weekDays = useMemo(() => getWeekDays(dateObj), [selectedDate]);
  const weekTotalHours = useMemo(() => weekDays.reduce((s, d) => s + getDateHours(toDateStr(d)), 0), [weekDays, entriesByDate]);

  const monthYear = dateObj.getFullYear();
  const monthIdx = dateObj.getMonth();
  const monthCalendarDays = useMemo(() => getMonthCalendarDays(monthYear, monthIdx), [monthYear, monthIdx]);
  const monthTotalHours = useMemo(() => {
    let total = 0;
    for (const d of monthCalendarDays) {
      if (d.getMonth() === monthIdx) total += getDateHours(toDateStr(d));
    }
    return total;
  }, [monthCalendarDays, entriesByDate, monthIdx]);

  function getPeriodLabel(): string {
    if (viewMode === "day") {
      return dateObj.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    } else if (viewMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    } else {
      return `${MONTH_NAMES[monthIdx]} ${monthYear}`;
    }
  }

  function getTotalLabel(): { label: string; value: string } {
    if (viewMode === "day") return { label: "Totale Giorno", value: `${dayTotalHours.toFixed(1)}h` };
    if (viewMode === "week") return { label: "Totale Settimana", value: `${weekTotalHours.toFixed(1)}h` };
    return { label: "Totale Mese", value: `${monthTotalHours.toFixed(1)}h` };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const totalInfo = getTotalLabel();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Rendicontazione</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">Registrazione Ore</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day" data-testid="tab-day" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">Giorno</span>
            </TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week" className="gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">Settimana</span>
            </TabsTrigger>
            <TabsTrigger value="month" data-testid="tab-month" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">Mese</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigatePeriod(-1)} data-testid="button-prev-period">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[220px]">
            {viewMode === "day" ? (
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="font-mono text-center"
                data-testid="input-select-date"
              />
            ) : (
              <p className="text-sm font-mono font-semibold capitalize" data-testid="text-period-label">{getPeriodLabel()}</p>
            )}
            {viewMode === "day" && (
              <p className="text-[11px] text-muted-foreground font-mono mt-1 capitalize" data-testid="text-day-label">{getPeriodLabel()}</p>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigatePeriod(1)} data-testid="button-next-period">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">{totalInfo.label}</p>
            <p className="text-lg font-bold font-mono text-primary" data-testid="text-period-total">{totalInfo.value}</p>
          </div>
        </div>
      </div>

      {viewMode === "week" && (
        <WeekView
          weekDays={weekDays}
          entriesByDate={entriesByDate}
          absenceSet={absenceSet}
          currentUser={currentUser}
          todayStr={todayStr}
          selectedDate={selectedDate}
          projectMap={projectMap}
          onSelectDay={selectDay}
          onAddEntry={openNew}
        />
      )}

      {viewMode === "month" && (
        <MonthView
          calendarDays={monthCalendarDays}
          currentMonth={monthIdx}
          entriesByDate={entriesByDate}
          absenceSet={absenceSet}
          currentUser={currentUser}
          todayStr={todayStr}
          selectedDate={selectedDate}
          onSelectDay={selectDay}
        />
      )}

      {viewMode === "day" && (
        <>
          {currentUser && (
            <Card className={currentUserAbsent ? "border-yellow-500/30 bg-yellow-500/5" : ""}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban className={`h-4 w-4 ${currentUserAbsent ? "text-yellow-500" : "text-muted-foreground"}`} />
                  <span className="text-sm font-mono">Assenza per il giorno selezionato</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentUserAbsent && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 font-mono text-[10px]">ASSENTE</Badge>
                  )}
                  <Switch
                    checked={currentUserAbsent}
                    onCheckedChange={(checked) => {
                      absenceMutation.mutate({ userId: currentUser.id, date: selectedDate, absent: checked });
                    }}
                    data-testid="switch-absence"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-mono tracking-wider uppercase text-muted-foreground">
              Registrazioni del giorno ({dayEntries.length})
            </h2>
            <Button
              onClick={() => openNew()}
              disabled={currentUserAbsent}
              data-testid="button-add-entry"
            >
              <Plus className="h-4 w-4 mr-2" /> Nuova Registrazione
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </CardContent>
            </Card>
          ) : dayEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                {currentUserAbsent ? (
                  <>
                    <Ban className="h-10 w-10 text-yellow-500 mb-3 opacity-50" />
                    <p className="text-yellow-500 text-xs font-mono tracking-wider" data-testid="text-absent-message">ASSENTE — INSERIMENTO ORE BLOCCATO</p>
                  </>
                ) : (
                  <>
                    <Timer className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
                    <p className="text-muted-foreground text-xs font-mono tracking-wider">NESSUNA REGISTRAZIONE</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">Clicca "Nuova Registrazione" per iniziare</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase">#</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase">Operatore</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase">Progetto</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase">Task</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Ore</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase">Note</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayEntries.map((entry, idx) => {
                      const user = userMap.get(entry.userId);
                      const project = projectMap.get(entry.projectId);
                      const task = entry.taskId ? taskMap.get(entry.taskId) : null;
                      return (
                        <TableRow key={entry.id} data-testid={`row-entry-${entry.id}`}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</TableCell>
                          <TableCell className="text-sm" data-testid={`text-entry-user-${entry.id}`}>
                            {user ? `${user.name} ${user.surname}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-mono">{project?.name || "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{task?.name || "—"}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary" data-testid={`text-entry-hours-${entry.id}`}>
                            {entry.hours}h
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{entry.note || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(entry)} data-testid={`button-edit-entry-${entry.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(entry)} data-testid={`button-delete-entry-${entry.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wide">{editEntry ? "// MODIFICA REGISTRAZIONE" : "// NUOVA REGISTRAZIONE"}</DialogTitle>
            <DialogDescription className="text-xs font-mono tracking-wider">
              {editEntry ? "Modifica i dettagli della registrazione" : `Registrazione per il ${form.getValues("date") || selectedDate}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Operatore</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-entry-user">
                        <SelectValue placeholder="Seleziona utente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} {u.surname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Data</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-entry-date" className="font-mono" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Progetto</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); form.setValue("taskId", ""); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-entry-project">
                        <SelectValue placeholder="Seleziona progetto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {filteredTasks.length > 0 && (
                <FormField control={form.control} name="taskId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Task (opzionale)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-entry-task">
                          <SelectValue placeholder="Seleziona attività" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTasks.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="hours" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Ore</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0.25"
                      {...field}
                      value={field.value || ""}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-entry-hours"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Note (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Descrizione attività svolte..." data-testid="input-entry-note" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog} data-testid="button-cancel-entry">Annulla</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-entry">
                  {isPending ? "Salvataggio..." : editEntry ? "Aggiorna" : "Registra"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono tracking-wide">// CONFERMA ELIMINAZIONE</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa registrazione ore?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WeekView({
  weekDays, entriesByDate, absenceSet, currentUser, todayStr, selectedDate, projectMap, onSelectDay, onAddEntry,
}: {
  weekDays: Date[];
  entriesByDate: Map<string, TimeEntry[]>;
  absenceSet: Set<string>;
  currentUser: User | null;
  todayStr: string;
  selectedDate: string;
  projectMap: Map<string, Project>;
  onSelectDay: (d: string) => void;
  onAddEntry: (d: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_NAMES_SHORT.map((name, i) => (
            <div key={name} className={`py-2 px-1 text-center font-mono text-[10px] tracking-wider uppercase text-muted-foreground ${i > 0 ? "border-l border-border" : ""}`}>
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[280px]">
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day);
            const dayEntries = entriesByDate.get(dateStr) || [];
            const totalHours = dayEntries.reduce((s, e) => s + e.hours, 0);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isAbsent = currentUser ? absenceSet.has(`${currentUser.id}:${dateStr}`) : false;
            const isWeekend = i >= 5;

            return (
              <div
                key={dateStr}
                className={`border-t border-border p-2 flex flex-col cursor-pointer transition-colors hover:bg-muted/40 ${i > 0 ? "border-l border-border" : ""} ${isToday ? "bg-primary/5" : ""} ${isSelected ? "ring-1 ring-primary ring-inset" : ""} ${isWeekend ? "bg-muted/20" : ""} ${isAbsent ? "bg-yellow-500/5" : ""}`}
                onClick={() => onSelectDay(dateStr)}
                data-testid={`week-cell-${dateStr}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day.getDate()}
                  </span>
                  {isAbsent && (
                    <Ban className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                {totalHours > 0 && (
                  <div className="mb-1">
                    <span className="text-sm font-mono font-bold text-primary" data-testid={`week-hours-${dateStr}`}>{totalHours}h</span>
                  </div>
                )}
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {dayEntries.slice(0, 3).map((entry) => {
                    const project = projectMap.get(entry.projectId);
                    return (
                      <div key={entry.id} className="text-[9px] font-mono text-muted-foreground truncate leading-tight">
                        <span className="text-primary/70">{entry.hours}h</span> {project?.name || "—"}
                      </div>
                    );
                  })}
                  {dayEntries.length > 3 && (
                    <div className="text-[9px] font-mono text-muted-foreground/60">+{dayEntries.length - 3} altre</div>
                  )}
                </div>
                {!isAbsent && (
                  <button
                    className="mt-1 w-full text-[9px] font-mono text-muted-foreground/40 hover:text-primary transition-colors py-0.5 rounded hover:bg-primary/10"
                    onClick={(e) => { e.stopPropagation(); onAddEntry(dateStr); }}
                    data-testid={`week-add-${dateStr}`}
                  >
                    + aggiungi
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MonthView({
  calendarDays, currentMonth, entriesByDate, absenceSet, currentUser, todayStr, selectedDate, onSelectDay,
}: {
  calendarDays: Date[];
  currentMonth: number;
  entriesByDate: Map<string, TimeEntry[]>;
  absenceSet: Set<string>;
  currentUser: User | null;
  todayStr: string;
  selectedDate: string;
  onSelectDay: (d: string) => void;
}) {
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_NAMES_SHORT.map((name, i) => (
            <div key={name} className={`py-2 px-1 text-center font-mono text-[10px] tracking-wider uppercase text-muted-foreground ${i > 0 ? "border-l border-border" : ""}`}>
              {name}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const dateStr = toDateStr(day);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const dayEntries = entriesByDate.get(dateStr) || [];
              const totalHours = dayEntries.reduce((s, e) => s + e.hours, 0);
              const isToday = dateStr === todayStr;
              const isAbsent = currentUser ? absenceSet.has(`${currentUser.id}:${dateStr}`) : false;
              const isWeekend = di >= 5;

              return (
                <div
                  key={dateStr}
                  className={`border-t border-border p-1.5 min-h-[70px] flex flex-col cursor-pointer transition-colors hover:bg-muted/40 ${di > 0 ? "border-l border-border" : ""} ${!isCurrentMonth ? "opacity-30" : ""} ${isToday ? "bg-primary/5" : ""} ${isWeekend && isCurrentMonth ? "bg-muted/20" : ""} ${isAbsent && isCurrentMonth ? "bg-yellow-500/5" : ""}`}
                  onClick={() => isCurrentMonth && onSelectDay(dateStr)}
                  data-testid={`month-cell-${dateStr}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono ${isToday ? "font-bold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </span>
                    {isAbsent && isCurrentMonth && (
                      <Ban className="h-2.5 w-2.5 text-yellow-500" />
                    )}
                  </div>
                  {totalHours > 0 && isCurrentMonth && (
                    <div className="mt-0.5">
                      <span className={`text-[11px] font-mono font-bold ${totalHours >= 8 ? "text-green-500" : "text-primary"}`} data-testid={`month-hours-${dateStr}`}>
                        {totalHours}h
                      </span>
                      {dayEntries.length > 0 && (
                        <span className="text-[9px] font-mono text-muted-foreground ml-1">({dayEntries.length})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
