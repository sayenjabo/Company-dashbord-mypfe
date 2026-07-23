import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function SessionsPage() {
  const [companyFilter, setCompanyFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.getCompanies(),
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => api.getTrainings(),
  });

  const filtered = sessions.filter((s: any) => {
    const companyName = s.company?.companyName || "";
    const trainingTitle = s.training?.title || "";
    const date = s.completedAt ? new Date(s.completedAt) : null;

    if (companyFilter !== "all" && companyName !== companyFilter) return false;
    if (trainingFilter !== "all" && trainingTitle !== trainingFilter) return false;
    if (dateFrom && date && date < new Date(dateFrom)) return false;
    if (dateTo && date && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Sessions</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} of {sessions.length} sessions
        </p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by company" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((c: any) => (
              <SelectItem key={c._id} value={c.companyName}>{c.companyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={trainingFilter} onValueChange={setTrainingFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by training" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trainings</SelectItem>
            {trainings.map((t: any) => (
              <SelectItem key={t._id} value={t.title}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />

        {(companyFilter !== "all" || trainingFilter !== "all" || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => {
            setCompanyFilter("all");
            setTrainingFilter("all");
            setDateFrom("");
            setDateTo("");
          }}>
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Loading sessions...</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Attempt</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Company</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Training</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Employee</th>
                <th className="text-left p-4 font-medium">Score</th>
                <th className="text-left p-4 font-medium">Result</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Date</th>
                <th className="text-right p-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const score = s.score ?? 0;
                const passed = s.passed ?? (score >= 70);
                const date = s.completedAt || s.createdAt || "";

                return (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">#{s.attemptNumber || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{s.company?.companyName || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{s.training?.title || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{s.employee?.name || "—"}</td>
                    <td className="p-4">{score}%</td>
                    <td className="p-4">
                      <Badge variant={passed ? "default" : "destructive"}>
                        {passed ? "Pass" : "Fail"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      {date ? new Date(date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No sessions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Session Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Attempt</span>
                  <p className="font-medium">#{selected.attemptNumber || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Company</span>
                  <p className="font-medium">{selected.company?.companyName || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Training</span>
                  <p className="font-medium">{selected.training?.title || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Employee</span>
                  <p className="font-medium">{selected.employee?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-medium">{formatDuration(selected.durationSeconds)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Score</span>
                  <p className="font-medium">{selected.score ?? 0}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Result</span>
                  <Badge variant={(selected.passed ?? (selected.score >= 70)) ? "default" : "destructive"}>
                    {(selected.passed ?? (selected.score >= 70)) ? "Pass" : "Fail"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">
                    {selected.completedAt ? new Date(selected.completedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                {selected.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes</span>
                    <p className="font-medium mt-1">{selected.notes}</p>
                  </div>
                )}
              </div>

              {selected.evaluationCriteria && selected.evaluationCriteria.length > 0 && (
                <div>
                  <h4 className="font-heading font-semibold mb-3">Evaluation Criteria</h4>
                  <div className="space-y-3">
                    {selected.evaluationCriteria.map((cr: any) => (
                      <div key={cr.criteriaName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {cr.criteriaName}
                            <Badge variant={cr.passed ? "default" : "destructive"} className="text-xs py-0">
                              {cr.passed ? "Pass" : "Fail"}
                            </Badge>
                          </span>
                          <span>{cr.score ?? 0}/100</span>
                        </div>
                        <Progress value={cr.score ?? 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
