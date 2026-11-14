import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetPrintDialog } from "@/features/budgets/budget-print-dialog";
import type { Budget } from "@/features/budgets/budget.types";

vi.mock("@/features/auth/use-session", () => ({
  useSession: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/features/company-settings", () => ({
  useCompanySettings: () => ({ data: null, isLoading: false, isError: false }),
}));

const baseBudget: Budget = {
  id: 7,
  code: "PPT-0007",
  customerName: "Escuela 25 de Mayo",
  establishmentCue: "700083300",
  issueDate: "2026-03-01",
  validUntil: "2026-12-31",
  status: "SENT",
  notes: "Insumos generales",
  total: 1500,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  lines: [
    { id: 1, description: "Cable HDMI", quantity: 2, unitPrice: 750, subtotal: 1500 },
  ],
};

const moneyRegex = (value: number) => {
  if (value === 750) return /\$\s*750,00/;
  if (value === 1500) return /\$\s*1\.500,00/;
  return new RegExp(String(value));
};

function renderDialog(
  budget: Budget | null,
  onOpenChange = vi.fn(),
) {
  render(<BudgetPrintDialog budget={budget} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

beforeEach(() => {
  vi.spyOn(window, "print").mockImplementation(() => {});
});

describe("BudgetPrintDialog", () => {
  it("renders the budget header, client and status", () => {
    renderDialog(baseBudget);

    expect(screen.getByRole("heading", { name: "Presupuesto PPT-0007" })).toBeInTheDocument();
    expect(screen.getByText("Escuela 25 de Mayo")).toBeInTheDocument();
    expect(screen.getByText("700083300")).toBeInTheDocument();
    expect(screen.getByText("Enviado")).toBeInTheDocument();
  });

  it("renders line details and the formatted total", () => {
    renderDialog(baseBudget);

    expect(screen.getByText("Cable HDMI")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(moneyRegex(750))).toBeInTheDocument();
    // subtotal de la línea y total del presupuesto coinciden en este fixture
    expect(screen.getAllByText(moneyRegex(1500))).toHaveLength(2);
  });

  it("renders notes when present", () => {
    renderDialog(baseBudget);

    expect(screen.getByText("Notas")).toBeInTheDocument();
    expect(screen.getByText("Insumos generales")).toBeInTheDocument();
  });

  it("falls back to placeholders when optional data is missing", () => {
    renderDialog({ ...baseBudget, establishmentCue: null, notes: null });

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Notas")).toBeInTheDocument();
  });

  it("closes the dialog when clicking Cerrar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(baseBudget);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(window.print).not.toHaveBeenCalled();
  });

  it("triggers the browser print dialog", async () => {
    const user = userEvent.setup();
    renderDialog(baseBudget);

    await user.click(
      screen.getByRole("button", { name: "Imprimir / Guardar PDF" }),
    );

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the budget is null", () => {
    renderDialog(null);

    expect(screen.queryByText(/Presupuesto PPT/)).not.toBeInTheDocument();
  });
});
