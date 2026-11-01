import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

import { fetchSuppliers } from "@/features/inventory/inventory.api";
import { NewSupplierDialog } from "@/features/inventory/new-supplier-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "list", debouncedSearch, page],
    queryFn: () =>
      fetchSuppliers({ search: debouncedSearch || undefined, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver al inventario
          </Link>
          <PageHeader
            title="Proveedores"
            description="Altas y datos de contacto de los proveedores."
          />
        </div>
        <Button onClick={() => setNewSupplierOpen(true)}>Nuevo proveedor</Button>
      </div>

      <Input
        placeholder="Buscar por nombre o email…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {suppliersQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {suppliersQuery.isError && (
        <Card>
          <CardContent className="text-sm text-destructive">
            No se pudieron cargar los proveedores.
          </CardContent>
        </Card>
      )}

      {!suppliersQuery.isPending && (suppliersQuery.data?.data.length ?? 0) === 0 && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Sin proveedores para los filtros actuales.
          </CardContent>
        </Card>
      )}

      {(suppliersQuery.data?.data.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Proveedor</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Página web</th>
                <th className="px-4 py-2 font-medium">Ítems</th>
              </tr>
            </thead>
            <tbody>
              {suppliersQuery.data!.data.map((supplier) => (
                <tr key={supplier.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{supplier.name}</td>
                  <td className="px-4 py-2">
                    {supplier.contactPhone ? (
                      <a href={`tel:${supplier.contactPhone}`} className="hover:underline">
                        {supplier.contactPhone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {supplier.contactEmail ? (
                      <a
                        href={`mailto:${supplier.contactEmail}`}
                        className="hover:underline"
                      >
                        {supplier.contactEmail}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {supplier.website ? (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {supplier.website}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary">
                      {supplier._count?.inventoryItems ?? 0}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suppliersQuery.data && suppliersQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {suppliersQuery.data.page} de {suppliersQuery.data.totalPages} ·{" "}
            {suppliersQuery.data.total} proveedores
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
              disabled={page >= suppliersQuery.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <NewSupplierDialog open={newSupplierOpen} onOpenChange={setNewSupplierOpen} />
    </section>
  );
}
