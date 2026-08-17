import { GalleryVerticalEnd } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import PixelBlast from "@/components/PixelBlast";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#111318] lg:block">
        <PixelBlast
          className="absolute inset-0 opacity-75"
          variant="square"
          pixelSize={5}
          color="#ffffff"
          patternScale={2.4}
          patternDensity={0.9}
          pixelSizeJitter={0.35}
          enableRipples
          rippleIntensityScale={1.25}
          rippleThickness={0.08}
          rippleSpeed={0.32}
          speed={0.35}
          edgeFade={0.2}
          transparent
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="pointer-events-none absolute left-10 top-10 z-10 flex items-center gap-2 text-sm font-medium text-white">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><GalleryVerticalEnd className="size-4" /></span>
          NeoAdmin
        </div>
        <div className="pointer-events-none absolute inset-x-10 bottom-10 z-10 max-w-md text-white">
          <blockquote className="space-y-2"><p className="text-lg">“统一管理用户、角色、菜单、工作区与组织数据范围，让系统权限清晰可控。”</p><footer className="text-sm text-white/65">NeoAdmin · CMS 管理</footer></blockquote>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col space-y-2 text-center"><h1 className="text-2xl font-semibold tracking-tight">登录管理平台</h1><p className="text-sm text-muted-foreground">输入平台账号和密码继续</p></div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
