import { api } from "@/lib/api";

import type {
  Paginated,
  TicketDetail,
  TicketListItem,
  Technician,
} from "./tickets.types";

export interface TicketListQuery {
  status?: string;
  establishment?: string;
  technicianId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchTickets(
  query: TicketListQuery,
): Promise<Paginated<TicketListItem>> {
  const { data } = await api.get<Paginated<TicketListItem>>("/tickets", {
    params: query,
  });
  return data;
}

export async function fetchTicketDetail(id: string): Promise<TicketDetail> {
  const { data } = await api.get<TicketDetail>(`/tickets/${id}`);
  return data;
}

export async function updateTicketStatus(
  id: string,
  status: string,
): Promise<{ ticketId: string; status: string }> {
  const { data } = await api.patch<{ ticketId: string; status: string }>(
    `/tickets/${id}/status`,
    { status },
  );
  return data;
}

export async function fetchTechnicians(): Promise<Paginated<Technician>> {
  const { data } = await api.get<Paginated<Technician>>("/technicians", {
    params: { limit: 100 },
  });
  return data;
}

export async function createTicket(input: {
  ticketId: bigint;
  establishmentCue?: string;
  title: string;
  status?: string;
  glpiClosedTicket?: string;
  openingTimestamp?: Date;
}): Promise<{ ticketId: string }> {
  const { data } = await api.post<{ ticketId: string }>("/tickets", {
    ticketId: input.ticketId.toString(),
    establishmentCue: input.establishmentCue,
    title: input.title,
    status: input.status,
    glpiClosedTicket: input.glpiClosedTicket,
    openingTimestamp: input.openingTimestamp?.toISOString(),
  });
  return data;
}
