import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";

import { fetchEmployees, updateEmployee } from "@/features/organization/organization.api";
import type { Employee } from "@/features/organization/organization.types";
import { EmployeeFormDialog } from "@/features/organization/employee-form-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function OrganizationPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["employees", "list", debouncedSearch, activeFilter, page],
    queryFn: () =>
      fetchEmployees({
        search: debouncedSearch || undefined,
        isActive: activeFilter === "ALL" ? undefined : activeFilter,
        page,
        limit: 20,
      }),
    placeholderData: (prev) => prev,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (emp: Employee) => updateEmployee(emp.id, { isActive: !emp.isActive }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(
        updated.isActive
          ? `${updated.fullName} dado de alta`
          : `${updated.fullName} dado de baja`,
      );
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo cambiar el estado";
      toast.error(message);
    },
  });

  const openCreate = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormOpen(true);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Organización"
          description="Altas y datos de contacto de los empleados."
        />
        <Button onClick={openCreate}>Nuevo empleado</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Buscar por nombre o DNI…"
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
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">DNI / Legajo</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Items en custodia</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.data!.data.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{emp.fullName}</td>
                  <td className="px-4 py-2 text-xs">{emp.dniOrFileNumber}</td>
                  <td className="px-4 py-2 text-xs">
                    {emp.phone ? (
                      <a href={`tel:${emp.phone}`} className="hover:underline">
                        {emp.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={toggleActiveMutation.isPending}
                        onClick={() => toggleActiveMutation.mutate(emp)}
                      >
                        {emp.isActive ? "Dar de baja" : "Dar de alta"}
                      </Button>
                    </div>
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
            Página {employeesQuery.data.page} de {employeesQuery.data.totalPages} ·{" "}
            {employeesQuery.data.total} empleados
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

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editingEmployee}
      />
    </section>
  );
}
