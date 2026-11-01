import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { Employee } from "@/features/inventory/inventory.types"

export function NewEmployeeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [formValues, setFormValues] = useState({
    fullName: "",
    dniOrFileNumber: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      setFormValues({
        fullName: "",
        dniOrFileNumber: "",
        phone: "",
        isActive: true,
      });
    }
  }, [open]);

  const mutation = useMutation<Employee, unknown, {
    fullName: string;
    dniOrFileNumber: string;
    phone?: string;
    isActive: boolean;
  }>({
    mutationFn: async (values) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error creando empleado");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Empleado creado");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error((err as Error).message ?? "Error desconocido");
    },
  });

  const handleSubmit = () => {
    mutation.mutate(formValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              value={formValues.fullName}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, fullName: e.target.value }))
              }
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label>DNI/número de legajo</Label>
            <Input
              value={formValues.dniOrFileNumber}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, dniOrFileNumber: e.target.value }))
              }
              placeholder="DNI/número de legajo"
              type="text"
            />
          </div>

          <div className="space-y-2">
            <Label>Teléfono (opcional)</Label>
            <Input
              value={formValues.phone || ""}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, phone: e.target.value }))
              }
              placeholder="Teléfono"
              type="text"
            />
          </div>

          <div className="space-y-2">
            <Label>Activo</Label>
            <Input
              value={formValues.isActive ? "true" : "false"}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, isActive: e.target.value === "true" }))
              }
              type="checkbox"
            />
          </div>

          <Button type="submit">Crear empleado</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
