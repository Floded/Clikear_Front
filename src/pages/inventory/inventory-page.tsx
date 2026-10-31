import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StockTab } from "@/features/inventory/stock-tab";
import { CustodyTab } from "@/features/inventory/custody-tab";
import { AssignMaterialDialog } from "@/features/inventory/assign-material-dialog";

export function InventoryPage() {
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Stock en depósito y custodia por empleado.
          </p>
        </div>
        <Button onClick={() => setAssignOpen(true)}>Asignar material</Button>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock en depósito</TabsTrigger>
          <TabsTrigger value="custody">Custodia por empleado</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <StockTab />
        </TabsContent>
        <TabsContent value="custody">
          <CustodyTab />
        </TabsContent>
      </Tabs>

      <AssignMaterialDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </section>
  );
}
