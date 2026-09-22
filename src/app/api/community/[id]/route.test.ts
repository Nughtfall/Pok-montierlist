import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ db: vi.fn() }));
vi.mock("@/lib/community-service", () => ({
  updateCommunityList: vi.fn(),
  CommunityValidationError: class extends Error {},
}));

describe("community list owner authentication", () => {
  beforeEach(() => authMock.mockReset());

  it("rejects unauthenticated visibility changes", async () => {
    authMock.mockResolvedValue(null);
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/community/list-id", {
        method: "PATCH",
        body: JSON.stringify({ isPublic: true }),
      }),
      { params: Promise.resolve({ id: "list-id" }) },
    );
    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated deletion", async () => {
    authMock.mockResolvedValue(null);
    const { DELETE } = await import("./route");
    const response = await DELETE(new Request("http://localhost/api/community/list-id", { method: "DELETE" }), {
      params: Promise.resolve({ id: "list-id" }),
    });
    expect(response.status).toBe(401);
  });
});
