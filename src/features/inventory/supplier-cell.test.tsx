import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SupplierCell } from "@/features/inventory/supplier-cell";
import { fetchSupplier } from "@/features/inventory/inventory.api";
import type { Supplier } from "@/features/inventory/inventory.types";

vi.mock("@/features/inventory/inventory.api", () => ({
  fetchSupplier: vi.fn(),
}));

const mockFetchSupplier = vi.mocked(fetchSupplier);

const supplier: Supplier = {
  id: 7,
  name: "Ferretería Central",
  contactPhone: "11-2233-4455",
  contactEmail: "ventas@ferrecentral.com",
  website: "https://ferrecentral.com",
  _count: { inventoryItems: 3 },
};

function renderSupplierCell(supplierParam: { id: number; name: string } | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SupplierCell supplier={supplierParam} />
    </QueryClientProvider>,
  );
}

const OPEN_DELAY_MS = 250;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SupplierCell", () => {
  it("renders a dash when there is no supplier", () => {
    renderSupplierCell(null);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the supplier name as a clickable trigger", () => {
    renderSupplierCell(supplier);
    const trigger = screen.getByText("Ferretería Central");
    expect(trigger).toHaveClass("cursor-help");
    expect(trigger).toHaveAttribute("tabindex", "0");
  });

  it("opens the supplier card on click after the open delay", async () => {
    mockFetchSupplier.mockResolvedValue(supplier);
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    expect(
      await screen.findByRole("dialog", {
        name: /Datos del proveedor Ferretería Central/,
      }),
    ).toBeInTheDocument();
  });

  it("shows skeletons while fetching supplier data", async () => {
    mockFetchSupplier.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders contact data once loaded", async () => {
    mockFetchSupplier.mockResolvedValue(supplier);
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    await waitFor(() => expect(screen.getByText("11-2233-4455")).toBeInTheDocument());
    expect(screen.getByText("ventas@ferrecentral.com")).toBeInTheDocument();
    expect(screen.getByText("https://ferrecentral.com")).toBeInTheDocument();
  });

  it("shows 'Sin datos' when a contact field is missing", async () => {
    mockFetchSupplier.mockResolvedValue({
      ...supplier,
      contactPhone: null,
      contactEmail: null,
      website: null,
    });
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    await waitFor(() => expect(screen.getAllByText("Sin datos")).toHaveLength(2));
  });

  it("shows an error when the fetch fails", async () => {
    mockFetchSupplier.mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    await waitFor(() =>
      expect(
        screen.getByText("No se pudieron cargar los datos del proveedor."),
      ).toBeInTheDocument(),
    );
  });

  it("closes the card on Escape", async () => {
    mockFetchSupplier.mockResolvedValue(supplier);
    const user = userEvent.setup();
    renderSupplierCell(supplier);
    await user.click(screen.getByText("Ferretería Central"));
    await new Promise((r) => setTimeout(r, OPEN_DELAY_MS + 50));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
