"use server";

import { hash } from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  menuItems,
  organizations,
  roleMenuItems,
  roles,
  sessions,
  tenants,
  userRoles,
  users,
} from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { writeOperationLog } from "@/lib/audit";
import {
  canAccessScopedRecord,
  canDelegateScopeForRole,
  canDelegateScopeToUser,
} from "@/lib/data-scope";
import { buildDataScopeCondition, getPermissionDataGrants } from "@/lib/data-scope-query";
import { PERMISSIONS } from "@/lib/permissions";
import { isDuplicateDatabaseError } from "@/lib/user-facing-error";
import {
  isAllowedOrganizationParent,
  isPlatformOrganizationType,
  organizationTypes,
  type OrganizationType,
} from "@/lib/organization-policy";

const id = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max);

async function getScopedUser(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  permission: string,
  userId: string,
) {
  const condition = buildDataScopeCondition(actor, permission, {
    tenantId: users.tenantId,
    organizationId: users.organizationId,
    organizationPath: organizations.path,
    ownerUserId: users.id,
  });
  const [target] = await db
    .select({ id: users.id, tenantId: users.tenantId, organizationId: users.organizationId })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .where(and(eq(users.id, userId), condition))
    .limit(1);
  if (!target) throw new Error("用户不存在或超出可操作的数据范围");
  return target;
}

async function getScopedOrganization(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  permission: string,
  organizationId: string,
  ownerUserId: string,
) {
  const [organization] = await db
    .select({ id: organizations.id, tenantId: organizations.tenantId, path: organizations.path })
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), eq(organizations.enabled, true)))
    .limit(1);
  if (!organization?.tenantId || !canAccessScopedRecord({
    userId: actor.id,
    grants: getPermissionDataGrants(actor, permission),
    record: {
      tenantId: organization.tenantId,
      organizationId: organization.id,
      organizationPath: organization.path,
      ownerUserId,
    },
  })) throw new Error("组织不存在或超出可操作的数据范围");
  return { ...organization, tenantId: organization.tenantId };
}

async function assertAssignableRoles(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  roleIds: string[],
  target: { userId: string; tenantId: string; organizationId: string; organizationPath: string },
) {
  const assignedRoles = await db.select({ id: roles.id, tenantId: roles.tenantId, code: roles.code }).from(roles).where(and(inArray(roles.id, roleIds), eq(roles.enabled, true)));
  if (assignedRoles.length !== new Set(roleIds).size) throw new Error("包含不存在或已停用的角色");
  if (assignedRoles.some((role) => role.tenantId !== target.tenantId && !(role.code === "SUPER_ADMIN" && actor.roleCodes.includes("SUPER_ADMIN")))) {
    throw new Error("不能分配其他公司的角色");
  }
  if (actor.roleCodes.includes("SUPER_ADMIN")) return;

  const grants = await db
    .select({ roleId: roleMenuItems.roleId, permissionCode: menuItems.permissionCode, dataScope: roleMenuItems.dataScope })
    .from(roleMenuItems)
    .innerJoin(menuItems, eq(menuItems.id, roleMenuItems.menuItemId))
    .where(and(inArray(roleMenuItems.roleId, roleIds), eq(menuItems.enabled, true)));
  for (const grant of grants) {
    if (!grant.permissionCode) continue;
    const actorGrants = getPermissionDataGrants(actor, grant.permissionCode);
    if (!canDelegateScopeToUser({
      actorUserId: actor.id,
      grants: actorGrants,
      requestedScope: grant.dataScope,
      targetUserId: target.userId,
      targetTenantId: target.tenantId,
      targetOrganizationId: target.organizationId,
      targetOrganizationPath: target.organizationPath,
    })) throw new Error(`不能分配超出自身授权范围的权限：${grant.permissionCode}`);
  }
}

const userInput = z.object({
  id: id.optional(),
  username: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(100),
  organizationId: id,
  roleIds: z.array(id).min(1),
  phone: optionalText(32),
  email: z.string().trim().email().or(z.literal("")),
  gender: z.enum(["男", "女", "未设置"]),
  enabled: z.boolean(),
  note: optionalText(1000),
  password: z.string().max(128).optional(),
});

