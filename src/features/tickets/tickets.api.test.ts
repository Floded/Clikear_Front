import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import {
  assignTicket,
  createTicket,
  deleteTicketImage,
  fetchEstablishmentByCue,
  fetchTicketDetail,
  fetchTicketImages,
  fetchTickets,
  updateTicketStatus,
  uploadTicketImages,
} from "@/features/tickets/tickets.api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

function axiosError(status: number) {
  return { isAxiosError: true, response: { status } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tickets.api", () => {
  it("fetchTickets sends the list filters as params", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await fetchTickets({ status: "ABIERTO", employeeId: "none", page: 2 });

    expect(mockGet).toHaveBeenCalledWith("/tickets", {
      params: { status: "ABIERTO", employeeId: "none", page: 2 },
    });
  });

  it("fetchTicketDetail fetches by id", async () => {
    const detail = { ticketId: "123" };
    mockGet.mockResolvedValue({ data: detail });

    await expect(fetchTicketDetail("123")).resolves.toEqual(detail);
    expect(mockGet).toHaveBeenCalledWith("/tickets/123");
  });

  it("updateTicketStatus patches the status", async () => {
    mockPatch.mockResolvedValue({ data: { ticketId: "123", status: "TERMINADO" } });

    await expect(updateTicketStatus("123", "TERMINADO")).resolves.toEqual({
      ticketId: "123",
      status: "TERMINADO",
    });
    expect(mockPatch).toHaveBeenCalledWith("/tickets/123/status", {
      status: "TERMINADO",
    });
  });

  it("assignTicket patches the employee id, including null to release", async () => {
    mockPatch.mockResolvedValue({ data: { ticketId: "123", assignedEmployee: null } });

    await expect(assignTicket("123", null)).resolves.toEqual({
      ticketId: "123",
      assignedEmployee: null,
    });
    expect(mockPatch).toHaveBeenCalledWith("/tickets/123/assignment", {
      employeeId: null,
    });
  });

  it("fetchEstablishmentByCue returns the establishment", async () => {
    const establishment = { cue: "700083300", name: "Escuela" };
    mockGet.mockResolvedValue({ data: establishment });

    await expect(fetchEstablishmentByCue("700083300")).resolves.toEqual(
      establishment,
    );
    expect(mockGet).toHaveBeenCalledWith("/establishments/700083300");
  });

  it("fetchEstablishmentByCue returns null on 404", async () => {
    mockGet.mockRejectedValue(axiosError(404));

    await expect(fetchEstablishmentByCue("000000000")).resolves.toBeNull();
  });

  it("fetchEstablishmentByCue rethrows other errors", async () => {
    mockGet.mockRejectedValue(axiosError(500));

    await expect(fetchEstablishmentByCue("700083300")).rejects.toBeTruthy();
  });

  it("fetchTicketImages gets the images list", async () => {
    const images = [
      { id: 1, ticketId: "123", fileName: "a.png", mimeType: "image/png", sizeBytes: 10, createdAt: "" },
    ];
    mockGet.mockResolvedValue({ data: images });

    await expect(fetchTicketImages("123")).resolves.toEqual(images);
    expect(mockGet).toHaveBeenCalledWith("/tickets/123/images");
  });

  it("uploadTicketImages posts a FormData with each file", async () => {
    mockPost.mockResolvedValue({ data: [] });
    const files = [new File(["a"], "a.png", { type: "image/png" })];

    await uploadTicketImages("123", files);

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe("/tickets/123/images");
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(formData.getAll("images")).toEqual(files);
  });

  it("deleteTicketImage sends the DELETE request", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    await expect(deleteTicketImage("123", 7)).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledWith("/tickets/123/images/7");
  });

  it("createTicket serializes the BigInt id and the opening date", async () => {
    mockPost.mockResolvedValue({ data: { ticketId: "123" } });

    await createTicket({
      ticketId: 123n,
      title: "Falla total",
      status: "ABIERTO",
      openingTimestamp: new Date("2026-03-01T10:00:00.000Z"),
    });

    expect(mockPost).toHaveBeenCalledWith("/tickets", {
      ticketId: "123",
      establishmentCue: undefined,
      establishment: undefined,
      title: "Falla total",
      status: "ABIERTO",
      glpiClosedTicket: undefined,
      openingTimestamp: "2026-03-01T10:00:00.000Z",
    });
  });
});
