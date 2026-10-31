import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";

import { fetchTicketDetail, updateTicketStatus } from "@/features/tickets/tickets.api";
import { TicketStatusBadge } from "@/features/tickets/ticket-status-badge";
import { TICKET_STATUSES } from "@/features/tickets/tickets.types";

interface TicketDetailDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailDialog({ ticketId, open, onOpenChange }: TicketDetailDialogProps) {
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicketDetail(ticketId as string),
    enabled: open && ticketId !== null,
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
                <Select
                  value={data.status}
                  onValueChange={(v) => mutation.mutate(v)}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

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
    </Dialog>
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
