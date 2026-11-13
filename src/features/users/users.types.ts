import type { FeaturePermission, UserRole } from "@/features/auth/auth.types";

export interface AppUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  permissions: FeaturePermission[];
}
