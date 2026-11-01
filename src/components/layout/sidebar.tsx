import { NavLink } from "react-router-dom";
import { Boxes, Calculator, ClipboardList, ReceiptText, Wrench } from "lucide-react";

import { cn } from "cn";
import { HealthStatus } from "./health-status";

const navigationOptions = [
  { to: "/tickets", label: "Tickets", icon: ClipboardList },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/budgets", label: "Presupuestos", icon: Calculator },
  { to: "/invoices", label: "Facturación", icon: ReceiptText },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <Wrench className="size-5" aria-hidden />
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

      <div className="border-t p-3">
        <HealthStatus />
      </div>
    </aside>
  );
}
