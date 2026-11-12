import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  deleteTicketImage,
  fetchTicketImages,
  ticketImageUrl,
  updateTicketStatus,
  uploadTicketImages,
} from "@/features/tickets/tickets.api";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_TICKET,
  MAX_IMAGE_SIZE_BYTES,
} from "@/features/tickets/tickets.types";

interface CloseTicketDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseTicketDialog({ ticketId, open, onOpenChange }: CloseTicketDialogProps) {
  const queryClient = useQueryClient();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const imagesQuery = useQuery({
    queryKey: ["ticket-images", ticketId],
    queryFn: () => fetchTicketImages(ticketId as string),
    enabled: open && ticketId !== null,
  });

  const existingImages = imagesQuery.data ?? [];

  // Previews locales; al cambiar la lista se revocan las URLs viejas
  const previews = useMemo(
    () =>
      pendingFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [pendingFiles],
  );
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  // Al cerrar el diálogo se descartan los archivos no enviados
  useEffect(() => {
    if (!open) setPendingFiles([]);
  }, [open]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const existingCount = imagesQuery.data?.length ?? 0;
    const valid: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        toast.error(`${file.name}: solo se admiten imágenes jpeg, png o webp`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${file.name}: supera el máximo de 5 MB`);
        continue;
      }
      valid.push(file);
    }

    setPendingFiles((prev) => {
      const total = existingCount + prev.length + valid.length;
      if (total > MAX_IMAGES_PER_TICKET) {
        toast.error(`Máximo ${MAX_IMAGES_PER_TICKET} imágenes por ticket`);
      }
      const room = Math.max(0, MAX_IMAGES_PER_TICKET - existingCount - prev.length);
      return [...prev, ...valid.slice(0, room)];
    });
  }

  function removeFile(file: File) {
    setPendingFiles((prev) => prev.filter((f) => f !== file));
  }

  async function removeExisting(imageId: number) {
    try {
      await deleteTicketImage(ticketId as string, imageId);
      await queryClient.invalidateQueries({ queryKey: ["ticket-images", ticketId] });
    } catch {
      toast.error("No se pudo quitar la imagen");
    }
  }

  const closeMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (files.length > 0) {
        await uploadTicketImages(ticketId as string, files);
      }
      return updateTicketStatus(ticketId as string, "TERMINADO");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-images", ticketId] });
      toast.success("Ticket cerrado");
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo cerrar el ticket";
      toast.error(msg);
    },
  });

  // Sin imágenes nuevas ni previas no hay evidencia: el backend rechazaría el cierre
  const canClose = pendingFiles.length > 0 || existingImages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cerrar ticket {ticketId}</DialogTitle>
          <DialogDescription>
            Adjunte al menos una imagen como evidencia del trabajo realizado.
          </DialogDescription>
        </DialogHeader>

        {existingImages.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Imágenes ya adjuntas ({existingImages.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((image) => (
                <div key={image.id} className="group relative">
                  <img
                    src={ticketImageUrl(image.fileName)}
                    alt={image.fileName}
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar imagen ${image.fileName}`}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    onClick={() => removeExisting(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/50"
          data-testid="dropzone"
        >
          <ImagePlus className="h-6 w-6" />
          <span>Hacer clic para agregar imágenes</span>
          <span className="text-xs">jpeg, png o webp · máx. 5 MB</span>
          <input
            type="file"
            accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {pendingFiles.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              A adjuntar ({pendingFiles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {previews.map(({ file, url }) => (
                <div key={url} className="group relative">
                  <img
                    src={url}
                    alt={file.name}
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar ${file.name}`}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive text-white p-0.5"
                    onClick={() => removeFile(file)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={closeMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canClose || closeMutation.isPending}
            onClick={() => closeMutation.mutate(pendingFiles)}
          >
            {closeMutation.isPending ? "Cerrando…" : "Confirmar cierre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
