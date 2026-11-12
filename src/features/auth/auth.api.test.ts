import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { fetchSession, login, logout } from "@/features/auth/auth.api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

const user = { id: 1, email: "ana@clickear.com", name: "Ana Pérez" };

function axiosError(status: number) {
  return { isAxiosError: true, response: { status } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth.api", () => {
  it("login returns the session user", async () => {
    mockPost.mockResolvedValue({ data: { user } });

    await expect(login("ana@clickear.com", "secret")).resolves.toEqual(user);
    expect(mockPost).toHaveBeenCalledWith("/auth/login", {
      email: "ana@clickear.com",
      password: "secret",
    });
  });

  it("logout posts to the logout endpoint", async () => {
    mockPost.mockResolvedValue({ data: undefined });

    await logout();

    expect(mockPost).toHaveBeenCalledWith("/auth/logout");
  });

  it("fetchSession returns the user when the session is valid", async () => {
    mockGet.mockResolvedValue({ data: { user } });

    await expect(fetchSession()).resolves.toEqual(user);
    expect(mockGet).toHaveBeenCalledWith("/auth/me");
  });

  it("fetchSession returns null on 401", async () => {
    mockGet.mockRejectedValue(axiosError(401));

    await expect(fetchSession()).resolves.toBeNull();
  });

  it("fetchSession rethrows other errors", async () => {
    mockGet.mockRejectedValue(axiosError(500));

    await expect(fetchSession()).rejects.toBeTruthy();
  });
});
