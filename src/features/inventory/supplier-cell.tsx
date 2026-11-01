import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";

import { fetchSupplier } from "@/features/inventory/inventory.api";

const OPEN_DELAY_MS = 250;
const CLOSE_DELAY_MS = 150;
const GAP_PX = 8;

interface SupplierSummary {
  id: number;
  name: string;
}

interface SupplierCellProps {
  supplier: SupplierSummary | null;
}

interface Position {
  left: number;
  top: number;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export function SupplierCell({ supplier }: SupplierCellProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const supplierQuery = useQuery({
    queryKey: ["supplier", supplier?.id],
    queryFn: () => fetchSupplier(supplier!.id),
    enabled: open && supplier !== null,
    staleTime: 5 * 60 * 1000,
  });

  const cancelTimer = (timerRef: { current: number | null }) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const computePosition = (): Position | null => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const CARD_WIDTH = 288; // w-72
    const CARD_ESTIMATED_HEIGHT = 200;
    const left = Math.min(rect.left, window.innerWidth - CARD_WIDTH - 12);
    const below = rect.bottom + GAP_PX;
    const top =
      below + CARD_ESTIMATED_HEIGHT > window.innerHeight
        ? Math.max(12, rect.top - CARD_ESTIMATED_HEIGHT - GAP_PX)
        : below;
    return { left: Math.max(12, left), top };
  };

  const openCard = () => {
    cancelTimer(closeTimerRef);
    if (open || openTimerRef.current !== null) return;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      const next = computePosition();
      if (!next) return;
      setPosition(next);
      setOpen(true);
    }, OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    cancelTimer(openTimerRef);
    cancelTimer(closeTimerRef);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
      setPosition(null);
    }, CLOSE_DELAY_MS);
  };

  const keepOpen = () => cancelTimer(closeTimerRef);

  // El card vive en un portal: su hover no cancela el cierre por delegación
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setPosition(null);
      }
    };
    // Con posición fija el card no sigue al scroll: mejor cerrarlo
    const onScroll = () => {
      setOpen(false);
      setPosition(null);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(
    () => () => {
      cancelTimer(openTimerRef);
      cancelTimer(closeTimerRef);
    },
    [],
  );

  if (!supplier) return <span>—</span>;

  const data = supplierQuery.data;

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-help underline decoration-dotted underline-offset-4"
        onMouseEnter={openCard}
        onMouseLeave={scheduleClose}
        onFocus={openCard}
        onBlur={scheduleClose}
        onClick={() => (open ? scheduleClose() : openCard())}
        tabIndex={0}
      >
        {supplier.name}
      </span>

      {open &&
        position &&
        createPortal(
          <div
            role="dialog"
            aria-label={`Datos del proveedor ${supplier.name}`}
            style={{ left: position.left, top: position.top }}
            className="fixed z-50 w-72 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
          >
            <p className="mb-3 font-medium">{supplier.name}</p>

            {supplierQuery.isPending && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

            {supplierQuery.isError && (
              <p className="text-sm text-destructive">
                No se pudieron cargar los datos del proveedor.
              </p>
            )}

            {data && (
              <div className="space-y-2">
                <InfoRow label="Teléfono">
                  {data.contactPhone ? (
                    <a href={`tel:${data.contactPhone}`} className="hover:underline">
                      {data.contactPhone}
                    </a>
                  ) : (
                    <span className="font-normal text-muted-foreground">Sin datos</span>
                  )}
                </InfoRow>
                <InfoRow label="Email">
                  {data.contactEmail ? (
                    <a href={`mailto:${data.contactEmail}`} className="hover:underline">
                      {data.contactEmail}
                    </a>
                  ) : (
                    <span className="font-normal text-muted-foreground">Sin datos</span>
                  )}
                </InfoRow>
                {data.website && (
                  <InfoRow label="Página web">
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {data.website}
                    </a>
                  </InfoRow>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
