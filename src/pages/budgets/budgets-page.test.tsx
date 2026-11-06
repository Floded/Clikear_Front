import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { BudgetsPage } from "@/pages/budgets/budgets-page";
import { listBudgets, removeBudget } from "@/features/budgets/budget.api";
import type { Budget } from "@/features/budgets/budget.types";

vi.mock("@/features/budgets/budget.api", () => ({
  listBudgets: vi.fn(),
  removeBudget: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockListBudgets = vi.mocked(listBudgets);
const mockRemoveBudget = vi.mocked(removeBudget);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const budget: Budget = {
  id: 1,
  code: "P-0001",
  customerName: "Acme S.A.",
  establishmentCue: "1234",
  issueDate: "2026-01-01",
  status: "APPROVED",
  total: 5000,
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  lines: [],
};

function renderBudgetsPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <BudgetsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListBudgets.mockResolvedValue([budget]);
  vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("BudgetsPage", () => {
  it("shows the title and the new budget button", () => {
    renderBudgetsPage();
    expect(screen.getByRole("heading", { name: /Presupuestos/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo presupuesto" })).toBeInTheDocument();
  });

  it("shows skeletons while fetching", async () => {
    mockListBudgets.mockReturnValue(new Promise(() => {}));
    renderBudgetsPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the error state when fetching fails", async () => {
    mockListBudgets.mockRejectedValue(new Error("network down"));
    renderBudgetsPage();
    expect(await screen.findByText("No se pudieron cargar los presupuestos.")).toBeInTheDocument();
  });

  it("shows the empty state when there are no budgets", async () => {
    mockListBudgets.mockResolvedValue([]);
    renderBudgetsPage();
    expect(await screen.findByText("No hay presupuestos.")).toBeInTheDocument();
  });

  it("renders the budgets table", async () => {
    renderBudgetsPage();
    await screen.findByText("P-0001");
    expect(screen.getByText("Acme S.A.")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText("$5000.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver / PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar" })).toBeInTheDocument();
  });

  it("deletes a budget after confirmation and toasts success", async () => {
    mockRemoveBudget.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderBudgetsPage();
    await screen.findByText("P-0001");
    await user.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() =>
      expect(mockRemoveBudget).toHaveBeenCalledWith(1, expect.anything()),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Presupuesto eliminado");
  });

  it("does not delete when confirmation is rejected", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const user = userEvent.setup();
    renderBudgetsPage();
    await screen.findByText("P-0001");
    await user.click(screen.getByRole("button", { name: "Borrar" }));
    expect(mockRemoveBudget).not.toHaveBeenCalled();
  });

  it("shows the backend error when deletion fails", async () => {
    mockRemoveBudget.mockRejectedValue(new Error("down"));
    const user = userEvent.setup();
    renderBudgetsPage();
    await screen.findByText("P-0001");
    await user.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("No se pudo eliminar el presupuesto"),
    );
  });
});
