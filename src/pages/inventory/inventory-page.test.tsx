import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InventoryPage } from "@/pages/inventory/inventory-page";

vi.mock("@/features/inventory/stock-tab", () => ({
  StockTab: vi.fn(() => <div data-testid="stock-tab">Stock en depósito</div>),
}));
vi.mock("@/features/inventory/custody-tab", () => ({
  CustodyTab: vi.fn(() => <div data-testid="custody-tab">Custodia por empleado</div>),
}));

function renderInventoryPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/inventory"]}>
        <Routes>
          <Route path="/inventory" element={<InventoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InventoryPage", () => {
  it("shows the title", () => {
    renderInventoryPage();
    expect(screen.getByRole("heading", { name: /Inventario/ })).toBeInTheDocument();
  });

  it("renders the stock tab by default", () => {
    renderInventoryPage();
    expect(screen.getByTestId("stock-tab")).toBeInTheDocument();
  });

  it("has tabs for stock and custody", () => {
    renderInventoryPage();
    expect(screen.getByRole("tab", { name: "Stock en depósito" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Custodia por empleado" })).toBeInTheDocument();
  });

  it("switches to the custody tab when clicked", async () => {
    const user = userEvent.setup();
    renderInventoryPage();
    await user.click(screen.getByRole("tab", { name: "Custodia por empleado" }));
    expect(screen.getByTestId("custody-tab")).toBeInTheDocument();
  });

  it("has a link to suppliers", () => {
    renderInventoryPage();
    expect(screen.getByRole("link", { name: /Proveedores/ })).toBeInTheDocument();
  });

  it("has buttons for new item and assign material", () => {
    renderInventoryPage();
    expect(screen.getByRole("button", { name: "Nuevo ítem" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asignar material" })).toBeInTheDocument();
  });

  it("renders the new inventory item and assign material dialogs", async () => {
    const user = userEvent.setup();
    renderInventoryPage();
    await user.click(screen.getByRole("button", { name: "Nuevo ítem" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });
});
