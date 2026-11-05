import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TicketFilters,
  type TicketFiltersState,
} from "@/features/tickets/ticket-filters";

const baseValue: TicketFiltersState = {
  status: "",
  technicianId: "",
  establishment: "",
  employeeId: "",
  search: "",
};

const technicians = [{ id: 1, fullName: "Juan Pérez" }];
const employees = [{ id: 10, fullName: "María López" }];

// Harness con estado interno: replica cómo la página real realimenta onChange
function FiltersHarness({
  onChange,
  initial = baseValue,
}: {
  onChange: (next: TicketFiltersState) => void;
  initial?: TicketFiltersState;
}) {
  const [value, setValue] = useState(initial);
  return (
    <TicketFilters
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      technicians={technicians}
      employees={employees}
    />
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("TicketFilters", () => {
  it("debounces the search input before notifying onChange", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<FiltersHarness onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Buscar título"), {
      target: { value: "notebook" },
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(349));
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "notebook" }),
    );
  });

  it("notifies an empty search after clearing the input", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <FiltersHarness
        onChange={onChange}
        initial={{ ...baseValue, search: "old" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar título"), {
      target: { value: "" },
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(350));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "" }),
    );
  });

  it("updates the establishment filter immediately, without debounce", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersHarness onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("CUE…"), "0234567");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ establishment: "0234567" }),
    );
  });

  it("notifies status changes from the select", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersHarness onChange={onChange} />);

    const [statusSelect] = screen.getAllByRole("combobox");
    await user.click(statusSelect);
    await user.click(await screen.findByRole("option", { name: "ABIERTO" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ABIERTO" }),
    );
  });

  it("notifies technician selection as a string id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersHarness onChange={onChange} />);

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);
    await user.click(await screen.findByRole("option", { name: "Juan Pérez" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ technicianId: "1" }),
    );
  });
});
