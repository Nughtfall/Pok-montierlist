import { adminActor, adminOperationError, readJson, validationError } from "@/lib/admin-api";
import { adminResources, type AdminResource } from "@/lib/admin-validation";
import { deleteAdminResource, updateAdminResource } from "@/lib/admin-operations";

function resolveResource(value: string): AdminResource | null {
  return adminResources.find((resource) => resource === value) ?? null;
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/data/[resource]/[id]">) {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  const { resource: value, id } = await context.params; const resource = resolveResource(value);
  if (!resource) return Response.json({ error: "Unknown admin resource" }, { status: 404 });
  const payload = await readJson(request); if ("response" in payload) return payload.response;
  try {
    const result = await updateAdminResource(resource, id, payload.data, actor.id);
    return result.ok ? Response.json({ data: result.data }) : validationError(result.issues);
  } catch (error) { return adminOperationError(error); }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/data/[resource]/[id]">) {
  const actor = await adminActor(); if (actor instanceof Response) return actor;
  const { resource: value, id } = await context.params; const resource = resolveResource(value);
  if (!resource) return Response.json({ error: "Unknown admin resource" }, { status: 404 });
  try { return Response.json({ data: await deleteAdminResource(resource, id, actor.id) }); } catch (error) { return adminOperationError(error); }
}
