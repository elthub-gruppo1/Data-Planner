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
import { Plus, Pencil, Trash2, FolderKanban, Cpu, GitBranch } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProjectSchema, type Project, type InsertProject, type Client } from "@shared/schema";

export default function ProjectsPage() {
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const [open, setOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: { name: "", clientId: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Progetto creato con successo" });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertProject> }) =>
      apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Progetto aggiornato" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Progetto eliminato" });
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditProject(null);
    form.reset({ name: "", clientId: "", notes: "" });
  }

  function openEdit(project: Project) {
    setEditProject(project);
    form.reset({ name: project.name, clientId: project.clientId, notes: project.notes || "" });
    setOpen(true);
  }

  function onSubmit(data: InsertProject) {
    if (editProject) {
      updateMutation.mutate({ id: editProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const clientMap = new Map(clients.map(c => [c.id, c]));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Progetti</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">Project Management Module</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-project">
              <Plus className="h-4 w-4 mr-2" /> Nuovo Progetto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono tracking-wide">{editProject ? "// MODIFICA PROGETTO" : "// NUOVO PROGETTO"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Nome</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome progetto" data-testid="input-project-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-client">
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Note</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Note sul progetto..." data-testid="input-project-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={closeDialog}>Annulla</Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-project">
                    {isPending ? "Salvataggio..." : editProject ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground text-xs font-mono tracking-wider">NO PROJECTS INITIALIZED</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">Click "Nuovo Progetto" to create</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map(project => {
            const client = clientMap.get(project.clientId);
            return (
              <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 pb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <FolderKanban className="h-3 w-3 text-primary" />
                      </div>
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    </div>
                    {client && (
                      <Badge variant="secondary" className="mt-2 font-mono text-[10px] tracking-wider">{client.name}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(project)} data-testid={`button-edit-project-${project.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(project.id)} data-testid={`button-delete-project-${project.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {project.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
