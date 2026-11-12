import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvoiceStatusBadge } from "@/features/invoices/invoice-status-badge";

describe("InvoiceStatusBadge", () => {
  it.each([
    ["PENDING", "Pendiente"],
    ["APPROVED", "Aprobada"],
    ["REJECTED", "Rechazada"],
  ])("translates %s as %s", (status, label) => {
    render(<InvoiceStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("falls back to the raw status when it is unknown", () => {
    render(<InvoiceStatusBadge status="ANULADA" />);
    expect(screen.getByText("ANULADA")).toBeInTheDocument();
  });
});
