import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, type Session } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — Tynass" },
      { name: "description", content: "Review VR training sessions across your team." },
    ],
  }),
  component: SessionsPage,
});

function fmtDuration(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function SessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api<{ sessions: Session[] }>("/api/sessions/my"),
  });
  const sessions = data?.sessions ?? [];

  const trainings = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.training?.title && set.add(s.training.title));
    return Array.from(set).sort();
  }, [sessions]);

  const [training, setTraining] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (training !== "all" && s.training?.title !== training) return false;
      const t = s.completedAt ? new Date(s.completedAt).getTime() : 0;
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 24 * 3600_000) return false;
      return true;
    });
  }, [sessions, training, from, to]);

  return (
    <div>
      <PageHeader
        title="Sessions"
        description="All completed training sessions across your team."
      />

      <GlassCard className="mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Training</Label>
            <Select value={training} onValueChange={setTraining}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All trainings</SelectItem>
                {trainings.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setTraining("all");
                setFrom("");
                setTo("");
              }}
              className="w-full"
            >
              Reset filters
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No sessions match" description="Try adjusting the filters." />
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((s, i) => (
              <motion.button
                key={s._id}
                type="button"
                onClick={() => setSelected(s)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                className="flex w-full flex-wrap items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {s.training?.title || "Untitled"}{" "}
                    {s.training?.category && (
                      <span className="text-xs text-muted-foreground">
                        · {s.training.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.employee?.name || "Unknown"} ·{" "}
                    {s.completedAt ? new Date(s.completedAt).toLocaleString() : "—"} ·
                    Attempt {s.attemptNumber ?? 1} · {fmtDuration(s.durationSeconds)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-display text-xl font-bold tabular-nums">
                    {s.score}
                  </div>
                  <Badge variant={s.passed ? "default" : "destructive"}>
                    {s.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.training?.title || "Session"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Score" value={selected.score} />
                <Stat
                  label="Result"
                  value={
                    <Badge variant={selected.passed ? "default" : "destructive"}>
                      {selected.passed ? "Passed" : "Failed"}
                    </Badge>
                  }
                />
                <Stat label="Attempt" value={selected.attemptNumber ?? 1} />
                <Stat label="Duration" value={fmtDuration(selected.durationSeconds)} />
              </div>
              <div className="text-sm text-muted-foreground">
                {selected.employee?.name} ·{" "}
                {selected.completedAt
                  ? new Date(selected.completedAt).toLocaleString()
                  : "—"}
              </div>

              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Evaluation criteria
                </h3>
                {(selected.evaluationCriteria ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No criteria recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selected.evaluationCriteria!.map((c, i) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{c.criteriaName}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {c.score}
                          </span>
                        </div>
                        <Progress value={c.score} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
