import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { dateRangeToParams } from "@/lib/download";

interface ExportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pending: boolean;
  /** Recibe el rango en ISO (undefined si no se eligieron fechas) */
  onExport: (range: { from?: string; to?: string }) => void;
}

/**
 * Modal reutilizable para exportar a Excel con rango de fechas opcional.
 * Sin fechas = exporta todo.
 */
export function ExportExcelDialog({
  open,
  onOpenChange,
  title,
  pending,
  onExport,
}: ExportExcelDialogProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleExport = () => {
    onExport(dateRangeToParams(from, to));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Elegí un rango de fechas o dejá los campos vacíos para exportar todo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="export-from">Desde</Label>
            <Input
              id="export-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export-to">Hasta</Label>
            <Input
              id="export-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={pending} onClick={handleExport}>
            <Download className="size-4" aria-hidden />
            {pending ? "Exportando…" : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
