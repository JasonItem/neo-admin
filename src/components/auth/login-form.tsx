"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";

import { loginAction } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.message && <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>}
      <div className="space-y-2">
        <Label htmlFor="username">账号</Label>
        <div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="username" name="username" autoComplete="username" autoFocus className="h-11 pl-10" placeholder="请输入平台账号" aria-invalid={Boolean(state?.errors?.username)} /></div>
        {state?.errors?.username?.map((error) => <p className="text-xs text-destructive" key={error}>{error}</p>)}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" name="password" type="password" autoComplete="current-password" className="h-11 pl-10" placeholder="请输入密码" aria-invalid={Boolean(state?.errors?.password)} /></div>
        {state?.errors?.password?.map((error) => <p className="text-xs text-destructive" key={error}>{error}</p>)}
      </div>
      <Button className="h-11 w-full justify-between px-4" disabled={pending} type="submit">
        <span>{pending ? "正在验证…" : "进入管理平台"}</span><ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
