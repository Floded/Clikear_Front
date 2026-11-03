export interface Employee {
  id: number;
  fullName: string;
  dniOrFileNumber: string;
  phone: string | null;
  isActive: boolean;
  _count?: { assignments: number };
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
