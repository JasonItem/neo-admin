"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useDemoStore } from "@/components/demo/demo-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageNames: Record<string, string> = {
  "/dashboard": "数据概览",
  "/system/users": "用户管理",
  "/system/roles": "角色管理",
  "/system/menus": "菜单管理",
  "/system/organizations": "组织管理",
  "/system/operation-logs": "操作日志",
  "/system/login-logs": "登录日志",
  "/cms/site": "站点设置",
  "/cms/media": "媒体库",
  "/cms/pages": "页面管理",
  "/cms/navigation": "栏目导航",
  "/cms/articles": "文章新闻",
  "/cms/products": "产品管理",
  "/cms/cases": "案例管理",
  "/account/profile": "账户设置",
  "/account/password": "账户设置",
};
export function HeaderActions({
  appearanceControl,
}: {
  appearanceControl?: React.ReactNode;
}) {
  const demo = useDemoStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const results = query
    ? [
        ...demo.menus
          .filter(
            (item) =>
              item.type !== "BUTTON" && item.path && item.name.includes(query),
          )
          .map((item) => ({
            id: item.id,
            label: item.name,
            meta: "页面",
            href: item.path,
          })),
        ...demo.users
          .filter((item) =>
            `${item.username}${item.displayName}`.includes(query),
          )
          .map((item) => ({
            id: item.id,
            label: item.displayName,
            meta: `用户 · ${item.username}`,
            href: "/system/users",
          })),
        ...demo.roles
          .filter((item) => `${item.name}${item.code}`.includes(query))
          .map((item) => ({
            id: item.id,
            label: item.name,
            meta: `角色 · ${item.code}`,
            href: "/system/roles",
          })),
      ].slice(0, 8)
    : [];
  return (
    <div className="ml-auto flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
        <Search />
        <span className="sr-only">全局搜索</span>
      </Button>
      {appearanceControl}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <Bell />
          <span className="sr-only">通知</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-3">
          <p className="text-sm font-medium">通知</p>
          <p className="mt-1 text-xs text-muted-foreground">
            当前没有新的系统通知
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>全局搜索</DialogTitle>
            <DialogDescription>搜索页面、用户和角色。</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="输入关键词…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="min-h-24 space-y-1">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.href}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{result.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {result.meta}
                </span>
              </Link>
            ))}
            {query && !results.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                没有找到匹配结果
              </p>
            )}
            {!query && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                输入关键词开始搜索
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AppHeader({
  showSidebarTrigger = true,
  actions,
}: {
  showSidebarTrigger?: boolean;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 items-center gap-2 px-4 md:px-6 lg:px-8 2xl:px-12">
        {showSidebarTrigger && (
          <>
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
          </>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">NeoAdmin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageNames[pathname] ?? "工作台"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {actions}
      </div>
    </header>
  );
}
