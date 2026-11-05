import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HealthStatus } from "@/components/layout/health-status";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

const mockGet = vi.mocked(api.get);

type HealthResponse = { data: { status: string } };

function renderHealth() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HealthStatus", () => {
  it("shows the connected state when the backend answers ok", async () => {
    mockGet.mockResolvedValue({ data: { status: "ok" } } as HealthResponse);

    renderHealth();

    expect(await screen.findByText("Backend conectado")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/health");
  });

  it("shows the disconnected state when the request fails", async () => {
    mockGet.mockRejectedValue(new Error("network down"));

    renderHealth();

    expect(await screen.findByText("Backend sin conexión")).toBeInTheDocument();
  });

  it("shows the disconnected state when the status is not ok", async () => {
    mockGet.mockResolvedValue({ data: { status: "degraded" } } as HealthResponse);

    renderHealth();

    expect(await screen.findByText("Backend sin conexión")).toBeInTheDocument();
  });
});
