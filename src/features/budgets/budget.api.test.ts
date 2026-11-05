import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import {
  createBudget,
  getBudget,
  listBudgets,
  removeBudget,
  updateBudget,
} from "@/features/budgets/budget.api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

const budget = { id: 7, code: "PPT-0007" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("budget.api", () => {
  it("listBudgets fetches all budgets without params by default", async () => {
    mockGet.mockResolvedValue({ data: [budget] });

    await expect(listBudgets()).resolves.toEqual([budget]);
    expect(mockGet).toHaveBeenCalledWith("/budgets", { params: {} });
  });

  it("listBudgets forwards the establishment filter", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await listBudgets({ establishmentCue: "700083300" });

    expect(mockGet).toHaveBeenCalledWith("/budgets", {
      params: { establishmentCue: "700083300" },
    });
  });

  it("getBudget fetches a single budget by id", async () => {
    mockGet.mockResolvedValue({ data: budget });

    await expect(getBudget(7)).resolves.toEqual(budget);
    expect(mockGet).toHaveBeenCalledWith("/budgets/7");
  });

  it("createBudget posts the input", async () => {
    mockPost.mockResolvedValue({ data: budget });
    const input = { customerName: "Cliente", lines: [] };

    await expect(createBudget(input)).resolves.toEqual(budget);
    expect(mockPost).toHaveBeenCalledWith("/budgets", input);
  });

  it("updateBudget patches the budget with its id", async () => {
    mockPatch.mockResolvedValue({ data: budget });

    await expect(updateBudget(7, { customerName: "Nuevo" })).resolves.toEqual(
      budget,
    );
    expect(mockPatch).toHaveBeenCalledWith("/budgets/7", {
      customerName: "Nuevo",
    });
  });

  it("removeBudget deletes the budget", async () => {
    mockDelete.mockResolvedValue({ data: undefined });

    await removeBudget(7);

    expect(mockDelete).toHaveBeenCalledWith("/budgets/7");
  });
});
