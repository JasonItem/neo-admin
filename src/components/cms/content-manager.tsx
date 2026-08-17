"use client";

import * as React from "react";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  saveCmsCategoryAction,
  saveCmsContentAction,
} from "@/app/actions/cms-content";
import { ImagePicker } from "@/components/cms/media-picker";
import { CmsFormField, CmsPickerField } from "@/components/cms/cms-form-field";
import type { MediaAsset } from "@/components/cms/media-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Kind = "ARTICLE" | "PRODUCT" | "CASE";
type Item = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  coverMediaId: string | null;
  status: "DRAFT" | "PUBLISHED" | "OFFLINE";
  featured: boolean;
  sortOrder: number;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  galleryMediaIds: string[];
  attributes: Record<string, string>;
};
type Category = {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
};
type Draft = Omit<
  Item,
  | "id"
  | "summary"
  | "body"
  | "coverMediaId"
  | "categoryId"
  | "seoTitle"
  | "seoDescription"
> & {
  id?: string;
  summary: string;
  body: string;
  coverMediaId: string;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
};
const empty: Draft = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  coverMediaId: "",
  status: "DRAFT" as const,
  featured: false,
  sortOrder: 0,
  categoryId: "",
  seoTitle: "",
  seoDescription: "",
  galleryMediaIds: [] as string[],
  attributes: {} as Record<string, string>,
};

export function ContentManager({
  kind,
  label,
  items: initialItems,
  categories,
  mediaItems,
}: {
  kind: Kind;
  label: string;
  items: Item[];
  categories: Category[];
  mediaItems: MediaAsset[];
}) {
  const [items, setItems] = React.useState(initialItems);
  const [editing, setEditing] = React.useState<Draft | null>(null);
  const [categoryName, setCategoryName] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const save = () =>
    editing &&
    startTransition(async () => {
      try {
        const result = await saveCmsContentAction({ ...editing, kind });
        const next = {
          ...editing,
          id: result.id,
          summary: editing.summary || null,
          body: editing.body || null,
          coverMediaId: editing.coverMediaId || null,
          categoryId: editing.categoryId || null,
          seoTitle: editing.seoTitle || null,
          seoDescription: editing.seoDescription || null,
        } as Item;
        setItems((current) =>
          editing.id
            ? current.map((item) => (item.id === editing.id ? next : item))
            : [next, ...current],
        );
        setEditing(null);
        toast.success(`${label}已保存`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
    });
  const addCategory = () =>
    categoryName.trim() &&
    startTransition(async () => {
      try {
        await saveCmsCategoryAction({
          kind,
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
          parentId: "",
          description: "",
          sortOrder: categories.length,
          enabled: true,
        });
        toast.success("分类已创建，刷新页面后可选择");
        setCategoryName("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "创建失败");
      }
    });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex items-end gap-2">
          <CmsFormField
            label={`${label}分类`}
            description={`新分类创建后可用于组织${label}。`}
          >
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={`新增${label}分类`}
              className="w-48"
            />
          </CmsFormField>
          <Button variant="outline" onClick={addCategory} disabled={pending}>
            添加分类
          </Button>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus />
          新增{label}
        </Button>
      </div>
      <Card className="py-0">
        <CardContent className="divide-y p-0">
          {items.length ? (
            items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  setEditing({
                    ...empty,
                    ...item,
                    summary: item.summary ?? "",
                    body: item.body ?? "",
                    coverMediaId: item.coverMediaId ?? "",
                    categoryId: item.categoryId ?? "",
                    seoTitle: item.seoTitle ?? "",
                    seoDescription: item.seoDescription ?? "",
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">/{item.slug}</p>
                </div>
                <Badge
                  variant={item.status === "PUBLISHED" ? "default" : "outline"}
                >
                  {item.status === "PUBLISHED"
                    ? "已发布"
                    : item.status === "DRAFT"
                      ? "草稿"
                      : "已下线"}
                </Badge>
              </button>
            ))
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              暂无{label}
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? `编辑${label}` : `新增${label}`}
            </DialogTitle>
            <DialogDescription>
              维护内容、分类、发布状态、封面与 SEO 信息。
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <CmsFormField label={`${label}标题`}>
                <Input
                  placeholder="标题"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsFormField
                label="访问路径"
                description={`生成${label}详情页地址，仅支持小写字母、数字和短横线。`}
              >
                <Input
                  placeholder="访问路径，如 company-news"
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing({ ...editing, slug: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsFormField label={`${label}分类`}>
                <select
                  className="h-9 rounded-lg border bg-background px-3"
                  value={editing.categoryId}
                  onChange={(e) =>
                    setEditing({ ...editing, categoryId: e.target.value })
                  }
                >
                  <option value="">未分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </CmsFormField>
              <CmsFormField
                label="发布状态"
                description="只有已发布内容会出现在前台列表区块中。"
              >
                <select
                  className="h-9 rounded-lg border bg-background px-3"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as typeof editing.status,
                    })
                  }
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">发布</option>
                  <option value="OFFLINE">下线</option>
                </select>
              </CmsFormField>
              <CmsFormField
                label={`${label}摘要`}
                description="显示在前台列表卡片中，用于快速介绍内容。"
                className="sm:col-span-2"
              >
                <Textarea
                  placeholder="摘要"
                  value={editing.summary}
                  onChange={(e) =>
                    setEditing({ ...editing, summary: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsFormField
                label={`${label}正文`}
                description={`访客打开${label}详情页后阅读的完整内容。`}
                className="sm:col-span-2"
              >
                <Textarea
                  rows={10}
                  placeholder="正文内容"
                  value={editing.body}
                  onChange={(e) =>
                    setEditing({ ...editing, body: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsPickerField
                label={`${label}封面图`}
                description={`显示在首页和${label}列表卡片中，可从媒体库复用已有图片。`}
              >
                <ImagePicker
                  items={mediaItems}
                  value={editing.coverMediaId}
                  onSelect={(asset) =>
                    setEditing({ ...editing, coverMediaId: asset.id })
                  }
                  triggerLabel={`选择${label}封面`}
                />
              </CmsPickerField>
              <CmsFormField
                label="SEO 标题"
                description="显示在浏览器标题和搜索结果标题中。"
              >
                <Input
                  placeholder="SEO 标题"
                  value={editing.seoTitle}
                  onChange={(e) =>
                    setEditing({ ...editing, seoTitle: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsFormField
                label="SEO 描述"
                description="搜索引擎结果中可能展示的内容摘要。"
                className="sm:col-span-2"
              >
                <Textarea
                  placeholder="SEO 描述"
                  value={editing.seoDescription}
                  onChange={(e) =>
                    setEditing({ ...editing, seoDescription: e.target.value })
                  }
                />
              </CmsFormField>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={save} disabled={pending}>
                  <Save />
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
