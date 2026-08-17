import type { NavigationItem } from "@/lib/navigation";

export type DemoUser = { id: string; username: string; displayName: string; organizationId: string; roleIds: string[]; phone: string; email: string; gender: "男" | "女" | "未设置"; enabled: boolean; createdAt: string; note: string };
export type DataScope = "SELF" | "CURRENT_ORG" | "ORG_SUBTREE" | "TENANT" | "PLATFORM";
export type DemoRole = { id: string; name: string; code: string; description: string; defaultDataScope: DataScope; enabled: boolean; builtIn?: boolean; permissionIds: string[]; permissionScopes: Record<string, DataScope>; createdAt: string };
export type DemoMenu = { id: string; parentId: string | null; name: string; type: "DIRECTORY" | "MENU" | "BUTTON"; path: string; icon: string; permissionCode: string; sortOrder: number; visible: boolean; enabled: boolean; openMode: "INTERNAL" | "EMBED" | "EXTERNAL" };
export type DemoOrganization = { id: string; parentId: string | null; name: string; code: string; type: "GROUP" | "COMPANY" | "BRANCH" | "DEPARTMENT" | "TEAM"; sortOrder: number; enabled: boolean; createdAt: string };
export type DemoOperationLog = { id: string; time: string; module: string; action: string; operator: string; method: string; path: string; success: boolean; ip: string };
export type DemoLoginLog = { id: string; time: string; username: string; event: "SUCCESS" | "FAILURE" | "LOGOUT"; reason: string; ip: string; location: string; browser: string };

export const demoOrganizations: DemoOrganization[] = [
  { id: "org-hq", parentId: null, name: "NeoAdmin 总部", code: "HQ", type: "COMPANY", sortOrder: 1, enabled: true, createdAt: "2026-01-08 09:00" },
  { id: "org-rd", parentId: "org-hq", name: "研发中心", code: "RD", type: "DEPARTMENT", sortOrder: 1, enabled: true, createdAt: "2026-01-08 09:10" },
  { id: "org-fe", parentId: "org-rd", name: "前端研发组", code: "RD-FE", type: "TEAM", sortOrder: 1, enabled: true, createdAt: "2026-01-08 09:20" },
  { id: "org-be", parentId: "org-rd", name: "后端研发组", code: "RD-BE", type: "TEAM", sortOrder: 2, enabled: true, createdAt: "2026-01-08 09:21" },
  { id: "org-product", parentId: "org-hq", name: "产品中心", code: "PRODUCT", type: "DEPARTMENT", sortOrder: 2, enabled: true, createdAt: "2026-01-08 09:30" },
  { id: "org-sales", parentId: "org-hq", name: "销售中心", code: "SALES", type: "DEPARTMENT", sortOrder: 3, enabled: true, createdAt: "2026-01-08 09:40" },
  { id: "org-east", parentId: "org-sales", name: "华东销售组", code: "SALES-EAST", type: "TEAM", sortOrder: 1, enabled: true, createdAt: "2026-01-08 09:50" },
  { id: "org-ops", parentId: "org-hq", name: "运营中心", code: "OPS", type: "DEPARTMENT", sortOrder: 4, enabled: true, createdAt: "2026-01-08 10:00" },
];

