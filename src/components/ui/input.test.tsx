import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Input } from "@/components/ui/input";

describe("Input", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default type text", () => {
    render(<Input placeholder="Escribe algo" />);

    const input = screen.getByPlaceholderText("Escribe algo");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("h-8");
    expect(input).toHaveClass("w-full");
    expect(input).toHaveClass("rounded-lg");
    expect(input).toHaveClass("border-input");
  });

  it("renders with type email", () => {
    render(<Input type="email" placeholder="email@ejemplo.com" />);

    const input = screen.getByPlaceholderText("email@ejemplo.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders with type password", () => {
    render(<Input type="password" placeholder="Contraseña" />);

    const input = screen.getByPlaceholderText("Contraseña");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders with disabled state", () => {
    render(<Input disabled placeholder="Deshabilitado" />);

    const input = screen.getByPlaceholderText("Deshabilitado");
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
  });

  it("renders with read-only state", () => {
    render(<Input readOnly placeholder="Solo lectura" />);

    const input = screen.getByPlaceholderText("Solo lectura");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("readonly");
  });
});