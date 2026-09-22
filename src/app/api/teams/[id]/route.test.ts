import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const dbMock = vi.fn();
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ db: dbMock }));
vi.mock("@/lib/team-service", () => ({
  duplicateTeam: vi.fn(),
  updateTeam: vi.fn(),
  TeamValidationError: class extends Error {},
}));

describe("saved team mutation authentication", () => {
  beforeEach(() => {
    authMock.mockReset();
    dbMock.mockReset();
  });

  it("rejects unauthenticated full team updates", async () => {
    authMock.mockResolvedValue(null);
    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/teams/team-id", { method: "PUT", body: "{}" }),
      { params: Promise.resolve({ id: "team-id" }) },
    );
    expect(response.status).toBe(401);
  });

  it("revokes the share token when an owner makes a team private", async () => {
    const update = vi.fn().mockResolvedValue({ id: "team-id", isPublic: false, shareSlug: null });
    authMock.mockResolvedValue({ user: { id: "owner-id", status: "ACTIVE" } });
    dbMock.mockReturnValue({
      team: {
        findFirst: vi.fn().mockResolvedValue({ id: "team-id", shareSlug: "old-share-token" }),
        update,
      },
    });
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/teams/team-id", {
        method: "PATCH",
        body: JSON.stringify({ isPublic: false }),
      }),
      { params: Promise.resolve({ id: "team-id" }) },
    );
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isPublic: false, shareSlug: null }),
    }));
  });
});
