import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Label } from "@/components/ui/label";

describe("Label", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders default label", () => {
    render(<Label>Texto de etiqueta</Label>);

    const label = screen.getByText("Texto de etiqueta");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("flex");
    expect(label).toHaveClass("items-center");
    expect(label).toHaveClass("gap-2");
    expect(label).toHaveClass("text-sm");
    expect(label).toHaveClass("leading-none");
    expect(label).toHaveClass("font-medium");
  });

  it("renders with disabled state", () => {
    render(<Label disabled>Etiqueta deshabilitada</Label>);

    const label = screen.getByText("Etiqueta deshabilitada");
    expect(label).toBeInTheDocument();
    // Las clases condicionales se aplican via group-data-[disabled=true]
    expect(label).toHaveClass("group-data-[disabled=true]:pointer-events-none");
    expect(label).toHaveClass("group-data-[disabled=true]:opacity-50");
  });

  it("renders with peer-disabled state", () => {
    render(
      <Label peerDisabled>Etiqueta peer-desabled</Label>
    );

    const label = screen.getByText("Etiqueta peer-desabled");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
    expect(label).toHaveClass("peer-disabled:opacity-50");
  });
});