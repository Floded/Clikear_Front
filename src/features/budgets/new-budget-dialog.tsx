import { useEffect, useState } from "react";
import type { Budget } from "@/features/budgets/budget.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewBudgetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState({
    customerName: "",
    establishmentCue: "",
    validUntil: "",
    notes: "",
    lines: [{ description: "Material de cocina", quantity: 1, unitPrice: 500 }],
  });

  useEffect(() => {
    if (open) {
      setFormValues({
        customerName: "",
        establishmentCue: "",
        validUntil: "",
        notes: "",
        lines: [{ description: "", quantity: 1, unitPrice: 0 }],
      });
    }
  }, [open]);

  const mutation = useMutation<Budget, unknown, {
    customerName: string;
    establishmentCue?: string;
    validUntil?: string;
    notes?: string;
    lines: Array<{ inventoryItemId?: number; description: string; quantity: number; unitPrice: number }>;
  }>({
    mutationFn: async (values) => {
      const apiLines = values.lines.map((l) => ({
        inventoryItemId: l.inventoryItemId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      }));
      const body = {
        customerName: values.customerName,
        establishmentCue: values.establishmentCue,
        validUntil: values.validUntil,
        notes: values.notes,
        lines: apiLines,
      };
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error creando presupuesto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Presupuesto creado");
      onOpenChange(false);
    },
    onError: (err) => {
      const msg = (err as Error).message ?? "Error desconocido";
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    mutation.mutate(formValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo presupuesto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del cliente</Label>
            <Input
              value={formValues.customerName}
              placeholder="Ej: Escuela 25 de Mayo"
            />
          </div>

          <div className="space-y-2">
            <Label>CUE del establecimiento (opcional)</Label>
            <Input
              value={formValues.establishmentCue || ""}
              placeholder="Ej: 700083300"
              type="text"
            />
          </div>

          <div className="space-y-2">
            <Label>Válido hasta (opcional)</Label>
            <Input
              value={formValues.validUntil || ""}
              placeholder="Ej: 2026-12-31"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input
              value={formValues.notes || ""}
              placeholder="Ej: Presupuesto para materiales"
            />
          </div>

          <div className="space-y-3">
            <Label>Líneas de presupuesto</Label>
            <p className="text-xs text-muted-foreground">
              Materiales predefinidos para este presupuesto.
            </p>
            <div className="space-y-2">
              {formValues.lines.map((line) => (
                <div className="space-y-1">
                  <span>Descripción: </span>
                  <Input
                    value={line.description || ""}
                    placeholder="Descripción"
                  />
                  <Input
                    value={line.quantity ?? 1}
                    type="number"
                    placeholder="Cantidad"
                  />
                  <Input
                    value={line.unitPrice ?? 0}
                    type="number"
                    placeholder="Precio unitario"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit">Crear presupuesto</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}