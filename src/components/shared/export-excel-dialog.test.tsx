import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportExcelDialog } from "@/components/shared/export-excel-dialog";

function renderDialog(onExport = vi.fn(), onOpenChange = vi.fn(), pending = false) {
  render(
    <ExportExcelDialog
      open
      onOpenChange={onOpenChange}
      title="Exportar tickets"
      pending={pending}
      onExport={onExport}
    />,
  );
  return { onExport, onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ExportExcelDialog", () => {
  it("muestra el título y el botón Exportar", () => {
    renderDialog();

    expect(screen.getByText("Exportar tickets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
  });

  it("exporta sin rango cuando los campos están vacíos", async () => {
    const user = userEvent.setup();
    const { onExport } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Exportar" }));

    expect(onExport).toHaveBeenCalledWith({ from: undefined, to: undefined });
  });

  it("exporta con el rango elegido en ISO de inicio/fin de día", async () => {
    const user = userEvent.setup();
    const { onExport } = renderDialog();

    await user.type(screen.getByLabelText("Desde"), "2026-06-01");
    await user.type(screen.getByLabelText("Hasta"), "2026-06-30");
    await user.click(screen.getByRole("button", { name: "Exportar" }));

    const range = vi.mocked(onExport).mock.calls[0][0];
    expect(new Date(range.from as string).getTime()).toBe(
      new Date("2026-06-01T00:00:00").getTime(),
    );
    expect(new Date(range.to as string).getTime()).toBe(
      new Date("2026-06-30T23:59:59.999").getTime(),
    );
  });

  it("cierra con Cancelar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deshabilita Exportar mientras está pendiente", () => {
    renderDialog(undefined, undefined, true);

    expect(screen.getByRole("button", { name: /Exportando…/ })).toBeDisabled();
  });
});
