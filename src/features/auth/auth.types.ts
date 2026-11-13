export type UserRole = "ADMIN" | "GESTOR" | "REVISADOR";

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}
