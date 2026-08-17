"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  cmsCategories,
  cmsContents,
  cmsNavigations,
  cmsPages,
} from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

const text = (max: number) => z.string().trim().max(max).optional().default("");
const status = z.enum(["DRAFT", "PUBLISHED", "OFFLINE"]);
const slug = z
  .string()
  .trim()
  .min(1, "请填写访问路径")
  .max(180)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "路径仅支持小写字母、数字和短横线");
const pageInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  slug,
  summary: text(500),
  coverMediaId: text(36),
  blocks: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      mediaId: z.string().optional(),
    }),
  ),
  seoTitle: text(255),
  seoDescription: text(500),
  status,
  isHome: z.boolean(),
  sortOrder: z.number().int(),
});
const contentInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["ARTICLE", "PRODUCT", "CASE"]),
  categoryId: text(36),
  title: z.string().trim().min(1).max(200),
  slug,
  summary: text(1000),
  body: text(50000),
  coverMediaId: text(36),
  galleryMediaIds: z.array(z.string().uuid()),
  attributes: z.record(z.string(), z.string()),
  featured: z.boolean(),
  status,
  sortOrder: z.number().int(),
  seoTitle: text(255),
  seoDescription: text(500),
});
const categoryInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(["ARTICLE", "PRODUCT", "CASE"]),
  parentId: text(36),
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(160),
  description: text(500),
  sortOrder: z.number().int(),
  enabled: z.boolean(),
});
const navigationInput = z.object({
  id: z.string().uuid().optional(),
  parentId: text(36),
  label: z.string().trim().min(1).max(100),
  location: z.enum(["HEADER", "FOOTER"]),
  linkType: z.enum(["PAGE", "URL"]),
  pageId: text(36),
  url: text(500),
  target: z.enum(["SELF", "BLANK"]),
  sortOrder: z.number().int(),
  enabled: z.boolean(),
});
const nullable = (value: string) => value || null;

export async function saveCmsPageAction(input: unknown) {
  const data = pageInput.parse(input);
  const actor = await requirePermission(PERMISSIONS.cmsPageManage);
  const id = data.id ?? randomUUID();
  const values = {
    ...data,
    id,
    tenantId: actor.tenantId,
    summary: nullable(data.summary),
    coverMediaId: nullable(data.coverMediaId),
    seoTitle: nullable(data.seoTitle),
    seoDescription: nullable(data.seoDescription),
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    createdBy: actor.id,
  };
  if (data.id)
    await db
      .update(cmsPages)
      .set(values)
      .where(and(eq(cmsPages.id, id), eq(cmsPages.tenantId, actor.tenantId)));
  else await db.insert(cmsPages).values(values);
  revalidatePath("/cms/pages");
  revalidatePath("/");
  return { id };
}

const managePermission = {
  ARTICLE: PERMISSIONS.cmsArticleManage,
  PRODUCT: PERMISSIONS.cmsProductManage,
  CASE: PERMISSIONS.cmsCaseManage,
} satisfies Record<string, PermissionCode>;
export async function saveCmsContentAction(input: unknown) {
  const data = contentInput.parse(input);
  const actor = await requirePermission(managePermission[data.kind]);
  const id = data.id ?? randomUUID();
  const values = {
    ...data,
    id,
    tenantId: actor.tenantId,
    categoryId: nullable(data.categoryId),
    summary: nullable(data.summary),
    body: nullable(data.body),
    coverMediaId: nullable(data.coverMediaId),
    seoTitle: nullable(data.seoTitle),
    seoDescription: nullable(data.seoDescription),
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    createdBy: actor.id,
  };
  if (data.id)
    await db
      .update(cmsContents)
      .set(values)
      .where(
        and(eq(cmsContents.id, id), eq(cmsContents.tenantId, actor.tenantId)),
      );
  else await db.insert(cmsContents).values(values);
  revalidatePath(
    `/cms/${data.kind === "ARTICLE" ? "articles" : data.kind === "PRODUCT" ? "products" : "cases"}`,
  );
  revalidatePath("/");
  return { id };
}

export async function saveCmsCategoryAction(input: unknown) {
  const data = categoryInput.parse(input);
  const actor = await requirePermission(managePermission[data.kind]);
  const id = data.id ?? randomUUID();
  const values = {
    ...data,
    id,
    tenantId: actor.tenantId,
    parentId: nullable(data.parentId),
    description: nullable(data.description),
  };
  if (data.id)
    await db
      .update(cmsCategories)
      .set(values)
      .where(
        and(
          eq(cmsCategories.id, id),
          eq(cmsCategories.tenantId, actor.tenantId),
        ),
      );
  else await db.insert(cmsCategories).values(values);
  return { id };
}

export async function saveCmsNavigationAction(input: unknown) {
  const data = navigationInput.parse(input);
  const actor = await requirePermission(PERMISSIONS.cmsNavigationManage);
  const id = data.id ?? randomUUID();
  const values = {
    ...data,
    id,
    tenantId: actor.tenantId,
    parentId: nullable(data.parentId),
    pageId: nullable(data.pageId),
    url: nullable(data.url),
  };
  if (data.id)
    await db
      .update(cmsNavigations)
      .set(values)
      .where(
        and(
          eq(cmsNavigations.id, id),
          eq(cmsNavigations.tenantId, actor.tenantId),
        ),
      );
  else await db.insert(cmsNavigations).values(values);
  revalidatePath("/cms/navigation");
  revalidatePath("/");
  return { id };
}
