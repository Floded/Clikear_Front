import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TODAY = new Date().toISOString().slice(0, 10);
import { Input } from "@/components/ui/input";import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportExcelDialog } from "@/components/shared/export-excel-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  exportAssignmentsExcel,
  fetchCustody,
  returnAssignment,
} from "@/features/inventory/inventory.api";
import type { Assignment } from "@/features/inventory/inventory.types";
import { fetchEmployees } from "@/features/organization/organization.api";
import type { Employee } from "@/features/organization/organization.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function CustodyTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [custodyOpen, setCustodyOpen] = useState(false);

  const [returnTarget, setReturnTarget] = useState<Assignment | null>(null);
  const [returnQty, setReturnQty] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [exportOpen, setExportOpen] = useState(false);

  const employeesQuery = useQuery({
    queryKey: ["employees", debouncedSearch, activeFilter, page],
    queryFn: () =>
      fetchEmployees({
        search: debouncedSearch || undefined,
        isActive: activeFilter === "ALL" ? undefined : activeFilter,
        page,
        limit: 20,
      }),
    placeholderData: (prev) => prev,
  });

  const custodyQuery = useQuery({
    queryKey: ["custody", selectedEmployee?.id],
    queryFn: () => fetchCustody(selectedEmployee!.id),
    enabled: custodyOpen && selectedEmployee !== null,
  });

  // Exporta las asignaciones filtradas por rango de entrega (sin paginar)
  const exportMutation = useMutation({
    mutationFn: (range: { from?: string; to?: string }) =>
      exportAssignmentsExcel(range),
    onSuccess: () => {
      toast.success("Excel descargado");
      setExportOpen(false);
    },
    onError: () => toast.error("No se pudo exportar"),
  });

  const returnMutation = useMutation({    mutationFn: (input: { id: number; quantity?: number; returnDate?: string; notes?: string }) =>
      returnAssignment(input.id, {
        quantity: input.quantity,
        returnDate: input.returnDate,
        notes: input.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custody"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Devolución registrada");
      setReturnTarget(null);
      setReturnQty("");
      setReturnDate("");
      setReturnNotes("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo registrar la devolución";
      toast.error(msg);
    },
  });

  const openCustody = (emp: Employee) => {
    setSelectedEmployee(emp);
    setCustodyOpen(true);
  };

  const startReturn = (assignment: Assignment) => {
    setReturnTarget(assignment);
    setReturnQty(String(assignment.quantityAssigned));
    setReturnDate(TODAY);
    setReturnNotes("");
  };

  const handleReturn = () => {
    if (!returnTarget) return;
    const quantity = returnQty ? Number(returnQty) : undefined;
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
      toast.error("La cantidad debe ser un entero positivo");
      return;
    }
    returnMutation.mutate({
      id: returnTarget.id,
      quantity,
      returnDate: returnDate ? new Date(returnDate).toISOString() : undefined,
      notes: returnNotes || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setExportOpen(true)}>
          <Download className="size-4" aria-hidden />
          Exportar Excel
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Buscar empleado…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {employeesQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {employeesQuery.isError && (
        <Card>
          <CardContent className="text-sm text-destructive">
            No se pudieron cargar los empleados.
          </CardContent>
        </Card>
      )}

      {!employeesQuery.isPending && (employeesQuery.data?.data.length ?? 0) === 0 && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Sin empleados para los filtros actuales.
          </CardContent>
        </Card>
      )}

      {(employeesQuery.data?.data.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Empleado</th>
                <th className="px-4 py-2 font-medium">DNI / Legajo</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">En custodia</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.data!.data.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{emp.fullName}</td>
                  <td className="px-4 py-2 text-xs">{emp.dniOrFileNumber}</td>
                  <td className="px-4 py-2">
                    {emp.isActive ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {emp._count?.assignments ?? 0} activas
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" onClick={() => openCustody(emp)}>
                      Ver custodia
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {employeesQuery.data && employeesQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {employeesQuery.data.page} de {employeesQuery.data.totalPages} · {employeesQuery.data.total} empleados
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
              disabled={page >= employeesQuery.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de custodia */}
      <Dialog open={custodyOpen} onOpenChange={setCustodyOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Custodia — {selectedEmployee?.fullName}
            </DialogTitle>
          </DialogHeader>

          {custodyQuery.isPending && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {custodyQuery.isError && (
            <p className="text-sm text-destructive">No se pudo cargar la custodia.</p>
          )}

          {custodyQuery.data && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Unidades en custodia:{" "}
                <span className="font-semibold">{custodyQuery.data.unitsInCustody}</span>
              </p>

              {custodyQuery.data.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin asignaciones activas.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Ítem</th>
                        <th className="px-3 py-2 font-medium">Cantidad</th>
                        <th className="px-3 py-2 font-medium">Entrega</th>
                        <th className="px-3 py-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custodyQuery.data.data.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="px-3 py-2">{a.inventoryItem?.name ?? `#${a.inventoryItemId}`}</td>
                          <td className="px-3 py-2">{a.quantityAssigned}</td>
                          <td className="px-3 py-2 text-xs">
                            {new Date(a.deliveryDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            <Button size="sm" variant="outline" onClick={() => startReturn(a)}>
                              Devolver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de devolución */}
      <Dialog open={returnTarget !== null} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ítem: <span className="font-medium">{returnTarget?.inventoryItem?.name}</span> · Asignado: {returnTarget?.quantityAssigned}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rq">Cantidad a devolver</Label>
              <Input
                id="rq"
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                placeholder="Total o parcial"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd">Fecha de devolución</Label>
              <Input
                id="rd"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rn">Notas</Label>
              <Input
                id="rn"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "Guardando…" : "Confirmar devolución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de exportación con rango de fechas */}
      <ExportExcelDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Exportar asignaciones a Excel"
        pending={exportMutation.isPending}
        onExport={(range) => exportMutation.mutate(range)}
      />
    </div>
  );
}
