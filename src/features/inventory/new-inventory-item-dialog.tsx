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

import { createInventoryItem, fetchSuppliers } from "@/features/inventory/inventory.api";
import type { InventoryItem } from "@/features/inventory/inventory.types";

// supplierId: 0 significa "sin proveedor"; se envía como undefined más abajo
const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, { message: "El nombre es obligatorio" }),
  description: z.string().trim().max(2000).optional(),
  supplierId: z.coerce.number().int().min(0).optional(),
  availableQuantity: z.coerce.number().int().min(0).default(0),
});

type CreateInventoryItemFormValues = z.infer<typeof createInventoryItemSchema>;

export function NewInventoryItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState<string>("");

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "for-create"],
    queryFn: () => fetchSuppliers({ limit: 100 }),
    enabled: open,
  });

  const form = useForm<CreateInventoryItemFormValues>({
    resolver: zodResolver(createInventoryItemSchema) as Resolver<CreateInventoryItemFormValues>,
    defaultValues: {
      name: "",
      description: "",
      supplierId: 0,
      availableQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        description: "",
        supplierId: 0,
        availableQuantity: 0,
      });
      setSupplierId("");
    }
  }, [open, form]);

  const mutation = useMutation<InventoryItem, unknown, CreateInventoryItemFormValues>({
    mutationFn: (values: CreateInventoryItemFormValues) =>
      createInventoryItem({
        name: values.name,
        description: values.description || undefined,
        supplierId: values.supplierId || undefined,
        availableQuantity: values.availableQuantity,
      }),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success(`Ítem "${newItem.name}" creado`);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo crear el ítem";
      toast.error(msg);
    },
  });

  const onSubmit = (values: CreateInventoryItemFormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo ítem de stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del ítem</Label>
            <Input {...form.register("name")} placeholder="Ej: Cable HDMI 2m" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input {...form.register("description")} placeholder="Detalles del ítem" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <Select
                value={supplierId}
                onValueChange={(v) => {
                  setSupplierId(v ?? "");
                  form.setValue("supplierId", v ? Number(v) : 0, { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor…" />
                </SelectTrigger>
                <SelectContent>
                  {(suppliersQuery.data?.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cantidad inicial</Label>
              <Input
                type="number"
                min={0}
                {...form.register("availableQuantity")}
              />
              {form.formState.errors.availableQuantity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.availableQuantity.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando…" : "Crear ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}