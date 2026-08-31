import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { companyApi, type Milestone } from "../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../components/dashboard-ui";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";

function MilestoneForm({
  trainings,
  onSubmit,
  submitting,
  submitLabel,
}: {
  trainings: any[];
  onSubmit: (data: { title: string; type: string; description: string; module: string }) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [title, setTitle] = useState("");
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
        <Label>Module / Formation</Label>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une formation" />
          </SelectTrigger>
          <SelectContent>
            {trainings.map((t: any) => (
              <SelectItem key={t._id || t.id} value={t.title}>
                {t.title}
              </SelectItem>
            ))}
            {trainings.length === 0 && (
              <SelectItem value="_none" disabled>Aucune formation disponible</SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Titre exact de la formation pour l'auto-complétion du milestone
        </p>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => companyApi.getEmployees(),
  });
  const employee = employees.data?.find((e: any) => e._id === id);

  const milestones = useQuery({
    queryKey: ["milestones", id],
    queryFn: () => companyApi.getMilestones(id!),
    enabled: !!id,
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["companyTrainings"],
    queryFn: () => companyApi.getMyTrainings(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [deleting, setDeleting] = useState<Milestone | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: any) => companyApi.addMilestone(id!, payload),
    onSuccess: () => {
      toast.success("Milestone added");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: any }) =>
      companyApi.updateMilestone(id!, milestoneId, data),
    onSuccess: () => {
      toast.success("Milestone updated");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (milestoneId: string) => companyApi.deleteMilestone(id!, milestoneId),
    onSuccess: () => {
      toast.success("Milestone removed");
      qc.invalidateQueries({ queryKey: ["milestones", id] });
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const openEdit = (m: any) => {
    setEditing(m);
    setEditStatus(m.status || "pending");
  };

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/employees"><ArrowLeft className="mr-2 h-4 w-4" />All employees</Link>
        </Button>
      </div>

      <PageHeader
        title={employee?.name || "Employee"}
        description={employee
          ? `${employee.jobTitle || "—"} · ${employee.department || "—"} · Code: ${employee.accessCode || "—"}`
          : "Loading…"}
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add milestone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add milestone</DialogTitle></DialogHeader>
            <MilestoneForm
              trainings={trainings}
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
          <EmptyState title="No milestones yet" description="Set training milestones for this employee." />
        ) : (
          <div className="divide-y divide-border/60">
            {(milestones.data ?? []).map((m: any) => (
              <div key={m._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{m.title || "—"}</div>
                    {m.status && <Badge variant={m.status === "completed" ? "default" : "secondary"}>{m.status}</Badge>}
                    {m.type && <Badge variant="outline">{m.type}</Badge>}
                  </div>
                  {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                  {m.module && <div className="text-xs text-muted-foreground">Formation: {m.module}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
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

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit milestone — {editing?.title}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Type : <span className="text-foreground">{editing.type || "—"}</span></div>
                <div>Formation : <span className="text-foreground">{editing.module || "—"}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => updateMut.mutate({ milestoneId: editing._id, data: { status: editStatus } })}
                  disabled={updateMut.isPending}
                  className="w-full"
                >
                  {updateMut.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
