import axios from "axios";

import { api } from "@/lib/api";

import type {
  EstablishmentDetail,
  EstablishmentInput,
  Paginated,
  TicketDetail,
  TicketImage,
  TicketListItem,
  Technician,
} from "./tickets.types";

export interface TicketListQuery {
  status?: string;
  establishment?: string;
  technicianId?: number;
  /** Número = tickets de ese empleado, "none" = sin asignar */
  employeeId?: number | "none";
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

// Imágenes de cierre del ticket: subir, listar y borrar
export async function fetchTicketImages(id: string): Promise<TicketImage[]> {
  const { data } = await api.get<TicketImage[]>(`/tickets/${id}/images`);
  return data;
}

// URL pública de la imagen: <origin del backend>/uploads/tickets/<fileName>
export function ticketImageUrl(fileName: string): string {
  const base = api.defaults.baseURL ?? "";
  const origin = base.replace(/\/api\/?$/, "");
  return `${origin}/uploads/tickets/${fileName}`;
}

export async function uploadTicketImages(
  id: string,
  files: File[],
): Promise<TicketImage[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  const { data } = await api.post<TicketImage[]>(
    `/tickets/${id}/images`,
    formData,
  );
  return data;
}

export async function deleteTicketImage(
  id: string,
  imageId: number,
): Promise<void> {
  await api.delete(`/tickets/${id}/images/${imageId}`);
}

// Asigna (id > 0), reasigna o libera (employeeId null) el ticket
export async function assignTicket(
  id: string,
  employeeId: number | null,
): Promise<{ ticketId: string; assignedEmployee: { id: number; fullName: string } | null }> {
  const { data } = await api.patch<{
    ticketId: string;
    assignedEmployee: { id: number; fullName: string } | null;
  }>(`/tickets/${id}/assignment`, { employeeId });
  return data;
}

export async function fetchTechnicians(): Promise<Paginated<Technician>> {
  const { data } = await api.get<Paginated<Technician>>("/technicians", {
    params: { limit: 100 },
  });
  return data;
}

export async function fetchEstablishmentByCue(
  cue: string,
): Promise<EstablishmentDetail | null> {
  try {
    const { data } = await api.get<EstablishmentDetail>(
      `/establishments/${encodeURIComponent(cue)}`,
    );
    return data;
  } catch (err) {
    // 404 = CUE desconocido, no es un error para el formulario
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createTicket(input: {
  ticketId: bigint;
  establishmentCue?: string;
  establishment?: EstablishmentInput;
  title: string;
  status?: string;
  glpiClosedTicket?: string;
  openingTimestamp?: Date;
}): Promise<{ ticketId: string }> {
  const { data } = await api.post<{ ticketId: string }>("/tickets", {
    ticketId: input.ticketId.toString(),
    establishmentCue: input.establishmentCue,
    establishment: input.establishment,
    title: input.title,
    status: input.status,
    glpiClosedTicket: input.glpiClosedTicket,
    openingTimestamp: input.openingTimestamp?.toISOString(),
  });
  return data;
}
