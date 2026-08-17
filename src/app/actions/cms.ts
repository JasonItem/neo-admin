"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { cmsMedia, cmsSiteSettings } from "@/db/schema";
import { writeOperationLog } from "@/lib/audit";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const siteSettingsInput = z.object({
  siteName: z.string().trim().min(1, "请填写网站名称").max(120),
  companyName: z.string().trim().min(1, "请填写企业名称").max(160),
  slogan: optionalText(255),
  description: optionalText(5000),
  phone: optionalText(50),
  email: z.union([z.literal(""), z.email("请输入正确的邮箱地址")]),
  address: optionalText(500),
  footerText: optionalText(500),
  seoTitle: optionalText(255),
  seoDescription: optionalText(500),
  enabled: z.boolean(),
});

const uploadRoot = () => path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");
const allowedTypes = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"],
  ["application/pdf", ".pdf"], ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.ms-excel", ".xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
]);

export async function saveCmsSiteSettingsAction(input: unknown) {
  const parsed = siteSettingsInput.parse(input);
  const actor = await requirePermission(PERMISSIONS.cmsSiteUpdate);
  const [existing] = await db.select({ id: cmsSiteSettings.id }).from(cmsSiteSettings).where(eq(cmsSiteSettings.tenantId, actor.tenantId)).limit(1);
  const values = {
    ...parsed,
    slogan: parsed.slogan || null,
    description: parsed.description || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    address: parsed.address || null,
    footerText: parsed.footerText || null,
    seoTitle: parsed.seoTitle || null,
    seoDescription: parsed.seoDescription || null,
  };
  const siteId = existing?.id ?? randomUUID();
  if (existing) await db.update(cmsSiteSettings).set(values).where(eq(cmsSiteSettings.id, existing.id));
  else await db.insert(cmsSiteSettings).values({ id: siteId, tenantId: actor.tenantId, ...values });
  await writeOperationLog({ actorId: actor.id, module: "站点设置", action: "更新站点设置", resourceType: "cms_site", resourceId: siteId, method: "PUT", path: "/cms/site", success: true });
  revalidatePath("/");
  revalidatePath("/cms/site");
}

export async function uploadCmsMediaAction(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.cmsMediaUpload);
  const file = formData.get("file");
  const altText = z.string().trim().max(255).parse(formData.get("altText") ?? "");
  if (!(file instanceof File) || !file.size) throw new Error("请选择需要上传的文件");
  if (file.size > 10 * 1024 * 1024) throw new Error("单个文件不能超过 10MB");
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("仅支持 JPG、PNG、WebP、GIF、PDF、Word 和 Excel 文件");

  const now = new Date();
  const storageName = `${randomUUID()}${extension}`;
  const relativePath = path.posix.join(actor.tenantId, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), storageName);
  const absolutePath = path.resolve(uploadRoot(), ...relativePath.split("/"));
  if (!absolutePath.startsWith(`${uploadRoot()}${path.sep}`)) throw new Error("文件路径无效");
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, new Uint8Array(await file.arrayBuffer()));

  const id = randomUUID();
  await db.insert(cmsMedia).values({
    id, tenantId: actor.tenantId, organizationId: actor.organizationId, originalName: file.name.slice(0, 255),
    storageName, relativePath, mimeType: file.type, extension, size: file.size, altText: altText || null, createdBy: actor.id,
  });
  await writeOperationLog({ actorId: actor.id, module: "媒体库", action: "上传媒体文件", resourceType: "cms_media", resourceId: id, method: "POST", path: "/cms/media", success: true, detail: { name: file.name, size: file.size } });
  revalidatePath("/cms/media");
  return { id };
}

export async function setCmsLogoAction(mediaId: string) {
  const actor = await requirePermission(PERMISSIONS.cmsSiteUpdate);
  const [media] = await db.select({ id: cmsMedia.id, mimeType: cmsMedia.mimeType }).from(cmsMedia).where(and(eq(cmsMedia.id, mediaId), eq(cmsMedia.tenantId, actor.tenantId), isNull(cmsMedia.deletedAt))).limit(1);
  if (!media || !media.mimeType.startsWith("image/")) throw new Error("只能将图片设为网站 Logo");
  const [settings] = await db.select({ id: cmsSiteSettings.id }).from(cmsSiteSettings).where(eq(cmsSiteSettings.tenantId, actor.tenantId)).limit(1);
  if (settings) await db.update(cmsSiteSettings).set({ logoMediaId: media.id }).where(eq(cmsSiteSettings.id, settings.id));
  else await db.insert(cmsSiteSettings).values({ id: randomUUID(), tenantId: actor.tenantId, siteName: "NeoAdmin 企业官网", companyName: "NeoAdmin 数字科技", logoMediaId: media.id });
  revalidatePath("/");
  revalidatePath("/cms/site");
  revalidatePath("/cms/media");
}

export async function deleteCmsMediaAction(mediaId: string) {
  const actor = await requirePermission(PERMISSIONS.cmsMediaDelete);
  const [media] = await db.select().from(cmsMedia).where(and(eq(cmsMedia.id, mediaId), eq(cmsMedia.tenantId, actor.tenantId), isNull(cmsMedia.deletedAt))).limit(1);
  if (!media) throw new Error("文件不存在或已删除");
  const [site] = await db.select({ id: cmsSiteSettings.id }).from(cmsSiteSettings).where(and(eq(cmsSiteSettings.tenantId, actor.tenantId), eq(cmsSiteSettings.logoMediaId, media.id))).limit(1);
  if (site) throw new Error("当前文件正在作为网站 Logo 使用，请先更换 Logo");
  await db.update(cmsMedia).set({ deletedAt: new Date() }).where(eq(cmsMedia.id, media.id));
  const absolutePath = path.resolve(uploadRoot(), ...media.relativePath.split("/"));
  if (absolutePath.startsWith(`${uploadRoot()}${path.sep}`)) await unlink(absolutePath).catch(() => undefined);
  await writeOperationLog({ actorId: actor.id, module: "媒体库", action: "删除媒体文件", resourceType: "cms_media", resourceId: media.id, method: "DELETE", path: "/cms/media", success: true });
  revalidatePath("/cms/media");
}
