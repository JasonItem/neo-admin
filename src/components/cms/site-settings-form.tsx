"use client";

import * as React from "react";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { saveCmsSiteSettingsAction } from "@/app/actions/cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type SiteSettingsValue = {
  siteName: string; companyName: string; slogan: string; description: string; phone: string; email: string;
  address: string; footerText: string; seoTitle: string; seoDescription: string; enabled: boolean; logoUrl?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

export function SiteSettingsForm({ initialValue }: { initialValue: SiteSettingsValue }) {
  const [value, setValue] = React.useState(initialValue);
  const [pending, startTransition] = React.useTransition();
  const set = (key: keyof SiteSettingsValue, next: string | boolean) => setValue((current) => ({ ...current, [key]: next }));
  const save = () => startTransition(async () => {
    try {
      await saveCmsSiteSettingsAction(value);
      toast.success("站点设置已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    }
  });
  return <div className="space-y-4">
    <div className="flex justify-end gap-2"><Button variant="outline" nativeButton={false} render={<Link href="/" target="_blank" />}><ExternalLink />预览官网</Button><Button disabled={pending} onClick={save}><Save />{pending ? "保存中…" : "保存设置"}</Button></div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card><CardHeader><CardTitle>企业与品牌</CardTitle><CardDescription>官网前台展示的企业基本资料与联系方式。</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="网站名称"><Input value={value.siteName} onChange={(event) => set("siteName", event.target.value)} /></Field>
        <Field label="企业名称"><Input value={value.companyName} onChange={(event) => set("companyName", event.target.value)} /></Field>
        <Field label="品牌标语"><Input value={value.slogan} onChange={(event) => set("slogan", event.target.value)} /></Field>
        <Field label="联系电话"><Input value={value.phone} onChange={(event) => set("phone", event.target.value)} /></Field>
        <Field label="联系邮箱"><Input type="email" value={value.email} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label="企业地址"><Input value={value.address} onChange={(event) => set("address", event.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="企业简介"><Textarea rows={5} value={value.description} onChange={(event) => set("description", event.target.value)} /></Field></div>
        <div className="sm:col-span-2"><Field label="页脚版权"><Input value={value.footerText} onChange={(event) => set("footerText", event.target.value)} /></Field></div>
      </CardContent></Card>
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>网站状态</CardTitle><CardDescription>关闭后官网将显示维护提示，管理后台不受影响。</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">对外开放</p><p className="text-xs text-muted-foreground">允许访客浏览企业官网</p></div><Switch checked={value.enabled} onCheckedChange={(checked) => set("enabled", checked)} /></div></CardContent></Card>
        <Card><CardHeader><CardTitle>品牌 Logo</CardTitle><CardDescription>在媒体库上传图片后，可将其设为网站 Logo。</CardDescription></CardHeader><CardContent>{value.logoUrl ? <Image src={value.logoUrl} alt="当前网站 Logo" width={320} height={80} unoptimized className="h-20 max-w-full rounded-lg border bg-muted object-contain p-3" /> : <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">尚未设置 Logo</div>}<Button variant="outline" className="mt-3" nativeButton={false} render={<Link href="/cms/media" />}>前往媒体库</Button></CardContent></Card>
      </div>
    </div>
    <Card><CardHeader><CardTitle>搜索引擎优化</CardTitle><CardDescription>用于浏览器标题和搜索引擎摘要。</CardDescription></CardHeader><CardContent className="grid gap-4">
      <Field label="SEO 标题"><Input value={value.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} /></Field>
      <Field label="SEO 描述"><Textarea rows={3} value={value.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} /></Field>
    </CardContent></Card>
  </div>;
}
