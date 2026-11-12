import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { runSync } from "@/lib/sync";
import { getDesktopInfo, isDesktop, setDesktopMode, type AppMode } from "@/lib/desktop";
import { invalidateDesktopInfo } from "@/lib/api";
import { toast } from "sonner";

export function ModeToggle() {
  const queryClient = useQueryClient();

  const { data: info } = useQuery({
    queryKey: ["desktop-info"],
    queryFn: getDesktopInfo,
    enabled: isDesktop(),
    staleTime: 30_000,
  });

  const mode: AppMode = info?.mode ?? "offline";

  const modeMutation = useMutation({
    mutationFn: (next: AppMode) => setDesktopMode(next),
    onSuccess: (next) => {
      invalidateDesktopInfo();
      queryClient.invalidateQueries({ queryKey: ["desktop-info"] });
      toast.success(`Modo ${next === "online" ? "online" : "offline"} activado`);
      // Recargar para que axios use la nueva base URL
      window.location.reload();
    },
    onError: () => toast.error("No se pudo cambiar el modo"),
  });

  const syncMutation = useMutation({
    mutationFn: runSync,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Sync OK: ${result.pushed} enviados, ${result.pulled} recibidos`);
    },
    onError: () => toast.error("Error al sincronizar"),
  });

  if (!isDesktop()) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2"
        disabled={modeMutation.isPending}
        onClick={() => modeMutation.mutate(mode === "online" ? "offline" : "online")}
      >
        {mode === "online" ? (
          <Cloud className="size-4 text-emerald-500" aria-hidden />
        ) : (
          <CloudOff className="size-4 text-amber-500" aria-hidden />
        )}
        <span className="text-xs">{mode === "online" ? "Online" : "Offline"}</span>
      </Button>
      {mode === "online" && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          <RefreshCw className={cn("size-4", syncMutation.isPending && "animate-spin")} aria-hidden />
          <span className="text-xs">Sincronizar</span>
        </Button>
      )}
    </div>
  );
}
