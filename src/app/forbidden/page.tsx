import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="max-w-md text-center">
        <ShieldX className="mx-auto mb-5 size-12 text-primary" />
        <h1 className="text-2xl font-semibold">没有访问权限</h1>
        <p className="mt-2 text-muted-foreground">
          当前账号未被授予此页面或操作的权限。如有需要，请联系平台管理员调整角色。
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ className: "mt-6" })}
        >
          返回数据概览
        </Link>
      </div>
    </main>
  );
}
