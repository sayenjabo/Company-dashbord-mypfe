import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye, BookOpen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "superadmin";

  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningCompany, setAssigningCompany] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.getCompanies(),
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => api.getTrainings(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created");
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateCompany(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: ({ companyId, trainingIds }: { companyId: string; trainingIds: string[] }) =>
      api.setCompanyTrainings(companyId, trainingIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Trainings updated");
      setAssignOpen(false);
      setAssigningCompany(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = companies.filter((c: any) =>
    (c.companyName || c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getAssignedIds = (company: any): string[] =>
    (company.assignedTrainings || []).map((t: any) => t._id || t.id || t);

  const handleToggleTraining = (company: any, trainingId: string) => {
    const current = getAssignedIds(company);
    const updated = current.includes(trainingId)
      ? current.filter((id) => id !== trainingId)
      : [...current, trainingId];
    assignMutation.mutate({ companyId: company._id, trainingIds: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground text-sm">{companies.length} total companies</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@company.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" type="password" />
              </div>
              <Button
                onClick={() => createMutation.mutate({ companyName: newName, email: newEmail, password: newPassword })}
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Loading companies...</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Email</th>
                <th className="text-left p-4 font-medium">Trainings</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{c.companyName || c.name}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{c.email}</td>
                  <td className="p-4">
                    <span className="text-muted-foreground">{(c.assignedTrainings || []).length} assigned</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={c.isActive !== false ? "default" : "secondary"}>
                      {c.isActive !== false ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setAssigningCompany(c); setAssignOpen(true); }}>
                      <BookOpen className="h-4 w-4 mr-1" /> Assign
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: c._id, isActive: c.isActive !== false })}>
                      {c.isActive !== false ? "Disable" : "Enable"}
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c._id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Company Details Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedCompany?.companyName || selectedCompany?.name}</DialogTitle></DialogHeader>
          {selectedCompany && (
            <div className="space-y-3 mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{selectedCompany.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedCompany.isActive !== false ? "default" : "secondary"}>
                  {selectedCompany.isActive !== false ? "active" : "inactive"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Assigned Trainings</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(selectedCompany.assignedTrainings || []).length === 0 && (
                    <span className="text-muted-foreground text-xs">No trainings assigned</span>
                  )}
                  {(selectedCompany.assignedTrainings || []).map((t: any) => (
                    <Badge key={t._id || t} variant="secondary" className="text-xs">
                      {t.title || t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Trainings Dialog */}
      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssigningCompany(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainings — {assigningCompany?.companyName || assigningCompany?.name}</DialogTitle>
          </DialogHeader>
          {assigningCompany && (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Click a training to assign or unassign it.</p>
              <div className="space-y-2">
                {trainings.map((t: any) => {
                  const assigned = getAssignedIds(assigningCompany).includes(t._id);
                  return (
                    <div
                      key={t._id}
                      onClick={() => handleToggleTraining(assigningCompany, t._id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        assigned ? "border-primary/50 bg-primary/10" : "border-border/50 hover:bg-muted/30"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.category}</p>
                      </div>
                      <Badge variant={assigned ? "default" : "secondary"}>
                        {assigned ? "Assigned" : "Not Assigned"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {trainings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No trainings available.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
