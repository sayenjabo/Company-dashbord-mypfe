import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { api, type Employee, type Milestone } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/employees/$id")({
  head: () => ({
    meta: [
      { title: "Employee — Tynass" },
      { name: "description", content: "Employee detail and training milestones." },
    ],
  }),
  component: EmployeeDetail,
});

function MilestoneForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial?: Partial<Milestone>;
  onSubmit: (data: { trainingId: string; targetDate: string; notes: string }) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [trainingId, setTrainingId] = useState(initial?.trainingId ?? "");
  const [targetDate, setTargetDate] = useState(
    initial?.targetDate ? initial.targetDate.slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ trainingId, targetDate, notes });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="trainingId">Training ID</Label>
        <Input
          id="trainingId"
          required
          value={trainingId}
          onChange={(e) => setTrainingId(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="targetDate">Target date</Label>
        <Input
          id="targetDate"
          type="date"
          required
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EmployeeDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api<Employee[] | { employees: Employee[] }>(
        "/api/company/employees",
      );
      return Array.isArray(res) ? res : res.employees ?? [];
    },
  });
  const employee = employees.data?.find((e) => e._id === id);

  const milestones = useQuery({
    queryKey: ["milestones", id],
    queryFn: async () => {
      const res = await api<Milestone[] | { milestones: Milestone[] }>(
        `/api/company/employees/${id}/milestones`,
      );
      return Array.isArray(res) ? res : res.milestones ?? [];
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: { trainingId: string; targetDate: string; notes: string }) =>
      api(`/api/company/employees/${id}/milestones`, {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      toast.success("Milestone added");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setCreateOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({
      milestoneId,
      payload,
    }: {
      milestoneId: string;
      payload: { trainingId: string; targetDate: string; notes: string };
    }) =>
      api(`/api/company/employees/${id}/milestones/${milestoneId}`, {
        method: "PATCH",
        json: payload,
      }),
    onSuccess: () => {
      toast.success("Milestone updated");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (milestoneId: string) =>
      api(`/api/company/employees/${id}/milestones/${milestoneId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Milestone removed");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setDeleting(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All employees
          </Link>
        </Button>
      </div>

      <PageHeader
        title={employee?.name || "Employee"}
        description={
          employee
            ? `${employee.department || "—"} · Access code: ${employee.accessCode || "—"}`
            : "Loading…"
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Milestones</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              onSubmit={(v) => createMut.mutate(v)}
              submitting={createMut.isPending}
              submitLabel="Add milestone"
            />
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard>
        {milestones.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (milestones.data ?? []).length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description="Set training milestones and target dates for this employee."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {(milestones.data ?? []).map((m) => (
              <div
                key={m._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">
                      Training {m.trainingId || "—"}
                    </div>
                    {m.status && <Badge variant="secondary">{m.status}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target:{" "}
                    {m.targetDate
                      ? new Date(m.targetDate).toLocaleDateString()
                      : "—"}
                    {m.notes ? ` · ${m.notes}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(m)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(m)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit milestone</DialogTitle>
          </DialogHeader>
          {editing && (
            <MilestoneForm
              initial={editing}
              onSubmit={(v) =>
                updateMut.mutate({ milestoneId: editing._id, payload: v })
              }
              submitting={updateMut.isPending}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMut.mutate(deleting._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
