import { api } from "@/lib/api";

import type { AppUser } from "./users.types";

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role: string;
}

export interface UpdateUserInput {
  username?: string;
  name?: string;
  password?: string;
  role?: string;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const { data } = await api.get<AppUser[]>("/users");
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const { data } = await api.post<AppUser>("/users", input);
  return data;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<AppUser> {
  const { data } = await api.patch<AppUser>(`/users/${id}`, input);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
