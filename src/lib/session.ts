import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, inArray } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { menuItems, organizations, roleMenuItems, roles, sessions, userRoles, users } from "@/db/schema";
import type { PermissionDataGrant } from "@/lib/data-scope";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "neoadmin_session";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  tenantId: string;
  organizationId: string;
  roleCodes: string[];
  permissions: string[];
  permissionGrants: Record<string, PermissionDataGrant[]>;
};

export async function createSession(userId: string, metadata: { ipAddress?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86_400_000);
  await db.insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ...metadata,
  });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (process.env.APP_DEMO_MODE === "true") return { id: "user-admin", username: "admin", displayName: "系统管理员", avatarUrl: null, tenantId: "org-hq", organizationId: "org-hq", roleCodes: ["SUPER_ADMIN"], permissions: [], permissionGrants: {} };
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [record] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      tenantId: users.tenantId,
      organizationId: users.organizationId,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.enabled, true)))
    .limit(1);
  if (!record) return null;

  const grants = await db
    .select({
      roleCode: roles.code,
      dataScope: roleMenuItems.dataScope,
      permissionCode: menuItems.permissionCode,
      tenantId: userRoles.tenantId,
      anchorOrganizationId: userRoles.anchorOrganizationId,
    })
    .from(userRoles)
    .innerJoin(roles, and(eq(roles.id, userRoles.roleId), eq(roles.enabled, true)))
    .leftJoin(roleMenuItems, eq(roleMenuItems.roleId, roles.id))
    .leftJoin(menuItems, and(eq(menuItems.id, roleMenuItems.menuItemId), eq(menuItems.enabled, true)))
    .where(eq(userRoles.userId, record.id));

  const anchorIds = [...new Set(grants.map((grant) => grant.anchorOrganizationId))];
  const anchorRows = anchorIds.length
    ? await db.select({ id: organizations.id, path: organizations.path }).from(organizations).where(inArray(organizations.id, anchorIds))
    : [];
  const anchorPaths = new Map(anchorRows.map((organization) => [organization.id, organization.path]));
  const permissionGrants: Record<string, PermissionDataGrant[]> = {};
  for (const grant of grants) {
    if (!grant.permissionCode || !grant.dataScope) continue;
    const anchorOrganizationPath = anchorPaths.get(grant.anchorOrganizationId);
    if (!anchorOrganizationPath) continue;
    (permissionGrants[grant.permissionCode] ??= []).push({
      scope: grant.dataScope,
      tenantId: grant.tenantId,
      anchorOrganizationId: grant.anchorOrganizationId,
      anchorOrganizationPath,
    });
  }

  return {
    ...record,
    roleCodes: [...new Set(grants.map((grant) => grant.roleCode))],
    permissions: [...new Set(grants.flatMap((grant) => grant.permissionCode ? [grant.permissionCode] : []))],
    permissionGrants,
  };
}

export function hasPermission(user: AuthUser, permission: string) {
  return user.roleCodes.includes("SUPER_ADMIN") || user.permissions.includes(permission);
}
