import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { Boxes, Calculator, ClipboardList, LogOut, ReceiptText, Users } from "lucide-react";

import { cn } from "cn";
import logoUrl from "@/assets/logo.png";
import { logout } from "@/features/auth/auth.api";
import { sessionQueryKey, useSession } from "@/features/auth/use-session";
import { Button } from "@/components/ui/button";
import { HealthStatus } from "./health-status";

const navigationOptions = [
  { to: "/tickets", label: "Tickets", icon: ClipboardList },
  { to: "/organization", label: "Organización", icon: Users },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/budgets", label: "Presupuestos", icon: Calculator },
  { to: "/invoices", label: "Facturación", icon: ReceiptText },
];

export function Sidebar() {
  const { data: user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      navigate("/login", { replace: true });
    },
  });

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <img src={logoUrl} alt="" className="size-6 rounded-md object-cover" aria-hidden />
        <span className="font-semibold tracking-tight">Clickear</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navigationOptions.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )
            }
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t p-3">
        <HealthStatus />

        <div className="flex items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </aside>
  );
}
