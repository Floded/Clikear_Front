import { api } from "@/lib/api";

import type { Budget, BudgetInput, ListBudgetsQuery } from "./budget.types";

export async function listBudgets(query: ListBudgetsQuery = {}): Promise<Budget[]> {
  const { data } = await api.get<Budget[]>("/budgets", { params: query });
  return data;
}

export async function getBudget(id: number): Promise<Budget> {
  const { data } = await api.get(`/budgets/${id}`);
  return data;
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const { data } = await api.post<Budget>("/budgets", input);
  return data;
}

export async function updateBudget(id: number, input: Partial<BudgetInput>): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}`, input);
  return data;
}

export async function removeBudget(id: number): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
