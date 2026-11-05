import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";

// El interceptor registrado en la creación del cliente
type RejectedHandler = (error: unknown) => Promise<never>;
const rejected = (
  api.interceptors.response as unknown as {
    handlers: Array<{ rejected: RejectedHandler }>;
  }
).handlers[0].rejected;

function axiosError(status: number, url: string) {
  return {
    isAxiosError: true,
    config: { url },
    response: { status },
  };
}

const originalLocation = window.location;

function stubLocation(pathname: string) {
  const assign = vi.fn();
  Object.defineProperty(window, "location", {
    value: { pathname, assign },
    configurable: true,
    writable: true,
  });
  return assign;
}

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    configurable: true,
    writable: true,
  });
  vi.clearAllMocks();
});

describe("api response interceptor", () => {
  it("redirects to /login on 401 of a protected endpoint", async () => {
    const assign = stubLocation("/tickets");
    const error = axiosError(401, "/tickets");

    await expect(rejected(error)).rejects.toBeTruthy();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("does not redirect on 401 of /auth/ endpoints", async () => {
    const assign = stubLocation("/tickets");

    await expect(rejected(axiosError(401, "/auth/me"))).rejects.toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not redirect when already on /login", async () => {
    const assign = stubLocation("/login");

    await expect(rejected(axiosError(401, "/tickets"))).rejects.toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not redirect on other statuses", async () => {
    const assign = stubLocation("/tickets");

    await expect(rejected(axiosError(403, "/tickets"))).rejects.toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not redirect on non-axios errors", async () => {
    const assign = stubLocation("/tickets");

    await expect(rejected(new Error("boom"))).rejects.toThrow("boom");
    expect(assign).not.toHaveBeenCalled();
  });
});
