import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { StockTab } from "@/features/inventory/stock-tab";
import {
  adjustStock,
  fetchInventoryItems,
} from "@/features/inventory/inventory.api";
import type {
  InventoryItem,
  Paginated,
} from "@/features/inventory/inventory.types";

vi.mock("@/features/inventory/inventory.api", () => ({
  adjustStock: vi.fn(),
  fetchInventoryItems: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFetchInventoryItems = vi.mocked(fetchInventoryItems);
const mockAdjustStock = vi.mocked(adjustStock);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

function item(overrides: Partial<InventoryItem>): InventoryItem {
  return {
    id: 1,
    name: "Cable HDMI 2m",
    description: null,
    supplierId: null,
    availableQuantity: 10,
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
    supplier: null,
    ...overrides,
  };
}

function page(data: InventoryItem[], total = data.length): Paginated<InventoryItem> {
  return { data, page: 1, limit: 20, total, totalPages: 1 };
}

function renderStockTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <StockTab />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAdjustStock.mockResolvedValue(item({}));
  mockFetchInventoryItems.mockResolvedValue(page([item({})]));
});

describe("StockTab", () => {
  it("shows a loading placeholder while fetching", () => {
    mockFetchInventoryItems.mockReturnValue(new Promise(() => {}));
    renderStockTab();

    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(
      screen.queryByText("No se pudieron cargar los ítems."),
    ).not.toBeInTheDocument();
  });

  it("renders the items with their stock badge", async () => {
    mockFetchInventoryItems.mockResolvedValue(
      page([
        item({ id: 1, name: "Teclado mecanizado", availableQuantity: 0 }),
        item({ id: 2, name: "Mouse inalámbrico", availableQuantity: 2 }),
        item({ id: 3, name: "Monitor 24\"", availableQuantity: 10 }),
      ]),
    );
    renderStockTab();

    expect(await screen.findByText("Sin stock")).toBeInTheDocument();
    expect(screen.getByText("Bajo (2)")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(mockFetchInventoryItems).toHaveBeenCalledWith({
      search: undefined,
      hasStock: undefined,
      page: 1,
      limit: 20,
    });
  });

  it("shows the empty state when no items match", async () => {
    mockFetchInventoryItems.mockResolvedValue(page([]));
    renderStockTab();

    expect(
      await screen.findByText("Sin ítems para los filtros actuales."),
    ).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    mockFetchInventoryItems.mockRejectedValue(new Error("network down"));
    renderStockTab();

    expect(
      await screen.findByText("No se pudieron cargar los ítems."),
    ).toBeInTheDocument();
  });

  it("filters by stock from the select", async () => {
    const user = userEvent.setup();
    renderStockTab();

    await screen.findByText("Cable HDMI 2m");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Sin stock" }));

    await waitFor(() =>
      expect(mockFetchInventoryItems).toHaveBeenCalledWith(
        expect.objectContaining({ hasStock: "false", page: 1 }),
      ),
    );
  });

  it("rejects a zero or non-integer adjustment", async () => {
    const user = userEvent.setup();
    renderStockTab();

    await screen.findByText("Cable HDMI 2m");
    await user.click(screen.getByRole("button", { name: "Ajustar stock" }));
    expect(
      screen.getByText("Ajustar stock — Cable HDMI 2m"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Cantidad"), "0");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mockToastError).toHaveBeenCalledWith(
      "La cantidad debe ser un entero distinto de cero",
    );
    expect(mockAdjustStock).not.toHaveBeenCalled();
  });

  it("adjusts the stock with a signed delta and toasts", async () => {
    const user = userEvent.setup();
    renderStockTab();

    await screen.findByText("Cable HDMI 2m");
    await user.click(screen.getByRole("button", { name: "Ajustar stock" }));

    await user.type(screen.getByLabelText("Cantidad"), "-3");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mockAdjustStock).toHaveBeenCalledWith(1, -3),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Stock ajustado");
    expect(
      screen.queryByText("Ajustar stock — Cable HDMI 2m"),
    ).not.toBeInTheDocument();
  });

  it("shows the backend error when the adjustment fails", async () => {
    mockAdjustStock.mockRejectedValue({
      response: { data: { error: "Cantidad inválida" } },
    });
    const user = userEvent.setup();
    renderStockTab();

    await screen.findByText("Cable HDMI 2m");
    await user.click(screen.getByRole("button", { name: "Ajustar stock" }));
    await user.type(screen.getByLabelText("Cantidad"), "5");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Cantidad inválida"),
    );
  });
});
