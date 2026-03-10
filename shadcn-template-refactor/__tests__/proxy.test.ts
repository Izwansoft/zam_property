import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

function makeRequest(pathname: string, role?: string) {
  const url = `https://example.com${pathname}`;
  const headers = role
    ? { cookie: `zam_access_token=test-token; zam_user_role=${role}` }
    : undefined;
  return new NextRequest(url, { headers });
}

describe("proxy boundary hardening", () => {
  it("redirects SUPER_ADMIN away from blocked platform operations", () => {
    const request = makeRequest("/dashboard/platform/tenancies", "SUPER_ADMIN");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/forbidden");
  });

  it("redirects SUPER_ADMIN away from nested partner operational routes", () => {
    const request = makeRequest(
      "/dashboard/platform/partners/p-123/transactions",
      "SUPER_ADMIN",
    );

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/forbidden");
  });

  it("allows SUPER_ADMIN access to governance billing route", () => {
    const request = makeRequest("/dashboard/platform/billing", "SUPER_ADMIN");

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated users from protected routes to login", () => {
    const request = makeRequest("/dashboard/platform/billing");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?returnTo=%2Fdashboard%2Fplatform%2Fbilling");
    expect(response.headers.get("location")).toContain("reason=unauthorized");
  });
});
