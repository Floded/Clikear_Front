import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  adjustStock,
  fetchInventoryItems,
} from "@/features/inventory/inventory.api";
import type { InventoryItem } from "@/features/inventory/inventory.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const LOW_STOCK_THRESHOLD = 3;

function stockBadge(item: InventoryItem) {
  if (item.availableQuantity <= 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  }
  if (item.availableQuantity <= LOW_STOCK_THRESHOLD) {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Bajo ({item.availableQuantity})</Badge>;
  }
  return <Badge variant="secondary">{item.availableQuantity}</Badge>;
}

export function StockTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [hasStock, setHasStock] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>("");

  const itemsQuery = useQuery({
    queryKey: ["inventory-items", debouncedSearch, hasStock, page],
    queryFn: () =>
      fetchInventoryItems({
        search: debouncedSearch || undefined,
        hasStock: hasStock === "ALL" ? undefined : (hasStock as "true" | "false"),
        page,
        limit: 20,
      }),
    placeholderData: (prev) => prev,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      adjustStock(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Stock ajustado");
      setAdjustItem(null);
      setAdjustQty("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo ajustar el stock";
      toast.error(msg);
    },
  });

  const handleAdjust = () => {
    if (!adjustItem) return;
    const quantity = Number(adjustQty);
    if (!Number.isInteger(quantity) || quantity === 0) {
      toast.error("La cantidad debe ser un entero distinto de cero");
      return;
    }
    adjustMutation.mutate({ id: adjustItem.id, quantity });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Buscar ítem…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={hasStock}
          onValueChange={(v) => {
            setHasStock(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="true">Con stock</SelectItem>
            <SelectItem value="false">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {itemsQuery.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {itemsQuery.isError && (
        <Card>
          <CardContent className="text-sm text-destructive">
            No se pudieron cargar los ítems.
          </CardContent>
        </Card>
      )}

      {!itemsQuery.isPending && (itemsQuery.data?.data.length ?? 0) === 0 && (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Sin ítems para los filtros actuales.
          </CardContent>
        </Card>
      )}

      {(itemsQuery.data?.data.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Ítem</th>
                <th className="px-4 py-2 font-medium">Proveedor</th>
                <th className="px-4 py-2 font-medium">Disponible</th>
                <th className="px-4 py-2 font-medium">En custodia</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsQuery.data!.data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {item.supplier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2">{stockBadge(item)}</td>
                  <td className="px-4 py-2 text-xs">{item._count?.assignments ?? 0}</td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAdjustItem(item);
                        setAdjustQty("");
                      }}
                    >
                      Ajustar stock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {itemsQuery.data && itemsQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {itemsQuery.data.page} de {itemsQuery.data.totalPages} · {itemsQuery.data.total} ítems
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
              disabled={page >= itemsQuery.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={adjustItem !== null} onOpenChange={(o) => !o && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock — {adjustItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Disponible actual: <span className="font-medium">{adjustItem?.availableQuantity}</span>. Ingresá un entero positivo para sumar o negativo para restar.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad</Label>
              <Input
                id="qty"
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="Ej: 5 o -3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
