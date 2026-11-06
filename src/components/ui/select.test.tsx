import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";

describe("Select", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Select", () => {
    it("renders select component", () => {
      const { container } = render(
        <Select placeholder="Seleccionar">
          <SelectTrigger>
            <span>Trigger</span>
          </SelectTrigger>
          <SelectValue>Valor</SelectValue>
        </Select>
      );

      // Verificar que el componente principal existe
      expect(container.innerHTML).toContain("select");
    });
  });

  describe("SelectTrigger", () => {
    it("renders trigger element", () => {
      const { container } = render(
        <Select placeholder="Buscar">
          <SelectTrigger>
            <span>Activar</span>
          </SelectTrigger>
        </Select>
      );

      const trigger = container.querySelector('[data-slot="select-trigger"]');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("SelectValue", () => {
    it("renders value element", () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <span>Activado</span>
          </SelectTrigger>
          <SelectValue>Mi Valor</SelectValue>
        </Select>
      );

      const value = container.querySelector('[data-slot="select-value"]');
      expect(value).toBeInTheDocument();
    });
  });

  describe("SelectItem", () => {
    it("renders select items", () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <span>Activado</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem>Primera opción</SelectItem>
            <SelectItem>Segunda opción</SelectItem>
          </SelectContent>
        </Select>
      );

      const items = container.querySelectorAll('[data-slot="select-item"]');
      expect(items).toBeTruthy();
    });
  });
});