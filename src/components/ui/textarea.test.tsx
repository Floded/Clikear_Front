import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders default textarea", () => {
    render(
      <Textarea placeholder="Escribe aquí..." />
    );

    const textarea = screen.getByPlaceholderText("Escribe aquí...");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveClass("flex");
    expect(textarea).toHaveClass("min-h-16");
    expect(textarea).toHaveClass("w-full");
    expect(textarea).toHaveClass("rounded-lg");
    expect(textarea).toHaveClass("border-input");
  });

  it("renders with disabled state", () => {
    render(<Textarea disabled placeholder="Deshabilitado" />);

    const textarea = screen.getByPlaceholderText("Deshabilitado");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeDisabled();
  });

  it("renders with aria-invalid state", () => {
    render(
      <Textarea aria-invalid="true" placeholder="Error" />
    );

    const textarea = screen.getByPlaceholderText("Error");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });
});