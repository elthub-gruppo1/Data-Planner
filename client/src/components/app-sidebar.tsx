import { LayoutDashboard, Users, Briefcase, FolderKanban, ListChecks, Clock, Bot, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clienti", url: "/clients", icon: Briefcase },
  { title: "Progetti", url: "/projects", icon: FolderKanban },
  { title: "Attivit\u00e0", url: "/tasks", icon: ListChecks },
  { title: "Time Tracking", url: "/time-entries", icon: Clock },
  { title: "Team", url: "/users", icon: Users },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider uppercase font-mono" data-testid="text-app-name">XEEL.TT</p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-widest">TIME TRACKER v1.0</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.2em] uppercase">Moduli</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} className={isActive ? "data-[active=true]:bg-primary/10 data-[active=true]:text-primary" : ""}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium tracking-wide">{item.title}</span>
                        {isActive && <Zap className="h-3 w-3 ml-auto text-primary" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="border-t border-border pt-3">
          <p className="text-[9px] text-muted-foreground font-mono tracking-widest text-center" data-testid="text-system-status">SYSTEM OPERATIONAL</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5" data-testid="status-system-indicators">
            <div className="h-1 w-1 rounded-full bg-emerald-400 dark:bg-emerald-400" />
            <div className="h-1 w-1 rounded-full bg-emerald-400 dark:bg-emerald-400" />
            <div className="h-1 w-1 rounded-full bg-emerald-400 dark:bg-emerald-400" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
