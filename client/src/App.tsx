import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import { useEffect } from "react";

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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground tracking-wide hidden sm:block" data-testid="text-header-date">
                    {new Date().toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                  </span>
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
