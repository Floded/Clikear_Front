import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { EmployeeFormDialog } from "@/features/organization/employee-form-dialog";
import { createEmployee, updateEmployee } from "@/features/organization/organization.api";
import type { Employee } from "@/features/organization/organization.types";

vi.mock("@/features/organization/organization.api", () => ({
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateEmployee = vi.mocked(createEmployee);
const mockUpdateEmployee = vi.mocked(updateEmployee);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const existingEmployee: Employee = {
  id: 3,
  fullName: "Ana Pérez",
  dniOrFileNumber: "30111222",
  phone: "221-555-0000",
  isActive: true,
};

function renderDialog(
  employee?: Employee | null,
  onOpenChange = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <EmployeeFormDialog open onOpenChange={onOpenChange} employee={employee} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateEmployee.mockResolvedValue(existingEmployee);
  mockUpdateEmployee.mockResolvedValue(existingEmployee);
});

describe("EmployeeFormDialog", () => {
  it("requires full name and file number", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Crear empleado" }));

    expect(mockToastError).toHaveBeenCalledWith(
      "Nombre y DNI/legajo son obligatorios",
    );
    expect(mockCreateEmployee).not.toHaveBeenCalled();
  });

  it("creates an employee without a phone when it is blank", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByLabelText("Nombre completo"), "Juan Gómez");
    await user.type(screen.getByLabelText("DNI / número de legajo"), "25888999");
    await user.click(screen.getByRole("button", { name: "Crear empleado" }));

    await waitFor(() =>
      expect(mockCreateEmployee).toHaveBeenCalledWith({
        fullName: "Juan Gómez",
        dniOrFileNumber: "25888999",
        phone: undefined,
        isActive: true,
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Empleado creado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("sends isActive=false when the active checkbox is unchecked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Nombre completo"), "Juan Gómez");
    await user.type(screen.getByLabelText("DNI / número de legajo"), "25888999");
    await user.click(screen.getByLabelText("Activo"));
    await user.click(screen.getByRole("button", { name: "Crear empleado" }));

    await waitFor(() =>
      expect(mockCreateEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      ),
    );
  });

  it("preloads the employee to edit and calls updateEmployee", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(existingEmployee);

    expect(screen.getByText("Editar empleado")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Ana Pérez");
    expect(screen.getByLabelText("Teléfono (opcional)")).toHaveValue(
      "221-555-0000",
    );

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(mockUpdateEmployee).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          fullName: "Ana Pérez",
          dniOrFileNumber: "30111222",
          phone: "221-555-0000",
          isActive: true,
        }),
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Empleado actualizado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend error when creation fails", async () => {
    mockCreateEmployee.mockRejectedValue({
      response: { data: { error: "DNI ya registrado" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Nombre completo"), "Juan Gómez");
    await user.type(screen.getByLabelText("DNI / número de legajo"), "25888999");
    await user.click(screen.getByRole("button", { name: "Crear empleado" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("DNI ya registrado"),
    );
  });
});
