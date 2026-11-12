import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSession } from "@/features/auth/use-session";
import { ProtectedRoute } from "@/components/auth/protected-route";

vi.mock("@/features/auth/use-session", () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

type SessionResult = ReturnType<typeof useSession>;

function LoginStub() {
  const location = useLocation();
  return <div>Login {JSON.stringify(location.state)}</div>;
}

function renderProtectedApp() {
  return render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/tickets" element={<div>Panel de tickets</div>} />
        </Route>
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockSession(partial: Partial<SessionResult>) {
  mockUseSession.mockReturnValue({
    isPending: false,
    data: undefined,
    ...partial,
  } as SessionResult);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProtectedRoute", () => {
  it("shows a spinner while the session is loading", () => {
    mockSession({ isPending: true });

    renderProtectedApp();

    expect(screen.queryByText("Panel de tickets")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Login/)).not.toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to /login remembering the origin when there is no session", () => {
    mockSession({ data: undefined });

    renderProtectedApp();

    expect(screen.getByText(/^Login/)).toHaveTextContent("/tickets");
    expect(screen.queryByText("Panel de tickets")).not.toBeInTheDocument();
  });

  it("renders the protected outlet when there is a session", () => {
    mockSession({
      data: { id: 1, email: "admin@clickear.local", name: "Admin" },
    });

    renderProtectedApp();

    expect(screen.getByText("Panel de tickets")).toBeInTheDocument();
    expect(screen.queryByText(/^Login/)).not.toBeInTheDocument();
  });
});
