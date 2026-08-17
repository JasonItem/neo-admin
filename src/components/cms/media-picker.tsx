"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ImageIcon, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadCmsMediaAction } from "@/app/actions/cms";
import type { MediaAsset } from "@/components/cms/media-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MediaPickerProps = {
  items: MediaAsset[];
  value?: string;
  onSelect: (asset: MediaAsset) => void | Promise<void>;
  triggerLabel?: string;
};

export function MediaPicker({ items, value, onSelect, triggerLabel = "从媒体库选择" }: MediaPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [assets, setAssets] = React.useState(items.filter((item) => item.mimeType.startsWith("image/")));
  const [selectedId, setSelectedId] = React.useState(value);
  const [pending, startTransition] = React.useTransition();

  const filtered = assets.filter((item) => `${item.originalName} ${item.altText}`.toLowerCase().includes(query.toLowerCase()));
  const upload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", file.name.replace(/\.[^.]+$/, ""));
    startTransition(async () => {
      try {
        const asset = await uploadCmsMediaAction(formData);
        setAssets((current) => [asset, ...current]);
        setSelectedId(asset.id);
        if (inputRef.current) inputRef.current.value = "";
        toast.success("图片已上传到媒体库");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "图片上传失败");
      }
    });
  };
  const confirm = () => {
    const selected = assets.find((item) => item.id === selectedId);
    if (!selected) return toast.error("请选择一张图片");
    startTransition(async () => {
      try {
        await onSelect(selected);
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "应用图片失败");
      }
    });
  };

  return <Dialog open={open} onOpenChange={(nextOpen) => {
    if (nextOpen) {
      setAssets(items.filter((item) => item.mimeType.startsWith("image/")));
      setSelectedId(value);
      setQuery("");
    }
    setOpen(nextOpen);
  }}>
    <DialogTrigger render={<Button type="button" variant="outline" />}><ImageIcon />{triggerLabel}</DialogTrigger>
    <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
      <DialogHeader className="border-b p-5">
        <DialogTitle>选择媒体图片</DialogTitle>
        <DialogDescription>从媒体库选择已有图片，或直接上传新图片并立即使用。</DialogDescription>
      </DialogHeader>
      <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
        <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center">
          <Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="bg-background" onChange={upload} />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={pending}><Upload />快捷上传</Button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件名称或图片说明" className="pl-9" /></div>
        {filtered.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{filtered.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={cn("group overflow-hidden rounded-xl border bg-card text-left transition hover:border-foreground/30", selectedId === item.id && "border-primary ring-2 ring-primary/20")}>
          <div className="relative aspect-square overflow-hidden bg-muted"><Image src={item.url} alt={item.altText || item.originalName} fill unoptimized sizes="180px" className="object-cover transition group-hover:scale-[1.02]" />{selectedId === item.id && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span>}</div>
          <div className="p-2"><p className="truncate text-sm font-medium">{item.originalName}</p><p className="truncate text-xs text-muted-foreground">{item.altText || "暂无图片说明"}</p></div>
        </button>)}</div> : <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">没有找到符合条件的图片</div>}
      </div>
      <DialogFooter className="m-0">
        <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
        <Button type="button" disabled={!selectedId || pending} onClick={confirm}>使用所选图片</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
