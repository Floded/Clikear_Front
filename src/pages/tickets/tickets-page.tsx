import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export function TicketsPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Tickets"
        description="Hojas de ruta y tickets por establecimiento."
      />
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          Listado con filtros y detalle del ticket — llega en la Etapa 2.
        </CardContent>
      </Card>
    </section>
  );
}
