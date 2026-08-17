import "server-only";

import { headers } from "next/headers";
import { db } from "@/db";
import { operationLogs } from "@/db/schema";

export async function writeOperationLog(entry: {
  actorId?: string;
  module: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  method: string;
  path: string;
  success: boolean;
  detail?: unknown;
}) {
  const requestHeaders = await headers();
  await db.insert(operationLogs).values({
    ...entry,
    detail: entry.detail ?? null,
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: requestHeaders.get("user-agent"),
  });
}
