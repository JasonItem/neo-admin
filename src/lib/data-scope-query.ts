import "server-only";

import { and, eq, like, or, sql, type SQL } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";

import type { AuthUser } from "@/lib/session";
import { resolvePermissionDataGrants } from "@/lib/data-scope";

type DataScopeColumns = {
  tenantId: AnyMySqlColumn;
  organizationId: AnyMySqlColumn;
  organizationPath: AnyMySqlColumn;
  ownerUserId: AnyMySqlColumn;
};

export function getPermissionDataGrants(user: AuthUser, permission: string) {
  return resolvePermissionDataGrants({ ...user, permission });
}

export function buildDataScopeCondition(
  user: AuthUser,
  permission: string,
  columns: DataScopeColumns,
): SQL {
  const grants = getPermissionDataGrants(user, permission);
  if (grants.some((grant) => grant.scope === "PLATFORM")) return sql`true`;
  if (!grants.length) return sql`false`;

  const rangeConditions = grants.flatMap<SQL>((grant) => {
    if (grant.tenantId !== user.tenantId) return [];
    if (grant.scope === "TENANT") return [sql`true`];
    if (grant.scope === "SELF") return [eq(columns.ownerUserId, user.id)];
    if (grant.scope === "CURRENT_ORG") return [eq(columns.organizationId, grant.anchorOrganizationId)];
    if (grant.scope === "ORG_SUBTREE") {
      return [or(
        eq(columns.organizationPath, grant.anchorOrganizationPath),
        like(columns.organizationPath, `${grant.anchorOrganizationPath}/%`),
      )!];
    }
    return [];
  });

  return and(
    eq(columns.tenantId, user.tenantId),
    rangeConditions.length ? or(...rangeConditions) : sql`false`,
  )!;
}
