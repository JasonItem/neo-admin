"use client";
import * as React from "react";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { saveCmsNavigationAction } from "@/app/actions/cms-content";
import { CmsFormField, CmsPickerField } from "@/components/cms/cms-form-field";
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
type Nav = {
  id: string;
  parentId: string | null;
  label: string;
  location: "HEADER" | "FOOTER";
  linkType: "PAGE" | "URL";
  pageId: string | null;
  url: string | null;
  target: "SELF" | "BLANK";
  sortOrder: number;
  enabled: boolean;
};
type Page = { id: string; title: string; slug: string };
type Draft = Omit<Nav, "id" | "parentId" | "pageId" | "url"> & {
  id?: string;
  parentId: string;
  pageId: string;
  url: string;
};
const empty: Draft = {
  parentId: "",
  label: "",
  location: "HEADER" as const,
  linkType: "PAGE" as const,
  pageId: "",
  url: "",
  target: "SELF" as const,
  sortOrder: 0,
  enabled: true,
};
export function NavigationManager({
  items: initial,
  pages,
}: {
  items: Nav[];
  pages: Page[];
}) {
  const [items, setItems] = React.useState(initial);
  const [editing, setEditing] = React.useState<Draft | null>(null);
  const [pending, startTransition] = React.useTransition();
  const depth = (item: Nav) => {
    let d = 0,
      p = item.parentId;
    while (p) {
      d++;
      p = items.find((x) => x.id === p)?.parentId ?? null;
    }
    return d;
  };
  const save = () =>
    editing &&
    startTransition(async () => {
      try {
        const result = await saveCmsNavigationAction(editing);
        const item = {
          ...editing,
          id: result.id,
          parentId: editing.parentId || null,
          pageId: editing.pageId || null,
          url: editing.url || null,
        } as Nav;
        setItems((c) =>
          editing.id
            ? c.map((x) => (x.id === editing.id ? item : x))
            : [...c, item],
        );
        setEditing(null);
        toast.success("导航已保存");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
    });
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus />
          新增导航
        </Button>
      </div>
      <Card className="py-0">
        <CardContent className="divide-y p-0">
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setEditing({
                    ...empty,
                    ...item,
                    parentId: item.parentId ?? "",
                    pageId: item.pageId ?? "",
                    url: item.url ?? "",
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
              >
                <span
                  style={{ paddingLeft: depth(item) * 24 }}
                  className="font-medium"
                >
                  {depth(item) > 0 ? "└ " : ""}
                  {item.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.location === "HEADER" ? "顶部" : "底部"} ·{" "}
                  {item.linkType === "PAGE"
                    ? pages.find((p) => p.id === item.pageId)?.title
                    : "外部链接"}
                </span>
              </button>
            ))
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              暂无导航
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导航配置</DialogTitle>
            <DialogDescription>
              支持无限级父子栏目，可关联站内页面或外部地址。
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <CmsFormField
                label="导航名称"
                description="显示在网站顶部或底部的文字。"
              >
                <Input
                  placeholder="导航名称"
                  value={editing.label}
                  onChange={(e) =>
                    setEditing({ ...editing, label: e.target.value })
                  }
                />
              </CmsFormField>
              <CmsFormField
                label="上级导航"
                description="选择上级后成为子菜单；不选择则为顶级导航。"
              >
                <select
                  className="h-9 rounded-lg border bg-background px-3"
                  value={editing.parentId}
                  onChange={(e) =>
                    setEditing({ ...editing, parentId: e.target.value })
                  }
                >
                  <option value="">顶级导航</option>
                  {items
                    .filter((x) => x.id !== editing.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {"—".repeat(depth(x))}
                        {x.label}
                      </option>
                    ))}
                </select>
              </CmsFormField>
              <div className="grid grid-cols-2 gap-3">
                <CmsFormField label="展示位置">
                  <select
                    className="h-9 rounded-lg border bg-background px-3"
                    value={editing.location}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        location: e.target.value as typeof editing.location,
                      })
                    }
                  >
                    <option value="HEADER">顶部导航</option>
                    <option value="FOOTER">底部导航</option>
                  </select>
                </CmsFormField>
                <CmsFormField label="链接类型">
                  <select
                    className="h-9 rounded-lg border bg-background px-3"
                    value={editing.linkType}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        linkType: e.target.value as typeof editing.linkType,
                      })
                    }
                  >
                    <option value="PAGE">站内页面</option>
                    <option value="URL">外部链接</option>
                  </select>
                </CmsFormField>
              </div>
              {editing.linkType === "PAGE" ? (
                <CmsFormField
                  label="关联页面"
                  description="点击导航后将打开所选择的已发布页面。"
                >
                  <select
                    className="h-9 rounded-lg border bg-background px-3"
                    value={editing.pageId}
                    onChange={(e) =>
                      setEditing({ ...editing, pageId: e.target.value })
                    }
                  >
                    <option value="">选择页面</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </CmsFormField>
              ) : (
                <CmsFormField
                  label="外部链接地址"
                  description="请输入完整地址，例如 https://example.com。"
                >
                  <Input
                    placeholder="https://example.com"
                    value={editing.url}
                    onChange={(e) =>
                      setEditing({ ...editing, url: e.target.value })
                    }
                  />
                </CmsFormField>
              )}
              <CmsPickerField
                label="启用状态"
                description="关闭后该导航不会显示在网站前台。"
              >
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span>启用导航</span>
                  <Switch
                    checked={editing.enabled}
                    onCheckedChange={(enabled) =>
                      setEditing({ ...editing, enabled })
                    }
                  />
                </div>
              </CmsPickerField>
              <Button disabled={pending} onClick={save}>
                <Save />
                保存导航
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
