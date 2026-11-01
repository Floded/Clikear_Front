import { z } from "zod";
import { cn } from "cn";

export const BudgetStatusSchema = z.enum(["DRAFT", "SENT", "APPROVED", "REJECTED"]);

export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const statuses: Record<BudgetStatus, { bg: string; fg: string; label: string }> = {
    DRAFT: { bg: "bg-gray-100", fg: "gray-800", label: "Borrador" },
    SENT: { bg: "bg-blue-100", fg: "blue-800", label: "Enviado" },
    APPROVED: { bg: "bg-green-100", fg: "green-800", label: "Aprobado" },
    REJECTED: { bg: "bg-red-100", fg: "red-800", label: "Rechazado" },
  };

  const s = statuses[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        s.bg,
        s.fg,
      )}
    >
      {s.label}
    </span>
  );
}