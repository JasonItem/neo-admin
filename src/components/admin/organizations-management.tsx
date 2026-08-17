"use client";

import * as React from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  MoreHorizontal,
  Info,
  Pencil,
  Plus,
  Trash2,
  XIcon,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DemoOrganization } from "@/lib/demo-data";
import { FormSelect } from "@/components/ui/form-select";
import { PERMISSIONS } from "@/lib/permissions";
import { isAllowedOrganizationParent } from "@/lib/organization-policy";

const typeNames: Record<DemoOrganization["type"], string> = {
  GROUP: "集团",
  COMPANY: "公司",
  BRANCH: "分公司",
  DEPARTMENT: "部门",
  TEAM: "小组",
};
const organizationTypeOptions = Object.entries(typeNames).map(([value, label]) => ({ value, label }));

function defaultChildType(parentType: DemoOrganization["type"] | null, isPlatformAdmin: boolean): DemoOrganization["type"] {
  if (!parentType) return isPlatformAdmin ? "GROUP" : "DEPARTMENT";
  if (parentType === "GROUP") return "COMPANY";
  if (parentType === "DEPARTMENT" || parentType === "TEAM") return "TEAM";
  return "DEPARTMENT";
}
const emptyOrganization = (
  parentId: string | null = null,
  type: DemoOrganization["type"] = parentId ? "DEPARTMENT" : "GROUP",
): Omit<DemoOrganization, "id" | "createdAt"> => ({
  parentId,
  name: "",
  code: "",
  type,
  sortOrder: 0,
  enabled: true,
});
function flatten(
  items: DemoOrganization[],
  expanded: Set<string>,
  parentId: string | null = null,
  depth = 0,
): Array<DemoOrganization & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((item) => [
      { ...item, depth },
      ...(expanded.has(item.id)
        ? flatten(items, expanded, item.id, depth + 1)
        : []),
    ]);
}
function flattenAll(
  items: DemoOrganization[],
  parentId: string | null = null,
  depth = 0,
): Array<DemoOrganization & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((item) => [
      { ...item, depth },
      ...flattenAll(items, item.id, depth + 1),
    ]);
}

