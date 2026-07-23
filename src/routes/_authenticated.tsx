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
  const { company, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login", replace: true });
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:static",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-bold text-sidebar-foreground">Tynass</div>
                <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {company?.companyName || "Company"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 pt-4">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive hover:bg-sidebar-accent/50"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center border-b border-border/50 px-4 gap-3">
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
            className="hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
