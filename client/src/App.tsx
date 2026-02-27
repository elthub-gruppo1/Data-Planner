import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ProjectsPage from "@/pages/projects";
import TasksPage from "@/pages/tasks";
import TimeEntriesPage from "@/pages/time-entries";
import UsersPage from "@/pages/users";
import LoginPage from "@/pages/login";
import { useEffect, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/time-entries" component={TimeEntriesPage} />
      <Route path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function AuthenticatedApp({ currentUser, onLogout }: { currentUser: any; onLogout: () => void }) {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 px-3 py-2 border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="hidden sm:flex items-center gap-2" data-testid="status-online">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 dark:bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wide hidden sm:block" data-testid="text-header-date">
                {new Date().toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5 border-l pl-3 border-border" data-testid="text-logged-user">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono text-foreground tracking-wide">
                  {currentUser.name} {currentUser.surname}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onLogout}
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { data: currentUser, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    queryClient.clear();
    refetch();
  }

  function handleLogin(user: any) {
    queryClient.clear();
    refetch();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Inizializzazione sistema...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AuthenticatedApp currentUser={currentUser} onLogout={handleLogout} />;
}

function App() {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored !== "light") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
