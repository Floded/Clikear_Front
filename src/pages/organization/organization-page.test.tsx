import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { OrganizationPage } from "@/pages/organization/organization-page";
import { fetchEmployees, updateEmployee } from "@/features/organization/organization.api";
import type { Employee, Paginated } from "@/features/organization/organization.types";

vi.mock("@/features/organization/organization.api", () => ({
  fetchEmployees: vi.fn(),
  updateEmployee: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/organization/employee-form-dialog", () => ({
  EmployeeFormDialog: vi.fn(() => <div data-testid="employee-form-dialog" />),
}));

const mockFetchEmployees = vi.mocked(fetchEmployees);
const mockUpdateEmployee = vi.mocked(updateEmployee);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const employee: Employee = {
  id: 1,
  fullName: "Juan Pérez",
  dniOrFileNumber: "12345678",
  phone: "11-2233-4455",
  isActive: true,
  _count: { assignments: 0 },
};

function employeesPage(data: Employee[], total = data.length): Paginated<Employee> {
  return { data, page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) };
}

function renderOrganizationPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <OrganizationPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchEmployees.mockResolvedValue(employeesPage([employee]));
});

describe("OrganizationPage", () => {
  it("shows the page header and new employee button", () => {
    renderOrganizationPage();
    expect(screen.getByRole("heading", { name: /Organización/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo empleado" })).toBeInTheDocument();
  });

  it("shows loading skeletons while fetching", async () => {
    mockFetchEmployees.mockReturnValue(new Promise(() => {}));
    renderOrganizationPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the error state when fetching fails", async () => {
    mockFetchEmployees.mockRejectedValue(new Error("network down"));
    renderOrganizationPage();
    expect(await screen.findByText("No se pudieron cargar los empleados.")).toBeInTheDocument();
  });

  it("shows the empty state when no employees match", async () => {
    mockFetchEmployees.mockResolvedValue(employeesPage([]));
    renderOrganizationPage();
    expect(
      await screen.findByText("Sin empleados para los filtros actuales."),
    ).toBeInTheDocument();
  });

  it("renders the employees table", async () => {
    renderOrganizationPage();
    await screen.findByText("Juan Pérez");
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("11-2233-4455")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dar de baja" })).toBeInTheDocument();
  });

  it("toggles an employee to inactive and toasts success", async () => {
    const updated = { ...employee, isActive: false };
    mockUpdateEmployee.mockResolvedValue(updated);
    const user = userEvent.setup();
    renderOrganizationPage();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Dar de baja" }));
    await waitFor(() =>
      expect(mockUpdateEmployee).toHaveBeenCalledWith(1, { isActive: false }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Juan Pérez dado de baja");
  });

  it("shows the backend error when the toggle fails", async () => {
    mockUpdateEmployee.mockRejectedValue({ response: { data: { error: "No se puede" } } });
    const user = userEvent.setup();
    renderOrganizationPage();
    await screen.findByText("Juan Pérez");
    await user.click(screen.getByRole("button", { name: "Dar de baja" }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("No se puede"),
    );
  });

  it("opens the employee form dialog on Nuevo empleado", async () => {
    const user = userEvent.setup();
    renderOrganizationPage();
    await user.click(screen.getByRole("button", { name: "Nuevo empleado" }));
    expect(screen.getByTestId("employee-form-dialog")).toBeInTheDocument();
  });
});
