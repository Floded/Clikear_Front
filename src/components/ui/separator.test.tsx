import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Separator } from "@/components/ui/separator";

describe("Separator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders horizontal separator by default", () => {
    const { container } = render(<Separator />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("data-horizontal:h-px");
    expect(separator).toHaveClass("data-horizontal:w-full");
  });

  it("renders horizontal orientation", () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("data-horizontal:h-px");
    expect(separator).toHaveClass("data-horizontal:w-full");
  });

  it("renders vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("data-vertical:w-px");
    expect(separator).toHaveClass("data-vertical:self-stretch");
  });

  it("renders without decorative", () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.querySelector('[data-slot="separator"]');
    expect(separator).toBeInTheDocument();
  });
});