import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSession } from "@/features/auth/auth.api";
import { useSession, sessionQueryKey } from "@/features/auth/use-session";
import type { SessionUser } from "@/features/auth/auth.types";

vi.mock("@/features/auth/auth.api", () => ({
  fetchSession: vi.fn(),
}));

const mockFetchSession = vi.mocked(fetchSession);

const sessionUser: SessionUser = {
  id: 1,
  username: "ana",
  name: "Ana Pérez",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSession", () => {
  it("returns the session user", async () => {
    mockFetchSession.mockResolvedValue(sessionUser);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sessionUser);
    expect(mockFetchSession).toHaveBeenCalledTimes(1);
  });

  it("returns null when there is no active session", async () => {
    mockFetchSession.mockResolvedValue(null);

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("uses the shared session query key", () => {
    expect(sessionQueryKey).toEqual(["session"]);
  });
});
