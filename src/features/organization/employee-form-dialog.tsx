import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createEmployee, updateEmployee } from "./organization.api";
import type { Employee } from "./organization.types";

interface FormValues {
  fullName: string;
  dniOrFileNumber: string;
  phone: string;
  isActive: boolean;
}

interface EmployeeInput {
  fullName: string;
  dniOrFileNumber: string;
  phone?: string;
  isActive: boolean;
}

const EMPTY_FORM: FormValues = { fullName: "", dniOrFileNumber: "", phone: "", isActive: true };

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = employee != null;

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setFormValues(
      employee
        ? {
            fullName: employee.fullName,
            dniOrFileNumber: employee.dniOrFileNumber,
            phone: employee.phone ?? "",
            isActive: employee.isActive,
          }
        : EMPTY_FORM,
    );
  }, [open, employee]);

  const mutation = useMutation<Employee, unknown, EmployeeInput>({
    mutationFn: (values) =>
      isEdit
        ? updateEmployee(employee.id, values)
        : createEmployee(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(isEdit ? "Empleado actualizado" : "Empleado creado");
      onOpenChange(false);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        "Error guardando empleado";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.fullName.trim() || !formValues.dniOrFileNumber.trim()) {
      toast.error("Nombre y DNI/legajo son obligatorios");
      return;
    }
    mutation.mutate({
      fullName: formValues.fullName.trim(),
      dniOrFileNumber: formValues.dniOrFileNumber.trim(),
      phone: formValues.phone.trim() || undefined,
      isActive: formValues.isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={formValues.fullName}
              onChange={(e) => setFormValues((v) => ({ ...v, fullName: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dniOrFileNumber">DNI / número de legajo</Label>
            <Input
              id="dniOrFileNumber"
              value={formValues.dniOrFileNumber}
              onChange={(e) => setFormValues((v) => ({ ...v, dniOrFileNumber: e.target.value }))}
              placeholder="DNI o legajo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              value={formValues.phone}
              onChange={(e) => setFormValues((v) => ({ ...v, phone: e.target.value }))}
              placeholder="Teléfono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              className="size-4"
              checked={formValues.isActive}
              onChange={(e) => setFormValues((v) => ({ ...v, isActive: e.target.checked }))}
            />
            <Label htmlFor="isActive">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
