"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  saveCmsCategoryAction,
  saveCmsContentAction,
} from "@/app/actions/cms-content";
import { ImagePicker } from "@/components/cms/media-picker";
import { CmsFormField, CmsPickerField } from "@/components/cms/cms-form-field";
import type { MediaAsset } from "@/components/cms/media-types";
import { RichTextEditor } from "@/components/cms/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  if (editing) {
    return (
      <ContentEditor
        editing={editing}
        setEditing={setEditing}
        label={label}
        categories={categories}
        mediaItems={mediaItems}
        pending={pending}
        onSave={save}
      />
    );
  }

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
    </div>
  );
}

function ContentEditor({
  editing,
  setEditing,
  label,
  categories,
  mediaItems,
  pending,
  onSave,
}: {
  editing: Draft;
  setEditing: React.Dispatch<React.SetStateAction<Draft | null>>;
  label: string;
  categories: Category[];
  mediaItems: MediaAsset[];
  pending: boolean;
  onSave: () => void;
}) {
  const update = (patch: Partial<Draft>) =>
    setEditing((current) => (current ? { ...current, ...patch } : current));
  const detailSection =
    label === "文章" ? "articles" : label === "产品" ? "products" : "cases";

  return (
    <div className="fixed inset-0 z-50 flex min-h-0 flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`返回${label}列表`}
          onClick={() => setEditing(null)}
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">
            {editing.id ? `编辑${label}` : `新增${label}`}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            独立编辑模式 · 正文与发布设置分区展示
          </p>
        </div>
        {editing.id && editing.status === "PUBLISHED" && editing.slug && (
          <Link
            href={`/${detailSection}/${editing.slug}`}
            target="_blank"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink />
            <span className="hidden sm:inline">预览</span>
          </Link>
        )}
        <Button type="button" onClick={onSave} disabled={pending}>
          <Save />
          {pending ? "保存中…" : "保存"}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1600px] gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-6">
            <Card>
              <CardContent className="space-y-5">
                <CmsFormField label={`${label}标题`}>
                  <Input
                    type="text"
                    placeholder={`请输入${label}标题`}
                    value={editing.title}
                    onChange={(event) => update({ title: event.target.value })}
                    className="h-11 text-lg font-medium"
                  />
                </CmsFormField>
                <CmsFormField
                  label={`${label}摘要`}
                  description="显示在前台列表卡片中，用于快速介绍内容。"
                >
                  <Textarea
                    rows={4}
                    placeholder={`请输入${label}摘要`}
                    value={editing.summary}
                    onChange={(event) =>
                      update({ summary: event.target.value })
                    }
                  />
                </CmsFormField>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CmsFormField
                  label={`${label}正文`}
                  description={`访客打开${label}详情页后阅读的完整内容；可设置标题、列表和链接，也可直接插入媒体库图片或文件。`}
                >
                  <RichTextEditor
                    value={editing.body}
                    onChange={(body) => update({ body })}
                    mediaItems={mediaItems}
                    label={label}
                  />
                </CmsFormField>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <CmsFormField
                  label="SEO 标题"
                  description="显示在浏览器标题和搜索结果标题中。"
                >
                  <Input
                    type="text"
                    placeholder="SEO 标题"
                    value={editing.seoTitle}
                    onChange={(event) =>
                      update({ seoTitle: event.target.value })
                    }
                  />
                </CmsFormField>
                <CmsFormField
                  label="SEO 描述"
                  description="搜索引擎结果中可能展示的内容摘要。"
                >
                  <Textarea
                    placeholder="SEO 描述"
                    value={editing.seoDescription}
                    onChange={(event) =>
                      update({ seoDescription: event.target.value })
                    }
                  />
                </CmsFormField>
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
            <Card>
              <CardContent className="space-y-5">
                <h2 className="font-semibold">发布设置</h2>
                <CmsFormField
                  label="发布状态"
                  description="只有已发布内容会出现在前台列表和详情页中。"
                >
                  <select
                    className="h-9 rounded-lg border bg-background px-3"
                    value={editing.status}
                    onChange={(event) =>
                      update({ status: event.target.value as Draft["status"] })
                    }
                  >
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">发布</option>
                    <option value="OFFLINE">下线</option>
                  </select>
                </CmsFormField>
                <CmsFormField label={`${label}分类`}>
                  <select
                    className="h-9 rounded-lg border bg-background px-3"
                    value={editing.categoryId}
                    onChange={(event) =>
                      update({ categoryId: event.target.value })
                    }
                  >
                    <option value="">未分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </CmsFormField>
                <CmsFormField
                  label="访问路径"
                  description={`生成${label}详情页地址，仅支持小写字母、数字和短横线。`}
                >
                  <Input
                    type="text"
                    placeholder="如 company-news"
                    value={editing.slug}
                    onChange={(event) => update({ slug: event.target.value })}
                  />
                </CmsFormField>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <CmsPickerField
                  label={`${label}封面图`}
                  description={`显示在首页、${label}列表卡片和详情页顶部，可从媒体库复用已有图片。`}
                >
                  <ImagePicker
                    items={mediaItems}
                    value={editing.coverMediaId}
                    onSelect={(asset) => update({ coverMediaId: asset.id })}
                    triggerLabel={`选择${label}封面`}
                  />
                </CmsPickerField>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