export const demoMenus: DemoMenu[] = [
  { id: "menu-dashboard", parentId: null, name: "数据概览", type: "MENU", path: "/dashboard", icon: "CircleGauge", permissionCode: "dashboard:view", sortOrder: 1, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "menu-system", parentId: null, name: "权限管理", type: "DIRECTORY", path: "", icon: "ShieldCheck", permissionCode: "", sortOrder: 2, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "menu-users", parentId: "menu-system", name: "用户管理", type: "MENU", path: "/system/users", icon: "Users", permissionCode: "system:user:list", sortOrder: 1, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "btn-user-create", parentId: "menu-users", name: "新增用户", type: "BUTTON", path: "", icon: "", permissionCode: "system:user:create", sortOrder: 1, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "btn-user-update", parentId: "menu-users", name: "修改用户", type: "BUTTON", path: "", icon: "", permissionCode: "system:user:update", sortOrder: 2, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "btn-user-delete", parentId: "menu-users", name: "删除用户", type: "BUTTON", path: "", icon: "", permissionCode: "system:user:delete", sortOrder: 3, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "menu-roles", parentId: "menu-system", name: "角色管理", type: "MENU", path: "/system/roles", icon: "ShieldCheck", permissionCode: "system:role:list", sortOrder: 2, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "btn-role-create", parentId: "menu-roles", name: "新增角色", type: "BUTTON", path: "", icon: "", permissionCode: "system:role:create", sortOrder: 1, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "btn-role-grant", parentId: "menu-roles", name: "分配权限", type: "BUTTON", path: "", icon: "", permissionCode: "system:role:grant", sortOrder: 2, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "menu-menus", parentId: "menu-system", name: "菜单管理", type: "MENU", path: "/system/menus", icon: "MenuSquare", permissionCode: "system:menu:list", sortOrder: 3, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "btn-menu-create", parentId: "menu-menus", name: "新增菜单", type: "BUTTON", path: "", icon: "", permissionCode: "system:menu:create", sortOrder: 1, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "menu-orgs", parentId: "menu-system", name: "组织管理", type: "MENU", path: "/system/organizations", icon: "Building2", permissionCode: "system:organization:list", sortOrder: 4, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "btn-org-create", parentId: "menu-orgs", name: "新增组织", type: "BUTTON", path: "", icon: "", permissionCode: "system:organization:create", sortOrder: 1, visible: false, enabled: true, openMode: "INTERNAL" },
  { id: "menu-operation", parentId: "menu-system", name: "操作日志", type: "MENU", path: "/system/operation-logs", icon: "FileClock", permissionCode: "system:operation-log:list", sortOrder: 5, visible: true, enabled: true, openMode: "INTERNAL" },
  { id: "menu-login", parentId: "menu-system", name: "登录日志", type: "MENU", path: "/system/login-logs", icon: "FileClock", permissionCode: "system:login-log:list", sortOrder: 6, visible: true, enabled: true, openMode: "INTERNAL" },
];

const allPermissionIds = demoMenus.map((item) => item.id);
const scopesFor = (ids: string[], scope: DataScope) => Object.fromEntries(ids.map((id) => [id, scope]));
export const demoRoles: DemoRole[] = [
  { id: "role-admin", name: "超级管理员", code: "SUPER_ADMIN", description: "拥有平台全部功能与数据权限", defaultDataScope: "PLATFORM", enabled: true, builtIn: true, permissionIds: allPermissionIds, permissionScopes: scopesFor(allPermissionIds, "PLATFORM"), createdAt: "2026-01-08 09:00" },
  { id: "role-manager", name: "部门管理员", code: "DEPT_MANAGER", description: "管理本组织及下级组织数据", defaultDataScope: "ORG_SUBTREE", enabled: true, permissionIds: allPermissionIds.filter((id) => !id.includes("delete")), permissionScopes: scopesFor(allPermissionIds.filter((id) => !id.includes("delete")), "ORG_SUBTREE"), createdAt: "2026-01-10 11:20" },
  { id: "role-member", name: "普通成员", code: "MEMBER", description: "仅可查看和维护本人数据", defaultDataScope: "SELF", enabled: true, permissionIds: ["menu-dashboard"], permissionScopes: scopesFor(["menu-dashboard"], "SELF"), createdAt: "2026-01-12 14:30" },
];

