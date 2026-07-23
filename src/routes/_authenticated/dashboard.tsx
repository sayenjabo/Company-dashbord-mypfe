import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, HardDrive, Activity, Target, ArrowRight } from "lucide-react";
import { companyApi, type Employee, type Device, type Session } from "../../lib/api";
import { PageHeader, StatCard, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Badge } from "../../components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function DashboardPage() {
  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => companyApi.getEmployees(),
  });
  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: () => companyApi.getDevices(),
  });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => companyApi.getSessions(),
  });

  const employeeList: Employee[] = employees.data ?? [];
  const deviceList: Device[] = devices.data ?? [];
  const sessionList: Session[] = sessions.data ?? [];

  const passRate = sessionList.length > 0
    ? Math.round((sessionList.filter((s) => s.passed).length / sessionList.length) * 100)
    : 0;

  const recent = [...sessionList]
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of your VR training program." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={employeeList.length} icon={<Users className="h-5 w-5" />} delay={0} />
        <StatCard label="Devices" value={deviceList.length} icon={<HardDrive className="h-5 w-5" />} delay={0.05} />
        <StatCard label="Sessions played" value={sessionList.length} icon={<Activity className="h-5 w-5" />} delay={0.1} />
        <StatCard label="Global pass rate" value={`${passRate}%`} icon={<Target className="h-5 w-5" />} delay={0.15}
          hint={`${sessionList.filter((s) => s.passed).length} passed / ${sessionList.length}`} />
      </div>

      <div className="mt-8">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent sessions</h2>
            <Link to="/sessions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {sessions.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : recent.length === 0 ? (
            <EmptyState title="No sessions yet" description="Sessions will appear here once your team starts training." />
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((s) => (
                <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.training?.title || "—"}</span>
                      <Badge variant={s.passed ? "default" : "destructive"}>
                        {s.passed ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.employee?.name || "—"} · Score: {s.score}% · {formatDuration(s.durationSeconds)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
