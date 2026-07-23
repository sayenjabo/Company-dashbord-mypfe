import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HardDrive, Trash2 } from "lucide-react";
import { api, type Device } from "../../lib/api";
import { PageHeader, GlassCard, EmptyState } from "../../components/dashboard-ui";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({
    meta: [
      { title: "Devices — Tynass" },
      { name: "description", content: "Manage VR headsets linked to your company." },
    ],
  }),
  component: DevicesPage,
});

function DevicesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const res = await api<Device[] | { devices: Device[] }>("/api/company/devices");
      return Array.isArray(res) ? res : res.devices ?? [];
    },
  });
  const [revoking, setRevoking] = useState<Device | null>(null);

  const revokeMut = useMutation({
    mutationFn: (id: string) =>
      api(`/api/company/devices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Device revoked");
      qc.invalidateQueries({ queryKey: ["devices"] });
      setRevoking(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Devices"
        description="VR headsets currently linked to your account."
      />

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No devices linked"
            description="Devices will appear here once activated."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((d) => (
              <div
                key={d._id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{d.label}</div>
                      <Badge variant={d.isActive ? "default" : "secondary"}>
                        {d.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Meta ID: {d.metaUserId || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Activated:{" "}
                      {d.activatedAt
                        ? new Date(d.activatedAt).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRevoking(d)}
                  aria-label="Revoke"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <AlertDialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revoking?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              The headset will no longer be able to access training on this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revoking && revokeMut.mutate(revoking._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
