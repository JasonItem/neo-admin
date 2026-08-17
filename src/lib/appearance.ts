import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userAppearancePreferences } from "@/db/schema";

export type AppearancePreference = {
  layout: "SIDEBAR" | "TOP";
  theme: "SYSTEM" | "LIGHT" | "DARK";
  density: "COMFORTABLE" | "COMPACT";
};

export async function getAppearancePreference(userId: string): Promise<AppearancePreference> {
  const [preference] = await db.select({ layout: userAppearancePreferences.layout, theme: userAppearancePreferences.theme, density: userAppearancePreferences.density }).from(userAppearancePreferences).where(eq(userAppearancePreferences.userId, userId)).limit(1);
  return preference ?? { layout: "SIDEBAR", theme: "SYSTEM", density: "COMFORTABLE" };
}
