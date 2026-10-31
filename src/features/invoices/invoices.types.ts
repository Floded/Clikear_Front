export type InvoiceStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InvoiceRow {
  id: number;
  ticketId: string;
  voucherType: number;
  amount: string;
  status: InvoiceStatus;
  cae: string | null;
  errorMessage: string | null;
  createdAt: string;
}
