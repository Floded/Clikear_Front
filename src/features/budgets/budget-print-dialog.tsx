import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/features/auth/use-session";
import { useCompanySettings } from "@/features/company-settings";

import type { Budget } from "./budget.types";
import { BudgetDocument } from "./budget-document";
import "./budget-print.css";

export function BudgetPrintDialog({
  budget,
  onOpenChange,
}: {
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const companySettingsQuery = useCompanySettings({
    // El endpoint es admin-only; evitamos 403 para usuarios sin permiso
    enabled: budget !== null && session?.role === "ADMIN",
  });
  const companySettings = companySettingsQuery.data ?? null;

  return (
    <>
      <Dialog open={budget !== null} onOpenChange={onOpenChange}>
        <DialogContent
          className="budget-print-dialog sm:max-w-5xl"
          showCloseButton={false}
        >
          <DialogHeader className="no-print px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Presupuesto {budget?.code ?? ""}</DialogTitle>
          </DialogHeader>

          {budget && (
            <div className="budget-preview-shell">
              <BudgetDocument budget={budget} companySettings={companySettings} />
            </div>
          )}

          <div className="budget-print-actions no-print">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      {budget &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="budget-print-root" aria-hidden="true">
            <BudgetDocument budget={budget} companySettings={companySettings} />
          </div>,
          document.body,
        )}
    </>
  );
}
