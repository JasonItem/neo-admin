"use client";

import * as React from "react";
import { ExternalLink, ImagePlus, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { saveCmsSiteSettingsAction, setCmsLogoAction } from "@/app/actions/cms";
import { ImagePicker } from "@/components/cms/media-picker";
import type { MediaAsset } from "@/components/cms/media-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type SiteSettingsValue = {
  siteName: string;
  companyName: string;
  slogan: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  enabled: boolean;
  logoMediaId?: string;
  logoUrl?: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export function SiteSettingsForm({
  initialValue,
  mediaItems,
}: {
  initialValue: SiteSettingsValue;
  mediaItems: MediaAsset[];
}) {
  const [value, setValue] = React.useState(initialValue);
  const [pending, startTransition] = React.useTransition();
  const set = (key: keyof SiteSettingsValue, next: string | boolean) =>
    setValue((current) => ({ ...current, [key]: next }));
  const save = () =>
    startTransition(async () => {
      try {
        await saveCmsSiteSettingsAction(value);
        toast.success("站点设置已保存");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
    });
  const selectLogo = async (asset: MediaAsset) => {
    await setCmsLogoAction(asset.id);
    setValue((current) => ({
      ...current,
      logoMediaId: asset.id,
      logoUrl: asset.url,
    }));
    toast.success("网站 Logo 已更新");
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" target="_blank" />}
        >
          <ExternalLink />
          预览官网
        </Button>
        <Button disabled={pending} onClick={save}>
          <Save />
          {pending ? "保存中…" : "保存设置"}
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>企业与品牌</CardTitle>
            <CardDescription>
              官网前台展示的企业基本资料与联系方式。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="网站名称">
              <Input
                value={value.siteName}
                onChange={(event) => set("siteName", event.target.value)}
              />
            </Field>
            <Field label="企业名称">
              <Input
                value={value.companyName}
                onChange={(event) => set("companyName", event.target.value)}
              />
            </Field>
            <Field label="品牌标语">
              <Input
                value={value.slogan}
                onChange={(event) => set("slogan", event.target.value)}
              />
            </Field>
            <Field label="联系电话">
              <Input
                value={value.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </Field>
            <Field label="联系邮箱">
              <Input
                type="email"
                value={value.email}
                onChange={(event) => set("email", event.target.value)}
              />
            </Field>
            <Field label="企业地址">
              <Input
                value={value.address}
                onChange={(event) => set("address", event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="企业简介">
                <Textarea
                  rows={5}
                  value={value.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="页脚版权">
                <Input
                  value={value.footerText}
                  onChange={(event) => set("footerText", event.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>网站状态</CardTitle>
              <CardDescription>
                关闭后官网将显示维护提示，管理后台不受影响。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">对外开放</p>
                  <p className="text-xs text-muted-foreground">
                    允许访客浏览企业官网
                  </p>
                </div>
                <Switch
                  checked={value.enabled}
                  onCheckedChange={(checked) => set("enabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>品牌 Logo</CardTitle>
              <CardDescription>
                点击下方图片框，从媒体库选择或快捷上传 Logo。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePicker
                items={mediaItems}
                value={value.logoMediaId}
                onSelect={selectLogo}
                trigger={
                  <button
                    type="button"
                    aria-label="选择品牌 Logo"
                    className="group relative flex h-32 w-full overflow-hidden rounded-xl border border-dashed bg-muted/30 transition hover:border-primary/60 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {value.logoUrl ? (
                      <>
                        <Image
                          src={value.logoUrl}
                          alt="当前网站 Logo"
                          fill
                          unoptimized
                          sizes="400px"
                          className="object-contain p-4 transition group-hover:opacity-70"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-background/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          <span className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm">
                            <ImagePlus className="size-4" />
                            更换图片
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="m-auto flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <span className="grid size-10 place-items-center rounded-full border bg-background">
                          <ImagePlus className="size-5" />
                        </span>
                        <span className="font-medium text-foreground">
                          选择或上传 Logo
                        </span>
                        <span className="text-xs">
                          支持 JPG、PNG、WebP、GIF
                        </span>
                      </span>
                    )}
                  </button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>搜索引擎优化</CardTitle>
          <CardDescription>用于浏览器标题和搜索引擎摘要。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="SEO 标题">
            <Input
              value={value.seoTitle}
              onChange={(event) => set("seoTitle", event.target.value)}
            />
          </Field>
          <Field label="SEO 描述">
            <Textarea
              rows={3}
              value={value.seoDescription}
              onChange={(event) => set("seoDescription", event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
