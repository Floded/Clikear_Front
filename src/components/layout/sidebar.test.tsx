import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar";
import { logout } from "@/features/auth/auth.api";
import { useSession, sessionQueryKey } from "@/features/auth/use-session";

vi.mock("@/features/auth/auth.api", () => ({
  logout: vi.fn(),
}));

vi.mock("@/features/auth/use-session", () => ({
  sessionQueryKey: ["session"],
  useSession: vi.fn(),
}));

vi.mock("@/components/layout/health-status", () => ({
  HealthStatus: () => null,
}));

const mockLogout = vi.mocked(logout);
const mockUseSession = vi.mocked(useSession);

type SessionResult = ReturnType<typeof useSession>;

function renderSidebar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/tickets" element={<Sidebar />} />
          <Route path="/login" element={<div>Pantalla de login</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { client };
}

const ALL_PERMISSIONS = [
  { feature: "tickets", access: "EDIT" },
  { feature: "organization", access: "EDIT" },
  { feature: "inventory", access: "EDIT" },
  { feature: "budgets", access: "EDIT" },
  { feature: "invoices", access: "EDIT" },
] as const;

function adminSession() {
  return {
    isPending: false,
    data: {
      id: 1,
      username: "ana",
      name: "Ana Pérez",
      role: "ADMIN",
      permissions: [...ALL_PERMISSIONS],
    },
  } as SessionResult;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
  mockUseSession.mockReturnValue({
    isPending: false,
    data: {
      id: 1,
      username: "ana",
      name: "Ana Pérez",
      role: "GESTOR",
      permissions: [...ALL_PERMISSIONS],
    },
  } as SessionResult);
});

describe("Sidebar", () => {
  it("renders every navigation option", () => {
    renderSidebar();

    for (const label of [
      "Tickets",
      "Organización",
      "Inventario",
      "Presupuestos",
      "Facturación",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the current section as active", () => {
    renderSidebar();

    expect(
      screen.getByRole("link", { name: "Tickets" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("shows the session user", () => {
    renderSidebar();

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana · Gestor")).toBeInTheDocument();
  });

  it("logs out, clears the session cache and navigates to /login", async () => {
    const user = userEvent.setup();
    const { client } = renderSidebar();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() =>
      expect(screen.getByText("Pantalla de login")).toBeInTheDocument(),
    );
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(sessionQueryKey)).toBeNull();
  });

  it("navigates to /login even when the logout request fails", async () => {
    mockLogout.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() =>
      expect(screen.getByText("Pantalla de login")).toBeInTheDocument(),
    );
  });

  it("solo muestra las funcionalidades permitidas", () => {
    mockUseSession.mockReturnValue({
      isPending: false,
      data: {
        id: 2,
        username: "rev",
        name: "Revisor",
        role: "REVISADOR",
        permissions: [{ feature: "tickets", access: "VIEW" }],
      },
    } as SessionResult);
    renderSidebar();

    expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Organización" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Inventario" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Configuración/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Configuración de empresa" }),
    ).not.toBeInTheDocument();
  });

  it("muestra el menú de configuración para administradores", async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue(adminSession());
    renderSidebar();

    const settingsToggle = screen.getByRole("button", { name: /Configuración/i });
    expect(settingsToggle).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();

    await user.click(settingsToggle);

    expect(screen.getByRole("link", { name: "Usuarios" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Configuración de empresa" }),
    ).toBeInTheDocument();
  });
});
