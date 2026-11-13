import type { FeatureKey, FeaturePermission, SessionUser } from "@/features/auth/auth.types";

export const FEATURES: { key: FeatureKey; label: string; path: string }[] = [
  { key: "tickets", label: "Tickets", path: "/tickets" },
  { key: "organization", label: "Organización", path: "/organization" },
  { key: "inventory", label: "Inventario", path: "/inventory" },
  { key: "budgets", label: "Presupuestos", path: "/budgets" },
  { key: "invoices", label: "Facturación", path: "/invoices" },
];

export function canView(user: SessionUser | null | undefined, feature: FeatureKey): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return (user.permissions ?? []).some(
    (p) => p.feature === feature && (p.access === "VIEW" || p.access === "EDIT"),
  );
}

export function canEdit(user: SessionUser | null | undefined, feature: FeatureKey): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return (user.permissions ?? []).some((p) => p.feature === feature && p.access === "EDIT");
}

export function getFirstAllowedPath(user: SessionUser | null | undefined): string | null {
  if (!user) return null;
  if (user.role === "ADMIN") return "/tickets";
  const first = FEATURES.find((f) => canView(user, f.key));
  return first?.path ?? null;
}

export function hasAnyPermission(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return (user.permissions ?? []).length > 0;
}

export function getAccess(
  permissions: FeaturePermission[] | undefined,
  feature: FeatureKey,
): "NONE" | "VIEW" | "EDIT" {
  const found = (permissions ?? []).find((p) => p.feature === feature);
  return found?.access ?? "NONE";
}
