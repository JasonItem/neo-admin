import "server-only";

import { randomUUID } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { workspaceMenuItems, workspaces } from "@/db/schema";
import { getAuthorizedNavigation, type NavigationItem } from "@/lib/navigation";
import type { AuthUser } from "@/lib/session";

export type AdminWorkspace = {
  id: string;
  name: string;
  isDefault: boolean;
  menuItemIds: string[];
  navigation: NavigationItem[];
};

export function flattenNavigation(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [item, ...flattenNavigation(item.children)]);
}

function filterNavigation(items: NavigationItem[], allowedIds: Set<string>): NavigationItem[] {
  return items.flatMap((item) => {
    const children = filterNavigation(item.children, allowedIds);
    return allowedIds.has(item.id) || children.length ? [{ ...item, children }] : [];
  });
}

export async function getWorkspaceExperience(user: AuthUser) {
  const navigation = await getAuthorizedNavigation(user);
  const authorizedMenuIds = flattenNavigation(navigation).map((item) => item.id);
  let rows = await db.select().from(workspaces).where(eq(workspaces.userId, user.id)).orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));

  if (!rows.length) {
    const workspaceId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(workspaces).values({ id: workspaceId, userId: user.id, name: "CMS管理", isDefault: true });
      if (authorizedMenuIds.length) await tx.insert(workspaceMenuItems).values(authorizedMenuIds.map((menuItemId) => ({ workspaceId, menuItemId })));
    });
    rows = await db.select().from(workspaces).where(eq(workspaces.userId, user.id)).orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));
  }

  const workspaceIds = rows.map((item) => item.id);
  const links = workspaceIds.length
    ? await db.select().from(workspaceMenuItems).where(inArray(workspaceMenuItems.workspaceId, workspaceIds))
    : [];
  const authorizedSet = new Set(authorizedMenuIds);
  const result: AdminWorkspace[] = rows.map((workspace) => {
    const menuItemIds = workspace.isDefault
      ? authorizedMenuIds
      : links.filter((item) => item.workspaceId === workspace.id && authorizedSet.has(item.menuItemId)).map((item) => item.menuItemId);
    return { ...workspace, menuItemIds, navigation: filterNavigation(navigation, new Set(menuItemIds)) };
  });

  return { workspaces: result, availableNavigation: navigation };
}
