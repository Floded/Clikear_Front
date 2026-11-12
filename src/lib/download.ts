import { api } from "@/lib/api";

// Dispara la descarga en el navegador de un blob ya descargado
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Descarga un archivo del backend y lo guarda respetando el nombre que envía
 * el servidor (Content-Disposition) o un fallback si no lo trae.
 */
export async function downloadExcel(
  url: string,
  fallbackName: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const response = await api.get(url, { responseType: "blob", params });
  const disposition =
    (response.headers?.["content-disposition"] as string | undefined) ?? "";
  const filename =
    /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  saveBlob(response.data as Blob, filename);
}
