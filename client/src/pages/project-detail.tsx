import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft, FolderKanban, CalendarDays, Clock, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTaskSchema, type Task, type InsertTask, type Project, type Client, type User } from "@shared/schema";
import { useLocation } from "wouter";

interface ProjectDetailProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const projectId = params.id;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: project, isLoading: loadingProject } = useQuery<Project>({ queryKey: ["/api/projects", projectId] });
  const { data: allTasks = [], isLoading: loadingTasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const tasks = allTasks.filter(t => t.projectId === projectId);
  const client = clients.find(c => c.id === project?.clientId);
  const userMap = new Map(users.map(u => [u.id, u]));

  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: { name: "", projectId, startDate: "", endDate: "", plannedHours: 0, assignedUserIds: [], note: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTask) => apiRequest("POST", "/api/tasks", { ...data, projectId, assignedUserIds: selectedUsers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attività creata con successo" });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTask> }) =>
      apiRequest("PATCH", `/api/tasks/${id}`, { ...data, assignedUserIds: selectedUsers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attività aggiornata" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attività eliminata" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Errore durante l'eliminazione", description: err.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditTask(null);
    setSelectedUsers([]);
    form.reset({ name: "", projectId, startDate: "", endDate: "", plannedHours: 0, assignedUserIds: [], note: "" });
  }

  function openNew() {
    setEditTask(null);
    setSelectedUsers([]);
    form.reset({ name: "", projectId, startDate: "", endDate: "", plannedHours: 0, assignedUserIds: [], note: "" });
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setSelectedUsers(task.assignedUserIds || []);
    form.reset({
      name: task.name,
      projectId: task.projectId,
      startDate: task.startDate || "",
      endDate: task.endDate || "",
      plannedHours: task.plannedHours || 0,
      assignedUserIds: task.assignedUserIds || [],
      note: task.note || "",
    });
    setOpen(true);
  }

  function onSubmit(data: InsertTask) {
    if (editTask) {
      updateMutation.mutate({ id: editTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = loadingProject || loadingTasks;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/projects")} data-testid="button-back-projects">
          <ArrowLeft className="h-4 w-4 mr-2" /> Torna ai Progetti
        </Button>
        <p className="text-muted-foreground mt-4 font-mono text-sm">Progetto non trovato.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} data-testid="button-back-projects">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-project-name">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {client && <Badge variant="secondary" className="font-mono text-[10px] tracking-wider">{client.name}</Badge>}
            <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">Dettaglio Progetto</span>
          </div>
        </div>
      </div>

      {project.notes && (
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-sm text-muted-foreground" data-testid="text-project-notes">{project.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Attività</h2>
          <Badge variant="outline" className="font-mono text-[10px]">{tasks.length}</Badge>
        </div>
        <Button onClick={openNew} data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" /> Nuova Attività
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground text-xs font-mono tracking-wider">NESSUNA ATTIVITÀ</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">Clicca "Nuova Attività" per aggiungere</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">#</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">Nome</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">Date</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Ore Prev.</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">Assegnatari</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, idx) => {
                  const assigned = (task.assignedUserIds || []).map(id => userMap.get(id)).filter(Boolean);
                  return (
                    <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</TableCell>
                      <TableCell>
                        <div>
                          <span data-testid={`text-task-name-${task.id}`}>{task.name}</span>
                          {task.note && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{task.note}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {task.startDate && <span>{task.startDate}</span>}
                        {task.startDate && task.endDate && <span className="text-primary/40 mx-1">→</span>}
                        {task.endDate && <span>{task.endDate}</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm" data-testid={`text-task-hours-${task.id}`}>
                        {task.plannedHours ? `${task.plannedHours}h` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {assigned.map(u => u && (
                            <Badge key={u.id} variant="outline" className="text-[10px] font-mono">{u.name} {u.surname[0]}.</Badge>
                          ))}
                          {assigned.length === 0 && <span className="text-[10px] text-muted-foreground font-mono">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(task)} data-testid={`button-edit-task-${task.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(task)} data-testid={`button-delete-task-${task.id}`}>
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

      <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wide">{editTask ? "// MODIFICA ATTIVITÀ" : "// NUOVA ATTIVITÀ"}</DialogTitle>
            <DialogDescription className="text-xs font-mono tracking-wider">
              {editTask ? "Modifica i dettagli dell'attività" : "Inserisci i dettagli della nuova attività"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Nome</FormLabel>
                  <FormControl><Input {...field} placeholder="Nome attività" data-testid="input-task-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Data Inizio</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-start" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Data Fine</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-end" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="plannedHours" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Ore Previste</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      {...field}
                      value={field.value || ""}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-task-hours"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div>
                <label className="text-xs font-mono tracking-wider uppercase mb-2 block text-foreground">Assegnatari</label>
                <div className="space-y-2 border rounded-md p-3">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`assign-${u.id}`}
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                        data-testid={`checkbox-user-${u.id}`}
                      />
                      <label htmlFor={`assign-${u.id}`} className="text-sm font-mono cursor-pointer">
                        {u.name} {u.surname}
                      </label>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-[10px] text-muted-foreground font-mono">Nessun operatore disponibile</p>}
                </div>
              </div>
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono tracking-wider uppercase">Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Note sull'attività..." data-testid="input-task-note" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog} data-testid="button-cancel-task">Annulla</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-task">
                  {isPending ? "Salvataggio..." : editTask ? "Aggiorna" : "Crea"}
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
              Sei sicuro di voler eliminare l'attività <strong>{deleteTarget?.name}</strong>? Questa azione non può essere annullata.
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
