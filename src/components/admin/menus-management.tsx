"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Plus,
  XIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/components/demo/demo-store";
import { PageHeader } from "@/components/layout/page-header";
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
import {
  Dialog,
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
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DemoMenu } from "@/lib/demo-data";
import { FormSelect } from "@/components/ui/form-select";
import { PERMISSIONS } from "@/lib/permissions";

const emptyMenu = (parentId: string | null = null): Omit<DemoMenu, "id"> => ({
  parentId,
  name: "",
  type: "MENU",
  path: "",
  icon: "",
  permissionCode: "",
  sortOrder: 0,
  visible: true,
  enabled: true,
  openMode: "INTERNAL",
});
const typeNames = { DIRECTORY: "目录", MENU: "菜单", BUTTON: "按钮" };
const typeVariants = {
  DIRECTORY: "default",
  MENU: "secondary",
  BUTTON: "outline",
} as const;
function flattenAll(
  items: DemoMenu[],
  parentId: string | null = null,
  depth = 0,
): Array<DemoMenu & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((item) => [
      { ...item, depth },
      ...flattenAll(items, item.id, depth + 1),
    ]);
}
function flattenVisible(
  items: DemoMenu[],
  expanded: Set<string>,
  parentId: string | null = null,
  depth = 0,
): Array<DemoMenu & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((item) => [
      { ...item, depth },
      ...(expanded.has(item.id)
        ? flattenVisible(items, expanded, item.id, depth + 1)
        : []),
    ]);
}

