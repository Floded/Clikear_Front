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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { createTicket, fetchEstablishmentByCue } from "@/features/tickets/tickets.api";

const createTicketSchema = z.object({
  ticketId: z
    .string()
    .trim()
    .min(1, { message: "Ticket ID es obligatorio" })
    .refine((v) => {
      try {
        return BigInt(v) > 0n;
      } catch {
        return false;
      }
    }, { message: "Debe ser un entero mayor a 0" }),
  establishmentCue: z.string().trim().max(20).optional(),
  establishmentName: z.string().trim().max(255).optional(),
  establishmentDepartment: z.string().trim().max(100).optional(),
  establishmentLocality: z.string().trim().max(100).optional(),
  establishmentAddress: z.string().trim().max(255).optional(),
  establishmentPhone: z.string().trim().max(50).optional(),
  title: z.string().trim().min(1, { message: "El título es obligatorio" }),
  status: z.enum(["ABIERTO", "EN PROGRESO"]).optional(),
  glpiClosedTicket: z.string().trim().max(100).optional(),
  openingTimestamp: z.string().optional(),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

const EMPTY_ESTABLISHMENT_FIELDS = {
  establishmentName: "",
  establishmentDepartment: "",
  establishmentLocality: "",
  establishmentAddress: "",
  establishmentPhone: "",
} as const;

export function NewTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema) as Resolver<CreateTicketFormValues>,
    defaultValues: {
      ticketId: "",
      establishmentCue: "",
      ...EMPTY_ESTABLISHMENT_FIELDS,
      title: "",
      status: "ABIERTO",
      glpiClosedTicket: "",
      openingTimestamp: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ticketId: "",
        establishmentCue: "",
        ...EMPTY_ESTABLISHMENT_FIELDS,
        title: "",
        status: "ABIERTO",
        glpiClosedTicket: "",
        openingTimestamp: "",
      });
    }
  }, [open, form]);

  const cue = form.watch("establishmentCue")?.trim() ?? "";
  const debouncedCue = useDebouncedValue(cue, 400);

  const {
    data: existingEstablishment,
    isFetching: isLookingUpCue,
  } = useQuery({
    queryKey: ["establishment-lookup", debouncedCue],
    queryFn: () => fetchEstablishmentByCue(debouncedCue),
    enabled: debouncedCue.length >= 3,
  });

  const cueIsKnown = debouncedCue.length >= 3;
  const establishmentExists = cueIsKnown && existingEstablishment !== undefined;
  const isEstablishmentNew = cueIsKnown && existingEstablishment === null;

  // Si el CUE ya existe, precarga los datos del establecimiento en el formulario
  useEffect(() => {
    if (!existingEstablishment) return;
    form.setValue("establishmentName", existingEstablishment.name);
    form.setValue("establishmentDepartment", existingEstablishment.department ?? "");
    form.setValue("establishmentLocality", existingEstablishment.locality ?? "");
    form.setValue("establishmentAddress", existingEstablishment.address ?? "");
    form.setValue("establishmentPhone", existingEstablishment.phone ?? "");
  }, [existingEstablishment, form]);

  const mutation = useMutation<{ ticketId: string }, unknown, CreateTicketFormValues>({
    mutationFn: (values: CreateTicketFormValues) =>
      createTicket({
        ticketId: BigInt(values.ticketId),
        establishmentCue: values.establishmentCue || undefined,
        establishment: values.establishmentCue && values.establishmentName
          ? {
              name: values.establishmentName,
              department: values.establishmentDepartment || undefined,
              locality: values.establishmentLocality || undefined,
              address: values.establishmentAddress || undefined,
              phone: values.establishmentPhone || undefined,
            }
          : undefined,
        title: values.title,
        status: values.status,
        glpiClosedTicket: values.glpiClosedTicket || undefined,
        openingTimestamp: values.openingTimestamp ? new Date(values.openingTimestamp) : undefined,
      }),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(`Ticket ${newTicket.ticketId} creado`);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo crear el ticket";
      toast.error(msg);
    },
  });

  const onSubmit = (values: CreateTicketFormValues) => {
    // Un CUE nuevo necesita al menos el nombre para poder crear el establecimiento
    if (isEstablishmentNew && !values.establishmentName?.trim()) {
      form.setError("establishmentName", {
        message: "El nombre es obligatorio para un CUE nuevo",
      });
      return;
    }
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ticket ID (BigInt)</Label>
              <Input
                type="number"
                min={1}
                {...form.register("ticketId")}
              />
              {form.formState.errors.ticketId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ticketId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>CUE del establecimiento</Label>
              <Input
                {...form.register("establishmentCue")}
                placeholder="700083300"
              />
              {cueIsKnown && isLookingUpCue && (
                <p className="text-xs text-muted-foreground">Buscando establecimiento…</p>
              )}
              {establishmentExists && (
                <p className="text-xs text-muted-foreground">
                  Establecimiento registrado: se completarán solo los datos que falten.
                </p>
              )}
              {isEstablishmentNew && (
                <p className="text-xs text-muted-foreground">
                  CUE nuevo: se creará el establecimiento junto con el ticket.
                </p>
              )}
            </div>
          </div>

          {cue && (
            <div className="space-y-4 rounded-md border p-3">
              <p className="text-sm font-medium">Datos del establecimiento</p>

              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input {...form.register("establishmentName")} />
                {form.formState.errors.establishmentName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.establishmentName.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Input {...form.register("establishmentDepartment")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Localidad</Label>
                  <Input {...form.register("establishmentLocality")} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Dirección</Label>
                  <Input {...form.register("establishmentAddress")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input {...form.register("establishmentPhone")} />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.watch("status") || "ABIERTO"}
                onValueChange={(v) => form.setValue("status", (v ?? "ABIERTO") as CreateTicketFormValues["status"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABIERTO">ABIERTO</SelectItem>
                  <SelectItem value="EN PROGRESO">EN PROGRESO</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>GLPI (cerrado)</Label>
              <Input {...form.register("glpiClosedTicket")} placeholder="Ej: 12345" />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha apertura</Label>
              <Input type="date" {...form.register("openingTimestamp")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando…" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}