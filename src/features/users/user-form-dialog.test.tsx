import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { UserFormDialog } from "@/features/users/user-form-dialog";
import { createUser, updateUser } from "@/features/users/users.api";
import type { AppUser } from "@/features/users/users.types";

vi.mock("@/features/users/users.api", () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateUser = vi.mocked(createUser);
const mockUpdateUser = vi.mocked(updateUser);

const existing: AppUser = {
  id: 2,
  username: "ana",
  name: "Ana Pérez",
  role: "GESTOR",
  createdAt: "2026-01-02",
};

function renderDialog(user?: AppUser | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UserFormDialog open onOpenChange={onOpenChange} user={user ?? null} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserFormDialog", () => {
  it("crea un usuario con datos válidos", async () => {
    mockCreateUser.mockResolvedValue({ ...existing, id: 3, username: "nuevo" });
    const user = userEvent.setup();
    renderDialog();

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
  });

  it("no envía la petición si la contraseña no cumple la política", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Usuario"), "nuevo");
    await user.type(screen.getByLabelText("Nombre"), "Nuevo Usuario");
    await user.type(screen.getByLabelText("Contraseña"), "corta");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
  });

  it("muestra el error inline de username con caracteres inválidos", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Usuario"), "con espacio");
    await user.type(screen.getByLabelText("Nombre"), "Nombre");
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura99!");
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "Solo admite letras, números, punto, guion y guion bajo (sin espacios)",
      ),
    ).toBeInTheDocument();
  });

  it("en edición, no exige contraseña y solo la cambia si se escribe una válida", async () => {
    mockUpdateUser.mockResolvedValue(existing);
    const user = userEvent.setup();
    renderDialog(existing);

    await user.type(screen.getByLabelText("Nombre"), " editado");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith(2, {
        username: "ana",
        name: "Ana Pérez editado",
        role: "GESTOR",
      }),
    );
  });

  it("en edición, rechaza una contraseña débil con error inline", async () => {
    const user = userEvent.setup();
    renderDialog(existing);

    await user.type(screen.getByLabelText("Nueva contraseña (opcional)"), "corta");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
  });
});
