"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { writeOperationLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { deleteCurrentSession } from "@/lib/session";

export async function updateProfileAction(formData: FormData) { const user = await requirePermission(PERMISSIONS.profileUpdate); const parsed = z.object({ displayName: z.string().trim().min(1).max(100), email: z.string().trim().email().or(z.literal("")), phone: z.string().trim().max(32) }).parse(Object.fromEntries(formData)); await db.update(users).set({ ...parsed, email: parsed.email || null, phone: parsed.phone || null }).where(eq(users.id, user.id)); await writeOperationLog({ actorId: user.id, module: "个人中心", action: "修改个人资料", resourceType: "user", resourceId: user.id, method: "PATCH", path: "/account/profile", success: true }); revalidatePath("/account/profile"); }

export async function changePasswordAction(formData: FormData) { const user = await requirePermission(PERMISSIONS.passwordUpdate); const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128), confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, "两次输入的新密码不一致").parse(Object.fromEntries(formData)); const [record] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1); if (!record || !(await compare(parsed.currentPassword, record.passwordHash))) throw new Error("当前密码不正确"); await db.update(users).set({ passwordHash: await hash(parsed.newPassword, 12), passwordChangedAt: new Date() }).where(eq(users.id, user.id)); await writeOperationLog({ actorId: user.id, module: "个人中心", action: "修改密码", resourceType: "user", resourceId: user.id, method: "PATCH", path: "/account/password", success: true }); await db.delete(sessions).where(eq(sessions.userId, user.id)); await deleteCurrentSession(); return { success: true }; }
