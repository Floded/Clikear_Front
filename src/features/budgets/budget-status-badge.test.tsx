import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BudgetStatus, BudgetStatusBadge } from "@/features/budgets/budget-status-badge";

describe("BudgetStatusBadge", () => {
  it.each<[BudgetStatus, string]>([
    ["DRAFT", "Borrador"],
    ["SENT", "Enviado"],
    ["APPROVED", "Aprobado"],
    ["REJECTED", "Rechazado"],
  ])("translates %s as %s", (status, label) => {
    render(<BudgetStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
