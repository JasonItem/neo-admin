"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Building2, ChevronDown, ChevronsUpDown, CircleGauge, FileClock, Globe2, Images, MenuSquare, MoreHorizontal, Plus, Settings2, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavigationItem } from "@/lib/navigation";
import type { AdminWorkspace } from "@/lib/workspaces";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { CircleGauge, ShieldCheck, Users, MenuSquare, Building2, FileClock, Globe2, Images };
const iconFor = (item: NavigationItem) => icons[item.icon ?? ""] ?? ShieldCheck;
const renderIcon = (item: NavigationItem) => React.createElement(iconFor(item), { className: "size-4" });
const containsPath = (item: NavigationItem, pathname: string): boolean => item.path === pathname || item.children.some((child) => containsPath(child, pathname));

function NestedMenuItem({ item }: { item: NavigationItem }) {
  if (item.children.length) return <DropdownMenuSub><DropdownMenuSubTrigger>{renderIcon(item)}{item.name}</DropdownMenuSubTrigger><DropdownMenuSubContent>{item.path && <DropdownMenuItem render={<Link href={item.path} />}>{renderIcon(item)}{item.name}</DropdownMenuItem>}{item.children.map((child) => <NestedMenuItem key={child.id} item={child} />)}</DropdownMenuSubContent></DropdownMenuSub>;
  return <DropdownMenuItem render={<Link href={item.path ?? "#"} />}>{renderIcon(item)}{item.name}</DropdownMenuItem>;
}

function RootMenuItem({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const active = containsPath(item, pathname);
  const menuClassName = "h-10 shrink-0 gap-2 rounded-lg px-3 text-sm font-medium";
  if (!item.children.length) return <Button variant="ghost" nativeButton={false} className={cn(menuClassName, active && "bg-accent text-accent-foreground")} render={<Link href={item.path ?? "#"} />}>{renderIcon(item)}{item.name}</Button>;
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" className={cn(menuClassName, active && "bg-accent text-accent-foreground")} />}>{renderIcon(item)}{item.name}<ChevronDown className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="start" className="min-w-44">{item.path && <DropdownMenuItem render={<Link href={item.path} />}>{renderIcon(item)}{item.name}</DropdownMenuItem>}{item.children.map((child) => <NestedMenuItem key={child.id} item={child} />)}</DropdownMenuContent></DropdownMenu>;
}

function TopMenu({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const ref = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState(1000);
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const visibleCount = React.useMemo(() => {
    const itemWidths = items.map((item) => 76 + [...item.name].length * 14);
    if (itemWidths.reduce((sum, value) => sum + value, 0) <= width) return items.length;
    let used = 44;
    let count = 0;
    for (const itemWidth of itemWidths) { if (used + itemWidth > width) break; used += itemWidth; count += 1; }
    return count;
  }, [items, width]);
  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);
  return <nav ref={ref} className="ml-2 hidden min-w-0 flex-1 items-center gap-1 overflow-hidden md:flex">{visible.map((item) => <RootMenuItem key={item.id} item={item} pathname={pathname} />)}{overflow.length > 0 && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}><MoreHorizontal /><span className="sr-only">更多菜单</span></DropdownMenuTrigger><DropdownMenuContent align="start" className="min-w-44">{overflow.map((item) => <NestedMenuItem key={item.id} item={item} />)}</DropdownMenuContent></DropdownMenu>}</nav>;
}

export function TopNavigation({ items, workspaces, activeWorkspace, onWorkspaceChange, onCreateWorkspace, onManageWorkspace, actions }: {
  items: NavigationItem[]; workspaces: AdminWorkspace[]; activeWorkspace: AdminWorkspace; actions?: React.ReactNode;
  onWorkspaceChange: (id: string) => void; onCreateWorkspace: () => void; onManageWorkspace: () => void;
}) {
  return <div className="border-b bg-background"><div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-4 md:px-6 lg:px-8 2xl:px-12">
    <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" className="h-11 shrink-0 gap-2 px-2" />}><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Boxes className="size-4" /></span><span className="min-w-0 text-left leading-tight"><span className="block truncate text-sm font-semibold">NeoAdmin</span><span className="block truncate text-xs text-muted-foreground">{activeWorkspace.name}</span></span><ChevronsUpDown className="ml-1 size-4 text-muted-foreground" /></DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60"><DropdownMenuGroup><DropdownMenuLabel>工作区</DropdownMenuLabel>{workspaces.map((workspace, index) => <DropdownMenuItem key={workspace.id} onClick={() => onWorkspaceChange(workspace.id)} className="gap-2 p-2"><span className="flex size-6 items-center justify-center rounded-md border"><Boxes className="size-4" /></span>{workspace.name}<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut></DropdownMenuItem>)}</DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem onClick={onCreateWorkspace}><Plus />添加工作区</DropdownMenuItem><DropdownMenuItem onClick={onManageWorkspace}><Settings2 />配置当前工作区</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    <TopMenu items={items} />{actions}
  </div></div>;
}
