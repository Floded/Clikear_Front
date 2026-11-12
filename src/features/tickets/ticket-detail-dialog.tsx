import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchEmployees } from "@/features/organization/organization.api";
import {
  assignTicket,
  fetchTicketDetail,
  ticketImageUrl,
  updateTicketStatus,
} from "@/features/tickets/tickets.api";
import { CloseTicketDialog } from "@/features/tickets/close-ticket-dialog";
import { TicketStatusBadge } from "@/features/tickets/ticket-status-badge";
import {
  ALLOWED_STATUS_TRANSITIONS,
  type TicketStatus,
} from "@/features/tickets/tickets.types";

interface TicketDetailDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailDialog({ ticketId, open, onOpenChange }: TicketDetailDialogProps) {
  const queryClient = useQueryClient();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicketDetail(ticketId as string),
    enabled: open && ticketId !== null,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => fetchEmployees({ isActive: "true", limit: 100 }),
    enabled: open,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (next: string) => updateTicketStatus(ticketId as string, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  const assignmentMutation = useMutation({
    mutationFn: (nextEmployeeId: number | null) =>
      assignTicket(ticketId as string, nextEmployeeId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success(
        result.assignedEmployee
          ? `Asignado a ${result.assignedEmployee.fullName}`
          : "Ticket liberado",
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo actualizar la asignación";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ticket {ticketId}
            {data && <TicketStatusBadge status={data.status} />}
          </DialogTitle>
          <DialogDescription>{data?.title ?? "Cargando detalle…"}</DialogDescription>
        </DialogHeader>

        {isPending && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            No se pudo cargar el detalle del ticket.
          </p>
        )}

        {data && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2">
              <Field label="GLPI (cerrado)" value={data.glpiClosedTicket ?? "—"} />
              <Field
                label="Apertura"
                value={data.openingTimestamp ? new Date(data.openingTimestamp).toLocaleString() : "—"}
              />
              <Field label="CUE" value={data.establishment?.cue ?? "—"} />
              <Field label="Establecimiento" value={data.establishment?.name ?? "—"} />
              <Field label="Departamento" value={data.establishment?.department ?? "—"} />
              <Field label="Localidad" value={data.establishment?.locality ?? "—"} />
              <Field label="Dirección" value={data.establishment?.address ?? "—"} />
              <Field label="Teléfono" value={data.establishment?.phone ?? "—"} />
              <Field label="Distancia (km)" value={data.establishment?.distanceKm ?? "—"} />
              <Field label="Director/a" value={data.establishment?.directorName ?? "—"} />
            </section>

            {data.establishment?.dispatchOrder && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Orden de despacho</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Código" value={data.establishment.dispatchOrder.dispatchCode} />
                  <Field
                    label="Fecha"
                    value={new Date(data.establishment.dispatchOrder.dispatchTimestamp).toLocaleDateString()}
                  />
                  <Field label="Estado" value={data.establishment.dispatchOrder.listStatus} />
                </div>
                {data.establishment.dispatchOrder.technicians.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.establishment.dispatchOrder.technicians.map((t) => (
                      <Badge key={t.technician.id} variant="secondary">
                        {t.technician.fullName}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Cambiar estado</h3>
                <div className="flex items-center gap-2">
                  <StatusSelect
                    currentStatus={(data.status as TicketStatus) ?? "ABIERTO"}
                    disabled={mutation.isPending}
                    onSelect={(next) => mutation.mutate(next)}
                  />
                  {/* El cierre es una acción explícita que exige evidencia */}
                  {data.status !== "TERMINADO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => setCloseDialogOpen(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Finalizar ticket
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Asignación a empleado (seguimiento) */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Asignación</h3>
                  <p className="text-xs text-muted-foreground">
                    {data.assignedEmployee
                      ? `Responsable: ${data.assignedEmployee.fullName}`
                      : "Sin asignar"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={data.assignedEmployee ? String(data.assignedEmployee.id) : "none"}
                    onValueChange={(v) =>
                      assignmentMutation.mutate(v === "none" ? null : Number(v))
                    }
                    disabled={assignmentMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Asignar a…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {(employeesQuery.data?.data ?? []).map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {data.assignedEmployee && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentMutation.isPending}
                      onClick={() => assignmentMutation.mutate(null)}
                    >
                      Liberar
                    </Button>
                  )}
                </div>
              </div>

              {(data.assignments?.length ?? 0) > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-2">Empleado</th>
                        <th className="p-2">Asignado</th>
                        <th className="p-2">Liberado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assignments.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="p-2">{a.employee.fullName}</td>
                          <td className="p-2 text-xs">
                            {new Date(a.assignedAt).toLocaleString()}
                          </td>
                          <td className="p-2 text-xs">
                            {a.releasedAt ? (
                              new Date(a.releasedAt).toLocaleString()
                            ) : (
                              <Badge variant="secondary">Actual</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Imágenes de cierre ya adjuntadas (solo lectura) */}
            {data.images.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Imágenes de cierre ({data.images.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.images.map((image) => (
                    <img
                      key={image.id}
                      src={ticketImageUrl(image.fileName)}
                      alt={image.fileName}
                      className="h-20 w-20 rounded-md border object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            {(data.invoices?.length ?? 0) > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Facturas asociadas</h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Monto</th>
                        <th className="p-2">Estado</th>
                        <th className="p-2">CAE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices.map((inv) => (
                        <tr key={inv.id} className="border-t">
                          <td className="p-2">{inv.id}</td>
                          <td className="p-2">{inv.voucherType}</td>
                          <td className="p-2">{inv.amount}</td>
                          <td className="p-2">{inv.status}</td>
                          <td className="p-2 text-xs">{inv.cae ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>

      <CloseTicketDialog
        ticketId={ticketId}
        open={closeDialogOpen}
        onOpenChange={(o) => {
          setCloseDialogOpen(o);
          if (!o) {
            // Refresca por si se canceló o quedó estado optimista en el Select
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
            queryClient.invalidateQueries({ queryKey: ["ticket-images", ticketId] });
          }
        }}
      />
    </Dialog>
  );
}

// Select de estados de flujo: solo el actual + transiciones válidas, sin
// TERMINADO (el cierre se hace con el botón "Finalizar ticket")
function StatusSelect({
  currentStatus,
  disabled,
  onSelect,
}: {
  currentStatus: TicketStatus;
  disabled: boolean;
  onSelect: (next: TicketStatus) => void;
}) {
  const options = [
    currentStatus,
    ...ALLOWED_STATUS_TRANSITIONS[currentStatus].filter(
      (s) => s !== currentStatus && s !== "TERMINADO",
    ),
  ];

  return (
    <Select
      value={currentStatus}
      onValueChange={(v) => onSelect(v as TicketStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((s) => (
          <SelectItem key={s} value={s} disabled={s === currentStatus}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}
