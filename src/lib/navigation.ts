import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, roleMenuItems, userRoles } from "@/db/schema";
import type { AuthUser } from "@/lib/session";
import { demoNavigation } from "@/lib/demo-data";

export type NavigationItem = { id: string; name: string; path: string | null; icon: string | null; children: NavigationItem[] };

export async function getAuthorizedNavigation(user: AuthUser): Promise<NavigationItem[]> {
  if (process.env.APP_DEMO_MODE === "true") return demoNavigation;
  const all = await db.select().from(menuItems).where(eq(menuItems.enabled, true)).orderBy(asc(menuItems.sortOrder));
  let allowedIds: Set<string>;
  if (user.roleCodes.includes("SUPER_ADMIN")) allowedIds = new Set(all.map((item) => item.id));
  else {
    const grants = await db.select({ id: roleMenuItems.menuItemId }).from(userRoles).innerJoin(roleMenuItems, eq(roleMenuItems.roleId, userRoles.roleId)).where(eq(userRoles.userId, user.id));
    allowedIds = new Set(grants.map((grant) => grant.id));
  }
  const byId = new Map(all.map((item) => [item.id, item]));
  for (const id of [...allowedIds]) { let parentId = byId.get(id)?.parentId; while (parentId) { allowedIds.add(parentId); parentId = byId.get(parentId)?.parentId; } }
  const visible = all.filter((item) => item.visible && item.type !== "BUTTON" && allowedIds.has(item.id));
  const build = (parentId: string | null): NavigationItem[] => visible.filter((item) => item.parentId === parentId).map((item) => ({ id: item.id, name: item.name, path: item.path, icon: item.icon, children: build(item.id) }));
  return build(null);
}
