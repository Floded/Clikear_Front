import axios from "axios";

// Cliente HTTP del backend; VITE_API_URL vive en .env (ver .env.example)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "api",
  timeout: 15_000,
  withCredentials: true,
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
