import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export function InvoicesPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Facturación"
        description="Comprobantes e integración ARCA (ex-AFIP)."
      />
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          Vista de facturas — llega en la Etapa 4.
        </CardContent>
      </Card>
    </section>
  );
}
