import { ContentManager } from "@/components/cms/content-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsCategories, getCmsContents, getCmsMedia } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function Page() {
  const user = await requirePermission(PERMISSIONS.cmsProductList);
  const [items, categories, media] = await Promise.all([
    getCmsContents(user.tenantId, "PRODUCT"),
    getCmsCategories(user.tenantId, "PRODUCT"),
    getCmsMedia(user.tenantId),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="产品管理"
        description="管理产品分类、介绍、参数与产品图片。"
      />
      <ContentManager
        kind="PRODUCT"
        label="产品"
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
