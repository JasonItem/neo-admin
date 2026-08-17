import { ContentManager } from "@/components/cms/content-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsCategories, getCmsContents, getCmsMedia } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function Page() {
  const user = await requirePermission(PERMISSIONS.cmsArticleList);
  const [items, categories, media] = await Promise.all([
    getCmsContents(user.tenantId, "ARTICLE"),
    getCmsCategories(user.tenantId, "ARTICLE"),
    getCmsMedia(user.tenantId),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="文章新闻"
        description="管理企业新闻、行业资讯和内容发布。"
      />
      <ContentManager
        kind="ARTICLE"
        label="文章"
        items={items}
        categories={categories}
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
