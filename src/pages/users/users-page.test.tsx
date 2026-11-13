import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { UsersPage } from "@/pages/users/users-page";
import { createUser, deleteUser, fetchUsers } from "@/features/users/users.api";
import type { AppUser } from "@/features/users/users.types";
import type { SessionUser } from "@/features/auth/auth.types";

vi.mock("@/features/users/users.api", () => ({
  fetchUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// useSession se mockea para controlar el rol del usuario en sesión
const sessionMock = vi.hoisted(() => ({ data: null as SessionUser | null }));
vi.mock("@/features/auth/use-session", () => ({
  sessionQueryKey: ["session"],
  useSession: () => ({ data: sessionMock.data }),
}));

const mockFetchUsers = vi.mocked(fetchUsers);
const mockCreateUser = vi.mocked(createUser);
const mockDeleteUser = vi.mocked(deleteUser);

const users: AppUser[] = [
  { id: 1, username: "admin", name: "Admin", role: "ADMIN", createdAt: "2026-01-01" },
  { id: 2, username: "ana", name: "Ana Pérez", role: "GESTOR", createdAt: "2026-01-02" },
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.data = { id: 1, username: "admin", name: "Admin", role: "ADMIN" };
  mockFetchUsers.mockResolvedValue(users);
});

describe("UsersPage", () => {
  it("renderiza la tabla de usuarios con roles", async () => {
    renderPage();

    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Gestor")).toBeInTheDocument();
  });

  it("redirige a /tickets si el usuario no es ADMIN", async () => {
    sessionMock.data = { id: 2, username: "ana", name: "Ana", role: "GESTOR" };
    renderPage();

    await waitFor(() => {
      // La página no debe llegar a renderizar la gestión de usuarios
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
    expect(mockFetchUsers).not.toHaveBeenCalled();
  });

  // El diálogo con Select es pesado bajo jsdom en suite completa: timeout ampliado
  it(
    "crea un usuario desde el diálogo",
    async () => {
      mockCreateUser.mockResolvedValue({
        id: 3,
        username: "nuevo",
        name: "Nuevo Usuario",
        role: "REVISADOR",
        createdAt: "2026-01-03",
      });
      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
      await user.type(screen.getByLabelText("Usuario"), "nuevo");
      await user.type(screen.getByLabelText("Nombre"), "Nuevo Usuario");
      await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura99!");

      await user.click(screen.getByRole("button", { name: "Crear usuario" }));

      await waitFor(() =>
        expect(mockCreateUser).toHaveBeenCalledWith({
          username: "nuevo",
          name: "Nuevo Usuario",
          password: "ClaveSegura99!",
          role: "GESTOR",
        }),
      );
    },
    15_000,
  );

  it("pide confirmación antes de eliminar y llama a la API", async () => {
    mockDeleteUser.mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderPage();

    // Hay un botón "Eliminar" por fila; se usa el primero (usuario admin)
    await user.click((await screen.findAllByRole("button", { name: /Eliminar/ }))[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith(1));
    confirmSpy.mockRestore();
  });

  it("no elimina si se cancela la confirmación", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();

    await user.click((await screen.findAllByRole("button", { name: /Eliminar/ }))[0]);

    expect(mockDeleteUser).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
