import axios from "axios";

// Cliente HTTP del backend; VITE_API_URL vive en .env (ver .env.example)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 15_000,
});
