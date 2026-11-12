import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import { createSupplier } from "@/features/inventory/inventory.api";
import type { Supplier } from "@/features/inventory/inventory.types";

const createSupplierSchema = z.object({
  name: z.string().trim().min(2, { message: "El nombre es obligatorio" }).max(255),
  contactPhone: z.string().trim().max(50).optional(),
  contactEmail: z
    .string()
    .trim()
    .email({ message: "El email no es válido" })
    .max(255)
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .trim()
    .url({ message: "La URL debe ser válida (ej: https://…)" })
    .max(255)
    .optional()
    .or(z.literal("")),
});

type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>;

const defaultValues: CreateSupplierFormValues = {
  name: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
};

export function NewSupplierDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema) as Resolver<CreateSupplierFormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, form]);

  const mutation = useMutation<Supplier, unknown, CreateSupplierFormValues>({
    mutationFn: (values) =>
      createSupplier({
        name: values.name,
        contactPhone: values.contactPhone || undefined,
        contactEmail: values.contactEmail || undefined,
        website: values.website || undefined,
      }),
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(`Proveedor "${newSupplier.name}" creado`);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo crear el proveedor";
      toast.error(msg);
    },
  });

  const onSubmit = (values: CreateSupplierFormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input {...form.register("name")} placeholder="Ej: Distribuidora Sur" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Teléfono de contacto (opcional)</Label>
            <Input
              {...form.register("contactPhone")}
              placeholder="Ej: 221-555-1234"
              type="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email (opcional)</Label>
            <Input
              {...form.register("contactEmail")}
              placeholder="Ej: ventas@proveedor.com"
              type="email"
            />
            {form.formState.errors.contactEmail && (
              <p className="text-xs text-destructive">
                {form.formState.errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Página web (opcional)</Label>
            <Input
              {...form.register("website")}
              placeholder="Ej: https://proveedor.com"
              type="url"
            />
            {form.formState.errors.website && (
              <p className="text-xs text-destructive">
                {form.formState.errors.website.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando…" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
