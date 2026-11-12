export type TicketStatus =
  | "ABIERTO"
  | "EN PROGRESO"
  | "TERMINADO"
  | "REABIERTO";

export const TICKET_STATUSES: TicketStatus[] = [
  "ABIERTO",
  "EN PROGRESO",
  "TERMINADO",
  "REABIERTO",
];

// Transiciones válidas (el backend valida igual; sirve para el Select del detalle)
export const ALLOWED_STATUS_TRANSITIONS: Record<
  TicketStatus,
  readonly TicketStatus[]
> = {
  ABIERTO: ["EN PROGRESO", "TERMINADO"],
  "EN PROGRESO": ["TERMINADO"],
  TERMINADO: ["REABIERTO"],
  REABIERTO: ["EN PROGRESO", "TERMINADO"],
};

export interface TicketImage {
  id: number;
  ticketId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

// Límites de imágenes de cierre (espejo de lo que valida el backend)
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_TICKET = 10;

export interface EstablishmentSummary {
  cue: string;
  name: string;
  department: string | null;
  locality: string | null;
  isSecondaryBuilding: boolean;
}

// Info que el formulario de ticket puede aportar para crear/completar el establecimiento
export interface EstablishmentInput {
  name: string;
  department?: string;
  locality?: string;
  address?: string;
  phone?: string;
  directorName?: string;
}

export interface EmployeeSummary {
  id: number;
  fullName: string;
  isActive: boolean;
}

export interface TicketListItem {
  ticketId: string;
  title: string;
  status: string;
  glpiClosedTicket: string | null;
  openingTimestamp: string | null;
  assignedEmployee: EmployeeSummary | null;
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

export interface TicketAssignment {
  id: number;
  ticketId: string;
  employeeId: number;
  assignedAt: string;
  releasedAt: string | null;
  employee: { id: number; fullName: string };
}

export interface TicketDetail {
  ticketId: string;
  establishmentCue: string | null;
  assignedEmployeeId: number | null;
  title: string;
  glpiClosedTicket: string | null;
  openingTimestamp: string | null;
  status: string;
  assignedEmployee: EmployeeSummary | null;
  establishment: EstablishmentDetail | null;
  assignments: TicketAssignment[];
  invoices: InvoiceItem[];
  images: TicketImage[];
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
