"use client";

import { Boxes, ChevronsUpDown, Plus, Settings2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import type { AdminWorkspace } from "@/lib/workspaces";

export function TeamSwitcher({ workspaces, activeWorkspace, onChange, onCreate, onManage }: {
  workspaces: AdminWorkspace[];
  activeWorkspace: AdminWorkspace;
  onChange: (id: string) => void;
  onCreate: () => void;
  onManage: () => void;
}) {
  const { isMobile } = useSidebar();
  return <SidebarMenu><SidebarMenuItem><DropdownMenu>
    <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground" />}>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Boxes className="size-4" /></div>
      <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">NeoAdmin</span><span className="truncate text-xs">{activeWorkspace.name}</span></div>
      <ChevronsUpDown className="ml-auto" />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="min-w-56" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
      <DropdownMenuGroup><DropdownMenuLabel>工作区</DropdownMenuLabel>
        {workspaces.map((workspace, index) => <DropdownMenuItem key={workspace.id} onClick={() => onChange(workspace.id)} className="gap-2 p-2">
          <div className="flex size-6 items-center justify-center rounded-md border"><Boxes className="size-4" /></div>{workspace.name}<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
        </DropdownMenuItem>)}
      </DropdownMenuGroup><DropdownMenuSeparator />
      <DropdownMenuItem className="gap-2" onClick={onCreate}><Plus />添加工作区</DropdownMenuItem>
      <DropdownMenuItem className="gap-2" onClick={onManage}><Settings2 />配置当前工作区</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu></SidebarMenuItem></SidebarMenu>;
}
