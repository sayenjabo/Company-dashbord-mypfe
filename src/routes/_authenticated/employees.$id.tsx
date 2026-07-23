import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { companyApi, type Milestone } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export const Route = createFileRoute("/_authenticated/employees/$id")({
  component: EmployeeDetail,
});

function MilestoneForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial?: Partial<Milestone>;
  onSubmit: (data: { title: string; type: string; description: string; module: string }) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(initial?.notes ?? "");
  const [type, setType] = useState("training");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, type, description, module }); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Complete Fire Evacuation training" />
      </div>
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="task">Task</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <div className="space-y-2">
        <Label>Module / Scene</Label>
        <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="FireEvacuationScene" className="font-mono" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

function EmployeeDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => companyApi.getEmployees(),
  });
  const employee = employees.data?.find((e: any) => e._id === id || e.id === id);

  const milestones = useQuery({
    queryKey: ["milestones", id],
    queryFn: () => companyApi.getMilestones(id),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: any) => companyApi.addMilestone(id, payload),
    onSuccess: () => {
      toast.success("Milestone added");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ milestoneId, payload }: { milestoneId: string; payload: any }) =>
      companyApi.updateMilestone(id, milestoneId, payload),
    onSuccess: () => {
      toast.success("Milestone updated");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (milestoneId: string) => companyApi.deleteMilestone(id, milestoneId),
    onSuccess: () => {
      toast.success("Milestone removed");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/employees"><ArrowLeft className="mr-2 h-4 w-4" />All employees</Link>
        </Button>
      </div>

      <PageHeader
        title={employee?.name || "Employee"}
        description={employee ? `${employee.jobTitle || "—"} · ${employee.department || "—"} · Code: ${employee.accessCode || "—"}` : "Loading…"}
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add milestone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add milestone</DialogTitle></DialogHeader>
            <MilestoneForm onSubmit={(v) => createMut.mutate(v)} submitting={createMut.isPending} submitLabel="Add milestone" />
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard>
        {milestones.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (milestones.data ?? []).length === 0 ? (
          <EmptyState title="No milestones yet" description="Set training milestones for this employee." />
        ) : (
          <div className="divide-y divide-border/60">
            {(milestones.data ?? []).map((m: any) => (
              <div key={m._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{m.title || "—"}</div>
                    {m.status && <Badge variant="secondary">{m.status}</Badge>}
                    {m.type && <Badge variant="outline">{m.type}</Badge>}
                  </div>
                  {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                  {m.module && <div className="text-xs text-muted-foreground font-mono">Scene: {m.module}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(m)}>
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
          <DialogHeader><DialogTitle>Edit milestone</DialogTitle></DialogHeader>
          {editing && (
            <MilestoneForm
              initial={editing}
              onSubmit={(v) => updateMut.mutate({ milestoneId: editing._id, payload: v })}
              submitting={updateMut.isPending}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove milestone?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this milestone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(deleting!._id)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
