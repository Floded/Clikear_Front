export interface BudgetLine {
  id?: number;
  inventoryItemId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Budget {
  id: number;
  code: string;
  customerName: string;
  establishmentCue?: string | null;
  issueDate: string;
  validUntil?: string | null;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  notes?: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  lines: BudgetLine[];
}

export interface BudgetLineInput {
  id?: number;
  inventoryItemId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface BudgetInput {
  customerName: string;
  establishmentCue?: string;
  validUntil?: string;
  notes?: string;
  lines: BudgetLineInput[];
}

export interface ListBudgetsQuery {
  establishmentCue?: string;
}
