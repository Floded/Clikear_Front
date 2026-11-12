import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { TableHead } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { TableRow } from "@/components/ui/table";

describe("Table Head", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a table head cell", () => {
    const { container } = render(<TableHead>Nombre</TableHead>);

    const th = container.querySelector('[data-slot="table-head"]');
    expect(th).toBeInTheDocument();
    expect(th).toHaveTextContent("Nombre");
  });
});

describe("Table Row", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a table row with cells", () => {
    const { container } = render(
      <TableRow>
        <TableCell>Celda 1</TableCell>
        <TableCell>Celda 2</TableCell>
      </TableRow>
    );

    const tr = container.querySelector('[data-slot="table-row"]');
    expect(tr).toBeInTheDocument();

    const tds = container.querySelectorAll('[data-slot="table-cell"]');
    expect(tds).toHaveLength(2);
    expect(tds[0]).toHaveTextContent("Celda 1");
    expect(tds[1]).toHaveTextContent("Celda 2");
  });
});

describe("Table Cell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a table cell", () => {
    const { container } = render(<TableCell>Contenido de celda</TableCell>);

    const td = container.querySelector('[data-slot="table-cell"]');
    expect(td).toBeInTheDocument();
    expect(td).toHaveTextContent("Contenido de celda");
  });
});