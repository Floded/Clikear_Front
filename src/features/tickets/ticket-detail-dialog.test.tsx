import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { fetchEmployees } from "@/features/organization/organization.api";
import { CloseTicketDialog } from "@/features/tickets/close-ticket-dialog";
import { TicketDetailDialog } from "@/features/tickets/ticket-detail-dialog";
import {
  assignTicket,
  fetchTicketDetail,
  fetchTicketImages,
  updateTicketStatus,
} from "@/features/tickets/tickets.api";
import type { TicketDetail } from "@/features/tickets/tickets.types";

vi.mock("@/features/tickets/tickets.api", () => ({
  fetchTicketDetail: vi.fn(),
  updateTicketStatus: vi.fn(),
  assignTicket: vi.fn(),
  fetchTicketImages: vi.fn(),
  uploadTicketImages: vi.fn(),
  deleteTicketImage: vi.fn(),
  ticketImageUrl: (fileName: string) => `http://test/uploads/tickets/${fileName}`,
}));

vi.mock("@/features/organization/organization.api", () => ({
  fetchEmployees: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFetchTicketDetail = vi.mocked(fetchTicketDetail);
const mockUpdateTicketStatus = vi.mocked(updateTicketStatus);
const mockAssignTicket = vi.mocked(assignTicket);
const mockFetchEmployees = vi.mocked(fetchEmployees);
const mockFetchTicketImages = vi.mocked(fetchTicketImages);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const ticketDetail: TicketDetail = {
  ticketId: "123",
  establishmentCue: "700083300",
  assignedEmployeeId: 4,
  title: "Falla total",
  glpiClosedTicket: "GLPI-9",
  openingTimestamp: "2026-03-01T10:00:00Z",
  status: "ABIERTO",
  assignedEmployee: { id: 4, fullName: "María López", isActive: true },
  establishment: {
    cue: "700083300",
    name: "Escuela N° 12",
    department: "La Plata",
    locality: "La Plata",
    isSecondaryBuilding: false,
    address: "Calle Falsa 123",
    phone: "221-555-0000",
    distanceKm: "12.5",
    directorName: "Ana Pérez",
    dispatchOrder: null,
  },
  assignments: [],
  invoices: [],
  images: [],
};

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TicketDetailDialog
        ticketId="123"
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchTicketDetail.mockResolvedValue(ticketDetail);
  mockFetchTicketImages.mockResolvedValue([]);
  mockUpdateTicketStatus.mockResolvedValue({
    ticketId: "123",
    status: "EN PROGRESO",
  });
  mockAssignTicket.mockResolvedValue({
    ticketId: "123",
    assignedEmployee: { id: 10, fullName: "Juan Gómez" },
  });
  mockFetchEmployees.mockResolvedValue({
    data: [
      {
        id: 10,
        fullName: "Juan Gómez",
        dniOrFileNumber: "98765432",
        phone: null,
        isActive: true,
      },
    ],
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  });
});

describe("TicketDetailDialog", () => {
  it("shows a loading placeholder while fetching", () => {
    renderDialog();

    expect(screen.getByText("Cargando detalle…")).toBeInTheDocument();
    expect(
      screen.queryByText("No se pudo cargar el detalle del ticket."),
    ).not.toBeInTheDocument();
  });

  it("renders the establishment fields once loaded", async () => {
    renderDialog();

    expect(await screen.findByText("Falla total")).toBeInTheDocument();
    expect(screen.getByText("Escuela N° 12")).toBeInTheDocument();
    expect(screen.getByText("Calle Falsa 123")).toBeInTheDocument();
    expect(screen.getByText("12.5")).toBeInTheDocument();
    expect(screen.getByText("Responsable: María López")).toBeInTheDocument();
    expect(mockFetchTicketDetail).toHaveBeenCalledWith("123");
  });

  it("shows an error message when the detail cannot be loaded", async () => {
    mockFetchTicketDetail.mockRejectedValue(new Error("network down"));
    renderDialog();

    expect(
      await screen.findByText("No se pudo cargar el detalle del ticket."),
    ).toBeInTheDocument();
  });

  it("updates the ticket status and toasts on success", async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    const [statusSelect] = screen.getAllByRole("combobox");
    await user.click(statusSelect);
    await user.click(await screen.findByRole("option", { name: "EN PROGRESO" }));

    await waitFor(() =>
      expect(mockUpdateTicketStatus).toHaveBeenCalledWith(
        "123",
        "EN PROGRESO",
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Estado actualizado");
  });

  it("assigns the ticket to an employee and toasts the name", async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    const [, assignSelect] = screen.getAllByRole("combobox");
    await user.click(assignSelect);
    await user.click(await screen.findByRole("option", { name: "Juan Gómez" }));

    await waitFor(() =>
      expect(mockAssignTicket).toHaveBeenCalledWith("123", 10),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Asignado a Juan Gómez",
    );
  });

  it("releases the ticket when clicking Liberar", async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    mockAssignTicket.mockResolvedValue({
      ticketId: "123",
      assignedEmployee: null,
    });

    await user.click(screen.getByRole("button", { name: "Liberar" }));

    await waitFor(() =>
      expect(mockAssignTicket).toHaveBeenCalledWith("123", null),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Ticket liberado");
  });

  it("shows the backend error when assignment fails", async () => {
    mockAssignTicket.mockRejectedValue({
      response: { data: { error: "Empleado inactivo" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    await user.click(screen.getByRole("button", { name: "Liberar" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Empleado inactivo"),
    );
  });
});

describe("TicketDetailDialog estados", () => {
  it("ofrece solo la transición actual y las válidas (ABIERTO)", async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    const [statusSelect] = screen.getAllByRole("combobox");
    await user.click(statusSelect);

    const options = await screen.findAllByRole("option");
    const names = options.map((o) => o.textContent);
    expect(names).toEqual(["ABIERTO", "EN PROGRESO"]);
  });

  it("oculta TERMINADO del Select para cualquier estado", async () => {
    mockFetchTicketDetail.mockResolvedValue({ ...ticketDetail, status: "EN PROGRESO" });
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    const [statusSelect] = screen.getAllByRole("combobox");
    await user.click(statusSelect);

    const names = (await screen.findAllByRole("option")).map((o) => o.textContent);
    expect(names).toEqual(["EN PROGRESO"]);
    expect(names).not.toContain("TERMINADO");
  });

  it("muestra el botón Finalizar ticket mientras el ticket no está TERMINADO", async () => {
    renderDialog();

    await screen.findByText("Falla total");
    expect(
      screen.getByRole("button", { name: /Finalizar ticket/ }),
    ).toBeInTheDocument();
  });

  it("no muestra el botón Finalizar ticket cuando el ticket está TERMINADO", async () => {
    mockFetchTicketDetail.mockResolvedValue({ ...ticketDetail, status: "TERMINADO" });
    renderDialog();

    await screen.findByText("Falla total");
    expect(
      screen.queryByRole("button", { name: /Finalizar ticket/ }),
    ).not.toBeInTheDocument();
  });

  it("abre el dialog de cierre desde el botón Finalizar ticket", async () => {
    const user = userEvent.setup();
    renderDialog();

    await screen.findByText("Falla total");
    await user.click(screen.getByRole("button", { name: /Finalizar ticket/ }));

    expect(
      await screen.findByText("Cerrar ticket 123"),
    ).toBeInTheDocument();
    expect(mockUpdateTicketStatus).not.toHaveBeenCalled();
  });

  it("muestra la sección de imágenes cuando el ticket tiene", async () => {
    mockFetchTicketDetail.mockResolvedValue({
      ...ticketDetail,
      images: [
        {
          id: 1,
          ticketId: "123",
          fileName: "cierre.png",
          mimeType: "image/png",
          sizeBytes: 100,
          createdAt: "2026-03-01T10:00:00Z",
        },
      ],
    });
    renderDialog();

    expect(await screen.findByText("Imágenes de cierre (1)")).toBeInTheDocument();
    expect(screen.getByAltText("cierre.png")).toHaveAttribute(
      "src",
      "http://test/uploads/tickets/cierre.png",
    );
  });

  it("no crashea si el backend no envía el campo images", async () => {
    // Backend viejo desplegado: el detalle llega sin `images`
    const { images: _omitted, ...withoutImages } = ticketDetail;
    mockFetchTicketDetail.mockResolvedValue(withoutImages);
    renderDialog();

    await screen.findByText("Falla total");
    expect(screen.queryByText(/Imágenes de cierre/)).not.toBeInTheDocument();
  });

  it("no muestra la sección de imágenes si no hay", async () => {
    renderDialog();

    await screen.findByText("Falla total");
    expect(screen.queryByText("Imágenes de cierre")).not.toBeInTheDocument();
  });
});
