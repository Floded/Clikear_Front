import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { LoginPage } from "@/pages/login-page";
import { login } from "@/features/auth/auth.api";
import { sessionQueryKey } from "@/features/auth/use-session";
import type { SessionUser } from "@/features/auth/auth.types";

vi.mock("@/features/auth/auth.api", () => ({
  login: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockLogin = vi.mocked(login);
const mockToastError = vi.mocked(toast.error);

const sessionUser: SessionUser = {
  id: 1,
  username: "admin",
  name: "Admin",
  role: "ADMIN",
};

function renderLogin(from?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const initialEntries = from
    ? [{ pathname: "/login", state: { from } }]
    : ["/login"];

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tickets" element={<div>Panel de tickets</div>} />
          <Route path="/inventory" element={<div>Panel de inventario</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { client };
}

function submitForm() {
  const form = screen.getByRole("button", { name: /Ingresar/ }).closest("form");
  fireEvent.submit(form!);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogin.mockResolvedValue(sessionUser);
});

describe("LoginPage", () => {
  it("shows errors for empty username and password", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("El usuario debe tener al menos 3 caracteres")).toBeInTheDocument();
    expect(
      await screen.findByText("La contraseña es obligatoria"),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("rejects a too-short username through the Zod schema", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuario"), "ab");
    await user.type(screen.getByLabelText("Contraseña"), "secret1");
    submitForm();

    expect(await screen.findByText("El usuario debe tener al menos 3 caracteres")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in, seeds the session cache and navigates to the origin", async () => {
    const user = userEvent.setup();
    const { client } = renderLogin("/inventory");

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "Admin123!");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        "admin",
        "Admin123!",
      ),
    );
    expect(await screen.findByText("Panel de inventario")).toBeInTheDocument();
    expect(client.getQueryData(sessionQueryKey)).toEqual(sessionUser);
  });

  it("defaults to /tickets when there is no origin", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "Admin123!");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Panel de tickets")).toBeInTheDocument();
  });

  it("shows the backend error message when credentials are rejected", async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: "Credenciales inválidas" } },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "otra-clave");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Credenciales inválidas"),
    );
    expect(screen.queryByText(/^Panel/)).not.toBeInTheDocument();
  });
});
