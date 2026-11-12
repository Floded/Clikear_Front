import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default variant", () => {
    render(<Badge>Nuevo</Badge>);

    const badge = screen.getByText("Nuevo");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
    expect(badge).toHaveClass("text-primary-foreground");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secundario</Badge>);

    const badge = screen.getByText("Secundario");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-secondary");
    expect(badge).toHaveClass("text-secondary-foreground");
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);

    const badge = screen.getByText("Error");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-destructive/10");
    expect(badge).toHaveClass("text-destructive");
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);

    const badge = screen.getByText("Outline");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("border-border");
    expect(badge).toHaveClass("text-foreground");
  });

  it("renders with ghost variant", () => {
    render(<Badge variant="ghost">Ghost</Badge>);

    const badge = screen.getByText("Ghost");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("hover:bg-muted");
  });

  it("renders with link variant", () => {
    render(<Badge variant="link">Enlace</Badge>);

    const badge = screen.getByText("Enlace");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-primary");
    expect(badge).toHaveClass("underline-offset-4");
  });

  it("renders default size", () => {
    render(<Badge>Chico</Badge>);

    const badge = screen.getByText("Chico");
    expect(badge).toBeInTheDocument();
  });

  it("renders with icon - svg is rendered inside", () => {
    const { container } = render(
      <Badge>
        <svg data-slot="badge-icon" width="12" height="12" />
      </Badge>
    );

    const svg = container.querySelector('svg[data-slot="badge-icon"]');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "12");
    expect(svg).toHaveAttribute("height", "12");
  });

  it("renders asChild variant", () => {
    const { container } = render(
      <Badge asChild>
        <span>Hola</span>
      </Badge>
    );

    const child = container.querySelector("span");
    expect(child).toBeInTheDocument();
  });
});