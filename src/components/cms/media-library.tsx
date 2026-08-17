"use client";

import * as React from "react";
import Image from "next/image";
import {
  File,
  FileImage,
  FileText,
  Grid2X2,
  ImageIcon,
  List,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteCmsMediaAction,
  updateCmsMediaAction,
  uploadCmsMediaAction,
} from "@/app/actions/cms";
import type { MediaAsset } from "@/components/cms/media-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const formatSize = (size: number) =>
  size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(date)
        .replaceAll("/", "-");
};
const typeOf = (item: MediaAsset) =>
  item.mimeType.startsWith("image/")
    ? "图片"
    : item.mimeType === "application/pdf"
      ? "PDF"
      : item.mimeType.includes("word") ||
          item.mimeType.includes("sheet") ||
          item.mimeType.includes("excel")
        ? "文档"
        : "其他";
const FileIcon = ({
  item,
  className,
}: {
  item: MediaAsset;
  className?: string;
}) =>
  item.mimeType.startsWith("image/") ? (
    <FileImage className={className} />
  ) : item.mimeType === "application/pdf" ? (
    <FileText className={className} />
  ) : (
    <File className={className} />
  );

export function MediaLibrary({ items: initialItems }: { items: MediaAsset[] }) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);
  const [items, setItems] = React.useState(initialItems);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("全部");
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [editing, setEditing] = React.useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = React.useState<MediaAsset | null>(null);
  const [pending, startTransition] = React.useTransition();

  const filtered = items.filter(
    (item) =>
      (filter === "全部" || typeOf(item) === filter) &&
      `${item.originalName} ${item.altText}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const recent = items.slice(0, 3);

  const upload = (file?: File) => {
    if (!file) return;
    const data = new FormData();
    data.set("file", file);
    data.set("altText", file.name.replace(/\.[^.]+$/, ""));
    startTransition(async () => {
      try {
        const asset = await uploadCmsMediaAction(data);
        setItems((current) => [
          {
            ...asset,
            createdAt: formatDate(asset.createdAt),
            updatedAt: formatDate(asset.updatedAt),
          },
          ...current,
        ]);
        toast.success("文件已上传到媒体库");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "上传失败");
      }
    });
  };
  const saveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      try {
        await updateCmsMediaAction({
          id: editing.id,
          originalName: editing.originalName,
          altText: editing.altText,
        });
        setItems((current) =>
          current.map((item) => (item.id === editing.id ? editing : item)),
        );
        setEditing(null);
        toast.success("媒体信息已更新");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "更新失败");
      }
    });
  };
  const remove = () => {
    if (!deleting) return;
    startTransition(async () => {
      try {
        await deleteCmsMediaAction(deleting.id);
        setItems((current) =>
          current.filter((item) => item.id !== deleting.id),
        );
        setDeleting(null);
        toast.success("文件已删除");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败");
      }
    });
  };

  return (
    <div className="space-y-8">
      <input
        ref={imageInputRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        className="hidden"
        type="file"
        accept="application/pdf,.doc,.docx,.xls,.xlsx"
        onChange={(event) => {
          upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <section>
        <h2 className="mb-3 text-sm font-medium">快速操作</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            icon={ImageIcon}
            title="上传图片"
            description="JPG、PNG、WebP 或 GIF"
            onClick={() => imageInputRef.current?.click()}
          />
          <QuickAction
            icon={FileText}
            title="上传文档"
            description="PDF、Word 或 Excel"
            onClick={() => documentInputRef.current?.click()}
          />
          <div className="hidden rounded-xl border border-dashed p-4 text-sm text-muted-foreground xl:flex xl:items-center xl:gap-3">
            <Upload className="size-5" />
            <span>文件保存在服务器本地，单个文件最大 10MB</span>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium">最近上传</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  window.open(item.url, "_blank", "noopener,noreferrer")
                }
                className="flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-muted/50"
              >
                <MediaThumb item={item} compact />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(item.size)} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">全部文件</h2>
          <p className="text-sm text-muted-foreground">
            共 {items.length} 个媒体文件
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {["全部", "图片", "文档", "PDF", "其他"].map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={filter === type ? "secondary" : "ghost"}
                onClick={() => setFilter(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索媒体文件"
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setView(view === "list" ? "grid" : "list")}
            >
              {view === "list" ? <Grid2X2 /> : <List />}
              <span className="sr-only">切换视图</span>
            </Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-dashed text-center">
            <div>
              <ImageIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="font-medium">没有找到媒体文件</p>
              <p className="mt-1 text-sm text-muted-foreground">
                调整筛选条件，或上传一个新文件。
              </p>
            </div>
          </div>
        ) : view === "list" ? (
          <Card className="overflow-hidden py-0">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>文件名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>上传者</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">操作</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <MediaThumb item={item} compact />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="max-w-64 truncate font-medium">
                              {item.originalName}
                            </p>
                            {item.isLogo && (
                              <Badge variant="secondary">网站 Logo</Badge>
                            )}
                          </div>
                          <p className="max-w-72 truncate text-xs text-muted-foreground">
                            {item.altText || "暂无说明"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeOf(item)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.uploaderName || "系统用户"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.uploaderUsername}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatSize(item.size)}</TableCell>
                    <TableCell>{item.updatedAt}</TableCell>
                    <TableCell>
                      <RowMenu
                        item={item}
                        pending={pending}
                        onEdit={() => setEditing(item)}
                        onDelete={() => setDeleting(item)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <Card key={item.id} className="overflow-hidden py-0">
                <MediaThumb item={item} />
                <CardContent className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(item.size)} · {item.updatedAt}
                    </p>
                  </div>
                  <RowMenu
                    item={item}
                    pending={pending}
                    onEdit={() => setEditing(item)}
                    onDelete={() => setDeleting(item)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑媒体信息</DialogTitle>
            <DialogDescription>
              修改后台显示的文件名称和图片替代文本，不会改变文件内容。
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                文件名称
                <Input
                  value={editing.originalName}
                  onChange={(event) =>
                    setEditing({ ...editing, originalName: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                图片说明（Alt）
                <Input
                  value={editing.altText}
                  onChange={(event) =>
                    setEditing({ ...editing, altText: event.target.value })
                  }
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              取消
            </DialogClose>
            <Button type="button" disabled={pending} onClick={saveEdit}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这个媒体文件？</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.originalName}
              ”将从媒体库和本地存储中删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={remove}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof ImageIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border p-4 text-left transition hover:bg-muted/50"
    >
      <span className="grid size-10 place-items-center rounded-lg border bg-background">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="text-xl text-muted-foreground transition group-hover:text-foreground">
        ＋
      </span>
    </button>
  );
}
function MediaThumb({
  item,
  compact = false,
}: {
  item: MediaAsset;
  compact?: boolean;
}) {
  return item.mimeType.startsWith("image/") ? (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        compact ? "size-10 rounded-lg" : "aspect-[4/3] w-full",
      )}
    >
      <Image
        src={item.url}
        alt={item.altText || item.originalName}
        fill
        unoptimized
        sizes={compact ? "40px" : "320px"}
        className="object-cover"
      />
    </div>
  ) : (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-muted text-muted-foreground",
        compact ? "size-10 rounded-lg" : "aspect-[4/3] w-full",
      )}
    >
      <FileIcon item={item} className={compact ? "size-5" : "size-12"} />
    </div>
  );
}
function RowMenu({
  item,
  pending,
  onEdit,
  onDelete,
}: {
  item: MediaAsset;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
          />
        }
      >
        <MoreHorizontal />
        <span className="sr-only">文件操作</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          render={<a href={item.url} target="_blank" rel="noreferrer" />}
        >
          <FileImage />
          在浏览器打开
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil />
          编辑媒体信息
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={item.isLogo}
          onClick={onDelete}
        >
          <Trash2 />
          删除文件
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
