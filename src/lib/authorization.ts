import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, hasPermission } from "@/lib/session";
export { canAccessScopedRecord, type ScopedRecord } from "@/lib/data-scope";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) redirect("/forbidden");
  return user;
}

export async function requireApiPermission(permission: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, response: Response.json({ message: "未登录" }, { status: 401 }) };
  if (!hasPermission(user, permission)) return { ok: false as const, response: Response.json({ message: "无权执行此操作" }, { status: 403 }) };
  return { ok: true as const, user };
}
