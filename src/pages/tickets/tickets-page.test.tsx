import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketsPage } from "@/pages/tickets/tickets-page";
import {
  exportTicketsExcel,
  fetchTickets,
  fetchTechnicians,
} from "@/features/tickets/tickets.api";
import { fetchEmployees } from "@/features/organization/organization.api";
import { useSession } from "@/features/auth/use-session";
import { toast } from "sonner";
import type { TicketListItem, Paginated, Technician } from "@/features/tickets/tickets.types";
import type { Employee } from "@/features/organization/organization.types";

vi.mock("@/features/tickets/tickets.api", () => ({
  fetchTickets: vi.fn(),
  fetchTechnicians: vi.fn(),
  exportTicketsExcel: vi.fn(),
}));

vi.mock("@/features/organization/organization.api", () => ({
  fetchEmployees: vi.fn(),
}));

vi.mock("@/features/auth/use-session", () => ({
  useSession: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/features/tickets/ticket-filters", () => ({
  TicketFilters: vi.fn(() => <div data-testid="ticket-filters" />),
}));
vi.mock("@/features/tickets/ticket-detail-dialog", () => ({
  TicketDetailDialog: vi.fn(() => <div data-testid="ticket-detail-dialog" />),
}));
vi.mock("@/features/tickets/new-ticket-dialog", () => ({
  NewTicketDialog: vi.fn(() => <div data-testid="new-ticket-dialog" />),
}));

const mockFetchTickets = vi.mocked(fetchTickets);
const mockFetchTechnicians = vi.mocked(fetchTechnicians);
const mockFetchEmployees = vi.mocked(fetchEmployees);
const mockExportTicketsExcel = vi.mocked(exportTicketsExcel);
const mockUseSession = vi.mocked(useSession);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const ticket: TicketListItem = {
  ticketId: "T-001",
  title: "No enciende la PC",
  status: "ABIERTO",
  glpiClosedTicket: null,
  openingTimestamp: "2026-10-01T10:00:00Z",
  assignedEmployee: null,
  establishment: {
    cue: "1234",
    name: "Escuela Central",
    department: null,
    locality: null,
    isSecondaryBuilding: false,
  },
};

function ticketsPage(data: TicketListItem[], total = data.length): Paginated<TicketListItem> {
  return { data, page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) };
}

function emptyPaginated<T>(): Paginated<T> {
  return { data: [], page: 1, limit: 100, total: 0, totalPages: 1 };
}

function renderTicketsPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TicketsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReturnValue({
    data: {
      id: 1,
      username: "admin",
      name: "Admin",
      role: "ADMIN",
      permissions: [],
    },
  } as unknown as ReturnType<typeof useSession>);
  mockFetchTickets.mockResolvedValue(ticketsPage([ticket]));
  mockFetchTechnicians.mockResolvedValue(emptyPaginated<Technician>());
  mockFetchEmployees.mockResolvedValue(emptyPaginated<Employee>());
  mockExportTicketsExcel.mockResolvedValue(undefined);
});

describe("TicketsPage", () => {
  it("shows the title and new ticket button", () => {
    renderTicketsPage();
    expect(screen.getByRole("heading", { name: /Tickets/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo ticket" })).toBeInTheDocument();
  });

  it("shows loading skeletons while fetching", async () => {
    mockFetchTickets.mockReturnValue(new Promise(() => {}));
    renderTicketsPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the error state when fetching fails", async () => {
    mockFetchTickets.mockRejectedValue(new Error("down"));
    renderTicketsPage();
    expect(
      await screen.findByText("No se pudieron cargar los tickets. Reintentá."),
    ).toBeInTheDocument();
  });

  it("shows the empty state when no tickets match", async () => {
    mockFetchTickets.mockResolvedValue(ticketsPage([]));
    renderTicketsPage();    expect(
      await screen.findByText("Sin resultados para los filtros actuales."),
    ).toBeInTheDocument();
  });

  it("renders tickets grouped by establishment", async () => {
    renderTicketsPage();
    await screen.findByText("Escuela Central");
    expect(screen.getByText("T-001")).toBeInTheDocument();
    expect(screen.getByText("No enciende la PC")).toBeInTheDocument();
    expect(screen.getByText("ABIERTO")).toBeInTheDocument();
  });

  it("opens the detail dialog when clicking a ticket", async () => {
    renderTicketsPage();
    await screen.findByText("T-001");
    fireEvent.click(screen.getByText("T-001").closest("tr")!);
    expect(screen.getByTestId("ticket-detail-dialog")).toBeInTheDocument();
  });

  it("paginates to the next page", async () => {
    const user = userEvent.setup();
    mockFetchTickets.mockResolvedValue(ticketsPage([ticket], 40));
    renderTicketsPage();
    await screen.findByText("Escuela Central");
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(mockFetchTickets).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20 }),
      ),
    );
  });

  it("opens the new ticket dialog", async () => {
    const user = userEvent.setup();
    renderTicketsPage();
    await user.click(screen.getByRole("button", { name: "Nuevo ticket" }));
    expect(screen.getByTestId("new-ticket-dialog")).toBeInTheDocument();
  });

  it("exporta el Excel al hacer clic y avisa con un toast", async () => {
    const user = userEvent.setup();
    renderTicketsPage();

    await screen.findByText("T-001");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.click(await screen.findByRole("button", { name: "Exportar" }));

    await waitFor(() =>
      expect(mockExportTicketsExcel).toHaveBeenCalledWith(
        {
          status: undefined,
          establishment: undefined,
          technicianId: undefined,
          employeeId: undefined,
          search: undefined,
        },
        { from: undefined, to: undefined },
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Excel descargado");
  });

  it("exporta con el rango de fechas elegido en el modal", async () => {
    const user = userEvent.setup();
    renderTicketsPage();

    await screen.findByText("T-001");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.type(await screen.findByLabelText("Desde"), "2026-06-01");
    await user.type(screen.getByLabelText("Hasta"), "2026-06-30");
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    await waitFor(() => {
      const [, range] = mockExportTicketsExcel.mock.calls[0];
      expect(new Date(range?.from as string).getTime()).toBe(
        new Date("2026-06-01T00:00:00").getTime(),
      );
      expect(new Date(range?.to as string).getTime()).toBe(
        new Date("2026-06-30T23:59:59.999").getTime(),
      );
    });
  });

  it("avisa con toast de error si la exportación falla", async () => {
    mockExportTicketsExcel.mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderTicketsPage();

    await screen.findByText("T-001");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.click(await screen.findByRole("button", { name: "Exportar" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("No se pudo exportar"),
    );
  });
});
