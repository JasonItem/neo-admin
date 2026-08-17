"use client";

import * as React from "react";
import { FileText, ImageIcon, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { deleteCmsMediaAction, setCmsLogoAction, uploadCmsMediaAction } from "@/app/actions/cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MediaItem = { id: string; originalName: string; mimeType: string; size: number; altText: string; createdAt: string; isLogo: boolean };
const formatSize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, startTransition] = React.useTransition();
  const upload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return toast.error("请先选择文件");
    const data = new FormData(); data.set("file", file); data.set("altText", file.name.replace(/\.[^.]+$/, ""));
    startTransition(async () => { try { await uploadCmsMediaAction(data); toast.success("文件上传成功"); if (inputRef.current) inputRef.current.value = ""; } catch (error) { toast.error(error instanceof Error ? error.message : "上传失败"); } });
  };
  const setLogo = (id: string) => startTransition(async () => { try { await setCmsLogoAction(id); toast.success("网站 Logo 已更新"); } catch (error) { toast.error(error instanceof Error ? error.message : "设置失败"); } });
  const remove = (id: string) => startTransition(async () => { try { await deleteCmsMediaAction(id); toast.success("文件已删除"); } catch (error) { toast.error(error instanceof Error ? error.message : "删除失败"); } });
  return <div className="space-y-4">
    <Card><CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center"><Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx" className="h-10" /><Button className="h-10" disabled={pending} onClick={upload}><Upload />上传文件</Button><p className="text-xs text-muted-foreground">支持图片、PDF、Word、Excel，单文件最大 10MB</p></CardContent></Card>
    {items.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Card key={item.id} className="gap-0 py-0">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">{item.mimeType.startsWith("image/") ? <Image src={`/media/${item.id}`} alt={item.altText || item.originalName} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" /> : <FileText className="size-12 text-muted-foreground" />}{item.isLogo && <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">当前 Logo</span>}</div>
      <CardContent className="space-y-1 py-3"><p className="truncate font-medium" title={item.originalName}>{item.originalName}</p><div className="flex justify-between text-xs text-muted-foreground"><span>{formatSize(item.size)}</span><span>{item.createdAt}</span></div></CardContent>
      <CardFooter className="justify-between gap-2 py-2">{item.mimeType.startsWith("image/") ? <Button size="sm" variant="outline" disabled={pending || item.isLogo} onClick={() => setLogo(item.id)}><Star />设为 Logo</Button> : <span />}<Button size="icon-sm" variant="ghost" disabled={pending || item.isLogo} onClick={() => remove(item.id)}><Trash2 /><span className="sr-only">删除</span></Button></CardFooter>
    </Card>)}</div> : <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed text-center"><ImageIcon className="mb-3 size-10 text-muted-foreground" /><p className="font-medium">媒体库还是空的</p><p className="mt-1 text-sm text-muted-foreground">上传企业 Logo、产品图片或相关文档。</p></div>}
  </div>;
}
