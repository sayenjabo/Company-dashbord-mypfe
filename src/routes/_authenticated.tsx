import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  HardDrive,
  Activity,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/devices", label: "Devices", icon: HardDrive },
  { to: "/sessions", label: "Sessions", icon: Activity },
] as const;

function AuthedLayout() {
  const { company, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !company) navigate({ to: "/login", replace: true });
  }, [loading, company, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:static",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold text-sidebar-foreground">
                Tynass
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {company.companyName || "Company"}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active =
              pathname === item.to ||
              (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate({ to: "/login", replace: true });
            }}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign out"}
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {company.email as string}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
