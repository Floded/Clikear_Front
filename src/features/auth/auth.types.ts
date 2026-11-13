export type UserRole = "ADMIN" | "GESTOR" | "REVISADOR";

export type FeatureKey = "tickets" | "organization" | "inventory" | "budgets" | "invoices";
export type AccessMode = "VIEW" | "EDIT";

export interface FeaturePermission {
  feature: FeatureKey;
  access: AccessMode;
}

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  permissions: FeaturePermission[];
}
