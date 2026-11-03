export interface Supplier {
  id: number;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  _count?: { inventoryItems: number };
}

export interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  supplierId: number | null;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
  supplier: { id: number; name: string } | null;
  _count?: { assignments: number };
}

export interface Assignment {
  id: number;
  inventoryItemId: number;
  employeeId: number;
  quantityAssigned: number;
  deliveryDate: string;
  returnDate: string | null;
  notes: string | null;
  createdAt: string;
  inventoryItem?: { id: number; name: string; description?: string | null };
  employee?: { id: number; fullName: string };
}

export interface CustodyResponse {
  employee: { id: number; fullName: string; isActive: boolean };
  unitsInCustody: number;
  data: Assignment[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
