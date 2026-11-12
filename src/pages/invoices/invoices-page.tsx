import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InvoiceStatusBadge } from "@/features/invoices/invoice-status-badge";
import type { InvoiceRow } from "@/features/invoices/invoices.types";

const INITIAL: InvoiceRow[] = [
  {
    id: 1,
    ticketId: "125691",
    voucherType: 1,
    amount: "15000.00",
    status: "APPROVED",
    cae: "70412345678901",
    errorMessage: null,
    createdAt: "2026-10-06T10:00:00.000Z",
  },
  {
    id: 2,
    ticketId: "125692",
    voucherType: 1,
    amount: "8200.50",
    status: "PENDING",
    cae: null,
    errorMessage: null,
    createdAt: "2026-10-07T14:30:00.000Z",
  },
  {
    id: 3,
    ticketId: "125693",
    voucherType: 6,
    amount: "3100.00",
    status: "REJECTED",
    cae: null,
    errorMessage: "CUIT del receptor inválido",
    createdAt: "2026-10-08T09:15:00.000Z",
  },
];

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(INITIAL);
  const [filter, setFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered =
    filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter);

  const handleGenerate = () => {
    if (!ticketId.trim() || !amount.trim()) {
      toast.error("Completá ticket y monto");
      return;
    }
    const next: InvoiceRow = {
      id: invoices.length + 1,
      ticketId: ticketId.trim(),
      voucherType: 1,
      amount: Number(amount).toFixed(2),
      status: "PENDING",
      cae: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [next, ...prev]);
    toast.success("Solicitud de factura enviada (integración ARCA en desarrollo)");
    setOpen(false);
    setTicketId("");
    setAmount("");
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-sm text-muted-foreground">
            Comprobantes e integración ARCA (ex-AFIP). Datos de ejemplo hasta que el backend exponga la API.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Generar factura</Button>
      </div>

      <div className="w-48">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="APPROVED">Aprobada</SelectItem>
            <SelectItem value="REJECTED">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Sin comprobantes para el filtro actual.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Ticket</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Monto</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">CAE</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2">{inv.id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{inv.ticketId}</td>
                  <td className="px-4 py-2">{inv.voucherType}</td>
                  <td className="px-4 py-2">{inv.amount}</td>
                  <td className="px-4 py-2">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-2 text-xs">{inv.cae ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.some((i) => i.errorMessage) && (
        <Card>
          <CardContent className="space-y-1 text-sm">
            {filtered
              .filter((i) => i.errorMessage)
              .map((i) => (
                <p key={i.id} className="text-destructive">
                  Ticket {i.ticketId}: {i.errorMessage}
                </p>
              ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticket">N° de ticket</Label>
              <Input
                id="ticket"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="125691"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              La emisión real contra ARCA se habilitará cuando el backend exponga el endpoint.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
