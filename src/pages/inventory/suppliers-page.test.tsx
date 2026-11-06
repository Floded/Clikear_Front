import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SuppliersPage } from "@/pages/inventory/suppliers-page";
import { fetchSuppliers } from "@/features/inventory/inventory.api";
import type { Supplier, Paginated } from "@/features/inventory/inventory.types";

vi.mock("@/features/inventory/inventory.api", () => ({
  fetchSuppliers: vi.fn(),
}));

const mockFetchSuppliers = vi.mocked(fetchSuppliers);

const supplier: Supplier = {
  id: 1,
  name: "Ferretería Central",
  contactPhone: "11-2233-4455",
  contactEmail: "ventas@ferrecentral.com",
  website: "https://ferrecentral.com",
  _count: { inventoryItems: 3 },
};

function suppliersPage(data: Supplier[], total = data.length): Paginated<Supplier> {
  return { data, page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) };
}

function renderSuppliersPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/inventory/suppliers"]}>
        <Routes>
          <Route path="/inventory/suppliers" element={<SuppliersPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchSuppliers.mockResolvedValue(suppliersPage([supplier]));
});

describe("SuppliersPage", () => {
  it("shows the page header with title and description", () => {
    renderSuppliersPage();
    expect(screen.getByRole("heading", { name: /Proveedores/ })).toBeInTheDocument();
    expect(screen.getByText(/Altas y datos de contacto/)).toBeInTheDocument();
  });

  it("shows skeletons while fetching", async () => {
    mockFetchSuppliers.mockReturnValue(new Promise(() => {}));
    renderSuppliersPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the error state when fetching fails", async () => {
    mockFetchSuppliers.mockRejectedValue(new Error("network down"));
    renderSuppliersPage();
    expect(await screen.findByText("No se pudieron cargar los proveedores.")).toBeInTheDocument();
  });

  it("shows the empty state when no suppliers match", async () => {
    mockFetchSuppliers.mockResolvedValue(suppliersPage([]));
    renderSuppliersPage();
    expect(await screen.findByText("Sin proveedores para los filtros actuales.")).toBeInTheDocument();
  });

  it("renders the suppliers table", async () => {
    renderSuppliersPage();
    await screen.findByText("Ferretería Central");
    expect(screen.getByText("11-2233-4455")).toBeInTheDocument();
    expect(screen.getByText("ventas@ferrecentral.com")).toBeInTheDocument();
    expect(screen.getByText("https://ferrecentral.com")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("filters suppliers by search", async () => {
    const user = userEvent.setup();
    renderSuppliersPage();
    await screen.findByText("Ferretería Central");
    await user.type(screen.getByPlaceholderText("Buscar por nombre o email…"), "Otra");
    await waitFor(() =>
      expect(mockFetchSuppliers).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Otra", page: 1, limit: 20 }),
      ),
    );
  });

  it("paginates to the next page", async () => {
    const user = userEvent.setup();
    mockFetchSuppliers.mockResolvedValue(suppliersPage([supplier], 40));
    renderSuppliersPage();
    await screen.findByText("Ferretería Central");
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(mockFetchSuppliers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20 }),
      ),
    );
  });

  it("has a new supplier button", () => {
    renderSuppliersPage();
    expect(screen.getByRole("button", { name: "Nuevo proveedor" })).toBeInTheDocument();
  });
});
