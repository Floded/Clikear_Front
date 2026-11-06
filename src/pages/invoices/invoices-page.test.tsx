import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { InvoicesPage } from "@/pages/invoices/invoices-page";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

function renderInvoicesPage() {
  render(<InvoicesPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InvoicesPage", () => {
  it("shows the title", () => {
    renderInvoicesPage();
    expect(screen.getByRole("heading", { name: /Facturación/ })).toBeInTheDocument();
  });

  it("shows loading skeletons at first", () => {
    renderInvoicesPage();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders the invoices table after loading", async () => {
    renderInvoicesPage();
    await waitFor(() => expect(screen.getByText("125691")).toBeInTheDocument());
    expect(screen.getByText("15000.00")).toBeInTheDocument();
    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Rechazada")).toBeInTheDocument();
  });

  it("shows the error card when an invoice has an error message", async () => {
    renderInvoicesPage();
    await waitFor(() => expect(screen.getByText("125693")).toBeInTheDocument());
    expect(await screen.findByText(/CUIT del receptor inválido/)).toBeInTheDocument();
  });

  it("filters invoices by status", async () => {
    const user = userEvent.setup();
    renderInvoicesPage();
    await waitFor(() => expect(screen.getByText("125691")).toBeInTheDocument());
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Pendiente" }));
    expect(await screen.findByText("125692")).toBeInTheDocument();
    expect(screen.queryByText("125691")).not.toBeInTheDocument();
  });

  it("generates an invoice through the dialog and toasts success", async () => {
    const user = userEvent.setup();
    renderInvoicesPage();
    await waitFor(() => expect(screen.getByText("125691")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Generar factura" }));
    await screen.findByRole("dialog", { name: /Generar factura/ });
    await user.type(screen.getByLabelText("N° de ticket"), "999999");
    await user.type(screen.getByLabelText("Monto"), "5000");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Solicitud de factura enviada (integración ARCA en desarrollo)",
      ),
    );
    expect(await screen.findByText("999999")).toBeInTheDocument();
    expect(screen.getByText("5000.00")).toBeInTheDocument();
  });

  it("shows an error when ticket or amount is missing", async () => {
    const user = userEvent.setup();
    renderInvoicesPage();
    await waitFor(() => expect(screen.getByText("125691")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Generar factura" }));
    await screen.findByRole("dialog", { name: /Generar factura/ });
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(mockToastError).toHaveBeenCalledWith("Completá ticket y monto");
  });
});
