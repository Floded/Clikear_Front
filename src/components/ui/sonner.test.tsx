import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Toaster } from "@/components/ui/sonner";

describe("Sonner", () => {
  describe("Toaster", () => {
    it("renders the toaster component", () => {
      render(<Toaster />);
      expect(
        screen.getByRole("region", { name: /Notifications/ }),
      ).toBeInTheDocument();
    });

    it("renders without crashing with the default theme", () => {
      const { container } = render(<Toaster theme="system" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
