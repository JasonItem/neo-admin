"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteMenusAction,
  deleteOrganizationsAction,
  deleteRolesAction,
  deleteUsersAction,
  grantRolePermissionsAction,
  saveMenuAction,
  saveOrganizationAction,
  saveRoleAction,
  saveUserAction,
  toggleUserAction,
} from "@/app/actions/admin";
import { updateProfileAction } from "@/app/actions/account";
import { demoLoginLogs, demoMenus, demoOperationLogs, demoOrganizations, demoRoles, demoUsers, type DataScope, type DemoLoginLog, type DemoMenu, type DemoOperationLog, type DemoOrganization, type DemoRole, type DemoUser } from "@/lib/demo-data";
import { getUserFacingError } from "@/lib/user-facing-error";

export type DemoState = { users: DemoUser[]; roles: DemoRole[]; menus: DemoMenu[]; organizations: DemoOrganization[]; operationLogs: DemoOperationLog[]; loginLogs: DemoLoginLog[] };
type DemoStore = DemoState & {
  currentUserId: string;
  isPlatformAdmin: boolean;
  can: (permission: string) => boolean;
  saveUser: (user: Omit<DemoUser, "id" | "createdAt"> & { id?: string; password?: string }) => void;
  deleteUsers: (ids: string[]) => void;
  toggleUser: (id: string, enabled: boolean) => void;
  saveRole: (role: Omit<DemoRole, "id" | "createdAt" | "permissionIds" | "permissionScopes"> & { id?: string; permissionIds?: string[]; permissionScopes?: Record<string, DataScope> }) => void;
  deleteRoles: (ids: string[]) => void;
  grantRole: (id: string, permissions: Array<{ menuItemId: string; dataScope: DataScope }>) => void;
  saveMenu: (menu: Omit<DemoMenu, "id"> & { id?: string }) => void;
  deleteMenus: (ids: string[]) => void;
  saveOrganization: (organization: Omit<DemoOrganization, "id" | "createdAt"> & { id?: string }) => void;
  deleteOrganizations: (ids: string[]) => void;
  updateProfile: (values: { displayName: string; email: string; phone: string }) => void;
  resetDemo: () => void;
};

const createDemoState = (): DemoState => ({ users: demoUsers.map((item) => ({ ...item, roleIds: [...item.roleIds] })), roles: demoRoles.map((item) => ({ ...item, permissionIds: [...item.permissionIds], permissionScopes: { ...item.permissionScopes } })), menus: demoMenus.map((item) => ({ ...item })), organizations: demoOrganizations.map((item) => ({ ...item })), operationLogs: demoOperationLogs.map((item) => ({ ...item })), loginLogs: demoLoginLogs.map((item) => ({ ...item })) });
const DemoContext = React.createContext<DemoStore | null>(null);