export async function saveUserAction(input: unknown) {
  const parsed = userInput.parse(input);
  const permission = parsed.id ? PERMISSIONS.userUpdate : PERMISSIONS.userCreate;
  const actor = await requirePermission(permission);
  const userId = parsed.id ?? randomUUID();
  if (parsed.id) await getScopedUser(actor, permission, parsed.id);
  const targetOrganization = await getScopedOrganization(actor, permission, parsed.organizationId, userId);
  await assertAssignableRoles(actor, parsed.roleIds, {
    userId,
    tenantId: targetOrganization.tenantId,
    organizationId: targetOrganization.id,
    organizationPath: targetOrganization.path,
  });
  if (!parsed.id && (!parsed.password || parsed.password.length < 8)) throw new Error("初始密码至少 8 位");
  const values = {
    displayName: parsed.displayName,
    tenantId: targetOrganization.tenantId,
    organizationId: parsed.organizationId,
    phone: parsed.phone || null,
    email: parsed.email || null,
    gender: parsed.gender === "男" ? "MALE" as const : parsed.gender === "女" ? "FEMALE" as const : "UNKNOWN" as const,
    enabled: parsed.enabled,
    bio: parsed.note || null,
  };
  await db.transaction(async (tx) => {
    if (parsed.id) {
      const passwordHash = parsed.password ? await hash(parsed.password, 12) : undefined;
      await tx.update(users).set({ ...values, ...(passwordHash ? { passwordHash, passwordChangedAt: new Date() } : {}) }).where(eq(users.id, parsed.id));
      await tx.delete(userRoles).where(eq(userRoles.userId, parsed.id));
    } else {
      await tx.insert(users).values({ id: userId, username: parsed.username, passwordHash: await hash(parsed.password!, 12), ...values });
    }
    await tx.insert(userRoles).values(parsed.roleIds.map((roleId) => ({ userId, roleId, tenantId: targetOrganization.tenantId, anchorOrganizationId: parsed.organizationId })));
  });
  await writeOperationLog({ actorId: actor.id, module: "用户管理", action: parsed.id ? "修改用户" : "新增用户", resourceType: "user", resourceId: userId, method: parsed.id ? "PATCH" : "POST", path: "/system/users", success: true, detail: { username: parsed.username } });
  revalidatePath("/system/users");
}

export async function toggleUserAction(input: unknown) {
  const parsed = z.object({ id, enabled: z.boolean() }).parse(input);
  const actor = await requirePermission(PERMISSIONS.userUpdate);
  if (parsed.id === actor.id && !parsed.enabled) throw new Error("不能停用当前登录账号");
  const target = await getScopedUser(actor, PERMISSIONS.userUpdate, parsed.id);
  await db.update(users).set({ enabled: parsed.enabled }).where(and(eq(users.id, target.id), eq(users.tenantId, target.tenantId)));
  await writeOperationLog({ actorId: actor.id, module: "用户管理", action: parsed.enabled ? "启用用户" : "停用用户", resourceType: "user", resourceId: parsed.id, method: "PATCH", path: "/system/users", success: true });
  revalidatePath("/system/users");
}

export async function deleteUsersAction(input: unknown) {
  const ids = z.array(id).min(1).parse(input);
  const actor = await requirePermission(PERMISSIONS.userDelete);
  if (ids.includes(actor.id)) throw new Error("不能删除当前登录账号");
  const targets = await Promise.all(ids.map((userId) => getScopedUser(actor, PERMISSIONS.userDelete, userId)));
  const scopedIds = targets.map((target) => target.id);
  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(inArray(sessions.userId, scopedIds));
    await tx.delete(userRoles).where(inArray(userRoles.userId, scopedIds));
    await tx.delete(users).where(and(inArray(users.id, scopedIds), inArray(users.tenantId, [...new Set(targets.map((target) => target.tenantId))])));
  });
  await writeOperationLog({ actorId: actor.id, module: "用户管理", action: `删除 ${ids.length} 个用户`, resourceType: "user", method: "DELETE", path: "/system/users", success: true, detail: { ids } });
  revalidatePath("/system/users");
}

