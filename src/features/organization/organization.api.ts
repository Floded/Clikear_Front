import { api } from "@/lib/api";

import type { Employee, Paginated } from "./organization.types";

export interface EmployeesQuery {
  search?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export async function fetchEmployees(query: EmployeesQuery = {}): Promise<Paginated<Employee>> {
  const { data } = await api.get<Paginated<Employee>>("/employees", { params: query });
  return data;
}

export async function createEmployee(input: {
  fullName: string;
  dniOrFileNumber: string;
  phone?: string;
  isActive: boolean;
}): Promise<Employee> {
  const { data } = await api.post<Employee>("/employees", input);
  return data;
}

export async function updateEmployee(
  id: number,
  input: {
    fullName?: string;
    dniOrFileNumber?: string;
    phone?: string;
    isActive?: boolean;
  },
): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}`, input);
  return data;
}
