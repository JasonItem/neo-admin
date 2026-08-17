import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getPublicSiteSettings } from "@/lib/cms";
import { getCmsPages, getPublicNavigations, getPublishedPage } from "@/lib/cms";
import { PublicCmsPage } from "@/components/cms/public-page";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteSettings();
  return {
    title: site.seoTitle || site.siteName,
    description: site.seoDescription || site.description,
  };
}

export default async function Home() {
  const site = await getPublicSiteSettings();
  if (!site.enabled)
    return (
      <main className="flex min-h-svh items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="max-w-md text-center">
          <Globe2 className="mx-auto mb-5 size-12 text-white/60" />
          <h1 className="text-3xl font-semibold">网站维护中</h1>
          <p className="mt-3 text-white/60">
            我们正在更新网站内容，请稍后再来。
          </p>
        </div>
      </main>
    );
  const [managedHome, managedNavigation, managedPages] = site.tenantId
    ? await Promise.all([
        getPublishedPage(site.tenantId),
        getPublicNavigations(site.tenantId),
        getCmsPages(site.tenantId),
      ])
    : [undefined, [], []];
  if (managedHome)
    return (
      <PublicCmsPage
        site={site}
        page={managedHome}
        navigation={managedNavigation}
        pages={managedPages.map(({ id, slug }) => ({ id, slug }))}
      />
    );
  const services = [
    {
      icon: Globe2,
      title: "品牌网站建设",
      description: "以清晰的信息架构和现代视觉语言，完整呈现企业品牌价值。",
    },
    {
      icon: Sparkles,
      title: "数字体验设计",
      description: "兼顾桌面与移动设备，为访客提供流畅、一致的浏览体验。",
    },
    {
      icon: ShieldCheck,
      title: "长期稳定运维",
      description: "安全可靠的内容管理能力，让网站能够持续更新与成长。",
    },
  ];
  return (
    <main className="min-h-svh bg-white text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {site.logoMediaId ? (
              <Image
                src={`/media/${site.logoMediaId}`}
                alt={site.siteName}
                width={160}
                height={36}
                unoptimized
                className="h-9 w-auto max-w-40 object-contain"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-950 text-white">
                <Building2 className="size-5" />
              </span>
            )}
            <span className="font-semibold tracking-tight">
              {site.siteName}
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#about" className="hover:text-neutral-500">
              关于我们
            </a>
            <a href="#services" className="hover:text-neutral-500">
              核心服务
            </a>
            <a href="#contact" className="hover:text-neutral-500">
              联系我们
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            管理后台
          </Link>
        </div>
      </header>
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(14,165,233,0.12),transparent_35%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-sm backdrop-blur">
              专业 · 清晰 · 值得信赖
            </span>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {site.slogan || site.companyName}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              {site.description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white"
              >
                联系我们
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#services"
                className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium"
              >
                了解服务
              </a>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <div className="absolute inset-8 rotate-6 rounded-[3rem] bg-neutral-950" />
            <div className="absolute inset-0 -rotate-3 rounded-[3rem] border border-black/10 bg-white/80 p-10 shadow-2xl backdrop-blur">
              <div className="grid h-full grid-cols-2 gap-4">
                {["品牌策略", "网站设计", "内容运营", "技术支持"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="flex flex-col justify-between rounded-3xl bg-neutral-100 p-5"
                    >
                      <span className="text-xs text-neutral-400">
                        0{index + 1}
                      </span>
                      <p className="font-medium">{item}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              关于 {site.companyName}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              用专业能力，帮助企业建立可信赖的数字形象
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-neutral-600">
            <p>{site.description}</p>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {[
                "响应式网站体验",
                "自主内容管理",
                "搜索引擎友好",
                "稳定安全运行",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-neutral-800"
                >
                  <CheckCircle2 className="size-4" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="services" className="bg-neutral-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm text-white/50">核心服务</p>
          <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight">
              从品牌表达，到网站长期运营
            </h2>
            <p className="max-w-md text-white/55">
              围绕企业真实业务目标，提供清晰、可靠、可持续维护的网站解决方案。
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {services.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <Icon className="size-6" />
                <h3 className="mt-14 text-xl font-medium">{title}</h3>
                <p className="mt-3 leading-7 text-white/55">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-[2.5rem] bg-neutral-100 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-neutral-500">联系我们</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              期待与您一起创造更好的网站
            </h2>
          </div>
          <div className="mt-8 grid gap-3 text-sm lg:mt-0">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="flex items-center gap-3">
                <Phone className="size-4" />
                {site.phone}
              </a>
            )}
            {site.email && (
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3"
              >
                <Mail className="size-4" />
                {site.email}
              </a>
            )}
            {site.address && (
              <p className="flex items-center gap-3">
                <MapPin className="size-4" />
                {site.address}
              </p>
            )}
          </div>
        </div>
      </section>
      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-8 text-sm text-neutral-500 sm:flex-row lg:px-8">
          <p>{site.footerText}</p>
          <p>{site.companyName}</p>
        </div>
      </footer>
    </main>
  );
}
