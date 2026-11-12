import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";

import type { Budget, BudgetInput, BudgetLineInput } from "@/features/budgets/budget.types";
import { createBudget, updateBudget } from "@/features/budgets/budget.api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LineFormValues extends BudgetLineInput {
  description: string;
}

interface FormValues {
  customerName: string;
  establishmentCue: string;
  validUntil: string;
  notes: string;
  lines: LineFormValues[];
}

const emptyForm = (): FormValues => ({
  customerName: "",
  establishmentCue: "",
  validUntil: "",
  notes: "",
  lines: [{ description: "", quantity: 1, unitPrice: 500 }],
});

function budgetToForm(budget: Budget): FormValues {
  return {
    customerName: budget.customerName,
    establishmentCue: budget.establishmentCue ?? "",
    validUntil: budget.validUntil ? budget.validUntil.slice(0, 10) : "",
    notes: budget.notes ?? "",
    lines: budget.lines.map((line) => ({
      inventoryItemId: line.inventoryItemId ?? undefined,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  };
}

// Traduce los errores del backend (zod/axios) a un mensaje legible
function apiErrorMessage(err: unknown): string {
  const data = (err as {
    response?: { data?: { error?: string; details?: Array<{ message: string }> } };
  })?.response?.data;
  return (
    data?.details?.[0]?.message ?? data?.error ?? (err as Error)?.message ?? "Error al guardar el presupuesto"
  );
}

export function NewBudgetDialog({
  open,
  onOpenChange,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
}) {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<FormValues>(emptyForm);

  // Al abrir, precarga el presupuesto a editar o parte de un formulario vacío
  useEffect(() => {
    if (!open) return;
    setFormValues(budget ? budgetToForm(budget) : emptyForm());
  }, [open, budget]);

  const mutation = useMutation<Budget, unknown, BudgetInput>({
    mutationFn: (values) =>
      budget ? updateBudget(budget.id, values) : createBudget(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success(budget ? "Presupuesto actualizado" : "Presupuesto creado");
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const updateLine = (index: number, patch: Partial<LineFormValues>) => {
    setFormValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formValues.customerName.trim()) {
      toast.error("Ingresá el nombre del cliente");
      return;
    }

    const invalidLine = formValues.lines.some(
      (line) =>
        !line.description.trim() ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.unitPrice <= 0,
    );
    if (invalidLine) {
      toast.error("Cada línea necesita descripción, cantidad ≥ 1 y precio > 0");
      return;
    }

    mutation.mutate({
      customerName: formValues.customerName.trim(),
      establishmentCue: formValues.establishmentCue || undefined,
      validUntil: formValues.validUntil || undefined,
      notes: formValues.notes || undefined,
      lines: formValues.lines.map((line) => ({
        inventoryItemId: line.inventoryItemId,
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{budget ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del cliente</Label>
            <Input
              value={formValues.customerName}
              placeholder="Ej: Escuela 25 de Mayo"
              onChange={(e) => setFormValues({ ...formValues, customerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>CUE del establecimiento (opcional)</Label>
            <Input
              value={formValues.establishmentCue}
              placeholder="Ej: 700083300"
              type="text"
              onChange={(e) => setFormValues({ ...formValues, establishmentCue: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Válido hasta (opcional)</Label>
            <Input
              value={formValues.validUntil}
              placeholder="Ej: 2026-12-31"
              type="date"
              onChange={(e) => setFormValues({ ...formValues, validUntil: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input
              value={formValues.notes}
              placeholder="Ej: Presupuesto para materiales"
              onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Líneas de presupuesto</Label>
            <p className="text-xs text-muted-foreground">
              Materiales incluidos en este presupuesto.
            </p>

            <div className="space-y-3">
              {formValues.lines.map((line, index) => (
                <div key={index} className="space-y-1 rounded-md border p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Línea {index + 1}
                    </span>
                    {formValues.lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Quitar línea ${index + 1}`}
                        onClick={() =>
                          setFormValues((prev) => ({
                            ...prev,
                            lines: prev.lines.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <Input
                    value={line.description}
                    placeholder="Descripción del item"
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={line.quantity}
                      type="number"
                      min={1}
                      placeholder="Cantidad"
                      onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                    />
                    <Input
                      value={line.unitPrice}
                      type="number"
                      min={0}
                      placeholder="Precio unitario"
                      onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormValues((prev) => ({
                    ...prev,
                    lines: [...prev.lines, { description: "", quantity: 1, unitPrice: 500 }],
                  }))
                }
              >
                Añadir línea
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {budget ? "Guardar cambios" : "Crear presupuesto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
