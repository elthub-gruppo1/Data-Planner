import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTimeEntrySchema, type TimeEntry, type InsertTimeEntry, type Project, type Task, type User } from "@shared/schema";

export default function TimeEntriesPage() {
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useQuery<TimeEntry[]>({ queryKey: ["/api/time-entries"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<InsertTimeEntry>({
    resolver: zodResolver(insertTimeEntrySchema),
    defaultValues: { userId: "", date: today, projectId: "", taskId: "", hours: 0, note: "" },
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
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTimeEntry> }) =>
      apiRequest("PATCH", `/api/time-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Registrazione aggiornata" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Registrazione eliminata" });
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditEntry(null);
    form.reset({ userId: "", date: today, projectId: "", taskId: "", hours: 0, note: "" });
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

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const userMap = new Map(users.map(u => [u.id, u]));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Time Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} registrazioni &middot; {totalHours.toFixed(1)} ore totali
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-entry">
              <Plus className="h-4 w-4 mr-2" /> Nuova Registrazione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editEntry ? "Modifica Registrazione" : "Nuova Registrazione"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utente</FormLabel>
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
                    <FormLabel>Data</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-entry-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progetto</FormLabel>
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
                      <FormLabel>Attivit&agrave; (opzionale)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-entry-task">
                            <SelectValue placeholder="Seleziona attivit\u00e0" />
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
                    <FormLabel>Ore</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-entry-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Descrizione delle attivit\u00e0 svolte..." data-testid="input-entry-note" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={closeDialog}>Annulla</Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-entry">
                    {isPending ? "Salvataggio..." : editEntry ? "Aggiorna" : "Registra"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">Nessuna registrazione ore</p>
            <p className="text-xs text-muted-foreground mt-1">Clicca su "Nuova Registrazione" per iniziare</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map(entry => {
            const user = userMap.get(entry.userId);
            const project = projectMap.get(entry.projectId);
            const task = entry.taskId ? taskMap.get(entry.taskId) : null;
            return (
              <Card key={entry.id} data-testid={`card-entry-${entry.id}`}>
                <CardContent className="flex items-center justify-between gap-2 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{user ? `${user.name} ${user.surname}` : "Utente"}</span>
                      <Badge variant="secondary" className="text-xs">{project?.name || "Progetto"}</Badge>
                      {task && <Badge variant="outline" className="text-xs">{task.name}</Badge>}
                    </div>
                    {entry.note && <p className="text-xs text-muted-foreground mt-1 truncate">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{entry.hours}h</p>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(entry)} data-testid={`button-edit-entry-${entry.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)} data-testid={`button-delete-entry-${entry.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
