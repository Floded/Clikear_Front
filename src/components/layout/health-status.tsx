import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { cn } from "cn";

interface HealthResponse {
  status: string;
}

export function HealthStatus() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => (await api.get<HealthResponse>("/health")).data,
    refetchInterval: 30_000,
  });

  const connected = !isError && data?.status === "ok";
  return (
    <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-2 rounded-full",
          connected ? "bg-emerald-500" : "bg-red-500",
        )}
        aria-hidden
      />
      {connected ? "Backend conectado" : "Backend sin conexión"}
    </div>
  );
}
