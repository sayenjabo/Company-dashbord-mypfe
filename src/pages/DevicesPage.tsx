import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, WifiOff, Monitor, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["adminDevices"],
    queryFn: () => api.getAdminDevices(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.getCompanies(),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.revokeAdminDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDevices"] });
      toast.success("Device revoked — it will need to be reactivated");
      setSelected(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (data: { activationCode: string; label: string; companyId: string }) =>
      api.adminActivateDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDevices"] });
      toast.success("Device activated successfully");
      setActivateOpen(false);
      setActivationCode("");
      setDeviceLabel("");
      setSelectedCompanyId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = devices.filter((d: any) => {
    const label = (d.label || "").toLowerCase();
    const company = (d.company?.companyName || "").toLowerCase();
    const metaId = (d.metaUserId || "").toLowerCase();
    return (
      label.includes(search.toLowerCase()) ||
      company.includes(search.toLowerCase()) ||
      metaId.includes(search.toLowerCase())
    );
  });

  const activeCount = devices.filter((d: any) => d.isActive).length;
  const revokedCount = devices.filter((d: any) => !d.isActive).length;

  const handleActivate = () => {
    if (!activationCode || !selectedCompanyId) {
      toast.error("Activation code and company are required");
      return;
    }
    activateMutation.mutate({
      activationCode,
      label: deviceLabel || `Headset ${activationCode}`,
      companyId: selectedCompanyId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Devices</h1>
          <p className="text-muted-foreground text-sm">
            {activeCount} active · {revokedCount} revoked · {devices.length} total
          </p>
        </div>

        <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Activate Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate a New Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                The 6-digit code is displayed on the Quest headset screen when it first starts up.
              </p>
              <div className="space-y-2">
                <Label>Activation Code</Label>
                <Input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="font-mono text-lg tracking-widest text-center"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Device Label <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={deviceLabel}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  placeholder="Headset 1 / Warehouse VR"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleActivate}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? "Activating..." : "Activate Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by label, company, or Meta ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Loading devices...</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Label</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Company</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Meta User ID</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Activated</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <motion.tr
                  key={d._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      {d.label || "Unnamed Device"}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {d.company?.companyName || "—"}
                  </td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell font-mono text-xs">
                    {d.metaUserId || "—"}
                  </td>
                  <td className="p-4">
                    <Badge variant={d.isActive ? "default" : "secondary"}>
                      {d.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell">
                    {d.activatedAt ? new Date(d.activatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(d)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {d.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setSelected(d)}
                      >
                        <WifiOff className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No devices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Device Details + Revoke Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {selected?.label || "Unnamed Device"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selected.isActive ? "default" : "secondary"}>
                    {selected.isActive ? "Active" : "Revoked"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{selected.company?.companyName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta User ID</span>
                  <span className="font-mono text-xs">{selected.metaUserId || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activated</span>
                  <span>{selected.activatedAt ? new Date(selected.activatedAt).toLocaleDateString() : "—"}</span>
                </div>
                {selected.revokedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revoked</span>
                    <span>{new Date(selected.revokedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selected.isActive && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-muted-foreground text-xs mb-3">
                    Revoking this device will immediately disconnect it. It will need to go through the activation process again.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(selected._id)}
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    {revokeMutation.isPending ? "Revoking..." : "Revoke Device"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
