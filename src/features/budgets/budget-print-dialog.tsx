import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { Budget } from "./budget.types";
import { BudgetStatusBadge } from "./budget-status-badge";

const money = (value: number) => `$${value.toFixed(2)}`;

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : "—";

export function BudgetPrintDialog({
  budget,
  onOpenChange,
}: {
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={budget !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl print-dialog">
        <DialogHeader className="no-print">
          <DialogTitle>Presupuesto {budget?.code}</DialogTitle>
        </DialogHeader>

        {budget && (
          <div className="print-area space-y-4 text-sm">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <p className="text-lg font-semibold">Clickear</p>
                <p className="text-xs text-muted-foreground">Presupuesto de materiales</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium">{budget.code}</p>
                <p>Emitido: {formatDate(budget.issueDate)}</p>
                <p>Válido hasta: {formatDate(budget.validUntil)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{budget.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Establecimiento (CUE)</p>
                <p className="font-medium">{budget.establishmentCue || "—"}</p>
              </div>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1 pr-2">Descripción</th>
                  <th className="py-1 pr-2 text-right">Cantidad</th>
                  <th className="py-1 pr-2 text-right">P. unitario</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {budget.lines.map((line, index) => (
                  <tr key={line.id ?? index} className="border-b">
                    <td className="py-1 pr-2">{line.description || "—"}</td>
                    <td className="py-1 pr-2 text-right">{line.quantity}</td>
                    <td className="py-1 pr-2 text-right">{money(line.unitPrice)}</td>
                    <td className="py-1 text-right">{money(line.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 pr-2 text-right font-semibold">
                    Total
                  </td>
                  <td className="py-2 text-right font-semibold">{money(budget.total)}</td>
                </tr>
              </tfoot>
            </table>

            {budget.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notas</p>
                <p>{budget.notes}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Estado: <BudgetStatusBadge status={budget.status} />
            </p>
          </div>
        )}

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
