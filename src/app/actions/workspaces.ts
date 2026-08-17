"use server";

import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { workspaceMenuItems, workspaces } from "@/db/schema";
import { requireUser } from "@/lib/authorization";
import { getAuthorizedNavigation } from "@/lib/navigation";
import { flattenNavigation } from "@/lib/workspaces";

const workspaceInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  menuItemIds: z.array(z.string().uuid()).min(1),
});

export async function saveWorkspaceAction(input: unknown) {
  const parsed = workspaceInput.parse(input);
  const user = await requireUser();
  const authorizedNavigation = await getAuthorizedNavigation(user);
  const authorizedIds = new Set(flattenNavigation(authorizedNavigation).map((item) => item.id));
  const requestedIds = [...new Set(parsed.menuItemIds)];
  if (requestedIds.some((id) => !authorizedIds.has(id))) throw new Error("工作区包含无权访问的菜单");

  const workspaceId = parsed.id ?? randomUUID();
  if (parsed.id) {
    const [owned] = await db.select({ id: workspaces.id }).from(workspaces).where(and(eq(workspaces.id, parsed.id), eq(workspaces.userId, user.id))).limit(1);
    if (!owned) throw new Error("工作区不存在或无权修改");
  }
  await db.transaction(async (tx) => {
    if (parsed.id) await tx.update(workspaces).set({ name: parsed.name }).where(and(eq(workspaces.id, parsed.id), eq(workspaces.userId, user.id)));
    else await tx.insert(workspaces).values({ id: workspaceId, userId: user.id, name: parsed.name });
    await tx.delete(workspaceMenuItems).where(eq(workspaceMenuItems.workspaceId, workspaceId));
    await tx.insert(workspaceMenuItems).values(requestedIds.map((menuItemId) => ({ workspaceId, menuItemId })));
  });
  revalidatePath("/", "layout");
  return { id: workspaceId };
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const user = await requireUser();
  const [workspace] = await db.select({ id: workspaces.id, isDefault: workspaces.isDefault }).from(workspaces).where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, user.id))).limit(1);
  if (!workspace) throw new Error("工作区不存在或无权删除");
  if (workspace.isDefault) throw new Error("默认工作区不能删除");
  const [remaining] = await db.select({ id: workspaces.id }).from(workspaces).where(and(eq(workspaces.userId, user.id), ne(workspaces.id, workspaceId))).limit(1);
  if (!remaining) throw new Error("至少需要保留一个工作区");
  await db.transaction(async (tx) => {
    await tx.delete(workspaceMenuItems).where(eq(workspaceMenuItems.workspaceId, workspaceId));
    await tx.delete(workspaces).where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, user.id)));
  });
  revalidatePath("/", "layout");
}
