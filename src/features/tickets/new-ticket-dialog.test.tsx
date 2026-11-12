import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";
import { NewTicketDialog } from "@/features/tickets/new-ticket-dialog";
import { createTicket, fetchEstablishmentByCue } from "@/features/tickets/tickets.api";
import type { EstablishmentDetail } from "@/features/tickets/tickets.types";

vi.mock("@/features/tickets/tickets.api", () => ({
  createTicket: vi.fn(),
  fetchEstablishmentByCue: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateTicket = vi.mocked(createTicket);
const mockFetchEstablishment = vi.mocked(fetchEstablishmentByCue);
const mockToastSuccess = vi.mocked(toast.success);

const existingEstablishment: EstablishmentDetail = {
  cue: "700083300",
  name: "Escuela N° 12",
  department: "La Plata",
  locality: "La Plata",
  isSecondaryBuilding: false,
  address: "Calle Falsa 123",
  phone: "221-555-0000",
  distanceKm: "12.5",
  directorName: "Ana Pérez",
  dispatchOrder: null,
};

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <NewTicketDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

// jsdom puede bloquear el submit nativo (inputs numéricos); se dispara el
// evento directo para ejercitar la validación Zod del formulario
function submitForm() {
  const form = screen
    .getByRole("button", { name: "Crear ticket" })
    .closest("form");
  fireEvent.submit(form!);
}

async function fillBasicTicket(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field("ticketId"), "123");
  await user.type(field("title"), "Falla total");
}

// Los Label de este diálogo no tienen htmlFor; RHF sí asigna name a los inputs
function field(name: string): HTMLInputElement {
  const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!el) throw new Error(`input[name="${name}"] not found`);
  return el;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateTicket.mockResolvedValue({ ticketId: "123" });
  mockFetchEstablishment.mockResolvedValue(existingEstablishment);
});

describe("NewTicketDialog", () => {
  it("shows errors for empty ticket id and title", async () => {
    renderDialog();

    submitForm();

    expect(await screen.findByText("Ticket ID es obligatorio")).toBeInTheDocument();
    expect(await screen.findByText("El título es obligatorio")).toBeInTheDocument();
    expect(mockCreateTicket).not.toHaveBeenCalled();
  });

  it("rejects a ticket id that is not a positive integer", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(field("ticketId"), "0");
    await user.type(field("title"), "Falla menor");
    submitForm();

    expect(
      await screen.findByText("Debe ser un entero mayor a 0"),
    ).toBeInTheDocument();
    expect(mockCreateTicket).not.toHaveBeenCalled();
  });

  it("requires the establishment name when the CUE is new", async () => {
    mockFetchEstablishment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderDialog();

    await fillBasicTicket(user);
    await user.type(
      screen.getByPlaceholderText("700083300"),
      "700083300",
    );

    expect(
      await screen.findByText(
        "CUE nuevo: se creará el establecimiento junto con el ticket.",
        {},
        { timeout: 2000 },
      ),
    ).toBeInTheDocument();

    submitForm();

    expect(
      await screen.findByText("El nombre es obligatorio para un CUE nuevo"),
    ).toBeInTheDocument();
    expect(mockCreateTicket).not.toHaveBeenCalled();
  });

  it("preloads the establishment data when the CUE already exists", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText("700083300"), "700083300");

    expect(
      await screen.findByText(
        "Establecimiento registrado: se completarán solo los datos que falten.",
        {},
        { timeout: 2000 },
      ),
    ).toBeInTheDocument();
    expect(field("establishmentName")).toHaveValue("Escuela N° 12");
    expect(field("establishmentLocality")).toHaveValue("La Plata");
    expect(mockFetchEstablishment).toHaveBeenCalledWith("700083300");
  });

  it("creates the ticket converting the id to BigInt and closes", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await fillBasicTicket(user);
    submitForm();

    await waitFor(() =>
      expect(mockCreateTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 123n,
          title: "Falla total",
          status: "ABIERTO",
          establishmentCue: undefined,
          establishment: undefined,
        }),
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Ticket 123 creado");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend error when creation fails", async () => {
    mockCreateTicket.mockRejectedValue({
      response: { data: { error: "Ticket duplicado" } },
    });
    const user = userEvent.setup();
    renderDialog();

    await fillBasicTicket(user);
    submitForm();

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Ticket duplicado"),
    );
  });
});
