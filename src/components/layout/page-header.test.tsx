import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/page-header";

describe("PageHeader", () => {
  it("renders the title and description", () => {
    render(
      <PageHeader
        title="Organización"
        description="Altas y datos de contacto de los empleados."
      />,
    );
    expect(screen.getByRole("heading", { name: "Organización" })).toBeInTheDocument();
    expect(
      screen.getByText("Altas y datos de contacto de los empleados."),
    ).toBeInTheDocument();
  });
});
