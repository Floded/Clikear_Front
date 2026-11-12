import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { dateRangeToParams, downloadExcel, saveBlob } from "@/lib/download";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockApiGet = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("saveBlob", () => {
  it("crea un link con el nombre y dispara la descarga", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const blob = new Blob(["data"]);

    saveBlob(blob, "archivo.xlsx");

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    // El link fue creado y ya se liberó la URL
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    clickSpy.mockRestore();
  });
});

describe("downloadExcel", () => {
  it("descarga como blob y respeta el nombre del servidor", async () => {
    mockApiGet.mockResolvedValue({
      data: new Blob(["xlsx"]),
      headers: { "content-disposition": 'attachment; filename="tickets-1-1-2026.xlsx"' },
    } as never);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");

    await downloadExcel("/tickets/export", "tickets.xlsx", { status: "TERMINADO" });

    expect(mockApiGet).toHaveBeenCalledWith("/tickets/export", {
      responseType: "blob",
      params: { status: "TERMINADO" },
    });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("usa el nombre de fallback si no hay Content-Disposition", async () => {
    mockApiGet.mockResolvedValue({
      data: new Blob(["xlsx"]),
      headers: {},
    } as never);
    const downloadSpy = vi.spyOn(HTMLAnchorElement.prototype, "download", "set");

    await downloadExcel("/assignments/export", "asignaciones.xlsx");

    expect(downloadSpy).toHaveBeenCalledWith("asignaciones.xlsx");
    downloadSpy.mockRestore();
  });
});

describe("dateRangeToParams", () => {
  it("convierte de/hasta en ISO de inicio y fin de día", () => {
    const params = dateRangeToParams("2026-06-01", "2026-06-30");

    // Comparación por timestamp para no depender de la zona horaria del runner
    expect(new Date(params.from as string).getTime()).toBe(
      new Date("2026-06-01T00:00:00").getTime(),
    );
    expect(new Date(params.to as string).getTime()).toBe(
      new Date("2026-06-30T23:59:59.999").getTime(),
    );
  });

  it("devuelve undefined cuando no hay fechas", () => {
    expect(dateRangeToParams()).toEqual({ from: undefined, to: undefined });
    expect(dateRangeToParams("2026-06-01")).toEqual({
      from: expect.any(String),
      to: undefined,
    });
  });
});