const roleInput = z.object({
  id: id.optional(),
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]*$/),
  description: optionalText(500),
  defaultDataScope: z.enum(["SELF", "CURRENT_ORG", "ORG_SUBTREE", "TENANT", "PLATFORM"]),
  enabled: z.boolean(),
});

export async function saveRoleAction(input: unknown) {
  const parsed = roleInput.parse(input);
  const actor = await requirePermission(parsed.id ? PERMISSIONS.roleUpdate : PERMISSIONS.roleCreate);
  const roleId = parsed.id ?? randomUUID();
  if (parsed.id) {
    const [targetRole] = await db.select({ tenantId: roles.tenantId, code: roles.code }).from(roles).where(eq(roles.id, parsed.id)).limit(1);
    if (!targetRole || (targetRole.tenantId !== actor.tenantId && !actor.roleCodes.includes("SUPER_ADMIN"))) throw new Error("角色不存在或不属于当前公司");
    if (targetRole.code === "SUPER_ADMIN" && !actor.roleCodes.includes("SUPER_ADMIN")) throw new Error("不能修改平台超级管理员角色");
  }
  if (parsed.defaultDataScope === "PLATFORM" && !actor.roleCodes.includes("SUPER_ADMIN")) throw new Error("只有平台超级管理员可以设置全平台数据范围");
  const values = { name: parsed.name, description: parsed.description || null, defaultDataScope: parsed.defaultDataScope, enabled: parsed.enabled };
  if (parsed.id) await db.update(roles).set(values).where(eq(roles.id, parsed.id));
  else await db.insert(roles).values({ id: roleId, tenantId: actor.tenantId, code: parsed.code, ...values });
  await writeOperationLog({ actorId: actor.id, module: "角色管理", action: parsed.id ? "修改角色" : "新增角色", resourceType: "role", resourceId: roleId, method: parsed.id ? "PATCH" : "POST", path: "/system/roles", success: true });
  revalidatePath("/system/roles");
}

export async function deleteRolesAction(input: unknown) {
  const ids = z.array(id).min(1).parse(input);
  const actor = await requirePermission(PERMISSIONS.roleDelete);
  const roleTenantCondition = actor.roleCodes.includes("SUPER_ADMIN") ? undefined : eq(roles.tenantId, actor.tenantId);
  const deletable = await db.select({ id: roles.id }).from(roles).where(and(inArray(roles.id, ids), eq(roles.builtIn, false), roleTenantCondition));
  const roleIds = deletable.map((item) => item.id);
  if (roleIds.length) await db.transaction(async (tx) => {
    await tx.delete(roleMenuItems).where(inArray(roleMenuItems.roleId, roleIds));
    await tx.delete(userRoles).where(inArray(userRoles.roleId, roleIds));
    await tx.delete(roles).where(inArray(roles.id, roleIds));
  });
  await writeOperationLog({ actorId: actor.id, module: "角色管理", action: `删除 ${roleIds.length} 个角色`, resourceType: "role", method: "DELETE", path: "/system/roles", success: true });
  revalidatePath("/system/roles");
}

