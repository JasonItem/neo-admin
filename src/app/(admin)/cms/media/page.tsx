import { MediaLibrary } from "@/components/cms/media-library";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsMedia, getCmsSiteSettings } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";

const formatDate = (date: Date) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("/", "-");

export default async function CmsMediaPage() {
  const user = await requirePermission(PERMISSIONS.cmsMediaList);
  const [media, settings] = await Promise.all([getCmsMedia(user.tenantId), getCmsSiteSettings(user.tenantId)]);
  return <div className="space-y-5"><PageHeader title="媒体库" description="图片和文档保存在服务器本地，并按当前公司进行隔离。" /><MediaLibrary items={media.map((item) => ({ id: item.id, originalName: item.originalName, mimeType: item.mimeType, size: item.size, altText: item.altText ?? "", createdAt: formatDate(item.createdAt), isLogo: settings.logoMediaId === item.id }))} /></div>;
}

