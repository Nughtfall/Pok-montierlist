import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUserMock = vi.fn();
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ db: () => ({ user: { findUnique: findUserMock } }) }));

describe("admin API authorization", () => {
  beforeEach(() => { authMock.mockReset(); findUserMock.mockReset(); });

  it("requires authentication", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{}" }));
    expect(response?.status).toBe(401);
  });

  it("requires the ADMIN role", async () => {
    authMock.mockResolvedValue({ user: { id: "user", role: "ADMIN" } });
    findUserMock.mockResolvedValue({ id: "user", role: "USER", status: "ACTIVE" });
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{}" }));
    expect(response?.status).toBe(403);
  });

  it("rejects suspended administrators", async () => {
    authMock.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    findUserMock.mockResolvedValue({ id: "admin", role: "ADMIN", status: "SUSPENDED" });
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{}" }));
    expect(response?.status).toBe(401);
  });
});
