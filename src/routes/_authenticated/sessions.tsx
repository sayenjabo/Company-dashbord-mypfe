import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { companyApi, type Session } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Progress } from "../../components/ui/progress";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sessions")({
  component: SessionsPage,
});

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function SessionsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => companyApi.getSessions(),
  });

  const filtered = data.filter((s: Session) => {
    const date = s.completedAt ? new Date(s.completedAt) : null;
    if (dateFrom && date && date < new Date(dateFrom)) return false;
    if (dateTo && date && date > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Sessions"
        description={`${filtered.length} of ${data.length} sessions`}
      />

      <div className="flex gap-3 flex-wrap items-center mb-6">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <span className="text-muted-foreground text-sm">to</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No sessions found" description="Sessions will appear here after training runs." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-4 font-medium">Training</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Employee</th>
                  <th className="text-left p-4 font-medium">Score</th>
                  <th className="text-left p-4 font-medium">Result</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Duration</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right p-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: Session) => (
                  <tr key={s._id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{s.training?.title || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{s.employee?.name || "—"}</td>
                    <td className="p-4">{s.score}%</td>
                    <td className="p-4">
                      <Badge variant={s.passed ? "default" : "destructive"}>
                        {s.passed ? "Pass" : "Fail"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{formatDuration(s.durationSeconds)}</td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Session Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Training</span><p className="font-medium">{selected.training?.title || "—"}</p></div>
                <div><span className="text-muted-foreground">Employee</span><p className="font-medium">{selected.employee?.name || "—"}</p></div>
                <div><span className="text-muted-foreground">Score</span><p className="font-medium">{selected.score}%</p></div>
                <div><span className="text-muted-foreground">Result</span>
                  <Badge variant={selected.passed ? "default" : "destructive"}>
                    {selected.passed ? "Pass" : "Fail"}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-medium">{formatDuration(selected.durationSeconds)}</p></div>
                <div><span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{selected.completedAt ? new Date(selected.completedAt).toLocaleDateString() : "—"}</p>
                </div>
                {selected.notes && (
                  <div className="col-span-2"><span className="text-muted-foreground">Notes</span><p className="font-medium">{selected.notes}</p></div>
                )}
              </div>
              {selected.evaluationCriteria && selected.evaluationCriteria.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Evaluation Criteria</h4>
                  <div className="space-y-3">
                    {selected.evaluationCriteria.map((cr) => (
                      <div key={cr.criteriaName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {cr.criteriaName}
                            <Badge variant={cr.passed ? "default" : "destructive"} className="text-xs py-0">
                              {cr.passed ? "Pass" : "Fail"}
                            </Badge>
                          </span>
                          <span>{cr.score}/100</span>
                        </div>
                        <Progress value={cr.score} className="h-2" />
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
