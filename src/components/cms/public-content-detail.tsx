import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

import {
  getCmsPages,
  getPublicNavigations,
  getPublicSiteSettings,
  getPublishedContent,
} from "@/lib/cms";

export type PublicContentKind = "ARTICLE" | "PRODUCT" | "CASE";

const kindConfig = {
  ARTICLE: { label: "文章", section: "articles" },
  PRODUCT: { label: "产品", section: "products" },
  CASE: { label: "案例", section: "cases" },
} satisfies Record<PublicContentKind, { label: string; section: string }>;

export async function getPublicContentMetadata(
  kind: PublicContentKind,
  slug: string,
): Promise<Metadata> {
  const site = await getPublicSiteSettings();
  const content = site.tenantId
    ? await getPublishedContent(site.tenantId, kind, slug)
    : undefined;
  if (!content) return {};
  return {
    title: content.seoTitle || content.title,
    description: content.seoDescription || content.summary || undefined,
  };
}

export async function PublicContentDetail({
  kind,
  slug,
}: {
  kind: PublicContentKind;
  slug: string;
}) {
  const site = await getPublicSiteSettings();
  if (!site.enabled || !site.tenantId) notFound();
  const [content, navigation, pages] = await Promise.all([
    getPublishedContent(site.tenantId, kind, slug),
    getPublicNavigations(site.tenantId),
    getCmsPages(site.tenantId),
  ]);
  if (!content) notFound();

  const config = kindConfig[kind];
  const pageHref = (pageId: string | null) => {
    const page = pages.find((candidate) => candidate.id === pageId);
    return page?.isHome ? "/" : page ? `/${page.slug}` : "#";
  };
  const navHref = (item: (typeof navigation)[number]) =>
    item.linkType === "URL" ? item.url || "#" : pageHref(item.pageId);
  const body = sanitizeHtml(content.body || "", {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "hr",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
  });

  return (
    <main className="min-h-svh bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {site.logoMediaId ? (
              <Image
                src={`/media/${site.logoMediaId}`}
                alt={site.siteName}
                width={140}
                height={36}
                unoptimized
                className="h-9 w-auto"
              />
            ) : (
              <Building2 />
            )}
            <b>{site.siteName}</b>
          </Link>
          <nav className="ml-auto hidden gap-7 md:flex">
            {navigation
              .filter((item) => item.location === "HEADER" && !item.parentId)
              .map((item) => (
                <Link
                  key={item.id}
                  href={navHref(item)}
                  target={item.target === "BLANK" ? "_blank" : undefined}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      </header>

      <article>
        <div className="mx-auto max-w-4xl px-6 pb-12 pt-16 lg:px-8 lg:pt-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-950"
          >
            <ArrowLeft className="size-4" />
            返回首页
          </Link>
          <p className="mt-12 text-sm font-medium text-neutral-500">
            {config.label}详情
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {content.title}
          </h1>
          {content.summary && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600">
              {content.summary}
            </p>
          )}
          {content.publishedAt && (
            <time
              dateTime={content.publishedAt.toISOString()}
              className="mt-6 block text-sm text-neutral-400"
            >
              发布于 {content.publishedAt.toLocaleDateString("zh-CN")}
            </time>
          )}
        </div>

        {content.coverMediaId && (
          <div className="relative mx-auto aspect-[16/8] max-w-6xl overflow-hidden rounded-3xl bg-neutral-100">
            <Image
              src={`/media/${content.coverMediaId}`}
              alt={content.title}
              fill
              unoptimized
              priority
              className="object-cover"
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8 lg:py-24">
          {body ? (
            <div
              className="text-base leading-8 text-neutral-700 [&_a]:font-medium [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-5 [&_blockquote]:text-neutral-500 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:my-8 [&_img]:max-h-[680px] [&_img]:w-full [&_img]:rounded-2xl [&_img]:object-contain [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-neutral-950 [&_pre]:p-5 [&_pre]:text-white [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="text-neutral-500">正文内容正在完善中。</p>
          )}
          <Link
            href="/"
            className="mt-16 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
          >
            浏览更多内容
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </article>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5 px-6 py-10 text-sm text-neutral-500 lg:px-8">
          <p>{site.footerText}</p>
          <nav className="flex gap-5">
            {navigation
              .filter((item) => item.location === "FOOTER" && !item.parentId)
              .map((item) => (
                <Link key={item.id} href={navHref(item)}>
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
