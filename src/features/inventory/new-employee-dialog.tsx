import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { fetchEmployees, createEmployee } from "@/features/inventory/inventory.api";
import type { Employee } from "@/features/inventory/inventory.types";

const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2, { message: "El nombre es obligatorio" }).max(255),
  dniOrFileNumber: z
    .string()
    .trim()
    .min(1, { message: "El DNI/número de legajo es obligatorio" })
    .max(50),
  phone: z.string().trim().max(50).optional(),
  isActive: z.boolean().default(true),
});

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export function NewEmployeeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [employeesQuery, setEmployeesQuery] = useState<Employee[]>([]);

  const form = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema) as Resolver<CreateEmployeeFormValues>,
    defaultValues: {
      fullName: "",
      dniOrFileNumber: "",
      phone: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: "",
        dniOrFileNumber: "",
        phone: "",
        isActive: true,
      });
      fetchEmployeesList();
    }
  }, [open, form]);

  const fetchEmployeesList = async () => {
    const { data } = await fetchEmployees({ limit: 100 });
    setEmployeesQuery(data?.data ?? []);
  };

  const mutation = useMutation<Employee, unknown, CreateEmployeeFormValues>({
    mutationFn: (values: CreateEmployeeFormValues) =>
      createEmployee({
        fullName: values.fullName,
        dniOrFileNumber: values.dniOrFileNumber,
        phone: values.phone || undefined,
        isActive: values.isActive,
      }),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      fetchEmployeesList();
      toast.success(`Empleado "${newEmployee.fullName}" creado`);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo crear el empleado";
      toast.error(msg);
    },
  });

  const onSubmit = (values: CreateEmployeeFormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo empleado</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input {...form.register("fullName")} placeholder="Ej: María González" />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>DNI / Número de legajo</Label>
            <Input
              {...form.register("dniOrFileNumber")}
              placeholder="Ej: 12345678"
            />
            {form.formState.errors.dniOrFileNumber && (
              <p className="text-xs text-destructive">
                {form.formState.errors.dniOrFileNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Teléfono (opcional)</Label>
            <Input
              {...form.register("phone")}
              placeholder="Ej: +5491112345678 o 4444-5555"
              type="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando…" : "Crear empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
