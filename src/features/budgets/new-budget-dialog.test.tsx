import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { NewBudgetDialog } from "@/features/budgets/new-budget-dialog";
import { createBudget, updateBudget } from "@/features/budgets/budget.api";
import type { Budget } from "@/features/budgets/budget.types";

vi.mock("@/features/budgets/budget.api", () => ({
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateBudget = vi.mocked(createBudget);
const mockUpdateBudget = vi.mocked(updateBudget);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

const existingBudget: Budget = {
  id: 7,
  code: "PPT-0007",
  customerName: "Escuela 25 de Mayo",
  establishmentCue: "700083300",
  issueDate: "2026-03-01",
  validUntil: "2026-12-31",
  status: "DRAFT",
  notes: "Insumos generales",
  total: 1500,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  lines: [
    {
      id: 1,
      description: "Cable HDMI",
      quantity: 2,
      unitPrice: 750,
      subtotal: 1500,
    },
  ],
};

function renderDialog(
  budget?: Budget | null,
  onOpenChange = vi.fn(),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <NewBudgetDialog open onOpenChange={onOpenChange} budget={budget} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

function field(placeholder: string): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`,
  );
  if (!el) throw new Error(`input[placeholder="${placeholder}"] not found`);
  return el;
}

function submitForm() {
  const form = screen
    .getByRole("button", { name: /Crear presupuesto|Guardar cambios/ })
    .closest("form");
  fireEvent.submit(form!);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateBudget.mockResolvedValue(existingBudget);
  mockUpdateBudget.mockResolvedValue(existingBudget);
});

describe("NewBudgetDialog", () => {
  it("shows an error when the customer name is empty", async () => {
    renderDialog();

    submitForm();

    expect(mockToastError).toHaveBeenCalledWith(
      "Ingresá el nombre del cliente",
    );
    expect(mockCreateBudget).not.toHaveBeenCalled();
  });

  it("shows an error when a line has no description", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(field("Ej: Escuela 25 de Mayo"), "Cliente");
    submitForm();

    expect(mockToastError).toHaveBeenCalledWith(
      "Cada línea necesita descripción, cantidad ≥ 1 y precio > 0",
    );
    expect(mockCreateBudget).not.toHaveBeenCalled();
  });

  it("creates a budget with trimmed values and empty optionals as undefined", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(field("Ej: Escuela 25 de Mayo"), "  Cliente SA  ");
    await user.type(field("Descripción del item"), "Teclado");
    submitForm();

    await waitFor(() =>
      expect(mockCreateBudget).toHaveBeenCalledWith({
        customerName: "Cliente SA",
        establishmentCue: undefined,
        validUntil: undefined,
        notes: undefined,
        lines: [
          {
            inventoryItemId: undefined,
            description: "Teclado",
            quantity: 1,
            unitPrice: 500,
          },
        ],
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Presupuesto creado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("adds and removes budget lines", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Añadir línea" }));
    expect(screen.getByText("Línea 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar línea 2" }));
    expect(screen.queryByText("Línea 2")).not.toBeInTheDocument();
  });

  it("preloads the budget to edit and calls updateBudget", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(existingBudget);

    expect(screen.getByText("Editar presupuesto")).toBeInTheDocument();
    expect(field("Ej: Escuela 25 de Mayo")).toHaveValue("Escuela 25 de Mayo");
    expect(field("Descripción del item")).toHaveValue("Cable HDMI");
    expect(field("Cantidad")).toHaveValue(2);

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(mockUpdateBudget).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          customerName: "Escuela 25 de Mayo",
          establishmentCue: "700083300",
          validUntil: "2026-12-31",
        }),
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Presupuesto actualizado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend error when creation fails", async () => {
    mockCreateBudget.mockRejectedValue({
      response: { data: { error: "Presupuesto inválido" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(field("Ej: Escuela 25 de Mayo"), "Cliente");
    await user.type(field("Descripción del item"), "Teclado");
    submitForm();

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Presupuesto inválido"),
    );
  });
});
