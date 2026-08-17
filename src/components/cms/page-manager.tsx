"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveCmsPageAction } from "@/app/actions/cms-content";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Block = {
  id: string;
  type: string;
  title?: string;
  content?: string;
  mediaId?: string;
};
type PageItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverMediaId: string | null;
  blocks: Block[];
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED" | "OFFLINE";
  isHome: boolean;
  sortOrder: number;
};
type Draft = Omit<
  PageItem,
  "id" | "summary" | "coverMediaId" | "seoTitle" | "seoDescription"
> & {
  id?: string;
  summary: string;
  coverMediaId: string;
  seoTitle: string;
  seoDescription: string;
};
const empty: Draft = {
  title: "",
  slug: "",
  summary: "",
  coverMediaId: "",
  blocks: [] as Block[],
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT" as const,
  isHome: false,
  sortOrder: 0,
};
const blockNames: Record<string, string> = {
  HERO: "首屏 Banner",
  RICH_TEXT: "图文介绍",
  FEATURES: "企业优势",
  PRODUCTS: "产品列表",
  ARTICLES: "新闻列表",
  CONTACT: "联系方式",
  CTA: "行动号召",
};

export function PageManager({
  pages: initialPages,
  mediaItems,
}: {
  pages: PageItem[];
  mediaItems: MediaAsset[];
}) {
  const [pages, setPages] = React.useState(initialPages);
  const [editing, setEditing] = React.useState<Draft | null>(null);
  const [pending, startTransition] = React.useTransition();
  const addBlock = (type: string) =>
    editing &&
    setEditing({
      ...editing,
      blocks: [
        ...editing.blocks,
        { id: crypto.randomUUID(), type, title: blockNames[type], content: "" },
      ],
    });
  const patchBlock = (id: string, patch: Partial<Block>) =>
    editing &&
    setEditing({
      ...editing,
      blocks: editing.blocks.map((block) =>
        block.id === id ? { ...block, ...patch } : block,
      ),
    });
  const move = (index: number, direction: -1 | 1) => {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.blocks.length) return;
    const blocks = [...editing.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setEditing({ ...editing, blocks });
  };
  const save = () =>
    editing &&
    startTransition(async () => {
      try {
        const result = await saveCmsPageAction(editing);
        const item = {
          ...editing,
          id: result.id,
          summary: editing.summary || null,
          coverMediaId: editing.coverMediaId || null,
          seoTitle: editing.seoTitle || null,
          seoDescription: editing.seoDescription || null,
        } as PageItem;
        setPages((current) =>
          editing.id
            ? current.map((page) => (page.id === editing.id ? item : page))
            : [item, ...current],
        );
        setEditing(null);
        toast.success("页面已保存");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
    });
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus />
          新增页面
        </Button>
      </div>
      <Card className="py-0">
        <CardContent className="divide-y p-0">
          {pages.length ? (
            pages.map((page) => (
              <button
                type="button"
                key={page.id}
                onClick={() =>
                  setEditing({
                    ...empty,
                    ...page,
                    summary: page.summary ?? "",
                    coverMediaId: page.coverMediaId ?? "",
                    seoTitle: page.seoTitle ?? "",
                    seoDescription: page.seoDescription ?? "",
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{page.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{page.slug} · {page.blocks.length} 个区块
                  </p>
                </div>
                {page.isHome && <Badge variant="secondary">首页</Badge>}
                <Badge
                  variant={page.status === "PUBLISHED" ? "default" : "outline"}
                >
                  {page.status === "PUBLISHED"
                    ? "已发布"
                    : page.status === "DRAFT"
                      ? "草稿"
                      : "已下线"}
                </Badge>
              </button>
            ))
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              暂无页面
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "编辑页面" : "新增页面"}</DialogTitle>
            <DialogDescription>
              维护页面基础信息，并使用结构化区块组合页面内容。
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <CmsFormField label="页面标题">
                  <Input
                    placeholder="页面标题"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                  />
                </CmsFormField>
                <CmsFormField
                  label="访问路径"
                  description="用于生成页面地址，例如填写 about-us 后可通过 /about-us 访问。"
                >
                  <Input
                    placeholder="访问路径，如 about-us"
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value })
                    }
                  />
                </CmsFormField>
                <CmsFormField
                  label="页面摘要"
                  description="用于后台识别页面，也可作为搜索引擎的默认描述。"
                >
                  <Textarea
                    placeholder="页面摘要"
                    value={editing.summary}
                    onChange={(e) =>
                      setEditing({ ...editing, summary: e.target.value })
                    }
                  />
                </CmsFormField>
                <CmsPickerField
                  label="首页设置"
                  description="启用后该页面会在网站根地址 / 展示，并自动取消其他首页。"
                >
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-sm">将此页面设为网站首页</span>
                    <Switch
                      checked={editing.isHome}
                      onCheckedChange={(isHome) =>
                        setEditing({ ...editing, isHome })
                      }
                    />
                  </div>
                </CmsPickerField>
                <CmsFormField
                  label="发布状态"
                  description="只有“发布”状态的页面可以被访客访问。"
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
                <CmsPickerField
                  label="页面封面图"
                  description="用于页面列表、分享卡片或后续模板中的页面主图，不是区块背景图。"
                >
                  <ImagePicker
                    items={mediaItems}
                    value={editing.coverMediaId}
                    onSelect={(asset) =>
                      setEditing({ ...editing, coverMediaId: asset.id })
                    }
                    triggerLabel="选择页面封面"
                  />
                </CmsPickerField>
              </div>
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {Object.entries(blockNames).map(([type, label]) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      onClick={() => addBlock(type)}
                    >
                      <Plus />
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="space-y-3">
                  {editing.blocks.map((block, index) => (
                    <Card key={block.id}>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {blockNames[block.type] ?? block.type}
                          </Badge>
                          <div className="ml-auto flex gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => move(index, -1)}
                            >
                              <ArrowUp />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => move(index, 1)}
                            >
                              <ArrowDown />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                setEditing({
                                  ...editing,
                                  blocks: [
                                    ...editing.blocks.slice(0, index + 1),
                                    { ...block, id: crypto.randomUUID() },
                                    ...editing.blocks.slice(index + 1),
                                  ],
                                })
                              }
                            >
                              <Copy />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                setEditing({
                                  ...editing,
                                  blocks: editing.blocks.filter(
                                    (item) => item.id !== block.id,
                                  ),
                                })
                              }
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                        <CmsFormField label="区块标题">
                          <Input
                            placeholder="区块标题"
                            value={block.title ?? ""}
                            onChange={(e) =>
                              patchBlock(block.id, { title: e.target.value })
                            }
                          />
                        </CmsFormField>
                        <CmsFormField
                          label="区块正文"
                          description="该文字会直接显示在当前页面区块中。"
                        >
                          <Textarea
                            rows={4}
                            placeholder="区块内容"
                            value={block.content ?? ""}
                            onChange={(e) =>
                              patchBlock(block.id, { content: e.target.value })
                            }
                          />
                        </CmsFormField>
                        {["HERO", "RICH_TEXT", "CTA"].includes(block.type) && (
                          <CmsPickerField
                            label="区块配图"
                            description="仅作用于当前区块；首屏区块中会作为背景图，图文区块中会作为内容配图。"
                          >
                            <ImagePicker
                              items={mediaItems}
                              value={block.mediaId}
                              onSelect={(asset) => {
                                patchBlock(block.id, { mediaId: asset.id });
                              }}
                              triggerLabel="选择区块配图"
                            />
                          </CmsPickerField>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
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
                  description="搜索引擎结果中可能展示的页面摘要。"
                >
                  <Input
                    placeholder="SEO 描述"
                    value={editing.seoDescription}
                    onChange={(e) =>
                      setEditing({ ...editing, seoDescription: e.target.value })
                    }
                  />
                </CmsFormField>
              </div>
              <div className="flex justify-end">
                <Button disabled={pending} onClick={save}>
                  <Save />
                  保存页面
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
