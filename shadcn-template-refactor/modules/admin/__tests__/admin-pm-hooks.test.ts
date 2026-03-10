import { describe, expect, it, vi, beforeEach } from "vitest";

const { useApiPaginatedQueryMock } = vi.hoisted(() => ({
  useApiPaginatedQueryMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: vi.fn(),
  useApiPaginatedQuery: useApiPaginatedQueryMock,
}));

vi.mock("@/hooks/use-api-mutation", () => ({
  useApiMutation: vi.fn(),
}));

import { useAdminBills, useAdminPayouts } from "../hooks/admin-pm";

describe("admin-pm hooks partner scope wiring", () => {
  beforeEach(() => {
    useApiPaginatedQueryMock.mockReset();
  });

  it("passes partnerScope to useAdminBills for partner-scoped governance views", () => {
    useAdminBills({ page: 1, pageSize: 20 }, { partnerScope: "partner-123" });

    expect(useApiPaginatedQueryMock).toHaveBeenCalledTimes(1);
    expect(useApiPaginatedQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/rent-billings",
        partnerScope: "partner-123",
      }),
    );
  });

  it("passes partnerScope to useAdminPayouts for partner-scoped governance views", () => {
    useAdminPayouts({ page: 1, pageSize: 20 }, { partnerScope: "partner-456" });

    expect(useApiPaginatedQueryMock).toHaveBeenCalledTimes(1);
    expect(useApiPaginatedQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/payouts",
        partnerScope: "partner-456",
      }),
    );
  });

  it("does not set partnerScope when omitted", () => {
    useAdminBills({ page: 1, pageSize: 20 });

    expect(useApiPaginatedQueryMock).toHaveBeenCalledTimes(1);
    expect(useApiPaginatedQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/rent-billings",
        partnerScope: undefined,
      }),
    );
  });
});
