import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { AssignMaterialDialog } from "@/features/inventory/assign-material-dialog";
import {
  createAssignment,
  fetchInventoryItems,
} from "@/features/inventory/inventory.api";
import { fetchEmployees } from "@/features/organization/organization.api";

vi.mock("@/features/inventory/inventory.api", () => ({
  createAssignment: vi.fn(),
  fetchInventoryItems: vi.fn(),
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

const mockCreateAssignment = vi.mocked(createAssignment);
const mockFetchItems = vi.mocked(fetchInventoryItems);
const mockFetchEmployees = vi.mocked(fetchEmployees);
const mockToastSuccess = vi.mocked(toast.success);

type User = ReturnType<typeof userEvent.setup>;

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AssignMaterialDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

function submitForm() {
  const form = screen.getByRole("button", { name: "Asignar" }).closest("form");
  fireEvent.submit(form!);
}

// Selecciona ítem y empleado en los dos Select de Radix
async function selectItemAndEmployee(user: User) {
  const [itemSelect, employeeSelect] = screen.getAllByRole("combobox");
  await user.click(itemSelect);
  await user.click(await screen.findByRole("option", { name: "Cable UTP (disp. 10)" }));
  await user.click(employeeSelect);
  await user.click(await screen.findByRole("option", { name: "María López" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateAssignment.mockResolvedValue({} as never);
  mockFetchItems.mockResolvedValue({
    data: [
      {
        id: 1,
        name: "Cable UTP",
        description: null,
        supplierId: null,
        availableQuantity: 10,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        supplier: null,
      },
    ],
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  });
  mockFetchEmployees.mockResolvedValue({
    data: [
      {
        id: 10,
        fullName: "María López",
        dniOrFileNumber: "30111222",
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

describe("AssignMaterialDialog", () => {
  it("requires an item and an employee", async () => {
    renderDialog();

    submitForm();

    expect(await screen.findByText("Seleccioná un ítem")).toBeInTheDocument();
    expect(await screen.findByText("Seleccioná un empleado")).toBeInTheDocument();
    expect(mockCreateAssignment).not.toHaveBeenCalled();
  });

  it("rejects a quantity of zero", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText("Cantidad"), {
      target: { value: "0" },
    });
    submitForm();

    expect(await screen.findByText("Cantidad > 0")).toBeInTheDocument();
    expect(mockCreateAssignment).not.toHaveBeenCalled();
  });

  it("assigns the material and closes the dialog", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await selectItemAndEmployee(user);
    submitForm();

    await waitFor(() =>
      expect(mockCreateAssignment).toHaveBeenCalledWith({
        inventoryItemId: 1,
        employeeId: 10,
        quantityAssigned: 1,
        deliveryDate: expect.any(String),
        notes: undefined,
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Material asignado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend error when the assignment is rejected", async () => {
    mockCreateAssignment.mockRejectedValue({
      response: { data: { error: "Stock insuficiente" } },
    });
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await selectItemAndEmployee(user);
    submitForm();

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Stock insuficiente"),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
