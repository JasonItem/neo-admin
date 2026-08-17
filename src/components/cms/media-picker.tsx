"use client";

import * as React from "react";
import Image from "next/image";
import { Check, FileText, Images, Search, Upload, Video } from "lucide-react";
import { toast } from "sonner";

import { uploadCmsMediaAction } from "@/app/actions/cms";
import type { MediaAsset } from "@/components/cms/media-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AssetKind = "image" | "media" | "file";
type AssetPickerProps = {
  items: MediaAsset[];
  value?: string;
  onSelect: (asset: MediaAsset) => void | Promise<void>;
  triggerLabel: string;
  trigger?: React.ReactElement;
  kind: AssetKind;
};
const configs = {
  image: {
    title: "选择图片",
    description: "从媒体库选择已有图片，或快捷上传新图片。",
    accept: "image/jpeg,image/png,image/webp,image/gif",
    empty: "没有找到符合条件的图片",
  },
  media: {
    title: "选择媒体",
    description: "选择可复用的图片或视频资源，也可以快捷上传。",
    accept:
      "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime",
    empty: "没有找到符合条件的媒体",
  },
  file: {
    title: "选择文件",
    description: "选择 PDF、Word、Excel 等文档，或快捷上传到媒体库。",
    accept: "application/pdf,.doc,.docx,.xls,.xlsx",
    empty: "没有找到符合条件的文件",
  },
} satisfies Record<
  AssetKind,
  { title: string; description: string; accept: string; empty: string }
>;
const matchesKind = (asset: MediaAsset, kind: AssetKind) =>
  kind === "image"
    ? asset.mimeType.startsWith("image/")
    : kind === "media"
      ? asset.mimeType.startsWith("image/") ||
        asset.mimeType.startsWith("video/")
      : !asset.mimeType.startsWith("image/") &&
        !asset.mimeType.startsWith("video/");

function AssetPicker({
  items,
  value,
  onSelect,
  triggerLabel,
  trigger,
  kind,
}: AssetPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [assets, setAssets] = React.useState(
    items.filter((item) => matchesKind(item, kind)),
  );
  const [selectedId, setSelectedId] = React.useState(value);
  const [pending, startTransition] = React.useTransition();
  const config = configs[kind];
  const filtered = assets.filter((item) =>
    `${item.originalName} ${item.altText}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const upload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", file.name.replace(/\.[^.]+$/, ""));
    startTransition(async () => {
      try {
        const asset = await uploadCmsMediaAction(formData);
        if (!matchesKind(asset, kind))
          throw new Error("上传的资源类型不符合当前选择器要求");
        setAssets((current) => [asset, ...current]);
        setSelectedId(asset.id);
        if (inputRef.current) inputRef.current.value = "";
        toast.success("资源已上传到媒体库");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "资源上传失败");
      }
    });
  };
  const confirm = () => {
    const selected = assets.find((item) => item.id === selectedId);
    if (!selected) return toast.error("请选择一个资源");
    startTransition(async () => {
      try {
        await onSelect(selected);
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "应用资源失败");
      }
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setAssets(items.filter((item) => matchesKind(item, kind)));
          setSelectedId(value);
          setQuery("");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={trigger ?? <Button type="button" variant="outline" />}
      >
        {!trigger && (
          <>
            <Images />
            {triggerLabel}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-5">
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              type="file"
              accept={config.accept}
              className="bg-background"
              onChange={upload}
            />
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
            >
              <Upload />
              快捷上传
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索文件名称或说明"
              className="pl-9"
            />
          </div>
          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-card text-left transition hover:border-foreground/30",
                    selectedId === item.id &&
                      "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <AssetPreview
                    asset={item}
                    selected={selectedId === item.id}
                  />
                  <div className="p-2">
                    <p className="truncate text-sm font-medium">
                      {item.originalName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.altText || item.mimeType}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
              {config.empty}
            </div>
          )}
        </div>
        <DialogFooter className="m-0">
          <DialogClose render={<Button type="button" variant="outline" />}>
            取消
          </DialogClose>
          <Button
            type="button"
            disabled={!selectedId || pending}
            onClick={confirm}
          >
            使用所选资源
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssetPreview({
  asset,
  selected,
}: {
  asset: MediaAsset;
  selected: boolean;
}) {
  return (
    <div className="relative aspect-square overflow-hidden bg-muted">
      {asset.mimeType.startsWith("image/") ? (
        <Image
          src={asset.url}
          alt={asset.altText || asset.originalName}
          fill
          unoptimized
          sizes="180px"
          className="object-cover transition group-hover:scale-[1.02]"
        />
      ) : asset.mimeType.startsWith("video/") ? (
        <video
          src={asset.url}
          muted
          preload="metadata"
          className="size-full object-cover"
          aria-label={asset.altText || asset.originalName}
        />
      ) : (
        <span className="grid size-full place-items-center">
          <FileText className="size-10 text-muted-foreground" />
        </span>
      )}
      {asset.mimeType.startsWith("video/") && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
          <Video className="size-3" />
          视频
        </span>
      )}
      {selected && (
        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
      )}
    </div>
  );
}

type PublicPickerProps = Omit<AssetPickerProps, "kind" | "triggerLabel"> & {
  triggerLabel?: string;
};
export function ImagePicker(props: PublicPickerProps) {
  return (
    <AssetPicker
      {...props}
      kind="image"
      triggerLabel={props.triggerLabel ?? "选择图片"}
    />
  );
}
export function MediaPicker(props: PublicPickerProps) {
  return (
    <AssetPicker
      {...props}
      kind="media"
      triggerLabel={props.triggerLabel ?? "选择媒体"}
    />
  );
}
export function FilePicker(props: PublicPickerProps) {
  return (
    <AssetPicker
      {...props}
      kind="file"
      triggerLabel={props.triggerLabel ?? "选择文件"}
    />
  );
}
