import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { cmsMedia, cmsSiteSettings } from "@/db/schema";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "NeoAdmin 企业官网",
  companyName: "NeoAdmin 数字科技",
  slogan: "让企业官网更专业、更清晰、更易维护",
  description: "我们为企业提供可靠的数字化解决方案，用专业内容与现代设计呈现品牌价值。",
  phone: "400-000-0000",
  email: "contact@example.com",
  address: "中国 · 上海",
  footerText: "© 2026 NeoAdmin 数字科技 版权所有",
  seoTitle: "NeoAdmin 企业官网",
  seoDescription: "专业的企业数字化服务与解决方案。",
  enabled: true,
};

export async function getCmsSiteSettings(tenantId: string) {
  const [settings] = await db.select().from(cmsSiteSettings).where(eq(cmsSiteSettings.tenantId, tenantId)).limit(1);
  return settings ?? { id: "", tenantId, logoMediaId: null, createdAt: new Date(), updatedAt: new Date(), ...DEFAULT_SITE_SETTINGS };
}

export async function getPublicSiteSettings() {
  const [settings] = await db.select().from(cmsSiteSettings).where(eq(cmsSiteSettings.enabled, true)).limit(1);
  return settings ?? { id: "", tenantId: "", logoMediaId: null, createdAt: new Date(), updatedAt: new Date(), ...DEFAULT_SITE_SETTINGS };
}

export async function getCmsMedia(tenantId: string) {
  return db.select().from(cmsMedia).where(and(eq(cmsMedia.tenantId, tenantId), isNull(cmsMedia.deletedAt))).orderBy(desc(cmsMedia.createdAt));
}

