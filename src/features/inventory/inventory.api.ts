import { api } from "@/lib/api";
import { downloadExcel } from "@/lib/download";

import type {
  Assignment,
  CustodyResponse,
  InventoryItem,
  Paginated,
  Supplier,
} from "./inventory.types";

export interface InventoryItemsQuery {
  search?: string;
  supplierId?: number;
  hasStock?: "true" | "false";
  page?: number;
  limit?: number;
}

export async function createInventoryItem(input: {
  name: string;
  description?: string;
  supplierId?: number;
  availableQuantity: number;
}): Promise<InventoryItem> {
  const { data } = await api.post<InventoryItem>("/inventory-items", input);
  return data;
}
export async function fetchInventoryItems(
  query: InventoryItemsQuery,
): Promise<Paginated<InventoryItem>> {
  const { data } = await api.get<Paginated<InventoryItem>>("/inventory-items", {
    params: query,
  });
  return data;
}

export async function fetchInventoryItem(id: number): Promise<InventoryItem> {
  const { data } = await api.get<InventoryItem>(`/inventory-items/${id}`);
  return data;
}

export async function adjustStock(id: number, quantity: number): Promise<InventoryItem> {
  const { data } = await api.patch<InventoryItem>(`/inventory-items/${id}/stock`, {
    quantity,
  });
  return data;
}

export async function fetchSuppliers(query: { search?: string; page?: number; limit?: number } = {}): Promise<Paginated<Supplier>> {
  const { data } = await api.get<Paginated<Supplier>>("/suppliers", { params: query });
  return data;
}

export async function fetchSupplier(id: number): Promise<Supplier> {
  const { data } = await api.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(input: {
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}): Promise<Supplier> {
  const { data } = await api.post<Supplier>("/suppliers", input);
  return data;
}

// Exporta todas las asignaciones de inventario a Excel
export async function exportAssignmentsExcel(): Promise<void> {
  await downloadExcel("/assignments/export", "asignaciones.xlsx");
}

export async function fetchAssignments(query: {
  employeeId?: number;
  inventoryItemId?: number;
  status?: "ACTIVE" | "RETURNED";
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<Assignment>> {
  const { data } = await api.get<Paginated<Assignment>>("/assignments", { params: query });
  return data;
}

export async function createAssignment(input: {
  inventoryItemId: number;
  employeeId: number;
  quantityAssigned: number;
  deliveryDate: string;
  notes?: string;
}): Promise<Assignment> {
  const { data } = await api.post<Assignment>("/assignments", input);
  return data;
}

export async function returnAssignment(
  id: number,
  input: { quantity?: number; returnDate?: string; notes?: string },
): Promise<Assignment> {
  const { data } = await api.put<Assignment>(`/assignments/${id}/return`, input);
  return data;
}

export async function fetchCustody(employeeId: number): Promise<CustodyResponse> {
  const { data } = await api.get<CustodyResponse>(`/employees/${employeeId}/assignments`);
  return data;
}
