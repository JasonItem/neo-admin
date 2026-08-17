import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  cmsCategories,
  cmsContents,
  cmsMedia,
  cmsNavigations,
  cmsPages,
  cmsSiteSettings,
  users,
} from "@/db/schema";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "NeoAdmin 企业官网",
  companyName: "NeoAdmin 数字科技",
  slogan: "让企业官网更专业、更清晰、更易维护",
  description:
    "我们为企业提供可靠的数字化解决方案，用专业内容与现代设计呈现品牌价值。",
  phone: "400-000-0000",
  email: "contact@example.com",
  address: "中国 · 上海",
  footerText: "© 2026 NeoAdmin 数字科技 版权所有",
  seoTitle: "NeoAdmin 企业官网",
  seoDescription: "专业的企业数字化服务与解决方案。",
  enabled: true,
};

export async function getCmsSiteSettings(tenantId: string) {
  const [settings] = await db
    .select()
    .from(cmsSiteSettings)
    .where(eq(cmsSiteSettings.tenantId, tenantId))
    .limit(1);
  return (
    settings ?? {
      id: "",
      tenantId,
      logoMediaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...DEFAULT_SITE_SETTINGS,
    }
  );
}

export const getCmsPages = (tenantId: string) =>
  db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.tenantId, tenantId))
    .orderBy(desc(cmsPages.updatedAt));
export const getCmsNavigations = (tenantId: string) =>
  db
    .select()
    .from(cmsNavigations)
    .where(eq(cmsNavigations.tenantId, tenantId))
    .orderBy(cmsNavigations.location, cmsNavigations.sortOrder);
export const getCmsCategories = (
  tenantId: string,
  kind: "ARTICLE" | "PRODUCT" | "CASE",
) =>
  db
    .select()
    .from(cmsCategories)
    .where(
      and(eq(cmsCategories.tenantId, tenantId), eq(cmsCategories.kind, kind)),
    )
    .orderBy(cmsCategories.sortOrder);
export const getCmsContents = (
  tenantId: string,
  kind: "ARTICLE" | "PRODUCT" | "CASE",
) =>
  db
    .select()
    .from(cmsContents)
    .where(and(eq(cmsContents.tenantId, tenantId), eq(cmsContents.kind, kind)))
    .orderBy(desc(cmsContents.updatedAt));

export async function getPublicSiteSettings() {
  const [settings] = await db
    .select()
    .from(cmsSiteSettings)
    .where(eq(cmsSiteSettings.enabled, true))
    .limit(1);
  return (
    settings ?? {
      id: "",
      tenantId: "",
      logoMediaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...DEFAULT_SITE_SETTINGS,
    }
  );
}

export async function getCmsMedia(tenantId: string) {
  return db
    .select({
      id: cmsMedia.id,
      originalName: cmsMedia.originalName,
      mimeType: cmsMedia.mimeType,
      extension: cmsMedia.extension,
      size: cmsMedia.size,
      altText: cmsMedia.altText,
      createdAt: cmsMedia.createdAt,
      updatedAt: cmsMedia.updatedAt,
      uploaderName: users.displayName,
      uploaderUsername: users.username,
    })
    .from(cmsMedia)
    .leftJoin(users, eq(users.id, cmsMedia.createdBy))
    .where(and(eq(cmsMedia.tenantId, tenantId), isNull(cmsMedia.deletedAt)))
    .orderBy(desc(cmsMedia.createdAt));
}

export async function getPublishedPage(tenantId: string, slug?: string) {
  const filters = [
    eq(cmsPages.tenantId, tenantId),
    eq(cmsPages.status, "PUBLISHED" as const),
    slug ? eq(cmsPages.slug, slug) : eq(cmsPages.isHome, true),
  ];
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(and(...filters))
    .limit(1);
  return page;
}

export const getPublicNavigations = (tenantId: string) =>
  db
    .select()
    .from(cmsNavigations)
    .where(
      and(
        eq(cmsNavigations.tenantId, tenantId),
        eq(cmsNavigations.enabled, true),
      ),
    )
    .orderBy(cmsNavigations.sortOrder);
export const getPublishedContents = (
  tenantId: string,
  kind: "ARTICLE" | "PRODUCT" | "CASE",
  limit = 6,
) =>
  db
    .select()
    .from(cmsContents)
    .where(
      and(
        eq(cmsContents.tenantId, tenantId),
        eq(cmsContents.kind, kind),
        eq(cmsContents.status, "PUBLISHED" as const),
      ),
    )
    .orderBy(cmsContents.sortOrder, desc(cmsContents.publishedAt))
    .limit(limit);

export async function getPublishedContent(
  tenantId: string,
  kind: "ARTICLE" | "PRODUCT" | "CASE",
  slug: string,
) {
  const [content] = await db
    .select()
    .from(cmsContents)
    .where(
      and(
        eq(cmsContents.tenantId, tenantId),
        eq(cmsContents.kind, kind),
        eq(cmsContents.slug, slug),
        eq(cmsContents.status, "PUBLISHED" as const),
      ),
    )
    .limit(1);
  return content;
}
