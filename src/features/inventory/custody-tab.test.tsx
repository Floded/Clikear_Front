import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { toast } from "sonner";
import { CustodyTab } from "@/features/inventory/custody-tab";
import { fetchCustody, returnAssignment, exportAssignmentsExcel } from "@/features/inventory/inventory.api";
import { fetchEmployees } from "@/features/organization/organization.api";
import type { Employee } from "@/features/organization/organization.types";
import type { Assignment } from "@/features/inventory/inventory.types";

vi.mock("@/features/inventory/inventory.api", () => ({
  fetchCustody: vi.fn(),
  returnAssignment: vi.fn(),
  exportAssignmentsExcel: vi.fn(),
}));

vi.mock("@/features/organization/organization.api", () => ({
  fetchEmployees: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockFetchEmployees = vi.mocked(fetchEmployees);
const mockFetchCustody = vi.mocked(fetchCustody);
const mockReturnAssignment = vi.mocked(returnAssignment);
const mockExportAssignmentsExcel = vi.mocked(exportAssignmentsExcel);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const employee: Employee = {
  id: 1,
  fullName: "Juan Pérez",
  dniOrFileNumber: "12345678",
  phone: null,
  isActive: true,
  _count: { assignments: 2 },
};

const assignment: Assignment = {
  id: 10,
  inventoryItemId: 1,
  employeeId: 1,
  quantityAssigned: 2,
  deliveryDate: "2026-01-10",
  returnDate: null,
  notes: null,
  createdAt: "2026-01-10T10:00:00Z",
  inventoryItem: { id: 1, name: "Taladro", description: null },
};

function employeesPage(data: Employee[], total = data.length) {
  return { data, page: 1, limit: 20, total, totalPages: 1 };
}

function custodyData(data: Assignment[], units = data.length) {
  return {
    employee: { id: 1, fullName: "Juan Pérez", isActive: true },
    unitsInCustody: units,
    data,
  };
}

function renderCustodyTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CustodyTab />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchEmployees.mockResolvedValue(employeesPage([employee]));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CustodyTab", () => {
  it("shows the search input and the filter select", () => {
    renderCustodyTab();
    expect(screen.getByPlaceholderText("Buscar empleado…")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows a loading placeholder while fetching employees", async () => {
    mockFetchEmployees.mockReturnValue(new Promise(() => {}));
    renderCustodyTab();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders the employees table with their data", async () => {
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("2 activas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver custodia" })).toBeInTheDocument();
  });

  it("shows the empty state when no employees match", async () => {
    mockFetchEmployees.mockResolvedValue(employeesPage([]));
    renderCustodyTab();
    expect(await screen.findByText("Sin empleados para los filtros actuales.")).toBeInTheDocument();
  });

  it("shows the error state when fetching employees fails", async () => {
    mockFetchEmployees.mockRejectedValue(new Error("network down"));
    renderCustodyTab();
    expect(await screen.findByText("No se pudieron cargar los empleados.")).toBeInTheDocument();
  });

  it("opens the custody dialog when clicking Ver custodia", async () => {
    mockFetchCustody.mockResolvedValue(custodyData([assignment]));
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    expect(await screen.findByText("Custodia — Juan Pérez")).toBeInTheDocument();
    expect(await screen.findByText("Unidades en custodia:")).toBeInTheDocument();
    expect(screen.getByText("Taladro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Devolver" })).toBeInTheDocument();
  });

  it("shows a loading skeleton while fetching custody", async () => {
    mockFetchCustody.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows an error state when fetching custody fails", async () => {
    mockFetchCustody.mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    expect(
      await screen.findByText("No se pudo cargar la custodia."),
    ).toBeInTheDocument();
  });

  it("opens the return dialog when clicking Devolver", async () => {
    mockFetchCustody.mockResolvedValue(custodyData([assignment]));
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    await screen.findByText("Taladro");
    await user.click(screen.getByRole("button", { name: "Devolver" }));
    expect(await screen.findByText("Devolver material")).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad a devolver")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de devolución")).toBeInTheDocument();
    expect(screen.getByLabelText("Notas")).toBeInTheDocument();
  });

  it("rejects a non-positive integer quantity and toasts an error", async () => {
    mockFetchCustody.mockResolvedValue(custodyData([assignment]));
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    await screen.findByText("Taladro");
    await user.click(screen.getByRole("button", { name: "Devolver" }));
    await user.clear(screen.getByLabelText("Cantidad a devolver"));
    await user.type(screen.getByLabelText("Cantidad a devolver"), "0");
    await user.click(screen.getByRole("button", { name: "Confirmar devolución" }));
    expect(mockToastError).toHaveBeenCalledWith("La cantidad debe ser un entero positivo");
    expect(mockReturnAssignment).not.toHaveBeenCalled();
  });

  it("registers the return and toasts success", async () => {
    mockFetchCustody.mockResolvedValue(custodyData([assignment]));
    mockReturnAssignment.mockResolvedValue(assignment);
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    await screen.findByText("Taladro");
    await user.click(screen.getByRole("button", { name: "Devolver" }));
    await user.click(screen.getByRole("button", { name: "Confirmar devolución" }));
    await waitFor(() =>
      expect(mockReturnAssignment).toHaveBeenCalledWith(10, expect.objectContaining({ quantity: 2 })),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Devolución registrada");
  });

  it("shows the backend error when the return fails", async () => {
    mockFetchCustody.mockResolvedValue(custodyData([assignment]));
    mockReturnAssignment.mockRejectedValue({ response: { data: { error: "Sin stock disponible" } } });
    const user = userEvent.setup();
    renderCustodyTab();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Ver custodia" }));
    await screen.findByText("Taladro");
    await user.click(screen.getByRole("button", { name: "Devolver" }));
    await user.click(screen.getByRole("button", { name: "Confirmar devolución" }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Sin stock disponible"),
    );
  });

  it("exporta el Excel de asignaciones al hacer clic", async () => {
    mockExportAssignmentsExcel.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCustodyTab();

    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.click(await screen.findByRole("button", { name: "Exportar" }));

    await waitFor(() =>
      expect(mockExportAssignmentsExcel).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Excel descargado");
  });

  it("exporta con el rango de fechas elegido en el modal", async () => {
    mockExportAssignmentsExcel.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCustodyTab();

    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.type(await screen.findByLabelText("Desde"), "2026-06-01");
    await user.type(screen.getByLabelText("Hasta"), "2026-06-30");
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    await waitFor(() => {
      const [range] = mockExportAssignmentsExcel.mock.calls[0];
      expect(new Date(range?.from as string).getTime()).toBe(
        new Date("2026-06-01T00:00:00").getTime(),
      );
      expect(new Date(range?.to as string).getTime()).toBe(
        new Date("2026-06-30T23:59:59.999").getTime(),
      );
    });
  });

  it("avisa con toast de error si la exportación falla", async () => {
    mockExportAssignmentsExcel.mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderCustodyTab();

    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));
    await user.click(await screen.findByRole("button", { name: "Exportar" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("No se pudo exportar"),
    );
  });
});
