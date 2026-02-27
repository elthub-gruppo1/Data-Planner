import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bot, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const user = await res.json();
      onLogin(user);
    } catch (err: any) {
      const msg = err.message?.includes("401") ? "Credenziali non valide" : "Errore di connessione";
      setError(msg);
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-8 w-8" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-mono tracking-wider" data-testid="text-login-title">XEEL.TT</h1>
            <p className="text-[10px] text-muted-foreground font-mono tracking-[0.25em] uppercase mt-1">Time Tracker System</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-mono tracking-wide">ACCESSO SISTEMA</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">INSERISCI CREDENZIALI</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  className="font-mono"
                  data-testid="input-login-username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="font-mono"
                  data-testid="input-login-password"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive font-mono tracking-wider" data-testid="text-login-error">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !username || !password} data-testid="button-login-submit">
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] text-muted-foreground font-mono tracking-widest uppercase">
          Default: admin / admin
        </p>
      </div>
    </div>
  );
}
