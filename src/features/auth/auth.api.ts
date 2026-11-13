import axios from "axios";

import { api } from "@/lib/api";

import type { SessionUser } from "./auth.types";

export async function login(username: string, password: string): Promise<SessionUser> {
  const { data } = await api.post<{ user: SessionUser }>("/auth/login", {
    username,
    password,
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const { data } = await api.get<{ user: SessionUser }>("/auth/me");
    return data.user;
  } catch (err) {
    // 401 = sin sesión válida, no es un error para la UI
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      return null;
    }
    throw err;
  }
}
