import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BudgetStatusBadge } from "@/features/budgets/budget-status-badge";
import { listBudgets, removeBudget } from "@/features/budgets/budget.api";
import type { Budget } from "@/features/budgets/budget.types";
import { BudgetPrintDialog } from "@/features/budgets/budget-print-dialog";
import { NewBudgetDialog } from "@/features/budgets/new-budget-dialog";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [printBudget, setPrintBudget] = useState<Budget | null>(null);

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: () => listBudgets(),
  });

  const deleteMutation = useMutation({
    mutationFn: removeBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Presupuesto eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el presupuesto"),
  });

  const openCreateDialog = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    if (!window.confirm(`¿Eliminar el presupuesto ${budget.code}?`)) return;
    deleteMutation.mutate(budget.id);
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de presupuestos y cotizaciones para establecimientos.
          </p>
        </div>
        <Button onClick={openCreateDialog}>Nuevo presupuesto</Button>
      </div>

      <NewBudgetDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBudget(null);
        }}
        budget={editingBudget}
      />

      {budgetsQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {budgetsQuery.isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          No se pudieron cargar los presupuestos.
        </div>
      )}

      {!budgetsQuery.isPending && !budgetsQuery.isError && budgetsQuery.data?.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>No hay presupuestos.</p>
        </div>
      )}

      {(budgetsQuery.data?.length ?? 0) > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>CUE</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetsQuery.data!.map((budget) => (
              <TableRow key={budget.id}>
                <TableCell className="font-mono text-xs">{budget.code}</TableCell>
                <TableCell>{budget.customerName}</TableCell>
                <TableCell>{budget.establishmentCue || "—"}</TableCell>
                <TableCell>${budget.total.toFixed(2)}</TableCell>
                <TableCell>
                  <BudgetStatusBadge status={budget.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPrintBudget(budget)}>
                      Ver / PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(budget)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(budget)}
                    >
                      Borrar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BudgetPrintDialog budget={printBudget} onOpenChange={(open) => !open && setPrintBudget(null)} />
    </section>
  );
}
