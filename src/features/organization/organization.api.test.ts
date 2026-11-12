import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import {
  createEmployee,
  fetchEmployees,
  updateEmployee,
} from "@/features/organization/organization.api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);

const employee = { id: 3, fullName: "Ana Pérez", isActive: true };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("organization.api", () => {
  it("fetchEmployees sends the query as params", async () => {
    mockGet.mockResolvedValue({ data: { data: [employee] } });

    await fetchEmployees({ search: "ana", isActive: "true", limit: 100 });

    expect(mockGet).toHaveBeenCalledWith("/employees", {
      params: { search: "ana", isActive: "true", limit: 100 },
    });
  });

  it("fetchEmployees works without a query", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await fetchEmployees();

    expect(mockGet).toHaveBeenCalledWith("/employees", { params: {} });
  });

  it("createEmployee posts the input", async () => {
    mockPost.mockResolvedValue({ data: employee });
    const input = { fullName: "Ana Pérez", dniOrFileNumber: "30111222", isActive: true };

    await expect(createEmployee(input)).resolves.toEqual(employee);
    expect(mockPost).toHaveBeenCalledWith("/employees", input);
  });

  it("updateEmployee patches the employee with its id", async () => {
    mockPatch.mockResolvedValue({ data: employee });

    await expect(
      updateEmployee(3, { fullName: "Ana P.", isActive: false }),
    ).resolves.toEqual(employee);
    expect(mockPatch).toHaveBeenCalledWith("/employees/3", {
      fullName: "Ana P.",
      isActive: false,
    });
  });
});
