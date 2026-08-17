import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { cmsMedia } from "@/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [media] = await db.select().from(cmsMedia).where(and(eq(cmsMedia.id, id), isNull(cmsMedia.deletedAt))).limit(1);
  if (!media) return new Response("Not found", { status: 404 });
  const root = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");
  const absolutePath = path.resolve(root, ...media.relativePath.split("/"));
  if (!absolutePath.startsWith(`${root}${path.sep}`)) return new Response("Invalid path", { status: 400 });
  try {
    const body = await readFile(absolutePath);
    return new Response(new Uint8Array(body), { headers: { "Content-Type": media.mimeType, "Content-Length": String(media.size), "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(media.originalName)}` } });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
