import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketStatusBadge } from "./ticket-status-badge";

describe("TicketStatusBadge", () => {
  it.each(["ABIERTO", "EN PROGRESO", "TERMINADO"])(
    "renders the %s status",
    (status) => {
      render(<TicketStatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    },
  );

  it("renders unknown statuses without crashing", () => {
    render(<TicketStatusBadge status="CANCELADO" />);
    expect(screen.getByText("CANCELADO")).toBeInTheDocument();
  });
});
