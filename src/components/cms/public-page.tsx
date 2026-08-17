import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { getPublishedContents } from "@/lib/cms";

type Site = {
  tenantId: string;
  siteName: string;
  logoMediaId: string | null;
  footerText: string | null;
};
type Block = {
  id: string;
  type: string;
  title?: string;
  content?: string;
  mediaId?: string;
};
type Nav = {
  id: string;
  parentId: string | null;
  label: string;
  location: "HEADER" | "FOOTER";
  linkType: "PAGE" | "URL";
  pageId: string | null;
  url: string | null;
  target: "SELF" | "BLANK";
};

export async function PublicCmsPage({
  site,
  page,
  navigation,
  pages,
}: {
  site: Site;
  page: { blocks: Block[] };
  navigation: Nav[];
  pages: Array<{ id: string; slug: string }>;
}) {
  const [products, articles, cases] = await Promise.all([
    getPublishedContents(site.tenantId, "PRODUCT"),
    getPublishedContents(site.tenantId, "ARTICLE"),
    getPublishedContents(site.tenantId, "CASE"),
  ]);
  const href = (item: Nav) =>
    item.linkType === "URL"
      ? item.url || "#"
      : `/${pages.find((page) => page.id === item.pageId)?.slug ?? ""}`;
  return (
    <main className="min-h-svh bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center px-6">
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
                  href={href(item)}
                  target={item.target === "BLANK" ? "_blank" : undefined}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      </header>
      {page.blocks.map((block) => (
        <PublicBlock
          key={block.id}
          block={block}
          items={
            block.type === "PRODUCTS"
              ? products
              : block.type === "ARTICLES"
                ? articles
                : block.type === "CASES"
                  ? cases
                  : []
          }
        />
      ))}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5 px-6 py-10">
          <p>{site.footerText}</p>
          <nav className="flex gap-5">
            {navigation
              .filter((item) => item.location === "FOOTER" && !item.parentId)
              .map((item) => (
                <Link key={item.id} href={href(item)}>
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}

function PublicBlock({
  block,
  items,
}: {
  block: Block;
  items: Array<{
    id: string;
    title: string;
    summary: string | null;
    coverMediaId: string | null;
  }>;
}) {
  if (block.type === "HERO")
    return (
      <section className="relative grid min-h-[620px] place-items-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
        {block.mediaId && (
          <Image
            src={`/media/${block.mediaId}`}
            alt=""
            fill
            unoptimized
            className="object-cover opacity-40"
          />
        )}
        <div className="relative max-w-4xl">
          <h1 className="text-5xl font-semibold md:text-7xl">{block.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            {block.content}
          </p>
        </div>
      </section>
    );
  if (["PRODUCTS", "ARTICLES", "CASES", "FEATURES"].includes(block.type))
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-4xl font-semibold">{block.title}</h2>
        <p className="mt-3 text-neutral-600">{block.content}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border"
            >
              {item.coverMediaId && (
                <div className="relative aspect-video">
                  <Image
                    src={`/media/${item.coverMediaId}`}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-medium">{item.title}</h3>
                <p className="mt-2 text-neutral-600">{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  if (block.type === "CTA")
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl bg-neutral-950 p-12 text-white">
          <h2 className="text-4xl font-semibold">{block.title}</h2>
          <p className="mt-4 text-white/60">{block.content}</p>
          <span className="mt-7 inline-flex items-center gap-2">
            联系我们
            <ArrowRight />
          </span>
        </div>
      </section>
    );
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-2">
      {block.mediaId && (
        <div className="relative min-h-72">
          <Image
            src={`/media/${block.mediaId}`}
            alt=""
            fill
            unoptimized
            className="rounded-2xl object-cover"
          />
        </div>
      )}
      <div>
        <h2 className="text-4xl font-semibold">{block.title}</h2>
        <p className="mt-5 whitespace-pre-wrap leading-8 text-neutral-600">
          {block.content}
        </p>
      </div>
    </section>
  );
}