function timestamp() { return new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"); }
function id(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }

export function DemoStoreProvider({ children, initialState, currentUserId = "user-admin", permissions = [], roleCodes = [] }: { children: React.ReactNode; initialState?: DemoState; currentUserId?: string; permissions?: string[]; roleCodes?: string[] }) {
  const router = useRouter();
  const [state, setState] = React.useState<DemoState>(() => initialState ?? createDemoState());
  const [previousInitialState, setPreviousInitialState] = React.useState(initialState);
  if (initialState && initialState !== previousInitialState) {
    setPreviousInitialState(initialState);
    setState(initialState);
  }
  const persist = React.useCallback((task: Promise<unknown>) => {
    void task
      .catch((error: unknown) => toast.error(getUserFacingError(error)))
      .finally(() => router.refresh());
  }, [router]);
  const log = React.useCallback((module: string, action: string, path: string) => ({ id: id("op"), time: timestamp(), module, action, operator: "系统管理员", method: "PATCH", path, success: true, ip: "103.151.173.202" }), []);

  const value = React.useMemo<DemoStore>(() => ({ ...state, currentUserId, isPlatformAdmin: roleCodes.includes("SUPER_ADMIN"), can: (permission) => roleCodes.includes("SUPER_ADMIN") || permissions.includes(permission),
    saveUser(user) { setState((current) => { const exists = user.id && current.users.some((item) => item.id === user.id); const next: DemoUser = { ...user, id: user.id ?? id("user"), createdAt: exists ? current.users.find((item) => item.id === user.id)!.createdAt : timestamp() }; return { ...current, users: exists ? current.users.map((item) => item.id === next.id ? next : item) : [next, ...current.users], operationLogs: [log("用户管理", exists ? "修改用户" : "新增用户", "/system/users"), ...current.operationLogs] }; }); persist(saveUserAction(user)); },
    deleteUsers(ids) { setState((current) => ({ ...current, users: current.users.filter((item) => !ids.includes(item.id) || item.id === currentUserId), operationLogs: [log("用户管理", `删除 ${ids.length} 个用户`, "/system/users"), ...current.operationLogs] })); persist(deleteUsersAction(ids)); },
    toggleUser(userId, enabled) { setState((current) => ({ ...current, users: current.users.map((item) => item.id === userId ? { ...item, enabled } : item), operationLogs: [log("用户管理", enabled ? "启用用户" : "停用用户", "/system/users"), ...current.operationLogs] })); persist(toggleUserAction({ id: userId, enabled })); },
    saveRole(role) { setState((current) => { const exists = role.id && current.roles.some((item) => item.id === role.id); const old = current.roles.find((item) => item.id === role.id); const next: DemoRole = { ...role, id: role.id ?? id("role"), createdAt: old?.createdAt ?? timestamp(), permissionIds: role.permissionIds ?? old?.permissionIds ?? [], permissionScopes: role.permissionScopes ?? old?.permissionScopes ?? {}, builtIn: old?.builtIn }; return { ...current, roles: exists ? current.roles.map((item) => item.id === next.id ? next : item) : [next, ...current.roles], operationLogs: [log("角色管理", exists ? "修改角色" : "新增角色", "/system/roles"), ...current.operationLogs] }; }); persist(saveRoleAction(role)); },
    deleteRoles(ids) { setState((current) => ({ ...current, roles: current.roles.filter((item) => item.builtIn || !ids.includes(item.id)), users: current.users.map((user) => ({ ...user, roleIds: user.roleIds.filter((roleId) => !ids.includes(roleId)) })), operationLogs: [log("角色管理", `删除 ${ids.length} 个角色`, "/system/roles"), ...current.operationLogs] })); persist(deleteRolesAction(ids)); },
    grantRole(roleId, permissions) { const permissionIds = permissions.map((item) => item.menuItemId); const permissionScopes = Object.fromEntries(permissions.map((item) => [item.menuItemId, item.dataScope])); setState((current) => ({ ...current, roles: current.roles.map((item) => item.id === roleId ? { ...item, permissionIds, permissionScopes } : item), operationLogs: [log("角色管理", "分配权限", "/system/roles"), ...current.operationLogs] })); persist(grantRolePermissionsAction({ roleId, permissions })); },
    saveMenu(menu) { setState((current) => { const exists = menu.id && current.menus.some((item) => item.id === menu.id); const next: DemoMenu = { ...menu, id: menu.id ?? id("menu") }; return { ...current, menus: exists ? current.menus.map((item) => item.id === next.id ? next : item) : [...current.menus, next], operationLogs: [log("菜单管理", exists ? "修改菜单" : "新增菜单", "/system/menus"), ...current.operationLogs] }; }); persist(saveMenuAction(menu)); },
    deleteMenus(ids) { setState((current) => { const allIds = new Set(ids); let changed = true; while (changed) { changed = false; for (const menu of current.menus) if (menu.parentId && allIds.has(menu.parentId) && !allIds.has(menu.id)) { allIds.add(menu.id); changed = true; } } return { ...current, menus: current.menus.filter((item) => !allIds.has(item.id)), roles: current.roles.map((role) => ({ ...role, permissionIds: role.permissionIds.filter((permissionId) => !allIds.has(permissionId)), permissionScopes: Object.fromEntries(Object.entries(role.permissionScopes).filter(([permissionId]) => !allIds.has(permissionId))) })), operationLogs: [log("菜单管理", `删除 ${allIds.size} 个菜单项`, "/system/menus"), ...current.operationLogs] }; }); persist(deleteMenusAction(ids)); },
    saveOrganization(organization) { setState((current) => { const exists = organization.id && current.organizations.some((item) => item.id === organization.id); const next: DemoOrganization = { ...organization, id: organization.id ?? id("org"), createdAt: current.organizations.find((item) => item.id === organization.id)?.createdAt ?? timestamp() }; return { ...current, organizations: exists ? current.organizations.map((item) => item.id === next.id ? next : item) : [...current.organizations, next], operationLogs: [log("组织管理", exists ? "修改组织" : "新增组织", "/system/organizations"), ...current.operationLogs] }; }); persist(saveOrganizationAction(organization)); },
    deleteOrganizations(ids) { setState((current) => { const used = new Set(current.users.map((user) => user.organizationId)); const deletable = ids.filter((orgId) => !used.has(orgId) && !current.organizations.some((item) => item.parentId === orgId)); return { ...current, organizations: current.organizations.filter((item) => !deletable.includes(item.id)), operationLogs: [log("组织管理", `删除 ${deletable.length} 个组织`, "/system/organizations"), ...current.operationLogs] }; }); persist(deleteOrganizationsAction(ids)); },
    updateProfile(values) { setState((current) => ({ ...current, users: current.users.map((item) => item.id === currentUserId ? { ...item, ...values } : item), operationLogs: [log("个人中心", "修改个人资料", "/account/profile"), ...current.operationLogs] })); const formData = new FormData(); for (const [key, value] of Object.entries(values)) formData.set(key, value); persist(updateProfileAction(formData)); },
    resetDemo() { setState(createDemoState()); },
  }), [state, log, currentUserId, persist, permissions, roleCodes]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoStore() { const value = React.useContext(DemoContext); if (!value) throw new Error("useDemoStore must be used inside DemoStoreProvider"); return value; }
