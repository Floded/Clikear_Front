import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";

describe("Dialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("DialogTrigger", () => {
    it("renders a trigger button when used within Dialog", () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole("button", {
        name: "Open Dialog",
      });
      expect(trigger).toBeInTheDocument();
    });
  });
});