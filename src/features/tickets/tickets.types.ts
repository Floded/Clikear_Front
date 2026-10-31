export type TicketStatus = "ABIERTO" | "EN PROGRESO" | "TERMINADO";

export const TICKET_STATUSES: TicketStatus[] = [
  "ABIERTO",
  "EN PROGRESO",
  "TERMINADO",
];

export interface EstablishmentSummary {
  cue: string;
  name: string;
  department: string | null;
  locality: string | null;
  isSecondaryBuilding: boolean;
}

export interface TicketListItem {
  ticketId: string;
  title: string;
  status: string;
  glpiClosedTicket: string | null;
  openingTimestamp: string | null;
  establishment: EstablishmentSummary | null;
}

export interface DispatchOrderInfo {
  id: number;
  dispatchCode: string;
  dispatchTimestamp: string;
  listStatus: string;
}

export interface TechnicianSummary {
  id: number;
  fullName: string;
}

export interface EstablishmentDetail extends EstablishmentSummary {
  address: string | null;
  phone: string | null;
  distanceKm: string | null;
  directorName: string | null;
  dispatchOrder: (DispatchOrderInfo & {
    technicians: { technician: TechnicianSummary }[];
  }) | null;
}

export interface InvoiceItem {
  id: number;
  voucherType: number;
  amount: string;
  status: string;
  cae: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface TicketDetail {
  ticketId: string;
  establishmentCue: string | null;
  title: string;
  glpiClosedTicket: string | null;
  openingTimestamp: string | null;
  status: string;
  establishment: EstablishmentDetail | null;
  invoices: InvoiceItem[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Technician {
  id: number;
  fullName: string;
}
