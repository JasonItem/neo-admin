import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { requireApiPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { buildDataScopeCondition } from "@/lib/data-scope-query";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.userList);
  if (!auth.ok) return auth.response;
  const scope = buildDataScopeCondition(auth.user, PERMISSIONS.userList, {
    tenantId: users.tenantId,
    organizationId: users.organizationId,
    organizationPath: organizations.path,
    ownerUserId: users.id,
  });
  const rows = await db.select({ id: users.id, username: users.username, displayName: users.displayName, organizationId: users.organizationId, organizationName: organizations.name, enabled: users.enabled }).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(scope);
  return Response.json({ data: rows });
}
