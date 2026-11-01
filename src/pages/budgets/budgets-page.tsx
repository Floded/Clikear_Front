import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BudgetStatusBadge } from "@/features/budgets/budget-status-badge";
import { listBudgets } from "@/features/budgets/budget.api";
import type { Budget } from "@/features/budgets/budget.types";

import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      listBudgets({}).then(({ data }) => setBudgets(data ?? [])).catch(() =>
        toast.error("Error al cargar presupuestos"),
      );
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de presupuestos y cotizaciones para establecimientos.
          </p>
        </div>
        <Button>Nuevo presupuesto</Button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay presupuestos.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>CUE</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.map((budget) => (
              <TableRow key={budget.id}>
                <TableCell className="font-mono text-xs">{budget.id}</TableCell>
                <TableCell>{budget.customerName}</TableCell>
                <TableCell>{budget.establishmentCue || "—"}</TableCell>
                <TableCell>${budget.total.toFixed(2)}</TableCell>
                <TableCell>
                  <BudgetStatusBadge status={budget.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
