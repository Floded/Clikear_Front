import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  ABIERTO: "bg-blue-100 text-blue-700 border-blue-200",
  "EN PROGRESO": "bg-amber-100 text-amber-700 border-amber-200",
  TERMINADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REABIERTO: "bg-orange-100 text-orange-700 border-orange-200",
};

export function TicketStatusBadge({ status }: { status: string }) {
  const extra = STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground";
  return (
    <Badge variant="outline" className={extra}>
      {status}
    </Badge>
  );
}
