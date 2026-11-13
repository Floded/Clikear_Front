import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/auth.api";
import { sessionQueryKey, useSession } from "@/features/auth/use-session";
import { canView, getFirstAllowedPath } from "@/lib/permissions";
import type { FeatureKey } from "@/features/auth/auth.types";

interface ProtectedRouteProps {
  feature?: FeatureKey;
  adminOnly?: boolean;
}

export function ProtectedRoute({ feature, adminOnly }: ProtectedRouteProps) {
  const { data: user, isPending } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      navigate("/login", { replace: true });
    },
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const denied =
    (adminOnly && user.role !== "ADMIN") || (feature && !canView(user, feature));

  if (denied) {
    const fallback = getFirstAllowedPath(user);
    if (fallback && fallback !== location.pathname) {
      return <Navigate to={fallback} replace />;
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <div>
          <h1 className="text-lg font-semibold">Sin acceso</h1>
          <p className="text-sm text-muted-foreground">
            No tenés permisos para acceder a esta sección.
          </p>
        </div>
        <Button variant="outline" onClick={() => logoutMutation.mutate()}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
