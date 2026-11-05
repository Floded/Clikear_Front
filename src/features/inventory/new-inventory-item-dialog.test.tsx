import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { NewInventoryItemDialog } from "@/features/inventory/new-inventory-item-dialog";
import { createInventoryItem, fetchSuppliers } from "@/features/inventory/inventory.api";
import type {
  InventoryItem,
  Paginated,
  Supplier,
} from "@/features/inventory/inventory.types";

vi.mock("@/features/inventory/inventory.api", () => ({
  createInventoryItem: vi.fn(),
  fetchSuppliers: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateInventoryItem = vi.mocked(createInventoryItem);
const mockFetchSuppliers = vi.mocked(fetchSuppliers);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const newItem: InventoryItem = {
  id: 10,
  name: "Cable HDMI 2m",
  description: null,
  supplierId: null,
  availableQuantity: 0,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  supplier: null,
};

const suppliers: Paginated<Supplier> = {
  data: [
    {
      id: 5,
      name: "Distribuidora Sur",
      contactPhone: null,
      contactEmail: null,
      website: null,
    },
  ],
  page: 1,
  limit: 100,
  total: 1,
  totalPages: 1,
};

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <NewInventoryItemDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

// jsdom puede bloquear el submit nativo; se dispara el evento directo para
// ejercitar la validación Zod del formulario
function submitForm() {
  const form = screen
    .getByRole("button", { name: "Crear ítem" })
    .closest("form");
  fireEvent.submit(form!);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateInventoryItem.mockResolvedValue(newItem);
  mockFetchSuppliers.mockResolvedValue(suppliers);
});

describe("NewInventoryItemDialog", () => {
  it("requires a name and blocks submission", async () => {
    renderDialog();

    submitForm();

    expect(
      await screen.findByText("El nombre es obligatorio"),
    ).toBeInTheDocument();
    expect(mockCreateInventoryItem).not.toHaveBeenCalled();
  });

  it("creates an item with default values and closes", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(screen.getByPlaceholderText("Ej: Cable HDMI 2m"), "Cable HDMI 2m");
    submitForm();

    await waitFor(() =>
      expect(mockCreateInventoryItem).toHaveBeenCalledWith({
        name: "Cable HDMI 2m",
        description: undefined,
        supplierId: undefined,
        availableQuantity: 0,
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Ítem "Cable HDMI 2m" creado',
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("loads suppliers when the dialog opens", async () => {
    renderDialog();

    expect(mockFetchSuppliers).toHaveBeenCalledWith({ limit: 100 });
  });

  it("shows the backend error when creation fails", async () => {
    mockCreateInventoryItem.mockRejectedValue({
      response: { data: { error: "El ítem ya existe" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("Ej: Cable HDMI 2m"), "Duplicado");
    submitForm();

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("El ítem ya existe"),
    );
  });
});
