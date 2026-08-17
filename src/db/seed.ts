import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";
import {
  menuItems,
  organizations,
  roleMenuItems,
  roles,
  tenants,
  userRoles,
  users,
} from "./schema";
import {
  PERMISSION_NAMES,
  PERMISSIONS,
  type PermissionCode,
} from "../lib/permissions";

if (existsSync(".env.local")) loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 2,
});
const db = drizzle({ client: pool });

const ids = {
  org: "00000000-0000-4000-8000-000000000001",
  admin: "00000000-0000-4000-8000-000000000002",
  role: "00000000-0000-4000-8000-000000000003",
  dashboard: "10000000-0000-4000-8000-000000000001",
  cms: "10000000-0000-4000-8000-000000000009",
  cmsSite: "10000000-0000-4000-8000-000000000010",
  cmsMedia: "10000000-0000-4000-8000-000000000011",
  cmsPages: "10000000-0000-4000-8000-000000000012",
  cmsNavigation: "10000000-0000-4000-8000-000000000013",
  cmsArticles: "10000000-0000-4000-8000-000000000014",
  cmsProducts: "10000000-0000-4000-8000-000000000015",
  cmsCases: "10000000-0000-4000-8000-000000000016",
  system: "10000000-0000-4000-8000-000000000002",
  users: "10000000-0000-4000-8000-000000000003",
  roles: "10000000-0000-4000-8000-000000000004",
  menus: "10000000-0000-4000-8000-000000000005",
  orgs: "10000000-0000-4000-8000-000000000006",
  operationLogs: "10000000-0000-4000-8000-000000000007",
  loginLogs: "10000000-0000-4000-8000-000000000008",
};

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const displayName = process.env.SEED_ADMIN_NAME ?? "系统管理员";
  await db
    .insert(tenants)
    .values({ id: ids.org, name: "总部", code: "HQ" })
    .onDuplicateKeyUpdate({ set: { name: "总部" } });
  await db
    .insert(organizations)
    .values({
      id: ids.org,
      tenantId: ids.org,
      name: "总部",
      code: "HQ",
      type: "COMPANY",
      path: ids.org,
      sortOrder: 1,
    })
    .onDuplicateKeyUpdate({ set: { name: "总部" } });
  await db
    .insert(roles)
    .values({
      id: ids.role,
      tenantId: null,
      name: "超级管理员",
      code: "SUPER_ADMIN",
      defaultDataScope: "PLATFORM",
      builtIn: true,
    })
    .onDuplicateKeyUpdate({
      set: { name: "超级管理员", defaultDataScope: "PLATFORM" },
    });
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const userId = existing?.id ?? ids.admin;
  if (!existing)
    await db
      .insert(users)
      .values({
        id: userId,
        tenantId: ids.org,
        organizationId: ids.org,
        username,
        passwordHash: await hash(password, 12),
        displayName,
      });
  await db
    .insert(userRoles)
    .values({
      userId,
      roleId: ids.role,
      tenantId: ids.org,
      anchorOrganizationId: ids.org,
    })
    .onDuplicateKeyUpdate({
      set: { tenantId: ids.org, anchorOrganizationId: ids.org },
    });

  const definitions = [
    {
      id: ids.dashboard,
      name: "数据概览",
      type: "MENU" as const,
      path: "/dashboard",
      icon: "CircleGauge",
      permissionCode: PERMISSIONS.dashboardView,
      sortOrder: 1,
    },
    {
      id: ids.cms,
      name: "网站管理",
      type: "DIRECTORY" as const,
      path: null,
      icon: "Globe2",
      permissionCode: null,
      sortOrder: 2,
    },
    {
      id: ids.cmsSite,
      parentId: ids.cms,
      name: "站点设置",
      type: "MENU" as const,
      path: "/cms/site",
      icon: "Globe2",
      permissionCode: PERMISSIONS.cmsSiteList,
      sortOrder: 1,
    },
    {
      id: ids.cmsMedia,
      parentId: ids.cms,
      name: "媒体库",
      type: "MENU" as const,
      path: "/cms/media",
      icon: "Images",
      permissionCode: PERMISSIONS.cmsMediaList,
      sortOrder: 2,
    },
    {
      id: ids.cmsPages,
      parentId: ids.cms,
      name: "页面管理",
      type: "MENU" as const,
      path: "/cms/pages",
      icon: "PanelsTopLeft",
      permissionCode: PERMISSIONS.cmsPageList,
      sortOrder: 3,
    },
    {
      id: ids.cmsNavigation,
      parentId: ids.cms,
      name: "栏目导航",
      type: "MENU" as const,
      path: "/cms/navigation",
      icon: "ListTree",
      permissionCode: PERMISSIONS.cmsNavigationList,
      sortOrder: 4,
    },
    {
      id: ids.cmsArticles,
      parentId: ids.cms,
      name: "文章新闻",
      type: "MENU" as const,
      path: "/cms/articles",
      icon: "Newspaper",
      permissionCode: PERMISSIONS.cmsArticleList,
      sortOrder: 5,
    },
    {
      id: ids.cmsProducts,
      parentId: ids.cms,
      name: "产品管理",
      type: "MENU" as const,
      path: "/cms/products",
      icon: "Package",
      permissionCode: PERMISSIONS.cmsProductList,
      sortOrder: 6,
    },
    {
      id: ids.cmsCases,
      parentId: ids.cms,
      name: "案例管理",
      type: "MENU" as const,
      path: "/cms/cases",
      icon: "BriefcaseBusiness",
      permissionCode: PERMISSIONS.cmsCaseList,
      sortOrder: 7,
    },
    {
      id: ids.system,
      name: "权限管理",
      type: "DIRECTORY" as const,
      path: null,
      icon: "ShieldCheck",
      permissionCode: null,
      sortOrder: 3,
    },
    {
      id: ids.users,
      parentId: ids.system,
      name: "用户管理",
      type: "MENU" as const,
      path: "/system/users",
      icon: "Users",
      permissionCode: PERMISSIONS.userList,
      sortOrder: 1,
    },
    {
      id: ids.roles,
      parentId: ids.system,
      name: "角色管理",
      type: "MENU" as const,
      path: "/system/roles",
      icon: "ShieldCheck",
      permissionCode: PERMISSIONS.roleList,
      sortOrder: 2,
    },
    {
      id: ids.menus,
      parentId: ids.system,
      name: "菜单管理",
      type: "MENU" as const,
      path: "/system/menus",
      icon: "MenuSquare",
      permissionCode: PERMISSIONS.menuList,
      sortOrder: 3,
    },
    {
      id: ids.orgs,
      parentId: ids.system,
      name: "组织管理",
      type: "MENU" as const,
      path: "/system/organizations",
      icon: "Building2",
      permissionCode: PERMISSIONS.organizationList,
      sortOrder: 4,
    },
    {
      id: ids.operationLogs,
      parentId: ids.system,
      name: "操作日志",
      type: "MENU" as const,
      path: "/system/operation-logs",
      icon: "FileClock",
      permissionCode: PERMISSIONS.operationLogList,
      sortOrder: 5,
    },
    {
      id: ids.loginLogs,
      parentId: ids.system,
      name: "登录日志",
      type: "MENU" as const,
      path: "/system/login-logs",
      icon: "FileClock",
      permissionCode: PERMISSIONS.loginLogList,
      sortOrder: 6,
    },
  ];
  const buttonParents = [
    [ids.cmsSite, [PERMISSIONS.cmsSiteUpdate]],
    [
      ids.cmsMedia,
      [
        PERMISSIONS.cmsMediaUpload,
        PERMISSIONS.cmsMediaUpdate,
        PERMISSIONS.cmsMediaDelete,
      ],
    ],
    [ids.cmsPages, [PERMISSIONS.cmsPageManage]],
    [ids.cmsNavigation, [PERMISSIONS.cmsNavigationManage]],
    [ids.cmsArticles, [PERMISSIONS.cmsArticleManage]],
    [ids.cmsProducts, [PERMISSIONS.cmsProductManage]],
    [ids.cmsCases, [PERMISSIONS.cmsCaseManage]],
    [
      ids.users,
      [PERMISSIONS.userCreate, PERMISSIONS.userUpdate, PERMISSIONS.userDelete],
    ],
    [
      ids.roles,
      [
        PERMISSIONS.roleCreate,
        PERMISSIONS.roleUpdate,
        PERMISSIONS.roleDelete,
        PERMISSIONS.roleGrant,
      ],
    ],
    [
      ids.menus,
      [PERMISSIONS.menuCreate, PERMISSIONS.menuUpdate, PERMISSIONS.menuDelete],
    ],
    [
      ids.orgs,
      [
        PERMISSIONS.organizationCreate,
        PERMISSIONS.organizationUpdate,
        PERMISSIONS.organizationDelete,
      ],
    ],
    [ids.system, [PERMISSIONS.profileUpdate, PERMISSIONS.passwordUpdate]],
  ] as const;
  const allDefinitions: Array<
    | (typeof definitions)[number]
    | {
        id: string;
        parentId: string;
        name: string;
        type: "BUTTON";
        path: null;
        icon: null;
        permissionCode: string;
        sortOrder: number;
        visible: boolean;
      }
  > = [...definitions];
  let sequence = 100;
  for (const [parentId, permissions] of buttonParents)
    for (const permissionCode of permissions)
      allDefinitions.push({
        id: `20000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`,
        parentId,
        name: PERMISSION_NAMES[permissionCode as PermissionCode],
        type: "BUTTON",
        path: null,
        icon: null,
        permissionCode,
        sortOrder: sequence,
        visible: false,
      });
  for (const definition of allDefinitions) {
    const [existingMenuItem] = definition.permissionCode
      ? await db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.permissionCode, definition.permissionCode))
          .limit(1)
      : [];
    const menuItemId = existingMenuItem?.id ?? definition.id;

    await db
      .insert(menuItems)
      .values({ ...definition, id: menuItemId })
      .onDuplicateKeyUpdate({
        set: {
          name: definition.name,
          parentId: definition.parentId ?? null,
          path: definition.path,
          icon: definition.icon,
          permissionCode: definition.permissionCode,
          sortOrder: definition.sortOrder,
          visible: "visible" in definition ? definition.visible : true,
        },
      });
    await db
      .insert(roleMenuItems)
      .values({ roleId: ids.role, menuItemId, dataScope: "PLATFORM" })
      .onDuplicateKeyUpdate({
        set: { dataScope: "PLATFORM" },
      });
  }
  console.log(`初始化完成。管理员账号：${username}`);
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
