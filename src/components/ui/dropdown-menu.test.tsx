import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

describe("DropdownMenu", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("DropdownMenu", () => {
    it("renders dropdown menu with trigger", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Opciones</DropdownMenuTrigger>
        </DropdownMenu>
      );

      expect(container.innerHTML).toContain("dropdown-menu");
    });
  });

  describe("DropdownMenuTrigger", () => {
    it("renders trigger button", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menú</DropdownMenuTrigger>
        </DropdownMenu>
      );

      const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
      expect(trigger).toBeInTheDocument();
    });
  });
});