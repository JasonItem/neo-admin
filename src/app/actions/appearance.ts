"use server";

import { z } from "zod";
import { db } from "@/db";
import { userAppearancePreferences } from "@/db/schema";
import { requireUser } from "@/lib/authorization";

const appearanceInput = z.object({
  layout: z.enum(["SIDEBAR", "TOP"]),
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"]),
  density: z.enum(["COMFORTABLE", "COMPACT"]),
});

export async function saveAppearanceAction(input: unknown) {
  const preference = appearanceInput.parse(input);
  const user = await requireUser();
  await db.insert(userAppearancePreferences).values({ userId: user.id, ...preference }).onDuplicateKeyUpdate({ set: preference });
  return preference;
}
