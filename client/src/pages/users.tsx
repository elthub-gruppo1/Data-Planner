import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, Cpu, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";

export default function UsersPage() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { name: "", surname: "", email: "", dailyHours: 8 },
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
    },
  });

  function closeDialog() {
    setOpen(false);
    setEditUser(null);
    form.reset({ name: "", surname: "", email: "", dailyHours: 8 });
  }

  function openEdit(user: User) {
    setEditUser(user);
    form.reset({ name: user.name, surname: user.surname, email: user.email, dailyHours: user.dailyHours });
    setOpen(true);
  }

  function onSubmit(data: InsertUser) {
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data });
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
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Team</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-wider uppercase">Operator Management Module</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-2" /> Nuovo Operatore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono tracking-wide">{editUser ? "// MODIFICA OPERATORE" : "// NUOVO OPERATORE"}</DialogTitle>
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
                    <FormLabel className="text-xs font-mono tracking-wider uppercase">Email</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder="mario@email.com" data-testid="input-user-email" className="font-mono" /></FormControl>
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
                  <Button type="button" variant="secondary" onClick={closeDialog}>Annulla</Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <p className="text-muted-foreground text-xs font-mono tracking-wider">NO OPERATORS REGISTERED</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">Click "Nuovo Operatore" to add</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(user => (
            <Card key={user.id} className="hover-elevate" data-testid={`card-user-${user.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-mono font-bold">
                      {user.name[0]}{user.surname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{user.name} {user.surname}</CardTitle>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</p>
                    <p className="text-[10px] text-primary font-mono font-semibold mt-0.5">{user.dailyHours}h/day</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(user.id)} data-testid={`button-delete-user-${user.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
