import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportExcelDialog } from "@/components/shared/export-excel-dialog";

import { useSession } from "@/features/auth/use-session";
import { canEdit } from "@/lib/permissions";
import { fetchEmployees } from "@/features/organization/organization.api";
import {
  exportTicketsExcel,
  fetchTickets,
  fetchTechnicians,
} from "@/features/tickets/tickets.api";
import { TicketFilters, type TicketFiltersState } from "@/features/tickets/ticket-filters";
import { TicketStatusBadge } from "@/features/tickets/ticket-status-badge";
import { TicketDetailDialog } from "@/features/tickets/ticket-detail-dialog";
import { NewTicketDialog } from "@/features/tickets/new-ticket-dialog";
import type { TicketListItem } from "@/features/tickets/tickets.types";

const EMPTY_FILTERS: TicketFiltersState = {
  status: "",
  technicianId: "",
  establishment: "",
  employeeId: "",
  search: "",
};

export function TicketsPage() {
  const { data: sessionUser } = useSession();
  const canEditTickets = canEdit(sessionUser, "tickets");

  const [filters, setFilters] = useState<TicketFiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      status: filters.status || undefined,
      establishment: filters.establishment || undefined,
      technicianId: filters.technicianId ? Number(filters.technicianId) : undefined,
      // "none" = sin asignar, número = tickets de ese empleado
      employeeId: filters.employeeId
        ? filters.employeeId === "none"
          ? ("none" as const)
          : Number(filters.employeeId)
        : undefined,
      search: filters.search || undefined,
      page,
      limit: 20,
    }),
    [filters, page],
  );

  const ticketsQuery = useQuery({
    queryKey: ["tickets", queryFilters],
    queryFn: () => fetchTickets(queryFilters),
    placeholderData: (prev) => prev,
  });

  const techniciansQuery = useQuery({
    queryKey: ["technicians", "all"],
    queryFn: fetchTechnicians,
    staleTime: 60_000,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => fetchEmployees({ isActive: "true", limit: 100 }),
    staleTime: 60_000,
  });

  // Agrupa por establecimiento (CUE) para la vista de hojas de ruta
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: TicketListItem[] }>();
    for (const ticket of ticketsQuery.data?.data ?? []) {
      const key = ticket.establishment?.cue ?? "__none__";
      const name = ticket.establishment?.name ?? "Sin establecimiento";
      if (!map.has(key)) map.set(key, { name, items: [] });
      map.get(key)!.items.push(ticket);
    }
    return Array.from(map.entries());
  }, [ticketsQuery.data]);

  const openDetail = (id: string) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  // Exporta respetando los filtros activos y el rango de apertura (sin paginar)
  const exportMutation = useMutation({
    mutationFn: (range: { from?: string; to?: string }) =>
      exportTicketsExcel(
        {
          status: queryFilters.status,
          establishment: queryFilters.establishment,
          technicianId: queryFilters.technicianId,
          employeeId: queryFilters.employeeId,
          search: queryFilters.search,
        },
        range,
      ),
    onSuccess: () => {
      toast.success("Excel descargado");
      setExportOpen(false);
    },
    onError: () => toast.error("No se pudo exportar"),
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Hojas de ruta y tickets por establecimiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" aria-hidden />
            Exportar Excel
          </Button>
          {canEditTickets && (
            <Button onClick={() => setNewTicketOpen(true)}>Nuevo ticket</Button>
          )}
        </div>
      </div>

      <TicketFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        technicians={techniciansQuery.data?.data ?? []}
        employees={employeesQuery.data?.data ?? []}
      />

      {ticketsQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {ticketsQuery.isError && (
        <Card>
          <CardContent className="text-sm text-destructive">
            No se pudieron cargar los tickets. Reintentá.
          </CardContent>
        </Card>
      )}

      {!ticketsQuery.isPending && (ticketsQuery.data?.data.length ?? 0) === 0 && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Sin resultados para los filtros actuales.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {grouped.map(([key, group]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{group.name}</CardTitle>
              {key !== "__none__" && (
                <p className="text-xs text-muted-foreground">CUE {key}</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium"># Ticket</th>
                    <th className="px-4 py-2 font-medium">Título</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Asignado a</th>
                    <th className="px-4 py-2 font-medium">Apertura</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((ticket) => (
                    <tr
                      key={ticket.ticketId}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/30 min-h-[36px] whitespace-nowrap"
                      onClick={() => openDetail(ticket.ticketId)}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-right whitespace-nowrap">{ticket.ticketId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{ticket.title}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        {ticket.assignedEmployee?.fullName ?? (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-muted-foreground whitespace-nowrap">
                        {ticket.openingTimestamp
                          ? new Date(ticket.openingTimestamp).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      {ticketsQuery.data && ticketsQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {ticketsQuery.data.page} de {ticketsQuery.data.totalPages} ·{" "}
            {ticketsQuery.data.total} tickets
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= ticketsQuery.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <TicketDetailDialog
        ticketId={selectedTicketId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <NewTicketDialog open={newTicketOpen} onOpenChange={setNewTicketOpen} />
      <ExportExcelDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Exportar tickets a Excel"
        pending={exportMutation.isPending}
        onExport={(range) => exportMutation.mutate(range)}
      />
    </section>
  );
}
