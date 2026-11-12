import axios from "axios";

import { getDesktopInfo } from "@/lib/desktop";

// Cliente HTTP del backend; VITE_API_URL vive en .env (ver .env.example)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "api",
  timeout: 15_000,
  withCredentials: true,
});

// En Electron el backend puede ser local u online según el modo elegido por el
// usuario: se resuelve la base URL por petición (con caché).
let cachedDesktopInfo: Awaited<ReturnType<typeof getDesktopInfo>> | undefined;
async function resolveBaseUrl(): Promise<string | null> {
  if (cachedDesktopInfo === undefined) {
    cachedDesktopInfo = await getDesktopInfo();
  }
  const info = cachedDesktopInfo;
  if (!info) return null;
  const base = info.mode === "online" ? info.remoteUrl : info.backendUrl;
  return base ? `${base.replace(/\/$/, "")}/api` : null;
}

export function invalidateDesktopInfo() {
  cachedDesktopInfo = undefined;
}

api.interceptors.request.use(async (config) => {
  const base = await resolveBaseUrl();
  if (base) config.baseURL = base;
  return config;
});

// Sesión expirada en un endpoint protegido: volver al login (sin tocar /auth/)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = axios.isAxiosError(error) ? error.config?.url ?? "" : "";
    const unauthorized =
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !url.startsWith("/auth/") &&
      !window.location.pathname.startsWith("/login");

    if (unauthorized) {
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);
