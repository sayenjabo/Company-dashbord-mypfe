import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(174,72%,46%)", "hsl(210,80%,55%)", "hsl(38,92%,55%)", "hsl(152,60%,45%)", "hsl(0,72%,55%)", "hsl(280,60%,55%)"];

export default function StatisticsPage() {
  const { data: trainingStats = [] } = useQuery({
    queryKey: ["trainingStats"],
    queryFn: () => api.getTrainingStats(),
  });

  const { data: companyStats = [] } = useQuery({
    queryKey: ["companyStats"],
    queryFn: () => api.getCompanyStats(),
  });

  // FIX: use correct backend field names (totalSessions, title, category)
  const trainingData = Array.isArray(trainingStats)
    ? trainingStats.map((t: any) => ({
        name: t.title || "Unknown",
        avgScore: t.avgScore || 0,
        playCount: t.totalSessions || 0,
        passRate: t.passRate || 0,
        category: t.category || "",
      }))
    : [];

  // FIX: use correct backend field names (companyName, totalSessions)
  const companyData = Array.isArray(companyStats)
    ? companyStats.map((c: any) => ({
        name: c.companyName || "Unknown",
        sessions: c.totalSessions || 0,
        passRate: c.passRate || 0,
        // FIX: format date properly
        lastActivity: c.lastActivity
          ? new Date(c.lastActivity).toLocaleDateString()
          : "—",
      }))
    : [];

  // Pie chart data — sessions per training
  const pieData = trainingData.filter(t => t.playCount > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Statistics</h1>
        <p className="text-muted-foreground text-sm">Analytics across trainings and companies</p>
      </div>

      {trainingData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h2 className="font-heading font-semibold text-lg mb-4">Training Performance — Avg Score</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainingData}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                <Bar dataKey="avgScore" fill="hsl(174,72%,46%)" radius={[4, 4, 0, 0]} name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h2 className="font-heading font-semibold text-lg mb-4">Sessions by Training</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="playCount"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {companyData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h2 className="font-heading font-semibold text-lg mb-4">Company Sessions</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "hsl(215,12%,52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "hsl(215,12%,52%)", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: "hsl(220,18%,10%)", border: "1px solid hsl(220,14%,18%)", borderRadius: 8, color: "hsl(210,20%,92%)" }} />
                  <Bar dataKey="sessions" fill="hsl(210,80%,55%)" radius={[0, 4, 4, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {trainingData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
          <h2 className="font-heading font-semibold text-lg p-5 pb-0">Training Details</h2>
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Training</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Avg Score</th>
                <th className="text-left p-4 font-medium">Sessions</th>
                <th className="text-left p-4 font-medium">Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {trainingData.map((t: any) => (
                <tr key={t.name} className="border-b border-border/30 last:border-0">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4 text-muted-foreground">{t.category}</td>
                  <td className="p-4">{t.avgScore}%</td>
                  <td className="p-4">{t.playCount}</td>
                  <td className="p-4">{t.passRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {companyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card overflow-hidden">
          <h2 className="font-heading font-semibold text-lg p-5 pb-0">Company Details</h2>
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium">Sessions</th>
                <th className="text-left p-4 font-medium">Pass Rate</th>
                <th className="text-left p-4 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {companyData.map((c: any) => (
                <tr key={c.name} className="border-b border-border/30 last:border-0">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4">{c.sessions}</td>
                  <td className="p-4">{c.passRate}%</td>
                  <td className="p-4 text-muted-foreground">{c.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {trainingData.length === 0 && companyData.length === 0 && (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No statistics data available yet
        </div>
      )}
    </div>
  );
}
