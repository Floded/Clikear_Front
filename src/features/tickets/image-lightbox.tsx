import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { ticketImageUrl } from "@/features/tickets/tickets.api";
import type { TicketImage } from "@/features/tickets/tickets.types";

interface ImageLightboxProps {
  images: TicketImage[];
  /** Imagen abierta (índice) o null si está cerrado */
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

export function ImageLightbox({ images, index, onIndexChange }: ImageLightboxProps) {
  const [downloading, setDownloading] = useState(false);
  const open = index !== null && images.length > 0;
  const current = open ? images[index] : null;
  const hasMultiple = images.length > 1;

  // Teclado: ← / → navegan entre imágenes (Escape lo maneja el Dialog)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange(((index as number) - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange(((index as number) + 1) % images.length);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, index, images.length, onIndexChange]);

  if (!open || !current) return null;

  const downloadImage = async (image: TicketImage) => {
    setDownloading(true);
    try {
      // Blob para forzar la descarga aunque la imagen venga de otro origen
      const response = await api.get(ticketImageUrl(image.fileName), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onIndexChange(null)}>
      {/* Modal proporcionado a la pantalla (no fullscreen) */}
      <DialogContent
        showCloseButton={false}
        className="flex h-auto max-h-[88vh] w-[min(94vw,72rem)] max-w-[94vw]! flex-col gap-0 overflow-hidden rounded-xl bg-black/95 p-0 text-white ring-1 ring-white/10 sm:max-w-[min(94vw,72rem)]!"
      >
        <DialogTitle className="sr-only">Imagen de cierre</DialogTitle>
        <DialogDescription className="sr-only">
          Vista ampliada de la imagen de cierre del ticket
        </DialogDescription>

        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.fileName}</p>
            <p className="text-xs text-white/70">
              {index! + 1} / {images.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              disabled={downloading}
              onClick={() => downloadImage(current)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Descargar imagen</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              autoFocus
              onClick={() => onIndexChange(null)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar imagen ampliada</span>
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-4">
          {hasMultiple && (
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0"
              onClick={() =>
                onIndexChange((index! - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Imagen anterior</span>
            </Button>
          )}

          <img
            src={ticketImageUrl(current.fileName)}
            alt={current.fileName}
            className="max-h-full max-w-full object-contain"
          />

          {hasMultiple && (
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0"
              onClick={() => onIndexChange((index! + 1) % images.length)}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Imagen siguiente</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