export const demoUsers: DemoUser[] = [
  { id: "user-admin", username: "admin", displayName: "系统管理员", organizationId: "org-hq", roleIds: ["role-admin"], phone: "13800000001", email: "admin@neoadmin.local", gender: "未设置", enabled: true, createdAt: "2026-01-08 09:00", note: "平台初始化管理员" },
  { id: "user-chen", username: "chenyu", displayName: "陈宇", organizationId: "org-rd", roleIds: ["role-manager"], phone: "13800000002", email: "chenyu@neoadmin.local", gender: "男", enabled: true, createdAt: "2026-02-16 10:25", note: "研发中心负责人" },
  { id: "user-lin", username: "linxia", displayName: "林夏", organizationId: "org-fe", roleIds: ["role-member"], phone: "13800000003", email: "linxia@neoadmin.local", gender: "女", enabled: true, createdAt: "2026-03-02 14:18", note: "" },
  { id: "user-zhou", username: "zhouming", displayName: "周明", organizationId: "org-be", roleIds: ["role-member"], phone: "13800000004", email: "zhouming@neoadmin.local", gender: "男", enabled: true, createdAt: "2026-03-05 09:42", note: "" },
  { id: "user-song", username: "songyi", displayName: "宋一", organizationId: "org-product", roleIds: ["role-manager"], phone: "13800000005", email: "songyi@neoadmin.local", gender: "女", enabled: true, createdAt: "2026-04-11 16:20", note: "" },
  { id: "user-wu", username: "wutong", displayName: "吴桐", organizationId: "org-sales", roleIds: ["role-manager"], phone: "13800000006", email: "wutong@neoadmin.local", gender: "女", enabled: true, createdAt: "2026-04-19 11:12", note: "" },
  { id: "user-zhao", username: "zhaoqi", displayName: "赵启", organizationId: "org-east", roleIds: ["role-member"], phone: "13800000007", email: "zhaoqi@neoadmin.local", gender: "男", enabled: false, createdAt: "2026-05-07 08:56", note: "账号暂时停用" },
  { id: "user-he", username: "hejing", displayName: "何静", organizationId: "org-ops", roleIds: ["role-member"], phone: "13800000008", email: "hejing@neoadmin.local", gender: "女", enabled: true, createdAt: "2026-06-22 13:37", note: "" },
];

export const demoOperationLogs: DemoOperationLog[] = Array.from({ length: 18 }, (_, i) => ({ id: `op-${i}`, time: `2026-07-${String(22 - Math.floor(i / 3)).padStart(2, "0")} ${String(9 + (i % 8)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`, module: ["用户管理", "角色管理", "菜单管理", "组织管理"][i % 4], action: ["新增", "修改", "查询", "分配权限"][i % 4], operator: i % 3 ? "系统管理员" : "陈宇", method: ["POST", "PATCH", "GET", "PUT"][i % 4], path: ["/system/users", "/system/roles", "/system/menus", "/system/organizations"][i % 4], success: i !== 7, ip: "103.151.173.202" }));
export const demoLoginLogs: DemoLoginLog[] = Array.from({ length: 22 }, (_, i) => ({ id: `login-${i}`, time: `2026-07-${String(22 - Math.floor(i / 4)).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 9) % 60).padStart(2, "0")}`, username: ["admin", "chenyu", "linxia", "zhaoqi"][i % 4], event: i % 7 === 0 ? "FAILURE" : i % 5 === 0 ? "LOGOUT" : "SUCCESS", reason: i % 7 === 0 ? "密码错误" : "", ip: `103.151.173.${200 + (i % 5)}`, location: "中国 上海", browser: i % 2 ? "Chrome / Windows" : "Edge / Windows" }));

export const demoNavigation: NavigationItem[] = [
  { id: "menu-dashboard", name: "数据概览", path: "/dashboard", icon: "CircleGauge", children: [] },
  { id: "menu-system", name: "权限管理", path: null, icon: "ShieldCheck", children: [
    { id: "menu-users", name: "用户管理", path: "/system/users", icon: "Users", children: [] },
    { id: "menu-roles", name: "角色管理", path: "/system/roles", icon: "ShieldCheck", children: [] },
    { id: "menu-menus", name: "菜单管理", path: "/system/menus", icon: "MenuSquare", children: [] },
    { id: "menu-orgs", name: "组织管理", path: "/system/organizations", icon: "Building2", children: [] },
    { id: "menu-operation", name: "操作日志", path: "/system/operation-logs", icon: "FileClock", children: [] },
    { id: "menu-login", name: "登录日志", path: "/system/login-logs", icon: "FileClock", children: [] },
  ] },
];

