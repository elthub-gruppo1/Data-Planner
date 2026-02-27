import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Cpu, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";

export default function UsersPage() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: currentUser } = useQuery<User | null>({ queryKey: ["/api/auth/me"], queryFn: getQueryFn({ on401: "returnNull" }) });
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { name: "", surname: "", email: "", password: "changeme", dailyHours: 8 },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente creato con successo" });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertUser> }) =>
      apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente aggiornato" });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente eliminato" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Errore durante l'eliminazione", description: err.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditUser(null);
    form.reset({ name: "", surname: "", email: "", password: "changeme", dailyHours: 8 });
  }

  function openEdit(user: User) {
    setEditUser(user);
    form.reset({ name: user.name, surname: user.surname, email: user.email, password: "changeme", dailyHours: user.dailyHours });
    setOpen(true);
  }

  function onSubmit(data: InsertUser) {
    if (editUser) {
      const { password, ...rest } = data;
      updateMutation.mutate({ id: editUser.id, data: rest });
    } else {
      createMutation.mutate(data);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Utenti</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">Gestione Operatori</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-2" /> Nuovo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono tracking-wide">{editUser ? "// MODIFICA UTENTE" : "// NUOVO UTENTE"}</DialogTitle>
              <DialogDescription className="text-xs font-mono tracking-wider">
                {editUser ? "Modifica i dati dell'utente" : "Inserisci i dati del nuovo utente"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono tracking-wider uppercase">Nome</FormLabel>
                      <FormControl><Input {...field} placeholder="Mario" data-testid="input-user-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="surname" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono tracking-wider uppercase">Cognome</FormLabel>
                      <FormControl><Input {...field} placeholder="Rossi" data-testid="input-user-surname" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Email / Username</FormLabel>
                    <FormControl><Input {...field} placeholder="mario@email.com" data-testid="input-user-email" className="font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dailyHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Ore Giornaliere</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="1"
                        max="24"
                        {...field}
                        value={field.value || 8}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 8)}
                        data-testid="input-user-hours"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={closeDialog} data-testid="button-cancel-user">Annulla</Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-user">
                    {isPending ? "Salvataggio..." : editUser ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground text-xs font-mono tracking-wider">NESSUN UTENTE REGISTRATO</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">Clicca "Nuovo" per aggiungere</p>
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
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">Cognome</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase">Email / Username</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Ore/Giorno</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider uppercase text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</TableCell>
                    <TableCell data-testid={`text-user-name-${user.id}`}>{user.name}</TableCell>
                    <TableCell data-testid={`text-user-surname-${user.id}`}>{user.surname}</TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-user-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell className="text-right font-mono text-sm" data-testid={`text-user-hours-${user.id}`}>{user.dailyHours}h</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {currentUser?.id !== user.id && (
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(user)} data-testid={`button-delete-user-${user.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono tracking-wide">// CONFERMA ELIMINAZIONE</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'utente <strong>{deleteTarget?.name} {deleteTarget?.surname}</strong>? Questa azione non può essere annullata.
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