export async function grantRolePermissionsAction(input: unknown) {
  const parsed = z.object({
    roleId: id,
    permissions: z.array(z.object({
      menuItemId: id,
      dataScope: z.enum(["SELF", "CURRENT_ORG", "ORG_SUBTREE", "TENANT", "PLATFORM"]),
    })),
  }).parse(input);
  const actor = await requirePermission(PERMISSIONS.roleGrant);
  const [role] = await db.select({ tenantId: roles.tenantId, code: roles.code }).from(roles).where(eq(roles.id, parsed.roleId)).limit(1);
  if (!role || (role.tenantId !== actor.tenantId && !actor.roleCodes.includes("SUPER_ADMIN"))) throw new Error("角色不存在或不属于当前公司");
  if (new Set(parsed.permissions.map((item) => item.menuItemId)).size !== parsed.permissions.length) throw new Error("权限列表包含重复项");
  if (parsed.permissions.some((item) => item.dataScope === "PLATFORM") && !actor.roleCodes.includes("SUPER_ADMIN")) throw new Error("只有平台管理员可以授予全平台数据范围");
  if (parsed.permissions.length) {
    const selectedMenuItems = await db
      .select({ id: menuItems.id, permissionCode: menuItems.permissionCode })
      .from(menuItems)
      .where(and(inArray(menuItems.id, parsed.permissions.map((item) => item.menuItemId)), eq(menuItems.enabled, true)));
    if (selectedMenuItems.length !== parsed.permissions.length) throw new Error("权限列表包含不存在或已停用的菜单项");
    if (!actor.roleCodes.includes("SUPER_ADMIN")) {
      const selectedById = new Map(selectedMenuItems.map((item) => [item.id, item]));
      for (const requested of parsed.permissions) {
        const permissionCode = selectedById.get(requested.menuItemId)?.permissionCode;
        if (!permissionCode) continue;
        if (!canDelegateScopeForRole({
          grants: getPermissionDataGrants(actor, permissionCode),
          requestedScope: requested.dataScope,
          targetTenantId: role.tenantId,
        })) throw new Error(`不能授予超出自身授权范围的权限：${permissionCode}`);
      }
    }
  }
  await db.transaction(async (tx) => {
    await tx.delete(roleMenuItems).where(eq(roleMenuItems.roleId, parsed.roleId));
    if (parsed.permissions.length) await tx.insert(roleMenuItems).values(parsed.permissions.map((item) => ({ roleId: parsed.roleId, ...item })));
  });
  await writeOperationLog({ actorId: actor.id, module: "角色管理", action: "分配权限", resourceType: "role", resourceId: parsed.roleId, method: "PUT", path: "/system/roles", success: true });
  revalidatePath("/system/roles");
}

const menuInput = z.object({
  id: id.optional(), parentId: id.nullable(), name: z.string().trim().min(1).max(100),
  type: z.enum(["DIRECTORY", "MENU", "BUTTON"]), path: optionalText(255), icon: optionalText(64),
  permissionCode: optionalText(128), sortOrder: z.number().int().min(0), visible: z.boolean(), enabled: z.boolean(),
  openMode: z.enum(["INTERNAL", "EMBED", "EXTERNAL"]),
});

export async function saveMenuAction(input: unknown) {
  const parsed = menuInput.parse(input);
  const actor = await requirePermission(parsed.id ? PERMISSIONS.menuUpdate : PERMISSIONS.menuCreate);
  if (parsed.type === "BUTTON" && !parsed.permissionCode) throw new Error("按钮必须填写权限标识");
  const menuId = parsed.id ?? randomUUID();
  const values = { parentId: parsed.parentId, name: parsed.name, type: parsed.type, path: parsed.path || null, icon: parsed.icon || null, permissionCode: parsed.permissionCode || null, sortOrder: parsed.sortOrder, visible: parsed.visible, enabled: parsed.enabled, openMode: parsed.openMode };
  if (parsed.id) await db.update(menuItems).set(values).where(eq(menuItems.id, parsed.id));
  else await db.insert(menuItems).values({ id: menuId, ...values });
  await writeOperationLog({ actorId: actor.id, module: "菜单管理", action: parsed.id ? "修改菜单" : "新增菜单", resourceType: "menu", resourceId: menuId, method: parsed.id ? "PATCH" : "POST", path: "/system/menus", success: true });
  revalidatePath("/system/menus");
}

