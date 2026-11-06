import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppLayout } from "@/components/layout/app-layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

describe("AppLayout", () => {
  it("renders sidebar and main content", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <QueryClientProvider client={client}>
          <AppLayout />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    // Sidebar is an <aside> element with the logo and navigation
    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toBeInTheDocument();

    // Main content
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("main content has proper classes", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <QueryClientProvider client={client}>
          <AppLayout />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveClass("flex-1");
    expect(main).toHaveClass("bg-muted/30");
    expect(main).toHaveClass("p-8");
  });
});