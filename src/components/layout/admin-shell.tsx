"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteWorkspaceAction, saveWorkspaceAction } from "@/app/actions/workspaces";
import { saveAppearanceAction } from "@/app/actions/appearance";
import { AppearanceConfigurator } from "@/components/layout/appearance-configurator";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NavigationItem } from "@/lib/navigation";
import type { AdminWorkspace } from "@/lib/workspaces";
import type { AppearancePreference } from "@/lib/appearance";

function flatten(items: NavigationItem[], depth = 0): Array<NavigationItem & { depth: number }> {
  return items.flatMap((item) => [{ ...item, depth }, ...flatten(item.children, depth + 1)]);
}

export function AdminShell({ children, workspaces, availableNavigation, initialAppearance }: { children: React.ReactNode; workspaces: AdminWorkspace[]; availableNavigation: NavigationItem[]; initialAppearance: AppearancePreference }) {
  const router = useRouter();
  const [activeId, setActiveId] = React.useState(workspaces.find((item) => item.isDefault)?.id ?? workspaces[0]!.id);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string>();
  const [name, setName] = React.useState("CMS管理");
  const [appearance, setAppearance] = React.useState(initialAppearance);
  const allMenuIds = React.useMemo(() => flatten(availableNavigation).map((item) => item.id), [availableNavigation]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set(allMenuIds));
  const [pending, startTransition] = React.useTransition();
  const isMobile = useIsMobile();
  const effectiveLayout = isMobile ? "SIDEBAR" : appearance.layout;
  const activeWorkspace = workspaces.find((item) => item.id === activeId) ?? workspaces.find((item) => item.isDefault) ?? workspaces[0]!;

  const changeWorkspace = (id: string) => setActiveId(id);
  const openCreate = () => { setEditingId(undefined); setName(`工作区 ${workspaces.length + 1}`); setSelected(new Set(allMenuIds)); setDialogOpen(true); };
  const openManage = () => { setEditingId(activeWorkspace.id); setName(activeWorkspace.name); setSelected(new Set(activeWorkspace.menuItemIds)); setDialogOpen(true); };
  const save = () => startTransition(async () => { try { const result = await saveWorkspaceAction({ id: editingId, name, menuItemIds: [...selected] }); if (!editingId) changeWorkspace(result.id); setDialogOpen(false); toast.success(editingId ? "工作区已更新" : "工作区已创建"); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "工作区保存失败"); } });
  const remove = () => startTransition(async () => { try { await deleteWorkspaceAction(activeWorkspace.id); setActiveId(workspaces.find((item) => item.isDefault)?.id ?? workspaces[0]!.id); setDialogOpen(false); toast.success("工作区已删除"); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "工作区删除失败"); } });
  const updateAppearance = (next: AppearancePreference) => { setAppearance(next); startTransition(async () => { try { await saveAppearanceAction(next); } catch { toast.error("外观配置保存失败"); } }); };
  const appearanceControl = <AppearanceConfigurator value={appearance} onChange={updateAppearance} pending={pending} />;
  const headerActions = <HeaderActions appearanceControl={appearanceControl} />;
  const content = <><AppHeader showSidebarTrigger={effectiveLayout === "SIDEBAR"} actions={effectiveLayout === "SIDEBAR" ? headerActions : undefined} /><div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-4 pb-8 pt-3 md:px-6 lg:px-8 2xl:px-12">{children}</div></>;

  return <>
    {effectiveLayout === "SIDEBAR" ? <SidebarProvider><AppSidebar items={activeWorkspace.navigation} workspaces={workspaces} activeWorkspace={activeWorkspace} onWorkspaceChange={changeWorkspace} onCreateWorkspace={openCreate} onManageWorkspace={openManage} /><SidebarInset>{content}</SidebarInset></SidebarProvider> : <div className="flex min-h-screen flex-col"><TopNavigation items={activeWorkspace.navigation} workspaces={workspaces} activeWorkspace={activeWorkspace} onWorkspaceChange={changeWorkspace} onCreateWorkspace={openCreate} onManageWorkspace={openManage} actions={headerActions} />{content}</div>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{editingId ? "配置工作区" : "添加工作区"}</DialogTitle><DialogDescription>工作区只管理菜单集合，并且只能选择当前账号有权访问的菜单。</DialogDescription></DialogHeader><FieldGroup>
      <Field><FieldLabel>工作区名称</FieldLabel><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field><FieldLabel>展示菜单</FieldLabel><div className="max-h-64 overflow-y-auto rounded-lg border p-2">{flatten(availableNavigation).map((item) => <label key={item.id} className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-muted" style={{ paddingLeft: 8 + item.depth * 22 }}><Checkbox checked={selected.has(item.id)} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); if (checked) next.add(item.id); else next.delete(item.id); return next; })} /><span className="text-sm">{item.name}</span></label>)}</div></Field>
    </FieldGroup><DialogFooter>{editingId && !activeWorkspace.isDefault && <Button variant="destructive" className="mr-auto" disabled={pending} onClick={remove}>删除工作区</Button>}<Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button disabled={pending || !name.trim() || !selected.size} onClick={save}>{pending ? "保存中…" : "保存"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
