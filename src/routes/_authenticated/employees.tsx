import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { api, type Employee } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Tynass" },
      { name: "description", content: "Manage the employees enrolled in training." },
    ],
  }),
  component: EmployeesPage,
});

function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api<Employee[] | { employees: Employee[] }>(
        "/api/company/employees",
      );
      return Array.isArray(res) ? res : res.employees ?? [];
    },
  });
}

function EmployeeForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial?: Partial<Employee>;
  onSubmit: (data: { name: string; department: string; accessCode: string }) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [accessCode, setAccessCode] = useState(initial?.accessCode ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, department, accessCode });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accessCode">Access code</Label>
        <Input
          id="accessCode"
          required
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
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

function EmployeesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useEmployees();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const createMut = useMutation({
    mutationFn: (payload: { name: string; department: string; accessCode: string }) =>
      api("/api/company/employees", { method: "POST", json: payload }),
    onSuccess: () => {
      toast.success("Employee added");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setCreateOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name: string; department: string; accessCode: string };
    }) => api(`/api/company/employees/${id}`, { method: "PATCH", json: payload }),
    onSuccess: () => {
      toast.success("Employee updated");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      api(`/api/company/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Employee removed");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setDeleting(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Add and manage the people using your training."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm
                onSubmit={(v) => createMut.mutate(v)}
                submitting={createMut.isPending}
                submitLabel="Add employee"
              />
            </DialogContent>
          </Dialog>
        }
      />

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No employees yet"
            description="Add your first employee to get started."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {data.map((emp) => (
              <div
                key={emp._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <Link
                  to="/employees/$id"
                  params={{ id: emp._id }}
                  className="group min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium group-hover:text-primary">
                      {emp.name}
                    </span>
                    {emp.isActive === false && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {emp.department || "—"} · Code: {emp.accessCode || "—"}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(emp)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(emp)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="ghost" size="icon" aria-label="Open">
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
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
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
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the employee and their access. This action cannot be undone.
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
