import {
  getPublicContentMetadata,
  PublicContentDetail,
} from "@/components/cms/public-content-detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return getPublicContentMetadata("PRODUCT", slug);
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <PublicContentDetail kind="PRODUCT" slug={slug} />;
}
