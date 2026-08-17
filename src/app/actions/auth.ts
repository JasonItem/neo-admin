"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { loginLogs, users } from "@/db/schema";
import { createSession, deleteCurrentSession, getCurrentUser } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入账号").max(64),
  password: z.string().min(1, "请输入密码").max(128),
});

export type LoginState = { message?: string; errors?: { username?: string[]; password?: string[] } } | undefined;

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  if (process.env.APP_DEMO_MODE === "true") redirect("/dashboard");

  const requestHeaders = await headers();
  const metadata = {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: requestHeaders.get("user-agent") ?? undefined,
  };
  const [user] = await db.select().from(users).where(eq(users.username, parsed.data.username)).limit(1);
  const valid = user?.enabled && await compare(parsed.data.password, user.passwordHash);
  await db.insert(loginLogs).values({
    username: parsed.data.username,
    userId: user?.id,
    event: valid ? "SUCCESS" : "FAILURE",
    reason: valid ? null : "账号、密码错误或账号已停用",
    ...metadata,
  });
  if (!valid || !user) return { message: "账号、密码错误或账号已停用" };

  await createSession(user.id, metadata);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  redirect("/dashboard");
}

export async function logoutAction() {
  if (process.env.APP_DEMO_MODE === "true") redirect("/login");
  const user = await getCurrentUser();
  if (user) await db.insert(loginLogs).values({ userId: user.id, username: user.username, event: "LOGOUT" });
  await deleteCurrentSession();
  redirect("/login");
}