export async function deleteMenusAction(input: unknown) {
  const requested = z.array(id).min(1).parse(input);
  const actor = await requirePermission(PERMISSIONS.menuDelete);
  const all = await db.select({ id: menuItems.id, parentId: menuItems.parentId }).from(menuItems);
  const ids = new Set(requested);
  let changed = true;
  while (changed) { changed = false; for (const item of all) if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) { ids.add(item.id); changed = true; } }
  const values = [...ids];
  await db.transaction(async (tx) => {
    await tx.delete(roleMenuItems).where(inArray(roleMenuItems.menuItemId, values));
    await tx.delete(menuItems).where(inArray(menuItems.id, values));
  });
  await writeOperationLog({ actorId: actor.id, module: "菜单管理", action: `删除 ${values.length} 个菜单项`, resourceType: "menu", method: "DELETE", path: "/system/menus", success: true });
  revalidatePath("/system/menus");
}

const organizationInput = z.object({ id: id.optional(), parentId: id.nullable(), name: z.string().trim().min(1).max(100), code: z.string().trim().min(1).max(64), type: z.enum(organizationTypes), sortOrder: z.number().int().min(0), enabled: z.boolean() });

async function assertOrganizationAccess(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  permission: string,
  organization: { id: string; tenantId: string | null; path: string },
) {
  if (actor.roleCodes.includes("SUPER_ADMIN")) return;
  if (!organization.tenantId || !canAccessScopedRecord({
    userId: actor.id,
    grants: getPermissionDataGrants(actor, permission),
    record: {
      tenantId: organization.tenantId,
      organizationId: organization.id,
      organizationPath: organization.path,
      ownerUserId: "",
    },
  })) throw new Error("组织不存在或超出可操作的数据范围");
}

export async function saveOrganizationAction(input: unknown) {
  const parsed = organizationInput.parse(input);
  const permission = parsed.id ? PERMISSIONS.organizationUpdate : PERMISSIONS.organizationCreate;
  const actor = await requirePermission(permission);
  const isPlatformAdmin = actor.roleCodes.includes("SUPER_ADMIN");
  const organizationId = parsed.id ?? randomUUID();
  const [[organizationWithCode], [tenantWithCode]] = await Promise.all([
    db.select({ id: organizations.id }).from(organizations).where(eq(organizations.code, parsed.code)).limit(1),
    db.select({ id: tenants.id }).from(tenants).where(eq(tenants.code, parsed.code)).limit(1),
  ]);
  if (organizationWithCode && organizationWithCode.id !== parsed.id) throw new Error("组织编码已存在");
  if (parsed.type === "COMPANY" && tenantWithCode && tenantWithCode.id !== organizationId) throw new Error("公司编码已存在");
  let parent: { id: string; path: string; tenantId: string | null; type: OrganizationType } | undefined;
  if (parsed.parentId) {
    if (parsed.parentId === organizationId) throw new Error("上级组织不能是自身");
    [parent] = await db.select({ id: organizations.id, path: organizations.path, tenantId: organizations.tenantId, type: organizations.type }).from(organizations).where(eq(organizations.id, parsed.parentId)).limit(1);
    if (!parent) throw new Error("上级组织不存在");
  }
  if (!isAllowedOrganizationParent(parsed.type, parent?.type ?? null)) throw new Error("所选上级组织与组织类型不匹配");
  if (isPlatformOrganizationType(parsed.type) && !isPlatformAdmin) throw new Error("只有平台超级管理员可以管理集团和公司");
  if (parent && !isPlatformAdmin) await assertOrganizationAccess(actor, permission, parent);

  const path = parent ? `${parent.path}/${organizationId}` : organizationId;
  const tenantId = parsed.type === "GROUP" ? null : parsed.type === "COMPANY" ? organizationId : parent?.tenantId;
  if (parsed.type !== "GROUP" && !tenantId) throw new Error("分公司、部门或小组必须隶属于公司");
  const values = { tenantId, parentId: parsed.parentId, name: parsed.name, code: parsed.code, type: parsed.type, sortOrder: parsed.sortOrder, enabled: parsed.enabled, path };
  let current: { id: string; path: string; tenantId: string | null; type: OrganizationType } | undefined;
  let descendants: Array<{ id: string; path: string }> = [];
  if (parsed.id) {
    [current] = await db.select({ id: organizations.id, path: organizations.path, tenantId: organizations.tenantId, type: organizations.type }).from(organizations).where(eq(organizations.id, parsed.id)).limit(1);
    if (!current) throw new Error("组织不存在");
    if (current.type !== parsed.type) throw new Error("已创建的组织不能直接变更类型");
    if (isPlatformOrganizationType(current.type) && !isPlatformAdmin) throw new Error("只有平台超级管理员可以管理集团和公司");
    await assertOrganizationAccess(actor, permission, current);
    if (!isPlatformOrganizationType(current.type) && current.tenantId !== tenantId) throw new Error("不能将组织移动到其他公司");
    if (path.startsWith(`${current.path}/`)) throw new Error("不能选择自己的下级组织作为上级");
    descendants = await db.select({ id: organizations.id, path: organizations.path }).from(organizations);
  }
  try {
    if (parsed.id && current) {
      await db.transaction(async (tx) => {
        await tx.update(organizations).set(values).where(eq(organizations.id, parsed.id!));
        for (const child of descendants.filter((item) => item.path.startsWith(`${current.path}/`))) await tx.update(organizations).set({ path: child.path.replace(current.path, path) }).where(eq(organizations.id, child.id));
        if (current.type === "COMPANY") await tx.update(tenants).set({ name: parsed.name, code: parsed.code, enabled: parsed.enabled }).where(eq(tenants.id, current.id));
      });
    } else {
      await db.transaction(async (tx) => {
        if (parsed.type === "COMPANY") await tx.insert(tenants).values({ id: organizationId, name: parsed.name, code: parsed.code, enabled: parsed.enabled });
        await tx.insert(organizations).values({ id: organizationId, ...values });
      });
    }
  } catch (error) {
    if (isDuplicateDatabaseError(error)) throw new Error(parsed.type === "COMPANY" ? "公司编码已存在" : "组织编码已存在");
    throw new Error("组织保存失败，请稍后重试");
  }
  await writeOperationLog({ actorId: actor.id, module: "组织管理", action: parsed.id ? "修改组织" : "新增组织", resourceType: "organization", resourceId: organizationId, method: parsed.id ? "PATCH" : "POST", path: "/system/organizations", success: true });
  revalidatePath("/system/organizations");
}

