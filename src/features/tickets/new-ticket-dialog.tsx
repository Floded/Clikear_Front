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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createTicket } from "@/features/tickets/tickets.api";

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
  title: z.string().trim().min(1, { message: "El título es obligatorio" }),
  status: z.enum(["ABIERTO", "EN PROGRESO", "TERMINADO"]).optional(),
  glpiClosedTicket: z.string().trim().max(100).optional(),
  openingTimestamp: z.string().optional(),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export function NewTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema) as Resolver<CreateTicketFormValues>,
    defaultValues: {
      ticketId: "",
      establishmentCue: "",
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
        title: "",
        status: "ABIERTO",
        glpiClosedTicket: "",
        openingTimestamp: "",
      });
    }
  }, [open, form]);

  const mutation = useMutation<{ ticketId: string }, unknown, CreateTicketFormValues>({
    mutationFn: (values: CreateTicketFormValues) =>
      createTicket({
        ticketId: BigInt(values.ticketId),
        establishmentCue: values.establishmentCue || undefined,
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

  const onSubmit = (values: CreateTicketFormValues) => mutation.mutate(values);

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
            </div>
          </div>

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
                  <SelectItem value="TERMINADO">TERMINADO</SelectItem>
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