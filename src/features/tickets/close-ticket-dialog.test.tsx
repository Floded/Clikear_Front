import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import { CloseTicketDialog } from "@/features/tickets/close-ticket-dialog";
import {
  deleteTicketImage,
  fetchTicketImages,
  ticketImageUrl,
  updateTicketStatus,
  uploadTicketImages,
} from "@/features/tickets/tickets.api";
import type { TicketImage } from "@/features/tickets/tickets.types";

vi.mock("@/features/tickets/tickets.api", () => ({
  fetchTicketImages: vi.fn(),
  uploadTicketImages: vi.fn(),
  updateTicketStatus: vi.fn(),
  deleteTicketImage: vi.fn(),
  ticketImageUrl: (fileName: string) => `http://test/uploads/tickets/${fileName}`,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFetchTicketImages = vi.mocked(fetchTicketImages);
const mockUploadTicketImages = vi.mocked(uploadTicketImages);
const mockUpdateTicketStatus = vi.mocked(updateTicketStatus);
const mockDeleteTicketImage = vi.mocked(deleteTicketImage);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const existingImage: TicketImage = {
  id: 1,
  ticketId: "123",
  fileName: "previa.png",
  mimeType: "image/png",
  sizeBytes: 100,
  createdAt: "2026-03-01T10:00:00Z",
};

function pngFile(name: string) {
  return new File(["png"], name, { type: "image/png" });
}

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CloseTicketDialog ticketId="123" open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom no implementa object URLs
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();

  mockFetchTicketImages.mockResolvedValue([]);
  mockUploadTicketImages.mockResolvedValue([]);
  mockUpdateTicketStatus.mockResolvedValue({ ticketId: "123", status: "TERMINADO" });
  mockDeleteTicketImage.mockResolvedValue(undefined);
});

function getInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("CloseTicketDialog", () => {
  it("mantiene deshabilitado el cierre sin imágenes", () => {
    renderDialog();

    expect(screen.getByRole("button", { name: "Confirmar cierre" })).toBeDisabled();
  });

  it("rechaza archivos con mime no permitido y no los agrega", async () => {
    renderDialog();

    const file = new File(["x"], "nota.txt", { type: "text/plain" });
    fireEvent.change(getInput(), { target: { files: [file] } });

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1));
    expect(mockToastError).toHaveBeenCalledWith(
      "nota.txt: solo se admiten imágenes jpeg, png o webp",
    );
    expect(screen.getByRole("button", { name: "Confirmar cierre" })).toBeDisabled();
  });

  it("habilita el cierre al elegir imágenes y sube antes de cambiar el estado", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    const file = pngFile("cierre.png");
    await user.upload(getInput(), file);

    expect(await screen.findByAltText("cierre.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar cierre" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Confirmar cierre" }));

    await waitFor(() =>
      expect(mockUploadTicketImages).toHaveBeenCalledWith("123", [file]),
    );
    expect(mockUpdateTicketStatus).toHaveBeenCalledWith("123", "TERMINADO");
    expect(mockToastSuccess).toHaveBeenCalledWith("Ticket cerrado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("permite cerrar con imágenes previas sin agregar nuevas", async () => {
    mockFetchTicketImages.mockResolvedValue([existingImage]);
    const user = userEvent.setup();
    renderDialog();

    expect(await screen.findByAltText("previa.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar cierre" }));

    await waitFor(() =>
      expect(mockUpdateTicketStatus).toHaveBeenCalledWith("123", "TERMINADO"),
    );
    expect(mockUploadTicketImages).not.toHaveBeenCalled();
  });

  it("muestra el error del backend si el cierre falla", async () => {
    mockUploadTicketImages.mockRejectedValue({
      response: { data: { error: "El ticket admite hasta 10 imágenes" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.upload(getInput(), pngFile("cierre.png"));
    await user.click(await screen.findByRole("button", { name: "Confirmar cierre" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("El ticket admite hasta 10 imágenes"),
    );
  });

  it("quita un archivo pendiente antes de confirmar", async () => {
    const user = userEvent.setup();
    renderDialog();

    const file = pngFile("cierre.png");
    await user.upload(getInput(), file);
    await user.click(await screen.findByRole("button", { name: "Quitar cierre.png" }));

    expect(screen.queryByAltText("cierre.png")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar cierre" })).toBeDisabled();
  });

  it("quita una imagen previa ya adjuntada", async () => {
    mockFetchTicketImages.mockResolvedValue([existingImage]);
    const user = userEvent.setup();
    renderDialog();

    expect(await screen.findByAltText("previa.png")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar imagen previa.png" }));

    await waitFor(() =>
      expect(mockDeleteTicketImage).toHaveBeenCalledWith("123", 1),
    );
  });

  it("arma la URL pública de la imagen desde la base de la API", () => {
    expect(ticketImageUrl("a.png")).toBe("http://test/uploads/tickets/a.png");
  });
});
