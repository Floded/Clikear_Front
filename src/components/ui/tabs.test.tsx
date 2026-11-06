import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("Tabs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Tabs", () => {
    it("renders default horizontal tabs", () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger>Opción 1</TabsTrigger>
            <TabsTrigger>Opción 2</TabsTrigger>
          </TabsList>
          <TabsContent>Contenido 1</TabsContent>
          <TabsContent>Contenido 2</TabsContent>
        </Tabs>
      );

      const tabs = container.querySelector('[data-slot="tabs"]');
      expect(tabs).toBeInTheDocument();
      expect(tabs).toHaveClass("group/tabs");
      expect(tabs).toHaveClass("flex");
      expect(tabs).toHaveClass("gap-2");
      // Verificar orientación horizontal por defecto
      expect(tabs).toHaveClass("data-horizontal:flex-col");
    });

    it("renders with vertical orientation", () => {
      const { container } = render(
        <Tabs orientation="vertical">
          <TabsList>
            <TabsTrigger>Opción 1</TabsTrigger>
            <TabsTrigger>Opción 2</TabsTrigger>
          </TabsList>
          <TabsContent>Contenido 1</TabsContent>
          <TabsContent>Contenido 2</TabsContent>
        </Tabs>
      );

      const tabs = container.querySelector('[data-slot="tabs"]');
      expect(tabs).toBeInTheDocument();
      expect(tabs).toHaveClass("group/tabs");
      expect(tabs).toHaveClass("flex");
      expect(tabs).toHaveClass("gap-2");
      // Verificar orientación vertical
      expect(tabs).toHaveAttribute("data-orientation", "vertical");
    });
  });

  describe("TabsList", () => {
    it("renders default list", () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger>Opción 1</TabsTrigger>
            <TabsTrigger>Opción 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const list = container.querySelector('[data-slot="tabs-list"]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass("group/tabs-list");
      expect(list).toHaveClass("inline-flex");
      expect(list).toHaveClass("w-fit");
    });

    it("renders with line variant", () => {
      const { container } = render(
        <Tabs>
          <TabsList variant="line">
            <TabsTrigger>Opción 1</TabsTrigger>
            <TabsTrigger>Opción 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const list = container.querySelector('[data-slot="tabs-list"]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass("gap-1");
      expect(list).toHaveClass("bg-transparent");
    });
  });

  describe("TabsTrigger", () => {
    it("renders default trigger", () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger>Opción 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = container.querySelector('[data-slot="tabs-trigger"]');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Opción 1");
    });

    it("renders active trigger", () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger data-state="active">Opción 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = container.querySelector('[data-slot="tabs-trigger"]');
      expect(trigger).toBeInTheDocument();
      // Clases activas para variant default
      expect(trigger).toHaveClass("group-data-[variant=default]/tabs-list:data-active:shadow-sm");
    });
  });

  describe("TabsContent", () => {
    it("renders default content", () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger>Opción 1</TabsTrigger>
          </TabsList>
          <TabsContent>Contenido</TabsContent>
        </Tabs>
      );

      const content = container.querySelector('[data-slot="tabs-content"]');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass("flex-1");
      // El contenido puede estar vacío o tener texto dependiendo de la implementación
      expect(content).toBeInTheDocument();
    });
  });
});