export function MenusManagement() {
  const store = useDemoStore();
  const [keyword, setKeyword] = React.useState("");
  const [types, setTypes] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [visibilities, setVisibilities] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(
      store.menus
        .filter((item) => item.type !== "BUTTON")
        .map((item) => item.id),
    ),
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string>();
  const [draft, setDraft] = React.useState(emptyMenu);
  const [deleteMenu, setDeleteMenu] = React.useState<DemoMenu>();
  const searching = Boolean(
    keyword || types.length || statuses.length || visibilities.length,
  );
  const source = searching
    ? flattenAll(store.menus).filter(
        (item) =>
          (!keyword ||
            `${item.name} ${item.path} ${item.permissionCode}`
              .toLowerCase()
              .includes(keyword.toLowerCase())) &&
          (!types.length || types.includes(item.type)) &&
          (!statuses.length || statuses.includes(String(item.enabled))) &&
          (!visibilities.length ||
            visibilities.includes(String(item.visible))),
      )
    : flattenVisible(store.menus, expanded);
  const parentOptions = flattenAll(store.menus).filter(
    (item) => item.type !== "BUTTON" && item.id !== editingId,
  );
  const openCreate = (parentId: string | null = null) => {
    setEditingId(undefined);
    setDraft(emptyMenu(parentId));
    setDialogOpen(true);
  };
  const openEdit = (menu: DemoMenu) => {
    setEditingId(menu.id);
    setDraft(menu);
    setDialogOpen(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return toast.error("请输入菜单名称");
    if (draft.type === "MENU" && !draft.path.trim())
      return toast.error("菜单类型必须填写路由地址");
    if (draft.type === "BUTTON" && !draft.permissionCode.trim())
      return toast.error("按钮类型必须填写权限标识");
    if (
      draft.permissionCode &&
      store.menus.some(
        (item) =>
          item.permissionCode === draft.permissionCode && item.id !== editingId,
      )
    )
      return toast.error("权限标识已存在");
    const normalized = {
      ...draft,
      path: draft.type === "BUTTON" ? "" : draft.path,
      icon: draft.type === "BUTTON" ? "" : draft.icon,
      visible: draft.type === "BUTTON" ? false : draft.visible,
    };
    store.saveMenu({ ...normalized, id: editingId });
    setDialogOpen(false);
    if (draft.parentId)
      setExpanded((current) => new Set(current).add(draft.parentId!));
    toast.success(editingId ? "菜单已更新" : "菜单已创建");
  };
  const childCount = (id: string) =>
    store.menus.filter((item) => item.parentId === id).length;
  return (
    <div className="space-y-5">
      <PageHeader
        title="菜单管理"
        description="管理侧边目录、页面菜单以及页面内按钮权限。"
      />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            className="h-8 w-full sm:w-[300px]"
            placeholder="搜索名称、路由或权限标识"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <DataTableFacetedFilter
            title="类型"
            values={types}
            onValuesChange={setTypes}
            options={[
              {
                value: "DIRECTORY",
                label: "目录",
                count: store.menus.filter((item) => item.type === "DIRECTORY").length,
              },
              {
                value: "MENU",
                label: "菜单",
                count: store.menus.filter((item) => item.type === "MENU").length,
              },
              {
                value: "BUTTON",
                label: "按钮",
                count: store.menus.filter((item) => item.type === "BUTTON").length,
              },
            ]}
          />
          <DataTableFacetedFilter
            title="状态"
            values={statuses}
            onValuesChange={setStatuses}
            options={[
              {
                value: "true",
                label: "正常",
                count: store.menus.filter((item) => item.enabled).length,
              },
              {
                value: "false",
                label: "停用",
                count: store.menus.filter((item) => !item.enabled).length,
              },
            ]}
          />
          <DataTableFacetedFilter
            title="显示"
            values={visibilities}
            onValuesChange={setVisibilities}
            options={[
              {
                value: "true",
                label: "显示",
                count: store.menus.filter((item) => item.visible).length,
              },
              {
                value: "false",
                label: "隐藏",
                count: store.menus.filter((item) => !item.visible).length,
              },
            ]}
          />
          {searching && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setKeyword("");
                setTypes([]);
                setStatuses([]);
                setVisibilities([]);
              }}
            >
              <XIcon />
              重置
            </Button>
          )}
        </div>
        {store.can(PERMISSIONS.menuCreate) && (
          <Button size="sm" onClick={() => openCreate()}>
            <Plus />
            新增菜单项
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex min-h-11 flex-wrap items-center gap-2 border-b px-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setExpanded(new Set(store.menus.map((item) => item.id)))
                }
              >
                <ChevronsUpDown />
                展开全部
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpanded(new Set())}
              >
                <ChevronsDownUp />
                折叠全部
              </Button>
              <span className="text-xs text-muted-foreground">
                共 {store.menus.length} 个菜单项
              </span>
        </div>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">菜单名称</TableHead>
                <TableHead>路由地址</TableHead>
                <TableHead>权限标识</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>显示</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {source.map((menu) => {
                const children = childCount(menu.id);
                const open = expanded.has(menu.id);
                return (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: menu.depth * 24 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!children || searching}
                          onClick={() =>
                            setExpanded((current) => {
                              const next = new Set(current);
                              if (next.has(menu.id)) next.delete(menu.id);
                              else next.add(menu.id);
                              return next;
                            })
                          }
                        >
                          {children ? (
                            open ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )
                          ) : null}
                        </Button>
                        <span className="font-medium">{menu.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {menu.path || "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {menu.permissionCode || "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeVariants[menu.type]}>
                        {typeNames[menu.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{menu.sortOrder}</TableCell>
                    <TableCell>{menu.visible ? "是" : "否"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={menu.enabled}
                        disabled={!store.can(PERMISSIONS.menuUpdate)}
                        onCheckedChange={(enabled) => {
                          store.saveMenu({ ...menu, enabled });
                          toast.success(enabled ? "菜单已启用" : "菜单已停用");
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!store.can(PERMISSIONS.menuUpdate)}
                          onClick={() => openEdit(menu)}
                        >
                          <Pencil />
                          修改
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" />}>
                            <MoreHorizontal />
                            <span className="sr-only">更多操作</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={menu.type === "BUTTON" || !store.can(PERMISSIONS.menuCreate)}
                              onClick={() => openCreate(menu.id)}
                            >
                              <Plus />
                              添加下级
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={!store.can(PERMISSIONS.menuDelete)}
                              onClick={() => setDeleteMenu(menu)}
                            >
                              <Trash2 />
                              删除菜单
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "修改菜单项" : "新增菜单项"}</DialogTitle>
            <DialogDescription>
              不同类型会自动启用对应的路由和权限字段。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>上级菜单</Label>
              <FormSelect
                value={draft.parentId ?? ""}
                onValueChange={(parentId) =>
                  setDraft({ ...draft, parentId: parentId || null })
                }
                options={[
                  { value: "", label: "无（根节点）" },
                  ...parentOptions.map((item) => ({
                    value: item.id,
                    label: `${"　".repeat(item.depth)}${item.name}`,
                  })),
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label>菜单类型 *</Label>
              <FormSelect
                value={draft.type}
                onValueChange={(type) =>
                  setDraft({ ...draft, type: type as DemoMenu["type"] })
                }
                options={[
                  { value: "DIRECTORY", label: "目录" },
                  { value: "MENU", label: "菜单" },
                  { value: "BUTTON", label: "按钮" },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label>名称 *</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>权限标识{draft.type === "BUTTON" ? " *" : ""}</Label>
              <Input
                value={draft.permissionCode}
                placeholder="例如 system:user:create"
                onChange={(e) =>
                  setDraft({ ...draft, permissionCode: e.target.value })
                }
              />
            </div>
            {draft.type !== "BUTTON" && (
              <>
                <div className="grid gap-2">
                  <Label>路由地址{draft.type === "MENU" ? " *" : ""}</Label>
                  <Input
                    value={draft.path}
                    placeholder="/system/example"
                    onChange={(e) =>
                      setDraft({ ...draft, path: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>菜单图标</Label>
                  <Input
                    value={draft.icon}
                    placeholder="Lucide 图标名称"
                    onChange={(e) =>
                      setDraft({ ...draft, icon: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label>打开方式</Label>
              <FormSelect
                value={draft.openMode}
                disabled={draft.type === "BUTTON"}
                onValueChange={(openMode) =>
                  setDraft({
                    ...draft,
                    openMode: openMode as DemoMenu["openMode"],
                  })
                }
                options={[
                  { value: "INTERNAL", label: "当前窗口" },
                  { value: "EMBED", label: "内嵌页面" },
                  { value: "EXTERNAL", label: "外部链接" },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input
                type="number"
                min="0"
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft({ ...draft, sortOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={draft.visible}
                  disabled={draft.type === "BUTTON"}
                  onCheckedChange={(visible) => setDraft({ ...draft, visible })}
                />
                在菜单中显示
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={draft.enabled}
                  onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
                />
                启用
              </label>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteMenu)}
        onOpenChange={(open) => !open && setDeleteMenu(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除“{deleteMenu?.name}”？</AlertDialogTitle>
            <AlertDialogDescription>
              该菜单项的所有下级菜单和按钮权限也会一起删除，侧边导航将立即更新。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteMenu) store.deleteMenus([deleteMenu.id]);
                setDeleteMenu(undefined);
                toast.success("菜单项已删除");
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
