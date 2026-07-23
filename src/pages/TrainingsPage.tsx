import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, BarChart3, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const emptyForm = { title: "", category: "", description: "", sceneName: "" };

export default function TrainingsPage() {
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "superadmin";

  const [search, setSearch] = useState("");
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => api.getTrainings(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.createTraining(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Training created");
      setAddOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      api.updateTraining(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Training updated");
      setEditOpen(false);
      setEditingTraining(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Training deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.updateTraining(id, { isActive: !active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Training updated");
      if (selectedTraining && (selectedTraining._id || selectedTraining.id) === variables.id) {
        setSelectedTraining((prev: any) => ({ ...prev, isActive: !variables.active }));
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = trainings.filter((t: any) =>
    (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (t: any) => {
    setEditingTraining(t);
    setEditForm({
      title: t.title || "",
      category: t.category || "",
      description: t.description || "",
      sceneName: t.sceneName || "",
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Trainings</h1>
          <p className="text-muted-foreground text-sm">{trainings.length} VR modules</p>
        </div>

        {/* Add Training Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Training</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Training</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Fire Evacuation" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Safety" />
              </div>
              <div className="space-y-2">
                <Label>Scene Name <span className="text-muted-foreground text-xs">(Unity SceneManager)</span></Label>
                <Input value={form.sceneName} onChange={(e) => setForm({ ...form, sceneName: e.target.value })} placeholder="FireEvacuationScene" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the training module..." />
              </div>
              <Button onClick={() => createMutation.mutate(form)} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Training"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search trainings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Loading trainings...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: any) => (
            <motion.div key={t._id || t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold">{t.title}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">{t.category}</Badge>
                </div>
                <Badge variant={t.isActive !== false ? "default" : "secondary"}>
                  {t.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              {t.sceneName && (
                <p className="text-xs font-mono text-primary/70">Scene: {t.sceneName}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTraining(t)}>
                  <BarChart3 className="h-4 w-4 mr-1" /> Details
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: t._id || t.id, active: t.isActive !== false })}>
                  {t.isActive !== false ? "Deactivate" : "Activate"}
                </Button>
                {isSuperAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t._id || t.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedTraining?.title}</DialogTitle></DialogHeader>
          {selectedTraining && (
            <div className="space-y-3 mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{selectedTraining.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scene Name</span>
                <span className="font-mono text-xs">{selectedTraining.sceneName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right max-w-[200px]">{selectedTraining.description || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedTraining.isActive !== false ? "default" : "secondary"}>
                  {selectedTraining.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingTraining(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Training — {editingTraining?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Scene Name <span className="text-muted-foreground text-xs">(Unity SceneManager)</span></Label>
              <Input value={editForm.sceneName} onChange={(e) => setEditForm({ ...editForm, sceneName: e.target.value })} placeholder="FireEvacuationScene" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate({ id: editingTraining._id, data: editForm })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
