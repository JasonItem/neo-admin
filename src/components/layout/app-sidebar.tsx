"use client";

import * as React from "react";
import { Building2, CircleGauge, FileClock, MenuSquare, ShieldCheck, Users } from "lucide-react";
import { useDemoStore } from "@/components/demo/demo-store";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { NavigationItem } from "@/lib/navigation";
import type { AdminWorkspace } from "@/lib/workspaces";

const icons = {
  CircleGauge,
  ShieldCheck,
  Users,
  MenuSquare,
  Building2,
  FileClock,
};
export function AppSidebar({
  items,
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  onManageWorkspace,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  items: NavigationItem[];
  workspaces: AdminWorkspace[];
  activeWorkspace: AdminWorkspace;
  onWorkspaceChange: (id: string) => void;
  onCreateWorkspace: () => void;
  onManageWorkspace: () => void;
}) {
  const demo = useDemoStore();
  const navItems = items.map((item) => ({
    title: item.name,
    url: item.path || "#",
    icon: icons[item.icon as keyof typeof icons] ?? ShieldCheck,
    items: item.children.map((child) => ({
      title: child.name,
      url: child.path || "#",
      icon: icons[child.icon as keyof typeof icons] ?? ShieldCheck,
    })),
  }));
  const admin = demo.users.find((item) => item.id === demo.currentUserId);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher workspaces={workspaces} activeWorkspace={activeWorkspace} onChange={onWorkspaceChange} onCreate={onCreateWorkspace} onManage={onManageWorkspace} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: admin?.displayName ?? "系统管理员",
            email: admin?.email ?? "admin@neoadmin.local",
            avatar: "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
