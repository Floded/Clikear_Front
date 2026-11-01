import { api } from "@/lib/api";

import type { Budget, ListBudgetsQuery } from "./budget.types";

export interface BudgetFormValues {
  customerName: string;
  establishmentCue?: string;
  validUntil?: string;
  notes?: string;
  lines: Array<{
    inventoryItemId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function listBudgets(query: ListBudgetsQuery = {}): Promise<{
  data: Budget[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const { data } = await api.get("/budgets", { params: query });
  return data;
}

export async function getBudget(id: number): Promise<Budget> {
  const { data } = await api.get(`/budgets/${id}`);
  return data;
}

export async function createBudget(input: {
  customerName: string;
  establishmentCue?: string;
  validUntil?: string;
  notes?: string;
  lines: Array<{
    inventoryItemId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}): Promise<Budget> {
  const { data } = await api.post<Budget>("/budgets", input);
  return data;
}

export async function updateBudget(
  id: number,
  input: Partial<{
    customerName: string;
    establishmentCue?: string;
    validUntil?: string;
    notes?: string;
    lines?: Array<{
      inventoryItemId?: number;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>
): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}`, input);
  return data;
}

export async function removeBudget(id: number): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
