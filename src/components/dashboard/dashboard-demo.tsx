"use client";

import {
  Activity,
  Building2,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "@/components/demo/demo-store";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardDemo() {
  const store = useDemoStore();
  const cards = [
    {
      label: "平台用户",
      value: store.users.length,
      hint: `${store.users.filter((item) => item.enabled).length} 个正常账号`,
      icon: Users,
    },
    {
      label: "平台角色",
      value: store.roles.length,
      hint: `${store.roles.filter((item) => item.enabled).length} 个启用角色`,
      icon: ShieldCheck,
    },
    {
      label: "组织节点",
      value: store.organizations.length,
      hint: `${store.organizations.filter((item) => item.type === "DEPARTMENT").length} 个部门`,
      icon: Building2,
    },
    {
      label: "今日操作",
      value: store.operationLogs.filter((item) =>
        item.time.startsWith("2026-07-22"),
      ).length,
      hint: "前端演示数据",
      icon: Activity,
    },
  ];
  const chartData = [
    "07-16",
    "07-17",
    "07-18",
    "07-19",
    "07-20",
    "07-21",
    "07-22",
  ].map((date, index) => ({
    date,
    visits: [12, 18, 15, 25, 21, 28, 19][index],
    operations: [8, 13, 11, 20, 16, 22, 14][index],
  }));
  return (
    <div className="space-y-6">
      <PageHeader
        title="数据概览"
        description="查看平台身份、组织和安全活动的整体状态。"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              store.resetDemo();
              toast.success("演示数据已重置");
            }}
          >
            <RotateCcw />
            重置演示数据
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">
                    {value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <Icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>近七日安全活动</CardTitle>
            <CardDescription>登录与受审计操作的每日趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近操作</CardTitle>
            <CardDescription>
              用户在管理页面产生的操作会实时显示
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {store.operationLogs.slice(0, 6).map((log) => (
                <div
                  className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
                  key={log.id}
                >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{log.action}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.module} · {log.operator}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.time}</p>
                </div>
                <Badge variant={log.success ? "outline" : "destructive"}>
                  {log.success ? "成功" : "失败"}
                </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
