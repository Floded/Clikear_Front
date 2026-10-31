import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const extra = STYLES[status] ?? "bg-secondary text-secondary-foreground";
  const label = LABELS[status] ?? status;
  return (
    <Badge variant="outline" className={extra}>
      {label}
    </Badge>
  );
}