export function OrganizationsManagement() {
  const store = useDemoStore();
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(store.organizations.map((item) => item.id)),
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string>();
  const [draft, setDraft] = React.useState(emptyOrganization);
  const [deleteOrg, setDeleteOrg] = React.useState<DemoOrganization>();
  const [keyword, setKeyword] = React.useState("");
  const [types, setTypes] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const searching = Boolean(keyword || types.length || statuses.length);
  const rows = searching
    ? flattenAll(store.organizations).filter(
        (item) =>
          (!keyword ||
            `${item.name} ${item.code}`
              .toLowerCase()
              .includes(keyword.toLowerCase())) &&
          (!types.length || types.includes(item.type)) &&
          (!statuses.length || statuses.includes(String(item.enabled))),
      )
    : flatten(store.organizations, expanded);
  const options = flattenAll(store.organizations).filter((item) => item.id !== editingId && isAllowedOrganizationParent(draft.type, item.type));
  const openCreate = (parentId: string | null = null) => {
    const currentUserOrganizationId = store.users.find((item) => item.id === store.currentUserId)?.organizationId ?? null;
    const resolvedParentId = parentId ?? (store.isPlatformAdmin ? null : currentUserOrganizationId);
    const parentType = store.organizations.find((item) => item.id === resolvedParentId)?.type ?? null;
    setEditingId(undefined);
    setDraft(emptyOrganization(resolvedParentId, defaultChildType(parentType, store.isPlatformAdmin)));
    setDialogOpen(true);
  };
  const openEdit = (org: DemoOrganization) => {
    setEditingId(org.id);
    setDraft(org);
    setDialogOpen(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.code.trim())
      return toast.error("请填写组织名称和编码");
    if (
      store.organizations.some(
        (item) => item.code === draft.code && item.id !== editingId,
      )
    )
      return toast.error("组织编码已存在");
    store.saveOrganization({ ...draft, id: editingId });
    if (draft.parentId)
      setExpanded((current) => new Set(current).add(draft.parentId!));
    setDialogOpen(false);
    toast.success(editingId ? "组织已更新" : "组织已创建");
  };
  const confirmDelete = () => {
    if (!deleteOrg) return;
    const hasChildren = store.organizations.some(
      (item) => item.parentId === deleteOrg.id,
    );
    const hasUsers = store.users.some(
      (item) => item.organizationId === deleteOrg.id,
    );
    if (hasChildren || hasUsers) {
      setDeleteOrg(undefined);
      toast.error(
        hasChildren ? "请先删除或移动下级组织" : "该组织下仍有用户，无法删除",
      );
      return;
    }
    store.deleteOrganizations([deleteOrg.id]);
    setDeleteOrg(undefined);
    toast.success("组织已删除");
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="组织管理"
        description="维护集团、公司、分公司、部门和小组层级，作为数据范围计算基础。"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 w-full sm:w-[300px]"
          placeholder="搜索组织名称或编码"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <DataTableFacetedFilter
          title="类型"
          values={types}
          onValuesChange={setTypes}
          options={[
            {
              value: "GROUP",
              label: "集团",
              count: store.organizations.filter((item) => item.type === "GROUP").length,
            },
            {
              value: "COMPANY",
              label: "公司",
              count: store.organizations.filter((item) => item.type === "COMPANY").length,
            },
            {
              value: "BRANCH",
              label: "分公司",
              count: store.organizations.filter((item) => item.type === "BRANCH").length,
            },
            {
              value: "DEPARTMENT",
              label: "部门",
              count: store.organizations.filter((item) => item.type === "DEPARTMENT").length,
            },
            {
              value: "TEAM",
              label: "小组",
              count: store.organizations.filter((item) => item.type === "TEAM").length,
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
              count: store.organizations.filter((item) => item.enabled).length,
            },
            {
              value: "false",
              label: "停用",
              count: store.organizations.filter((item) => !item.enabled).length,
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
            }}
          >
            <XIcon />
            重置
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex min-h-11 flex-wrap items-center gap-2 border-b px-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setExpanded(
                    new Set(store.organizations.map((item) => item.id)),
                  )
                }
              >
                <ChevronsUpDown />
                展开全部
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(new Set())}
              >
                <ChevronsDownUp />
                折叠全部
              </Button>
              <span className="text-xs text-muted-foreground">
                共 {store.organizations.length} 个组织节点
              </span>
          {store.can(PERMISSIONS.organizationCreate) && (
            <Button className="ml-auto" size="sm" onClick={() => openCreate()}>
              <Plus />
              新增组织
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-72">组织名称</TableHead>
                <TableHead>组织编码</TableHead>
                <TableHead>组织类型</TableHead>
                <TableHead>直属用户</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((org) => {
                const children = store.organizations.filter(
                  (item) => item.parentId === org.id,
                ).length;
                const open = expanded.has(org.id);
                const userCount = store.users.filter(
                  (item) => item.organizationId === org.id,
                ).length;
                const protectedOrganization = org.type === "GROUP" || org.type === "COMPANY";
                const canManageOrganization = store.isPlatformAdmin || !protectedOrganization;
                return (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: org.depth * 24 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!children}
                          onClick={() =>
                            setExpanded((current) => {
                              const next = new Set(current);
                              if (next.has(org.id)) next.delete(org.id);
                              else next.add(org.id);
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
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{org.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeNames[org.type]}</Badge>
                    </TableCell>
                    <TableCell>{userCount}</TableCell>
                    <TableCell>{org.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={org.enabled}
                          disabled={!store.can(PERMISSIONS.organizationUpdate) || !canManageOrganization}
                          onCheckedChange={(enabled) => {
                            store.saveOrganization({ ...org, enabled });
                            toast.success(
                              enabled ? "组织已启用" : "组织已停用",
                            );
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {org.enabled ? "正常" : "停用"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!store.can(PERMISSIONS.organizationUpdate) || !canManageOrganization}
                          onClick={() => openEdit(org)}
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
                              disabled={!store.can(PERMISSIONS.organizationCreate)}
                              onClick={() => openCreate(org.id)}
                            >
                              <Plus />
                              添加下级
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={!store.can(PERMISSIONS.organizationDelete) || !canManageOrganization}
                              onClick={() => setDeleteOrg(org)}
                            >
                              <Trash2 />
                              删除组织
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "修改组织" : "新增组织"}</DialogTitle>
            <DialogDescription>
              选择上级组织后，新节点会显示在对应层级下。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save}>
            <FieldGroup>
            <Alert>
              <Info />
              <AlertTitle>数据边界说明</AlertTitle>
              <AlertDescription>
                公司会创建独立数据边界；分公司、部门和小组继承所属公司的数据边界。集团只用于平台组织归类。
              </AlertDescription>
            </Alert>
            <Field>
              <FieldLabel>上级组织</FieldLabel>
              <FormSelect
                value={draft.parentId ?? ""}
                onValueChange={(parentId) =>
                  setDraft({ ...draft, parentId: parentId || null })
                }
                options={[
                  ...(isAllowedOrganizationParent(draft.type, null) ? [{ value: "", label: "无（根组织）" }] : []),
                  ...options.map((item) => ({
                    value: item.id,
                    label: `${"　".repeat(item.depth)}${item.name}`,
                  })),
                ]}
              />
            </Field>
            <Field>
              <FieldLabel>组织名称 *</FieldLabel>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>组织编码 *</FieldLabel>
              <Input
                value={draft.code}
                onChange={(e) =>
                  setDraft({ ...draft, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field>
              <FieldLabel>组织类型 *</FieldLabel>
              <FormSelect
                value={draft.type}
                disabled={Boolean(editingId)}
                onValueChange={(type) =>
                  setDraft({
                    ...draft,
                    type: type as DemoOrganization["type"],
                    parentId: null,
                  })
                }
                options={organizationTypeOptions.filter((option) => store.isPlatformAdmin || (option.value !== "GROUP" && option.value !== "COMPANY"))}
              />
            </Field>
            <Field>
              <FieldLabel>排序</FieldLabel>
              <Input
                type="number"
                min="0"
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft({ ...draft, sortOrder: Number(e.target.value) })
                }
              />
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="organization-enabled"
                checked={draft.enabled}
                onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
              />
              <FieldLabel htmlFor="organization-enabled">启用</FieldLabel>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
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
      <AlertDialog
        open={Boolean(deleteOrg)}
        onOpenChange={(open) => !open && setDeleteOrg(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除组织“{deleteOrg?.name}”？</AlertDialogTitle>
            <AlertDialogDescription>
              存在下级组织或直属用户时系统会阻止删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
