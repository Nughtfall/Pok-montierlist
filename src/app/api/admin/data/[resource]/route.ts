import { adminActor, adminOperationError, readJson, validationError } from "@/lib/admin-api";
import { adminResources, type AdminResource } from "@/lib/admin-validation";
import { createAdminResource, listAdminResource } from "@/lib/admin-operations";

function resolveResource(value: string): AdminResource | null {
  return adminResources.find((resource) => resource === value) ?? null;
}

export async function GET(_request: Request, context: RouteContext<"/api/admin/data/[resource]">) {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  const resource = resolveResource((await context.params).resource);
  if (!resource) return Response.json({ error: "Unknown admin resource" }, { status: 404 });
  try { return Response.json({ data: await listAdminResource(resource) }); } catch (error) { return adminOperationError(error); }
}

export async function POST(request: Request, context: RouteContext<"/api/admin/data/[resource]">) {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  const resource = resolveResource((await context.params).resource);
  if (!resource) return Response.json({ error: "Unknown admin resource" }, { status: 404 });
  const payload = await readJson(request); if ("response" in payload) return payload.response;
  try {
    const result = await createAdminResource(resource, payload.data, actor.id);
    return result.ok ? Response.json({ data: result.data }, { status: 201 }) : validationError(result.issues);
  } catch (error) { return adminOperationError(error); }
}
