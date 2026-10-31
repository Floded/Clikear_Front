import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createAssignment, fetchInventoryItems, fetchEmployees } from "@/features/inventory/inventory.api";

const schema = z.object({
  inventoryItemId: z.coerce.number().int().positive({ message: "Seleccioná un ítem" }),
  employeeId: z.coerce.number().int().positive({ message: "Seleccioná un empleado" }),
  quantityAssigned: z.coerce.number().int().positive({ message: "Cantidad > 0" }),
  deliveryDate: z.string().min(1, "Fecha obligatoria"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AssignMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignMaterialDialog({ open, onOpenChange }: AssignMaterialDialogProps) {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["inventory-items", "for-assign"],
    queryFn: () => fetchInventoryItems({ hasStock: "true", limit: 100 }),
    enabled: open,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "for-assign"],
    queryFn: () => fetchEmployees({ isActive: "true", limit: 100 }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      inventoryItemId: 0,
      employeeId: 0,
      quantityAssigned: 1,
      deliveryDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        inventoryItemId: 0,
        employeeId: 0,
        quantityAssigned: 1,
        deliveryDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createAssignment({
        inventoryItemId: values.inventoryItemId,
        employeeId: values.employeeId,
        quantityAssigned: values.quantityAssigned,
        deliveryDate: new Date(values.deliveryDate).toISOString(),
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["custody"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Material asignado");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo asignar el material";
      toast.error(msg);
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar material a empleado</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ítem</Label>
            <Select
              value={String(form.watch("inventoryItemId") || "")}
              onValueChange={(v) => form.setValue("inventoryItemId", Number(v), { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ítem…" />
              </SelectTrigger>
              <SelectContent>
                {(itemsQuery.data?.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name} (disp. {item.availableQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.inventoryItemId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.inventoryItemId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Empleado</Label>
            <Select
              value={String(form.watch("employeeId") || "")}
              onValueChange={(v) => form.setValue("employeeId", Number(v), { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado…" />
              </SelectTrigger>
              <SelectContent>
                {(employeesQuery.data?.data ?? []).map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.employeeId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.employeeId.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                {...form.register("quantityAssigned")}
              />
              {form.formState.errors.quantityAssigned && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.quantityAssigned.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha de entrega</Label>
              <Input id="date" type="date" {...form.register("deliveryDate")} />
              {form.formState.errors.deliveryDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deliveryDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Asignando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
