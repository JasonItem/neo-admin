import { ContentManager } from "@/components/cms/content-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsCategories, getCmsContents, getCmsMedia } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function Page() {
  const user = await requirePermission(PERMISSIONS.cmsCaseList);
  const [items, categories, media] = await Promise.all([
    getCmsContents(user.tenantId, "CASE"),
    getCmsCategories(user.tenantId, "CASE"),
    getCmsMedia(user.tenantId),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader title="案例管理" description="展示企业项目经验与客户案例。" />
      <ContentManager
        kind="CASE"
        label="案例"
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
