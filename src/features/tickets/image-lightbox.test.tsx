import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { ImageLightbox } from "@/features/tickets/image-lightbox";
import type { TicketImage } from "@/features/tickets/tickets.types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/features/tickets/tickets.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/tickets/tickets.api")>()),
  ticketImageUrl: (fileName: string) => `http://test/uploads/tickets/${fileName}`,
}));

const mockApiGet = vi.mocked(api.get);

const images: TicketImage[] = [
  {
    id: 1,
    ticketId: "123",
    fileName: "cierre-1.png",
    mimeType: "image/png",
    sizeBytes: 100,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: 2,
    ticketId: "123",
    fileName: "cierre-2.png",
    mimeType: "image/png",
    sizeBytes: 200,
    createdAt: "2026-03-01T10:05:00Z",
  },
  {
    id: 3,
    ticketId: "123",
    fileName: "cierre-3.png",
    mimeType: "image/png",
    sizeBytes: 300,
    createdAt: "2026-03-01T10:10:00Z",
  },
];

function renderLightbox(index = 0, onIndexChange = vi.fn()) {
  render(
    <ImageLightbox images={images} index={index} onIndexChange={onIndexChange} />,
  );
  return { onIndexChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom no implementa createObjectURL
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
  mockApiGet.mockResolvedValue({ data: new Blob(["img"]) } as never);
});

describe("ImageLightbox", () => {
  it("no renderiza nada cuando está cerrado", () => {
    renderLightbox(null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra la imagen seleccionada en grande", () => {
    renderLightbox(1);

    const image = screen.getByAltText("cierre-2.png");
    expect(image).toHaveAttribute(
      "src",
      "http://test/uploads/tickets/cierre-2.png",
    );
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("navega a la siguiente imagen con el botón", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(0, onIndexChange);

    await user.click(screen.getByRole("button", { name: "Imagen siguiente" }));

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("navega a la imagen anterior con el botón", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(2, onIndexChange);

    await user.click(screen.getByRole("button", { name: "Imagen anterior" }));

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("envuelve al llegar al final hacia la primera imagen", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(2, onIndexChange);

    await user.click(screen.getByRole("button", { name: "Imagen siguiente" }));

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("no muestra botones de navegación con una sola imagen", () => {
    render(
      <ImageLightbox
        images={[images[0]]}
        index={0}
        onIndexChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Imagen siguiente" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Imagen anterior" }),
    ).not.toBeInTheDocument();
  });

  it("navega con las flechas del teclado", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(1, onIndexChange);

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowLeft}");

    expect(onIndexChange).toHaveBeenNthCalledWith(1, 2);
    expect(onIndexChange).toHaveBeenNthCalledWith(2, 0);
  });

  it("cierra con el botón X", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(0, onIndexChange);

    await user.click(
      screen.getByRole("button", { name: "Cerrar imagen ampliada" }),
    );

    expect(onIndexChange).toHaveBeenCalledWith(null);
  });

  it("cierra con Escape", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    renderLightbox(0, onIndexChange);

    await user.keyboard("{Escape}");

    expect(onIndexChange).toHaveBeenCalledWith(null);
  });

  it("descarga la imagen como blob", async () => {
    const user = userEvent.setup();
    const createObjectURL = URL.createObjectURL as ReturnType<typeof vi.fn>;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    renderLightbox(0);

    await user.click(screen.getByRole("button", { name: "Descargar imagen" }));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "http://test/uploads/tickets/cierre-1.png",
        { responseType: "blob" },
      );
    });
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
