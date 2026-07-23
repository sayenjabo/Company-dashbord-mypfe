import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HardDrive, Trash2 } from "lucide-react";
import { companyApi, type Device } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/devices")({
  component: DevicesPage,
});

function DevicesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => companyApi.getDevices(),
  });
  const [revoking, setRevoking] = useState<Device | null>(null);

  const revokeMut = useMutation({
    mutationFn: (id: string) => companyApi.revokeDevice(id),
    onSuccess: () => {
      toast.success("Device revoked");
      qc.invalidateQueries({ queryKey: ["devices"] });
      setRevoking(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Devices" description="VR headsets currently linked to your account." />

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState title="No devices linked" description="Devices will appear here once activated by your Tynass admin." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((d: Device) => (
              <div key={d._id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{d.label}</div>
                      <Badge variant={d.isActive ? "default" : "secondary"}>
                        {d.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{d.metaUserId || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      Activated: {d.activatedAt ? new Date(d.activatedAt).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
                {d.isActive && (
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setRevoking(d)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <AlertDialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke device?</AlertDialogTitle>
            <AlertDialogDescription>
              "{revoking?.label}" will be disconnected and need to be reactivated by your Tynass admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => revokeMut.mutate(revoking!._id)}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
