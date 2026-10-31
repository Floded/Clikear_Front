import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export function InventoryPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Inventario"
        description="Stock en depósito y custodia por empleado."
      />
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          Tabs de stock y asignaciones — llega en la Etapa 3.
        </CardContent>
      </Card>
    </section>
  );
}
