import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";

describe("Card", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default variant", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Descripción</CardDescription>
        </CardHeader>
        <CardContent>Contenido</CardContent>
        <CardFooter>Pie de página</CardFooter>
      </Card>
    );

    // Verificar contenido de texto
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.getByText("Pie de página")).toBeInTheDocument();
  });

  it("renders with size sm", () => {
    render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>Título chico</CardTitle>
        </CardHeader>
        <CardContent>Contenido chico</CardContent>
      </Card>
    );

    expect(screen.getByText("Título chico")).toBeInTheDocument();
    expect(screen.getByText("Contenido chico")).toBeInTheDocument();
  });

  it("renders CardHeader", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título en header</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText("Título en header")).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(<Card><CardTitle>Título isolado</CardTitle></Card>);

    expect(screen.getByText("Título isolado")).toBeInTheDocument();
  });

  it("renders CardDescription", () => {
    render(<Card><CardDescription>Descripción isolada</CardDescription></Card>);

    expect(screen.getByText("Descripción isolada")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(<Card><CardContent>Contenido isolado</CardContent></Card>);

    expect(screen.getByText("Contenido isolado")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardFooter>
          <span>Acción</span>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Acción")).toBeInTheDocument();
  });
});