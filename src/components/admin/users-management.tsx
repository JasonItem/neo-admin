"use client";

import * as React from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  XIcon,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { useDemoStore } from "@/components/demo/demo-store";
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
import { Textarea } from "@/components/ui/textarea";
import type { DemoOrganization, DemoUser } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/ui/form-select";
import { PERMISSIONS } from "@/lib/permissions";

type UserDraft = Omit<DemoUser, "id" | "createdAt"> & { password: string };

const emptyUser = (): UserDraft => ({
  username: "",
  displayName: "",
  organizationId: "",
  roleIds: [],
  phone: "",
  email: "",
  gender: "未设置",
  enabled: true,
  note: "",
  password: "",
});

function OrganizationNode({
  org,
  all,
  selected,
  expanded,
  onSelect,
  onToggle,
  counts,
}: {
  org: DemoOrganization;
  all: DemoOrganization[];
  selected: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  counts: Map<string, number>;
}) {
  const children = all
    .filter((item) => item.parentId === org.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const open = expanded.has(org.id);
  return (
    <li>
      <div
        className={cn(
          "flex h-9 items-center rounded-md text-sm hover:bg-muted",
          selected === org.id && "bg-muted font-medium",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onToggle(org.id)}
          disabled={!children.length}
        >
          {children.length ? (
            open ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : null}
        </Button>
        <Button
          variant="ghost"
          className="h-9 min-w-0 flex-1 justify-start gap-2 px-2 font-normal"
          onClick={() => onSelect(org.id)}
        >
          <Building2 className="size-4 text-muted-foreground" />
          <span className="truncate">{org.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {counts.get(org.id) ?? 0}
          </span>
        </Button>
      </div>
      {open && children.length > 0 && (
        <ul className="ml-4 border-l pl-2">
          {children.map((child) => (
            <OrganizationNode
              key={child.id}
              org={child}
              all={all}
              selected={selected}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
              counts={counts}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function UsersManagement() {
  const store = useDemoStore();
  const [keyword, setKeyword] = React.useState("");
  const [genders, setGenders] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [organizationId, setOrganizationId] = React.useState("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(["org-hq", "org-rd", "org-sales"]),
  );
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string>();
  const [draft, setDraft] = React.useState(emptyUser);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);
  const descendants = React.useCallback(
    (id: string) => {
      const ids = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const org of store.organizations)
          if (org.parentId && ids.has(org.parentId) && !ids.has(org.id)) {
            ids.add(org.id);
            changed = true;
          }
      }
      return ids;
    },
    [store.organizations],
  );
  const filtered = React.useMemo(() => {
    const orgIds =
      organizationId === "all" ? null : descendants(organizationId);
    const text = keyword.trim().toLowerCase();
    return store.users.filter(
      (user) =>
        (!text ||
          `${user.username} ${user.displayName} ${user.phone} ${user.email}`
            .toLowerCase()
            .includes(text)) &&
        (!genders.length || genders.includes(user.gender)) &&
        (!statuses.length || statuses.includes(String(user.enabled))) &&
        (!orgIds || orgIds.has(user.organizationId)),
    );
  }, [store.users, keyword, genders, statuses, organizationId, descendants]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(
    (Math.min(page, totalPages) - 1) * pageSize,
    Math.min(page, totalPages) * pageSize,
  );
  const allVisibleSelected =
    visible.length > 0 && visible.every((user) => selected.has(user.id));
  const orgName = (id: string) =>
    store.organizations.find((item) => item.id === id)?.name ?? "—";
  const roleNames = (ids: string[]) =>
    ids
      .map((id) => store.roles.find((role) => role.id === id)?.name)
      .filter(Boolean);
  const counts = React.useMemo(() => {
    const result = new Map<string, number>();
    for (const org of store.organizations)
      result.set(
        org.id,
        store.users.filter((user) =>
          descendants(org.id).has(user.organizationId),
        ).length,
      );
    return result;
  }, [store.organizations, store.users, descendants]);
  const openCreate = () => {
    setEditingId(undefined);
    setDraft({
      ...emptyUser(),
      organizationId:
        organizationId === "all"
          ? (store.organizations[0]?.id ?? "")
          : organizationId,
    });
    setDialogOpen(true);
  };
  const openEdit = (user: DemoUser) => {
    setEditingId(user.id);
    setDraft({ ...user, roleIds: [...user.roleIds], password: "" });
    setDialogOpen(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !draft.username.trim() ||
      !draft.displayName.trim() ||
      !draft.organizationId ||
      !draft.roleIds.length ||
      (!editingId && draft.password.length < 8)
    ) {
      toast.error("请完整填写必填项");
      return;
    }
    if (
      store.users.some(
        (item) => item.username === draft.username && item.id !== editingId,
      )
    ) {
      toast.error("用户账号已存在");
      return;
    }
    store.saveUser({ ...draft, id: editingId });
    setDialogOpen(false);
    toast.success(editingId ? "用户信息已更新" : "用户创建成功");
  };
  const requestDelete = (ids: string[]) => {
    setDeleteIds(ids);
    setDeleteOpen(true);
  };
  const confirmDelete = () => {
    const adminIncluded = deleteIds.includes(store.currentUserId);
    store.deleteUsers(deleteIds);
    setSelected(new Set());
    setDeleteOpen(false);
    toast[adminIncluded ? "warning" : "success"](
      adminIncluded ? "内置管理员已保留，其余用户已删除" : "用户已删除",
    );
  };
  const reset = () => {
    setKeyword("");
    setGenders([]);
    setStatuses([]);
    setOrganizationId("all");
    setPage(1);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="用户管理"
        description="管理平台用户、所属组织、角色和账号状态。"
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            className="h-8 w-full sm:w-[280px] lg:w-[320px]"
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
            placeholder="搜索账号、姓名、手机或邮箱"
          />
          <DataTableFacetedFilter
            title="性别"
            values={genders}
            onValuesChange={(values) => {
              setGenders(values);
              setPage(1);
            }}
            options={[
              {
                value: "男",
                label: "男",
                count: store.users.filter((user) => user.gender === "男").length,
              },
              {
                value: "女",
                label: "女",
                count: store.users.filter((user) => user.gender === "女").length,
              },
              {
                value: "未设置",
                label: "未设置",
                count: store.users.filter((user) => user.gender === "未设置").length,
              },
            ]}
          />
          <DataTableFacetedFilter
            title="状态"
            values={statuses}
            onValuesChange={(values) => {
              setStatuses(values);
              setPage(1);
            }}
            options={[
              {
                value: "true",
                label: "正常",
                count: store.users.filter((user) => user.enabled).length,
              },
              {
                value: "false",
                label: "停用",
                count: store.users.filter((user) => !user.enabled).length,
              },
            ]}
          />
          {(keyword ||
            genders.length > 0 ||
            statuses.length > 0 ||
            organizationId !== "all") && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <XIcon />
              重置
            </Button>
          )}
        </div>
        {store.can(PERMISSIONS.userCreate) && (
          <Button size="sm" onClick={openCreate}>
            <Plus />
            新增用户
          </Button>
        )}
      </div>
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border p-3">
          <div className="mb-2 flex h-8 items-center justify-between px-2">
            <p className="text-sm font-medium">组织架构</p>
            <span className="text-xs text-muted-foreground">{store.organizations.length}</span>
          </div>
            <Button
              variant="ghost"
              onClick={() => setOrganizationId("all")}
              className={cn(
                "mb-1 h-9 w-full justify-start gap-2 px-2 font-normal",
                organizationId === "all" && "bg-muted font-medium",
              )}
            >
              <UsersRound className="size-4" />
              全部用户
              <span className="ml-auto text-xs text-muted-foreground">
                {store.users.length}
              </span>
            </Button>
            <ul>
              {store.organizations
                .filter((org) => !org.parentId)
                .map((org) => (
                  <OrganizationNode
                    key={org.id}
                    org={org}
                    all={store.organizations}
                    selected={organizationId}
                    expanded={expanded}
                    counts={counts}
                    onSelect={(id) => {
                      setOrganizationId(id);
                      setPage(1);
                    }}
                    onToggle={(id) =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  />
                ))}
            </ul>
        </aside>
        <div className="min-w-0 overflow-hidden rounded-lg border">
          <div className="flex min-h-11 items-center gap-2 border-b px-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={!selected.size || !store.can(PERMISSIONS.userDelete)}
                  onClick={() => requestDelete([...selected])}
                >
                  <Trash2 />
                  批量删除{selected.size ? ` (${selected.size})` : ""}
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  共 {filtered.length} 个用户
                </span>
          </div>
          <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          for (const user of visible) {
                            if (checked) next.add(user.id);
                            else next.delete(user.id);
                          }
                          return next;
                        })
                      }
                    />
                  </TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>所属组织</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((user) => (
                  <TableRow
                    key={user.id}
                    data-state={selected.has(user.id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={(checked) =>
                          setSelected((current) => {
                            const next = new Set(current);
                            if (checked) next.add(user.id);
                            else next.delete(user.id);
                            return next;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.username} · {user.phone}
                      </p>
                    </TableCell>
                    <TableCell>{orgName(user.organizationId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roleNames(user.roleIds).map((role) => (
                          <Badge variant="secondary" key={role}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.enabled}
                          disabled={user.id === store.currentUserId || !store.can(PERMISSIONS.userUpdate)}
                          onCheckedChange={(checked) => {
                            store.toggleUser(user.id, checked);
                            toast.success(
                              checked ? "账号已启用" : "账号已停用",
                            );
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {user.enabled ? "正常" : "停用"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {user.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!store.can(PERMISSIONS.userUpdate)}
                          onClick={() => openEdit(user)}
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
                              variant="destructive"
                              disabled={user.id === store.currentUserId || !store.can(PERMISSIONS.userDelete)}
                              onClick={() => requestDelete([user.id])}
                            >
                              <Trash2 />
                              删除用户
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      没有符合条件的用户
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </Table>
          </div>
          <div className="flex flex-col gap-2 border-t px-3 py-2 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                第 {Math.min(page, totalPages)} / {totalPages} 页
              </p>
              <div className="ml-auto flex items-center gap-2">
              <FormSelect
                className="h-8 w-28"
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
                options={[
                  { value: "5", label: "5 条/页" },
                  { value: "10", label: "10 条/页" },
                  { value: "20", label: "20 条/页" },
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                下一页
              </Button>
              </div>
          </div>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "修改用户" : "新增用户"}</DialogTitle>
            <DialogDescription>
              设置用户基本信息、所属组织和角色。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>所属组织 *</Label>
              <FormSelect
                value={draft.organizationId}
                onValueChange={(organizationId) =>
                  setDraft({ ...draft, organizationId })
                }
                options={store.organizations.map((org) => ({
                  value: org.id,
                  label: org.name,
                }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>用户账号 *</Label>
              <Input
                value={draft.username}
                disabled={Boolean(editingId)}
                onChange={(e) =>
                  setDraft({ ...draft, username: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>用户名称 *</Label>
              <Input
                value={draft.displayName}
                onChange={(e) =>
                  setDraft({ ...draft, displayName: e.target.value })
                }
              />
            </div>
            {!editingId && (
              <div className="grid gap-2">
                <Label>初始密码 *</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={draft.password}
                  placeholder="至少 8 位"
                  onChange={(e) =>
                    setDraft({ ...draft, password: e.target.value })
                  }
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>手机号</Label>
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>邮箱</Label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>性别</Label>
              <FormSelect
                value={draft.gender}
                onValueChange={(gender) =>
                  setDraft({ ...draft, gender: gender as DemoUser["gender"] })
                }
                options={[
                  { value: "未设置", label: "未设置" },
                  { value: "男", label: "男" },
                  { value: "女", label: "女" },
                ]}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>角色 *</Label>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                {store.roles
                  .filter((role) => role.enabled)
                  .map((role) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={role.id}
                    >
                      <Checkbox
                        checked={draft.roleIds.includes(role.id)}
                        onCheckedChange={(checked) =>
                          setDraft({
                            ...draft,
                            roleIds: checked
                              ? [...draft.roleIds, role.id]
                              : draft.roleIds.filter((id) => id !== role.id),
                          })
                        }
                      />
                      {role.name}
                    </label>
                  ))}
              </div>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>个人简介</Label>
              <Textarea
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, enabled: checked })
                }
              />
              账号正常
            </label>
            <DialogFooter className="sm:col-span-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除选中的 {deleteIds.length}{" "}
              个用户。内置管理员不会被删除，此操作仅影响当前前端演示数据。
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
