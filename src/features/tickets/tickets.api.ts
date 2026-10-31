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
): Promise<TicketDetail> {
  const { data } = await api.patch<TicketDetail>(`/tickets/${id}/status`, {
    status,
  });
  return data;
}

export async function fetchTechnicians(): Promise<Paginated<Technician>> {
  const { data } = await api.get<Paginated<Technician>>("/technicians", {
    params: { limit: 100 },
  });
  return data;
}
