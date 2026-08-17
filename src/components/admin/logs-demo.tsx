"use client";

import * as React from "react";
import { Eye, XIcon } from "lucide-react";
import { useDemoStore } from "@/components/demo/demo-store";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DemoOperationLog } from "@/lib/demo-data";

function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <span className="mr-auto text-xs text-muted-foreground">
        第 {page} / {total} 页
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        上一页
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
      >
        下一页
      </Button>
    </div>
  );
}

export function OperationLogsDemo() {
  const { operationLogs } = useDemoStore();
  const [keyword, setKeyword] = React.useState("");
  const [results, setResults] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [detail, setDetail] = React.useState<DemoOperationLog>();
  const rows = operationLogs.filter(
    (item) =>
      (!keyword ||
        `${item.module} ${item.action} ${item.operator} ${item.path}`
          .toLowerCase()
          .includes(keyword.toLowerCase())) &&
      (!results.length || results.includes(String(item.success))),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const visible = rows.slice(
    (Math.min(page, pages) - 1) * 8,
    Math.min(page, pages) * 8,
  );
  return (
    <div className="space-y-5">
      <PageHeader
        title="操作日志"
        description="查询平台关键管理操作及其执行结果。"
      />
      <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 w-full sm:w-[320px]"
            placeholder="搜索模块、操作人或请求地址"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <DataTableFacetedFilter
            title="结果"
            values={results}
            onValuesChange={(values) => {
              setResults(values);
              setPage(1);
            }}
            options={[
              {
                value: "true",
                label: "成功",
                count: operationLogs.filter((item) => item.success).length,
              },
              {
                value: "false",
                label: "失败",
                count: operationLogs.filter((item) => !item.success).length,
              },
            ]}
          />
          {(keyword || results.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setKeyword("");
                setResults([]);
                setPage(1);
              }}
            >
              <XIcon />
              重置
            </Button>
          )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作时间</TableHead>
                <TableHead>模块 / 操作</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>请求</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>IP 地址</TableHead>
                <TableHead className="text-right">详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {log.time}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.module}
                    </p>
                  </TableCell>
                  <TableCell>{log.operator}</TableCell>
                  <TableCell>
                    <code className="text-xs">
                      {log.method} {log.path}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.success ? "outline" : "destructive"}>
                      {log.success ? "成功" : "失败"}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDetail(log)}
                    >
                      <Eye />
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
        </div>
        <div className="border-t px-3 py-2">
          <Pager page={Math.min(page, pages)} total={pages} onChange={setPage} />
        </div>
      </div>
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>操作详情</DialogTitle>
            <DialogDescription>
              操作日志只读，不允许在后台修改。
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[90px_1fr] gap-3 text-sm">
            <dt className="text-muted-foreground">时间</dt>
            <dd>{detail?.time}</dd>
            <dt className="text-muted-foreground">模块</dt>
            <dd>{detail?.module}</dd>
            <dt className="text-muted-foreground">操作</dt>
            <dd>{detail?.action}</dd>
            <dt className="text-muted-foreground">操作人</dt>
            <dd>{detail?.operator}</dd>
            <dt className="text-muted-foreground">请求</dt>
            <dd>
              <code>
                {detail?.method} {detail?.path}
              </code>
            </dd>
            <dt className="text-muted-foreground">IP</dt>
            <dd>{detail?.ip}</dd>
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LoginLogsDemo() {
  const { loginLogs } = useDemoStore();
  const [username, setUsername] = React.useState("");
  const [events, setEvents] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const rows = loginLogs.filter(
    (item) =>
      (!username ||
        item.username.toLowerCase().includes(username.toLowerCase())) &&
      (!events.length || events.includes(item.event)),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const visible = rows.slice(
    (Math.min(page, pages) - 1) * 8,
    Math.min(page, pages) * 8,
  );
  const names = {
    SUCCESS: "登录成功",
    FAILURE: "登录失败",
    LOGOUT: "退出登录",
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="登录日志"
        description="查看账号登录、失败尝试和主动退出记录。"
      />
      <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-8 w-full sm:w-[280px]"
            placeholder="搜索用户账号"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <DataTableFacetedFilter
            title="事件"
            values={events}
            onValuesChange={(values) => {
              setEvents(values);
              setPage(1);
            }}
            options={[
              {
                value: "SUCCESS",
                label: "登录成功",
                count: loginLogs.filter((item) => item.event === "SUCCESS").length,
              },
              {
                value: "FAILURE",
                label: "登录失败",
                count: loginLogs.filter((item) => item.event === "FAILURE").length,
              },
              {
                value: "LOGOUT",
                label: "退出登录",
                count: loginLogs.filter((item) => item.event === "LOGOUT").length,
              },
            ]}
          />
          {(username || events.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setUsername("");
                setEvents([]);
                setPage(1);
              }}
            >
              <XIcon />
              重置
            </Button>
          )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>登录时间</TableHead>
                <TableHead>用户账号</TableHead>
                <TableHead>事件</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>IP 地址</TableHead>
                <TableHead>登录地点</TableHead>
                <TableHead>客户端</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {log.time}
                  </TableCell>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.event === "FAILURE" ? "destructive" : "outline"
                      }
                    >
                      {names[log.event]}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.reason || "—"}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{log.location}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.browser}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
        </div>
        <div className="border-t px-3 py-2">
          <Pager page={Math.min(page, pages)} total={pages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
