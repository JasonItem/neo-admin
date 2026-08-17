import { PageManager } from "@/components/cms/page-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsMedia, getCmsPages } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function Page() {
  const user = await requirePermission(PERMISSIONS.cmsPageList);
  const [pages, media] = await Promise.all([
    getCmsPages(user.tenantId),
    getCmsMedia(user.tenantId),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="页面管理"
        description="创建页面并通过结构化区块组合企业官网内容。"
      />
      <PageManager
        pages={pages}
        mediaItems={media.map((x) => ({
          ...x,
          altText: x.altText ?? "",
          createdAt: x.createdAt.toISOString(),
          updatedAt: x.updatedAt.toISOString(),
          uploaderName: x.uploaderName ?? "",
          uploaderUsername: x.uploaderUsername ?? "",
          url: `/media/${x.id}`,
        }))}
      />
    </div>
  );
}
