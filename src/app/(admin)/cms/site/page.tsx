import { SiteSettingsForm } from "@/components/cms/site-settings-form";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsSiteSettings } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CmsSitePage() {
  const user = await requirePermission(PERMISSIONS.cmsSiteList);
  const settings = await getCmsSiteSettings(user.tenantId);
  return <div className="space-y-5"><PageHeader title="站点设置" description="维护企业官网的品牌资料、联系方式、网站状态和 SEO 信息。" /><SiteSettingsForm initialValue={{
    siteName: settings.siteName, companyName: settings.companyName, slogan: settings.slogan ?? "", description: settings.description ?? "",
    phone: settings.phone ?? "", email: settings.email ?? "", address: settings.address ?? "", footerText: settings.footerText ?? "",
    seoTitle: settings.seoTitle ?? "", seoDescription: settings.seoDescription ?? "", enabled: settings.enabled,
    logoUrl: settings.logoMediaId ? `/media/${settings.logoMediaId}` : undefined,
  }} /></div>;
}

