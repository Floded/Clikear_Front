import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { downloadExcel, saveBlob } from "@/lib/download";

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
