import { notFound } from "next/navigation";
import { PublicCmsPage } from "@/components/cms/public-page";
import {
  getCmsPages,
  getPublicNavigations,
  getPublicSiteSettings,
  getPublishedPage,
} from "@/lib/cms";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getPublicSiteSettings();
  const [page, navigation, pages] = await Promise.all([
    getPublishedPage(site.tenantId, slug),
    getPublicNavigations(site.tenantId),
    getCmsPages(site.tenantId),
  ]);
  if (!page) notFound();
  return (
    <PublicCmsPage
      site={site}
      page={page}
      navigation={navigation}
      pages={pages.map(({ id, slug: path, isHome }) => ({
        id,
        slug: path,
        isHome,
      }))}
    />
  );
}
