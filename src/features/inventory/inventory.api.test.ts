import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import {
  adjustStock,
  createAssignment,
  createSupplier,
  fetchInventoryItems,
  fetchSuppliers,
  returnAssignment,
} from "@/features/inventory/inventory.api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockPatch = vi.mocked(api.patch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inventory.api", () => {
  it("fetchInventoryItems sends the filters as params", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await fetchInventoryItems({ search: "cable", hasStock: "true", page: 2 });

    expect(mockGet).toHaveBeenCalledWith("/inventory-items", {
      params: { search: "cable", hasStock: "true", page: 2 },
    });
  });

  it("fetchSuppliers sends the query as params", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await fetchSuppliers({ search: "sur", limit: 100 });

    expect(mockGet).toHaveBeenCalledWith("/suppliers", {
      params: { search: "sur", limit: 100 },
    });
  });

  it("createSupplier posts the input", async () => {
    const supplier = { id: 1, name: "Distribuidora Sur" };
    mockPost.mockResolvedValue({ data: supplier });
    const input = { name: "Distribuidora Sur", contactPhone: "221-555-0000" };

    await expect(createSupplier(input)).resolves.toEqual(supplier);
    expect(mockPost).toHaveBeenCalledWith("/suppliers", input);
  });

  it("adjustStock patches the item stock with the delta", async () => {
    const item = { id: 10, availableQuantity: 7 };
    mockPatch.mockResolvedValue({ data: item });

    await expect(adjustStock(10, -3)).resolves.toEqual(item);
    expect(mockPatch).toHaveBeenCalledWith("/inventory-items/10/stock", {
      quantity: -3,
    });
  });

  it("createAssignment posts the assignment payload", async () => {
    const assignment = { id: 1 };
    mockPost.mockResolvedValue({ data: assignment });
    const input = {
      inventoryItemId: 10,
      employeeId: 4,
      quantityAssigned: 2,
      deliveryDate: "2026-03-01",
    };

    await expect(createAssignment(input)).resolves.toEqual(assignment);
    expect(mockPost).toHaveBeenCalledWith("/assignments", input);
  });

  it("returnAssignment puts the return payload", async () => {
    const assignment = { id: 1 };
    mockPut.mockResolvedValue({ data: assignment });

    await expect(
      returnAssignment(1, { quantity: 1, returnDate: "2026-03-10" }),
    ).resolves.toEqual(assignment);
    expect(mockPut).toHaveBeenCalledWith("/assignments/1/return", {
      quantity: 1,
      returnDate: "2026-03-10",
    });
  });
});
