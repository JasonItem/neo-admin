"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  XIcon,
  ShieldCheck,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { DataScope, DemoMenu, DemoRole } from "@/lib/demo-data";
import { FormSelect } from "@/components/ui/form-select";
import { PERMISSIONS } from "@/lib/permissions";

const scopeNames: Record<DataScope, string> = {
  SELF: "仅本人数据",
  CURRENT_ORG: "当前组织数据",
  ORG_SUBTREE: "当前组织及下级",
  TENANT: "当前公司全部数据",
  PLATFORM: "全平台数据",
};
const emptyRole = (): Omit<DemoRole, "id" | "createdAt" | "permissionIds" | "permissionScopes"> => ({
  name: "",
  code: "",
  description: "",
  defaultDataScope: "SELF",
  enabled: true,
});
function flatten(
  items: DemoMenu[],
  parentId: string | null = null,
  depth = 0,
): Array<DemoMenu & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((item) => [
      { ...item, depth },
      ...flatten(items, item.id, depth + 1),
    ]);
}

export function RolesManagement() {
  const store = useDemoStore();
  const [keyword, setKeyword] = React.useState("");
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string>();
  const [draft, setDraft] = React.useState(emptyRole);
  const [permissionRole, setPermissionRole] = React.useState<DemoRole>();
  const [permissionIds, setPermissionIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [permissionScopes, setPermissionScopes] = React.useState<Record<string, DataScope>>({});
  const [deleteRole, setDeleteRole] = React.useState<DemoRole>();
  const rows = store.roles.filter(
    (role) =>
      (!keyword ||
        `${role.name} ${role.code}`
          .toLowerCase()
          .includes(keyword.toLowerCase())) &&
      (!statuses.length || statuses.includes(String(role.enabled))),
  );
  const flatMenus = flatten(store.menus);
  const openCreate = () => {
    setEditingId(undefined);
    setDraft(emptyRole());
    setDialogOpen(true);
  };
  const openEdit = (role: DemoRole) => {
    setEditingId(role.id);
    setDraft(role);
    setDialogOpen(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !/^[A-Z][A-Z0-9_]*$/.test(draft.code)) {
      toast.error("请填写名称，并使用大写字母、数字或下划线作为角色标识");
      return;
    }
    if (
      store.roles.some(
        (role) => role.code === draft.code && role.id !== editingId,
      )
    ) {
      toast.error("角色标识已存在");
      return;
    }
    store.saveRole({ ...draft, id: editingId });
    setDialogOpen(false);
    toast.success(editingId ? "角色已更新" : "角色已创建");
  };
  const openPermissions = (role: DemoRole) => {
    setPermissionRole(role);
    setPermissionIds(new Set(role.permissionIds));
    setPermissionScopes({ ...role.permissionScopes });
  };
  const descendants = (id: string) => {
    const result = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of store.menus)
        if (
          item.parentId &&
          result.has(item.parentId) &&
          !result.has(item.id)
        ) {
          result.add(item.id);
          changed = true;
        }
    }
    return result;
  };
  const togglePermission = (menu: DemoMenu, checked: boolean) =>
    setPermissionIds((current) => {
      const next = new Set(current);
      const affected = descendants(menu.id);
      for (const id of affected) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      if (checked) {
        let parentId = menu.parentId;
        while (parentId) {
          next.add(parentId);
          parentId =
            store.menus.find((item) => item.id === parentId)?.parentId ?? null;
        }
      }
      setPermissionScopes((currentScopes) => {
        const nextScopes = { ...currentScopes };
        for (const id of affected) {
          if (checked) nextScopes[id] ??= permissionRole?.defaultDataScope ?? "SELF";
          else delete nextScopes[id];
        }
        return nextScopes;
      });
      return next;
    });
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="角色管理"
        description="配置角色功能权限以及默认的数据访问范围。"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 w-full sm:w-[280px]"
            placeholder="搜索角色名称或标识"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <DataTableFacetedFilter
            title="状态"
            values={statuses}
            onValuesChange={setStatuses}
            options={[
              {
                value: "true",
                label: "正常",
                count: store.roles.filter((role) => role.enabled).length,
              },
              {
                value: "false",
                label: "停用",
                count: store.roles.filter((role) => !role.enabled).length,
              },
            ]}
          />
          {(keyword || statuses.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setKeyword("");
                setStatuses([]);
              }}
            >
              <XIcon />
              重置
            </Button>
          )}
        </div>
        {store.can(PERMISSIONS.roleCreate) && (
          <Button size="sm" onClick={openCreate}>
            <Plus />
            新增角色
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex h-11 items-center border-b px-3">
          <p className="text-sm font-medium">角色列表</p>
          <span className="ml-auto text-xs text-muted-foreground">共 {rows.length} 个角色</span>
        </div>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>角色标识</TableHead>
                <TableHead>数据范围</TableHead>
                <TableHead>权限数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {role.name}
                    {role.builtIn && (
                      <Badge className="ml-2" variant="secondary">
                        内置
                      </Badge>
                    )}
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      {role.description || "暂无备注"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{role.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {scopeNames[role.defaultDataScope]}
                    </Badge>
                  </TableCell>
                  <TableCell>{role.permissionIds.length}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={role.enabled}
                        disabled={role.builtIn || !store.can(PERMISSIONS.roleUpdate)}
                        onCheckedChange={(enabled) => {
                          store.saveRole({ ...role, enabled });
                          toast.success(enabled ? "角色已启用" : "角色已停用");
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {role.enabled ? "正常" : "停用"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.createdAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!store.can(PERMISSIONS.roleUpdate)}
                        onClick={() => openEdit(role)}
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
                            disabled={!store.can(PERMISSIONS.roleGrant)}
                            onClick={() => openPermissions(role)}
                          >
                            <ShieldCheck />
                            分配权限
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={role.builtIn || !store.can(PERMISSIONS.roleDelete)}
                            onClick={() => setDeleteRole(role)}
                          >
                            <Trash2 />
                            删除角色
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "修改角色" : "新增角色"}</DialogTitle>
            <DialogDescription>
              功能权限将在创建后通过“分配权限”设置。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-name">角色名称 *</FieldLabel>
              <Input
                id="role-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role-code">角色标识 *</FieldLabel>
              <Input
                id="role-code"
                value={draft.code}
                disabled={Boolean(editingId)}
                placeholder="例如 SALES_MANAGER"
                onChange={(e) =>
                  setDraft({ ...draft, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field>
              <FieldLabel>默认数据范围 *</FieldLabel>
              <FormSelect
                value={draft.defaultDataScope}
                onValueChange={(defaultDataScope) =>
                  setDraft({
                    ...draft,
                    defaultDataScope: defaultDataScope as DataScope,
                  })
                }
                options={Object.entries(scopeNames).filter(([value]) => value !== "PLATFORM" || store.isPlatformAdmin).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role-description">备注</FieldLabel>
              <Textarea
                id="role-description"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="role-enabled"
                checked={draft.enabled}
                onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
              />
              <FieldLabel htmlFor="role-enabled">角色正常</FieldLabel>
            </Field>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(permissionRole)}
        onOpenChange={(open) => !open && setPermissionRole(undefined)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>分配权限</DialogTitle>
            <DialogDescription>
              为“{permissionRole?.name}”选择目录、页面和按钮权限。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPermissionIds(new Set(store.menus.map((item) => item.id)))
              }
            >
              全选
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPermissionIds(new Set());
                setPermissionScopes({});
              }}
            >
              清空
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              已选择 {permissionIds.size} 项
            </span>
          </div>
          <Separator />
          <div className="max-h-[55vh] overflow-y-auto rounded-md border p-2">
            <FieldSet>
              <FieldLegend className="sr-only">角色权限及数据范围</FieldLegend>
              <FieldGroup className="gap-1">
            {flatMenus.map((menu) => (
              <Field
                key={menu.id}
                orientation="horizontal"
                className="min-h-9 rounded-md px-2 hover:bg-muted"
                style={{ paddingLeft: 8 + menu.depth * 24 }}
              >
                <Checkbox
                  id={`role-permission-${menu.id}`}
                  checked={permissionIds.has(menu.id)}
                  onCheckedChange={(checked) => togglePermission(menu, checked)}
                />
                <FieldLabel htmlFor={`role-permission-${menu.id}`} className="min-w-0 flex-1 font-normal">
                  {menu.name}
                </FieldLabel>
                <Badge variant="outline">
                  {menu.type === "DIRECTORY"
                    ? "目录"
                    : menu.type === "MENU"
                      ? "菜单"
                      : "按钮"}
                </Badge>
                {menu.permissionCode && permissionIds.has(menu.id) && (
                  <FormSelect
                    className="w-[156px]"
                    value={permissionScopes[menu.id] ?? permissionRole?.defaultDataScope ?? "SELF"}
                    onValueChange={(dataScope) => setPermissionScopes((current) => ({ ...current, [menu.id]: dataScope as DataScope }))}
                    options={Object.entries(scopeNames).filter(([value]) => value !== "PLATFORM" || store.isPlatformAdmin).map(([value, label]) => ({ value, label }))}
                  />
                )}
              </Field>
            ))}
              </FieldGroup>
            </FieldSet>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermissionRole(undefined)}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (permissionRole)
                  store.grantRole(permissionRole.id, [...permissionIds].map((menuItemId) => ({
                    menuItemId,
                    dataScope: permissionScopes[menuItemId] ?? permissionRole.defaultDataScope,
                  })));
                setPermissionRole(undefined);
                toast.success("权限已保存");
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteRole)}
        onOpenChange={(open) => !open && setDeleteRole(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除角色“{deleteRole?.name}”？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，该角色会同时从已分配用户中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRole) store.deleteRoles([deleteRole.id]);
                setDeleteRole(undefined);
                toast.success("角色已删除");
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
