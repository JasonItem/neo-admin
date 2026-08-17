import { NavigationManager } from "@/components/cms/navigation-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCmsNavigations, getCmsPages } from "@/lib/cms";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function Page() {
  const user = await requirePermission(PERMISSIONS.cmsNavigationList);
  const [items, pages] = await Promise.all([
    getCmsNavigations(user.tenantId),
    getCmsPages(user.tenantId),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="栏目导航"
        description="配置无限级顶部和底部导航，并关联站内页面。"
      />
      <NavigationManager
        items={items}
        pages={pages.map(({ id, title, slug }) => ({ id, title, slug }))}
      />
    </div>
  );
}
