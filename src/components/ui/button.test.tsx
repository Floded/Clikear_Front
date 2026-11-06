import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default variant and size", () => {
    render(<Button>Hola</Button>);

    const button = screen.getByRole("button", { name: "Hola" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole("button", { name: "Outline" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("border-border");
    expect(button).toHaveClass("bg-background");
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secundario</Button>);

    const button = screen.getByRole("button", { name: "Secundario" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-secondary");
    expect(button).toHaveClass("text-secondary-foreground");
  });

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Eliminar</Button>);

    const button = screen.getByRole("button", { name: "Eliminar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-destructive/10");
    expect(button).toHaveClass("text-destructive");
  });

  it("renders with link variant", () => {
    render(<Button variant="link">Enlace</Button>);

    const button = screen.getByRole("button", { name: "Enlace" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("text-primary");
    expect(button).toHaveClass("underline-offset-4");
  });

  it("renders with small size", () => {
    render(<Button size="xs">Chico</Button>);

    const button = screen.getByRole("button", { name: "Chico" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-6");
    expect(button).toHaveClass("text-xs");
  });

  it("renders with large size", () => {
    render(<Button size="lg">Grande</Button>);

    const button = screen.getByRole("button", { name: "Grande" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-9");
  });

  it("renders icon button", () => {
    render(<Button size="icon"><svg data-slot="button-icon" /></Button>);

    const button = screen.getByRole("button", { name: "" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("size-8");
  });

  it("renders asChild variant", () => {
    const { container } = render(
      <Button asChild>
        <span>Hola</span>
      </Button>
    );

    const child = container.querySelector("span");
    expect(child).toBeInTheDocument();
  });
});