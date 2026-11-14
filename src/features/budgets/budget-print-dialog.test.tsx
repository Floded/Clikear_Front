import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BudgetPrintDialog } from "@/features/budgets/budget-print-dialog";
import type { Budget } from "@/features/budgets/budget.types";
import type { CompanySettings } from "@/features/company-settings/company-settings.types";
import { useCompanySettings } from "@/features/company-settings";

vi.mock("@/features/auth/use-session", () => ({
  useSession: () => ({ data: { role: "ADMIN" } }),
}));

vi.mock("@/features/company-settings", () => ({
  useCompanySettings: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
}));

const mockUseCompanySettings = vi.mocked(useCompanySettings);

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

const companySettingsWithSignature: CompanySettings = {
  id: 1,
  commercialName: "Clickear",
  legalName: "Clickear SRL",
  logoUrl: null,
  logoPath: null,
  signatureUrl: "https://example.com/signature.png",
  signaturePath: "company/signature.png",
  responsibleName: "Ricardo Gabriel Lillo Morales",
  responsiblePosition: "Socio Gerente",
  address: null,
  locality: null,
  province: null,
  country: null,
  postalCode: null,
  email: null,
  phone: null,
  taxId: null,
  grossIncomeNumber: null,
  rupeNumber: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: null,
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
  vi.clearAllMocks();
  vi.spyOn(window, "print").mockImplementation(() => {});
  mockUseCompanySettings.mockReturnValue({ data: null, isLoading: false, isError: false } as any);
});

describe("BudgetPrintDialog", () => {
  it("renders the budget header, client and status", () => {
    renderDialog(baseBudget);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Presupuesto PPT-0007" })).toBeInTheDocument();
    expect(within(dialog).getByText("Escuela 25 de Mayo")).toBeInTheDocument();
    expect(within(dialog).getByText("700083300")).toBeInTheDocument();
    expect(within(dialog).getByText("Enviado")).toBeInTheDocument();
  });

  it("renders line details and the formatted total", () => {
    renderDialog(baseBudget);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Cable HDMI")).toBeInTheDocument();
    expect(within(dialog).getByText("2")).toBeInTheDocument();
    expect(within(dialog).getByText(moneyRegex(750))).toBeInTheDocument();
    expect(within(dialog).getAllByText(moneyRegex(1500))).toHaveLength(2);
  });

  it("renders notes when present", () => {
    renderDialog(baseBudget);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Notas")).toBeInTheDocument();
    expect(within(dialog).getByText("Insumos generales")).toBeInTheDocument();
  });

  it("falls back to placeholders when optional data is missing", () => {
    renderDialog({ ...baseBudget, establishmentCue: null, notes: null });

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText("—").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Notas")).toBeInTheDocument();
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

  it("renders company signature in the print document when configured", () => {
    mockUseCompanySettings.mockReturnValue({
      data: companySettingsWithSignature,
      isLoading: false,
      isError: false,
    } as any);

    renderDialog(baseBudget);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByAltText("Firma autorizada")).toBeInTheDocument();
    expect(within(dialog).getByText("Ricardo Gabriel Lillo Morales")).toBeInTheDocument();
    expect(within(dialog).getByText("Socio Gerente")).toBeInTheDocument();
  });
});
