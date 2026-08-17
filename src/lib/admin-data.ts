import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  loginLogs,
  menuItems,
  operationLogs,
  organizations,
  roleMenuItems,
  roles,
  userRoles,
  users,
} from "@/db/schema";
import type { DemoState } from "@/components/demo/demo-store";
import { buildDataScopeCondition, getPermissionDataGrants } from "@/lib/data-scope-query";
import { hasPermission, type AuthUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

function formatDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(value)
    .replaceAll("/", "-");
}

export async function getManagementState(authUser: AuthUser): Promise<DemoState> {
  const canListUsers = hasPermission(authUser, PERMISSIONS.userList);
  const isPlatformAdmin = authUser.roleCodes.includes("SUPER_ADMIN");
  const userScope = canListUsers
    ? buildDataScopeCondition(authUser, PERMISSIONS.userList, {
        tenantId: users.tenantId,
        organizationId: users.organizationId,
        organizationPath: organizations.path,
        ownerUserId: users.id,
      })
    : and(eq(users.tenantId, authUser.tenantId), eq(users.id, authUser.id));
  const [userRows, roleRows, menuRows, organizationRows, userRoleRows, roleMenuRows, operationRows, loginRows] =
    await Promise.all([
      db
        .select({
          id: users.id,
          tenantId: users.tenantId,
          organizationId: users.organizationId,
          username: users.username,
          displayName: users.displayName,
          phone: users.phone,
          email: users.email,
          gender: users.gender,
          enabled: users.enabled,
          bio: users.bio,
          createdAt: users.createdAt,
        })
        .from(users)
        .innerJoin(organizations, eq(organizations.id, users.organizationId))
        .where(userScope)
        .orderBy(desc(users.createdAt)),
      db.select().from(roles).where(isPlatformAdmin ? undefined : eq(roles.tenantId, authUser.tenantId)).orderBy(asc(roles.createdAt)),
      db.select().from(menuItems).orderBy(asc(menuItems.sortOrder)),
      db.select().from(organizations).orderBy(asc(organizations.sortOrder)),
      db.select().from(userRoles),
      db.select().from(roleMenuItems),
      db
        .select({
          id: operationLogs.id,
          actorId: operationLogs.actorId,
          time: operationLogs.createdAt,
          module: operationLogs.module,
          action: operationLogs.action,
          operator: users.displayName,
          method: operationLogs.method,
          path: operationLogs.path,
          success: operationLogs.success,
          ip: operationLogs.ipAddress,
        })
        .from(operationLogs)
        .leftJoin(users, eq(users.id, operationLogs.actorId))
        .orderBy(desc(operationLogs.createdAt))
        .limit(200),
      db.select().from(loginLogs).orderBy(desc(loginLogs.createdAt)).limit(200),
    ]);

  const organizationById = new Map(organizationRows.map((item) => [item.id, item]));
  const currentOrganization = organizationById.get(authUser.organizationId);
  const scopedUserRows = userRows;
  const visibleOrganizationIds = new Set(scopedUserRows.map((item) => item.organizationId));
  const organizationPermission = hasPermission(authUser, PERMISSIONS.organizationList)
    ? PERMISSIONS.organizationList
    : PERMISSIONS.userList;
  const organizationGrants = getPermissionDataGrants(authUser, organizationPermission);
  if (currentOrganization) {
    for (const organization of organizationRows) {
      if (organizationGrants.some((grant) => {
        if (grant.scope === "PLATFORM") return true;
        if (organization.tenantId !== grant.tenantId) return false;
        if (grant.scope === "TENANT") return true;
        if (grant.scope === "SELF" || grant.scope === "CURRENT_ORG") return organization.id === grant.anchorOrganizationId;
        return organization.path === grant.anchorOrganizationPath || organization.path.startsWith(`${grant.anchorOrganizationPath}/`);
      })) visibleOrganizationIds.add(organization.id);
    }
  }
  for (const organizationId of [...visibleOrganizationIds]) {
    let parentId = organizationById.get(organizationId)?.parentId;
    while (parentId) {
      const parent = organizationById.get(parentId);
      if (!parent || (parent.tenantId !== authUser.tenantId && !isPlatformAdmin)) break;
      visibleOrganizationIds.add(parentId);
      parentId = parent.parentId;
    }
  }
  const canListRoles = hasPermission(authUser, PERMISSIONS.roleList) || hasPermission(authUser, PERMISSIONS.userCreate) || hasPermission(authUser, PERMISSIONS.userUpdate);
  const ownRoleIds = new Set(userRoleRows.filter((item) => item.userId === authUser.id).map((item) => item.roleId));
  const visibleRoleRows = canListRoles ? roleRows : roleRows.filter((role) => ownRoleIds.has(role.id));
  const canListMenus = hasPermission(authUser, PERMISSIONS.menuList) || hasPermission(authUser, PERMISSIONS.roleList);
  const ownMenuIds = new Set(roleMenuRows.filter((item) => ownRoleIds.has(item.roleId)).map((item) => item.menuItemId));
  const visibleMenuRows = canListMenus ? menuRows : menuRows.filter((menu) => ownMenuIds.has(menu.id));

  return {
    users: scopedUserRows.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      organizationId: user.organizationId,
      roleIds: userRoleRows.filter((item) => item.userId === user.id).map((item) => item.roleId),
      phone: user.phone ?? "",
      email: user.email ?? "",
      gender: user.gender === "MALE" ? "男" : user.gender === "FEMALE" ? "女" : "未设置",
      enabled: user.enabled,
      createdAt: formatDate(user.createdAt),
      note: user.bio ?? "",
    })),
    roles: visibleRoleRows.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description ?? "",
      defaultDataScope: role.defaultDataScope,
      enabled: role.enabled,
      builtIn: role.builtIn,
      permissionIds: roleMenuRows.filter((item) => item.roleId === role.id).map((item) => item.menuItemId),
      permissionScopes: Object.fromEntries(roleMenuRows.filter((item) => item.roleId === role.id).map((item) => [item.menuItemId, item.dataScope])),
      createdAt: formatDate(role.createdAt),
    })),
    menus: visibleMenuRows.map((menu) => ({
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      type: menu.type,
      path: menu.path ?? "",
      icon: menu.icon ?? "",
      permissionCode: menu.permissionCode ?? "",
      sortOrder: menu.sortOrder,
      visible: menu.visible,
      enabled: menu.enabled,
      openMode: menu.openMode,
    })),
    organizations: organizationRows.filter((organization) => visibleOrganizationIds.has(organization.id)).map((organization) => ({
      id: organization.id,
      parentId: organization.parentId && visibleOrganizationIds.has(organization.parentId) ? organization.parentId : null,
      name: organization.name,
      code: organization.code,
      type: organization.type,
      sortOrder: organization.sortOrder,
      enabled: organization.enabled,
      createdAt: formatDate(organization.createdAt),
    })),
    operationLogs: operationRows.filter((log) => hasPermission(authUser, PERMISSIONS.operationLogList) || log.actorId === authUser.id).map((log) => ({
      id: String(log.id),
      time: formatDate(log.time),
      module: log.module,
      action: log.action,
      operator: log.operator ?? "系统",
      method: log.method,
      path: log.path,
      success: log.success,
      ip: log.ip ?? "—",
    })),
    loginLogs: loginRows.filter((log) => hasPermission(authUser, PERMISSIONS.loginLogList) || log.userId === authUser.id).map((log) => ({
      id: String(log.id),
      time: formatDate(log.createdAt),
      username: log.username,
      event: log.event,
      reason: log.reason ?? "",
      ip: log.ipAddress ?? "—",
      location: "—",
      browser: log.userAgent ?? "—",
    })),
  };
}
