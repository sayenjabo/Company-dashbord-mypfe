import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { companyApi, type Employee } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

function EmployeeForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial?: Partial<Employee>;
  onSubmit: (data: { name: string; jobTitle: string; department: string; pin: string }) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [pin, setPin] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, jobTitle, department, pin }); }} className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
      </div>
      <div className="space-y-2">
        <Label>Job Title</Label>
        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Safety Officer" />
      </div>
      <div className="space-y-2">
        <Label>Department</Label>
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Operations" />
      </div>
      <div className="space-y-2">
        <Label>4-digit PIN *</Label>
        <Input
          required
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="1234"
          maxLength={4}
          pattern="\d{4}"
          inputMode="numeric"
          className="font-mono tracking-widest text-center"
        />
        <p className="text-xs text-muted-foreground">Used by the employee to log in on the VR headset</p>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

function EmployeesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => companyApi.getEmployees(),
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: { name: string; jobTitle: string; department: string; pin: string }) =>
      companyApi.createEmployee(payload),
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setCreateOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      companyApi.updateEmployee(id, payload),
    onSuccess: () => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => companyApi.deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee removed");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setDeleting(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Add and manage the people using your training."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add employee</DialogTitle></DialogHeader>
              <EmployeeForm onSubmit={(v) => createMut.mutate(v)} submitting={createMut.isPending} submitLabel="Add employee" />
            </DialogContent>
          </Dialog>
        }
      />

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState title="No employees yet" description="Add your first employee to get started." />
        ) : (
          <div className="divide-y divide-border/60">
            {data.map((emp: Employee) => (
              <div key={emp._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link to="/employees/$id" params={{ id: emp._id }} className="group min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium group-hover:text-primary">{emp.name}</span>
                    {emp.isActive === false && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {emp.jobTitle || "—"} · {emp.department || "—"} · Code: {emp.accessCode || "—"}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(emp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(emp)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <Link to="/employees/$id" params={{ id: emp._id }}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit employee</DialogTitle></DialogHeader>
          {editing && (
            <EmployeeForm
              initial={editing}
              onSubmit={(v) => updateMut.mutate({ id: editing._id, payload: v })}
              submitting={updateMut.isPending}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {deleting?.name}.</AlertDialogDescription>
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