export async function deleteOrganizationsAction(input: unknown) {
  const ids = [...new Set(z.array(id).min(1).parse(input))];
  const actor = await requirePermission(PERMISSIONS.organizationDelete);
  const targets = await db.select({ id: organizations.id, tenantId: organizations.tenantId, path: organizations.path, type: organizations.type }).from(organizations).where(inArray(organizations.id, ids));
  if (targets.length !== ids.length) throw new Error("包含不存在的组织");
  for (const target of targets) {
    if (isPlatformOrganizationType(target.type) && !actor.roleCodes.includes("SUPER_ADMIN")) throw new Error("只有平台超级管理员可以删除集团和公司");
    await assertOrganizationAccess(actor, PERMISSIONS.organizationDelete, target);
  }
  const companyTenantIds = targets.filter((item) => item.type === "COMPANY" && item.tenantId).map((item) => item.tenantId!);
  const [children, members, tenantRoles] = await Promise.all([
    db.select({ parentId: organizations.parentId }).from(organizations).where(inArray(organizations.parentId, ids)),
    db.select({ organizationId: users.organizationId }).from(users).where(inArray(users.organizationId, ids)),
    companyTenantIds.length ? db.select({ id: roles.id }).from(roles).where(inArray(roles.tenantId, companyTenantIds)) : Promise.resolve([]),
  ]);
  if (children.length || members.length || tenantRoles.length) throw new Error("存在下级组织、用户或公司角色，无法删除");
  await db.transaction(async (tx) => {
    await tx.delete(organizations).where(inArray(organizations.id, ids));
    if (companyTenantIds.length) await tx.delete(tenants).where(inArray(tenants.id, companyTenantIds));
  });
  await writeOperationLog({ actorId: actor.id, module: "组织管理", action: `删除 ${ids.length} 个组织`, resourceType: "organization", method: "DELETE", path: "/system/organizations", success: true });
  revalidatePath("/system/organizations");
}
