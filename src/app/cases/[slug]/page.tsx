import {
  getPublicContentMetadata,
  PublicContentDetail,
} from "@/components/cms/public-content-detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return getPublicContentMetadata("CASE", slug);
}

export default async function CaseDetailPage({ params }: Props) {
  const { slug } = await params;
  return <PublicContentDetail kind="CASE" slug={slug} />;
}
