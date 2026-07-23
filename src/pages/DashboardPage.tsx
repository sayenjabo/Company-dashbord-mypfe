import { Building2, GraduationCap, PlayCircle, TrendingUp, Star, Zap } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { admin } = useAuth();

  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => api.getCompanies() });
  const { data: trainings = [] } = useQuery({ queryKey: ["trainings"], queryFn: () => api.getTrainings() });
  const { data: trainingStats } = useQuery({ queryKey: ["trainingStats"], queryFn: () => api.getTrainingStats() });
  const { data: companyStats } = useQuery({ queryKey: ["companyStats"], queryFn: () => api.getCompanyStats() });

  const totalSessions = Array.isArray(companyStats)
    ? companyStats.reduce((sum: number, c: any) => sum + (c.totalSessions || 0), 0)
    : 0;

  const globalPassRate = Array.isArray(trainingStats) && trainingStats.length
    ? Math.round(trainingStats.reduce((sum: number, t: any) => sum + (t.passRate || 0), 0) / trainingStats.length)
    : 0;

  // FIX: sort by totalSessions (backend field name)
  const topCompanies = Array.isArray(companyStats)
    ? [...companyStats].sort((a: any, b: any) => (b.totalSessions || 0) - (a.totalSessions || 0)).slice(0, 5)
    : [];

  // FIX: sort by totalSessions (backend field name)
  const topTrainings = Array.isArray(trainingStats)
    ? [...trainingStats].sort((a: any, b: any) => (b.totalSessions || 0) - (a.totalSessions || 0)).slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Welcome back{admin?.name ? `, ${admin.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">Overview of your VR training platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Companies" value={companies.length} icon={Building2} />
        <StatCard title="Total Trainings" value={trainings.length} icon={GraduationCap} />
        <StatCard title="Sessions Played" value={totalSessions.toLocaleString()} icon={PlayCircle} />
        <StatCard title="Global Pass Rate" value={`${globalPassRate}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" /> Most Active Companies
          </h2>
          <div className="space-y-3">
            {topCompanies.map((c: any, i: number) => (
              <div key={c.companyId || i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  {/* FIX: backend returns companyName not name */}
                  <span className="text-sm font-medium">{c.companyName}</span>
                </div>
                <span className="text-sm text-muted-foreground">{c.totalSessions || 0} sessions</span>
              </div>
            ))}
            {topCompanies.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Most Played Trainings
          </h2>
          <div className="space-y-3">
            {topTrainings.map((t: any, i: number) => (
              <div key={t.trainingId || i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <div>
                    {/* FIX: backend returns title and category directly */}
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">{t.category}</span>
                  </div>
                </div>
                {/* FIX: backend returns totalSessions not playCount */}
                <span className="text-sm text-muted-foreground">{t.totalSessions || 0} plays</span>
              </div>
            ))}
            {topTrainings.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
