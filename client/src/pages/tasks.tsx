import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ListChecks, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTaskSchema, type Task, type InsertTask, type Project, type User } from "@shared/schema";

export default function TasksPage() {
  const { toast } = useToast();
  const { data: tasks = [], isLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: { name: "", projectId: "", startDate: "", endDate: "", plannedHours: 0, assignedUserIds: [] },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTask) => apiRequest("POST", "/api/tasks", { ...data, assignedUserIds: selectedUsers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attivit\u00e0 creata con successo" });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertTask> }) =>
      apiRequest("PATCH", `/api/tasks/${id}`, { ...data, assignedUserIds: selectedUsers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attivit\u00e0 aggiornata" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Attivit\u00e0 eliminata" });
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditTask(null);
    setSelectedUsers([]);
    form.reset({ name: "", projectId: "", startDate: "", endDate: "", plannedHours: 0, assignedUserIds: [] });
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

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const userMap = new Map(users.map(u => [u.id, u]));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Attivit&agrave;</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci le attivit&agrave; dei tuoi progetti</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-task">
              <Plus className="h-4 w-4 mr-2" /> Nuova Attivit&agrave;
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTask ? "Modifica Attivit\u00e0" : "Nuova Attivit\u00e0"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome attivit\u00e0" data-testid="input-task-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progetto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-project">
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Inizio</FormLabel>
                      <FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-start" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fine</FormLabel>
                      <FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-end" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="plannedHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Pianificate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-task-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div>
                  <Label className="text-sm font-medium mb-2 block">Assegna Utenti</Label>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <Badge
                        key={u.id}
                        variant={selectedUsers.includes(u.id) ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleUser(u.id)}
                        data-testid={`badge-user-${u.id}`}
                      >
                        {u.name} {u.surname}
                      </Badge>
                    ))}
                    {users.length === 0 && <p className="text-xs text-muted-foreground">Nessun utente disponibile</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={closeDialog}>Annulla</Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-task">
                    {isPending ? "Salvataggio..." : editTask ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-sm">Nessuna attivit&agrave; ancora</p>
            <p className="text-xs text-muted-foreground mt-1">Clicca su "Nuova Attivit&agrave;" per iniziare</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const project = projectMap.get(task.projectId);
            const assigned = (task.assignedUserIds || []).map(id => userMap.get(id)).filter(Boolean);
            return (
              <Card key={task.id} data-testid={`card-task-${task.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 pb-2">
                  <div className="min-w-0 space-y-1.5">
                    <CardTitle className="text-base truncate">{task.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {project && <Badge variant="secondary">{project.name}</Badge>}
                      {task.plannedHours && (
                        <span className="text-xs text-muted-foreground">{task.plannedHours}h pianificate</span>
                      )}
                    </div>
                    {(task.startDate || task.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {task.startDate && <span>{task.startDate}</span>}
                        {task.startDate && task.endDate && <span>-</span>}
                        {task.endDate && <span>{task.endDate}</span>}
                      </div>
                    )}
                    {assigned.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {assigned.map(u => u && (
                          <Badge key={u.id} variant="outline" className="text-xs">{u.name} {u.surname}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(task)} data-testid={`button-edit-task-${task.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(task.id)} data-testid={`button-delete-task-${task.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
