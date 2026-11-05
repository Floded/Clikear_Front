import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { createSupplier } from "@/features/inventory/inventory.api";
import type { Supplier } from "@/features/inventory/inventory.types";
import { NewSupplierDialog } from "@/features/inventory/new-supplier-dialog";

vi.mock("@/features/inventory/inventory.api", () => ({
  createSupplier: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateSupplier = vi.mocked(createSupplier);
const mockToastSuccess = vi.mocked(toast.success);

const newSupplier: Supplier = {
  id: 1,
  name: "Distribuidora Sur",
  contactPhone: null,
  contactEmail: null,
  website: null,
};

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NewSupplierDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateSupplier.mockResolvedValue(newSupplier);
});

describe("NewSupplierDialog", () => {
  it("blocks submission when the name is empty", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Crear proveedor" }));

    expect(
      await screen.findByText("El nombre es obligatorio"),
    ).toBeInTheDocument();
    expect(mockCreateSupplier).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("rejects invalid email and website formats", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("Ej: Distribuidora Sur"), "Sur");
    await user.type(
      screen.getByPlaceholderText("Ej: ventas@proveedor.com"),
      "no-es-email",
    );
    await user.type(
      screen.getByPlaceholderText("Ej: https://proveedor.com"),
      "not a url",
    );

    // jsdom bloquea el submit nativo con url/email inválidos; se dispara el
    // evento directo para ejercitar la validación Zod del formulario
    const form = screen
      .getByRole("button", { name: "Crear proveedor" })
      .closest("form");
    fireEvent.submit(form!);

    expect(await screen.findByText("El email no es válido")).toBeInTheDocument();
    expect(
      await screen.findByText("La URL debe ser válida (ej: https://…)"),
    ).toBeInTheDocument();
    expect(mockCreateSupplier).not.toHaveBeenCalled();
  });

  it("creates a supplier with trimmed values, toasts and closes", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.type(
      screen.getByPlaceholderText("Ej: Distribuidora Sur"),
      "  Distribuidora Sur  ",
    );
    await user.click(screen.getByRole("button", { name: "Crear proveedor" }));

    await waitFor(() =>
      expect(mockCreateSupplier).toHaveBeenCalledWith({
        name: "Distribuidora Sur",
        contactPhone: undefined,
        contactEmail: undefined,
        website: undefined,
      }),
    );
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Proveedor "Distribuidora Sur" creado',
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the API error message when creation fails", async () => {
    mockCreateSupplier.mockRejectedValue({
      response: { data: { error: "El proveedor ya existe" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("Ej: Distribuidora Sur"),
      "Existente",
    );
    await user.click(screen.getByRole("button", { name: "Crear proveedor" }));

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "El proveedor ya existe",
      ),
    );
  });
});
