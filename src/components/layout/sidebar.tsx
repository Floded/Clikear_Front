import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  Building2,
  Calculator,
  ChevronDown,
  ClipboardList,
  LogOut,
  ReceiptText,
  Settings,
  UserCog,
  Users,
} from "lucide-react";

import { cn } from "cn";
import logoUrl from "@/assets/logo.png";
import { logout } from "@/features/auth/auth.api";
import { sessionQueryKey, useSession } from "@/features/auth/use-session";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { canView } from "@/lib/permissions";
import type { FeatureKey } from "@/features/auth/auth.types";
import { HealthStatus } from "./health-status";
import { ModeToggle } from "./mode-toggle";
import { Moon, Sun } from "lucide-react";

const navigationOptions: { to: string; label: string; icon: typeof ClipboardList; feature: FeatureKey }[] = [
  { to: "/tickets", label: "Tickets", icon: ClipboardList, feature: "tickets" },
  { to: "/organization", label: "Organización", icon: Users, feature: "organization" },
  { to: "/inventory", label: "Inventario", icon: Boxes, feature: "inventory" },
  { to: "/budgets", label: "Presupuestos", icon: Calculator, feature: "budgets" },
  { to: "/invoices", label: "Facturación", icon: ReceiptText, feature: "invoices" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  REVISADOR: "Revisador",
};

const adminSettingsItems = [
  { to: "/usuarios", label: "Usuarios", icon: UserCog },
  { to: "/settings/company", label: "Configuración de empresa", icon: Building2 },
] as const;

export function Sidebar() {
  const { data: user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isAdmin = user?.role === "ADMIN";
  const isSettingsActive = adminSettingsItems.some((item) =>
    location.pathname.startsWith(item.to),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsActive);

  useEffect(() => {
    if (isSettingsActive) {
      setIsSettingsOpen(true);
    }
  }, [isSettingsActive]);

  // Alterna el tema y asegura que la clase .dark esté en el HTML para Tailwind
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      navigate("/login", { replace: true });
    },
  });

  const visibleOptions = navigationOptions.filter((opt) => canView(user, opt.feature));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <img src={logoUrl} alt="" className="size-6 rounded-md object-cover" aria-hidden />
        <span className="font-semibold tracking-tight">Clickear</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleOptions.map(({ to, label, icon: Icon }) => (
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

        {isAdmin && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isSettingsActive
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
              aria-expanded={isSettingsOpen}
              aria-controls="settings-submenu"
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              <Settings className="size-4" aria-hidden />
              <span className="flex-1 text-left">Configuración</span>
              <ChevronDown
                className={cn("size-4 transition-transform", isSettingsOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {isSettingsOpen && (
              <div id="settings-submenu" className="ml-4 flex flex-col gap-1 border-l pl-2">
                {adminSettingsItems.map(({ to, label, icon: Icon }) => (
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
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="flex flex-col gap-3 border-t p-3">
        {/* Theme toggle button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alternar modo oscuro/claro"
            onClick={toggleTheme}
          >
            <Moon className="size-4 block dark:hidden" aria-hidden />
            <Sun className="size-4 hidden dark:block" aria-hidden />
          </Button>
        </div>

        <HealthStatus />

        <ModeToggle />

        <div className="flex items-center gap-2 px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user ? `${user.username} · ${ROLE_LABELS[user.role] ?? user.role}` : ""}
            </p>
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
