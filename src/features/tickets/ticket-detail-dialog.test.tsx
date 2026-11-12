import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { fetchEmployees } from "@/features/organization/organization.api";
import { TicketDetailDialog } from "@/features/tickets/ticket-detail-dialog";
import {
  assignTicket,
  fetchTicketDetail,
  updateTicketStatus,
} from "@/features/tickets/tickets.api";
import type { TicketDetail } from "@/features/tickets/tickets.types";

vi.mock("@/features/tickets/tickets.api", () => ({
  fetchTicketDetail: vi.fn(),
  updateTicketStatus: vi.fn(),
  assignTicket: vi.fn(),
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
