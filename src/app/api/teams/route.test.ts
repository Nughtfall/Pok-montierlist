import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ db: vi.fn() }));
vi.mock("@/lib/team-service", () => ({ createTeam: vi.fn(), TeamValidationError: class extends Error {} }));

describe("teams API authentication", () => {
  beforeEach(() => authMock.mockReset());

  it("rejects unauthenticated reads", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    expect((await GET()).status).toBe(401);
  });

  it("rejects unauthenticated writes", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/teams", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });
});
