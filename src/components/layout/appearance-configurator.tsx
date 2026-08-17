"use client";

import * as React from "react";
import { Check, Columns3, LayoutDashboard, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AppearancePreference } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "LIGHT" as const, label: "浅色", icon: Sun },
  { value: "DARK" as const, label: "深色", icon: Moon },
  { value: "SYSTEM" as const, label: "跟随系统", icon: Monitor },
];

function OptionButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sun; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted", active && "border-primary bg-muted")}><Icon className="size-5" /><span>{label}</span>{active && <Check className="absolute right-2 top-2 size-3.5" />}</button>;
}

export function AppearanceConfigurator({ value, onChange, pending }: { value: AppearancePreference; onChange: (value: AppearancePreference) => void; pending?: boolean }) {
  const { setTheme } = useTheme();
  React.useEffect(() => setTheme(value.theme.toLowerCase()), [setTheme, value.theme]);
  const update = (next: Partial<AppearancePreference>) => onChange({ ...value, ...next });
  return <Sheet><SheetTrigger render={<Button variant="ghost" size="icon" />}><Palette /><span className="sr-only">主题配置</span></SheetTrigger><SheetContent side="right" className="w-full sm:max-w-md"><SheetHeader className="border-b pr-12"><SheetTitle>主题配置器</SheetTitle><SheetDescription>配置当前账号的后台布局和显示主题。</SheetDescription></SheetHeader>
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <section><h3 className="mb-2 text-sm font-medium">后台布局</h3><div className="grid grid-cols-2 gap-2"><OptionButton active={value.layout === "SIDEBAR"} icon={LayoutDashboard} label="左侧菜单" onClick={() => update({ layout: "SIDEBAR" })} /><OptionButton active={value.layout === "TOP"} icon={Columns3} label="顶部菜单" onClick={() => update({ layout: "TOP" })} /></div></section>
      <section><h3 className="mb-2 text-sm font-medium">显示主题</h3><div className="grid grid-cols-3 gap-2">{themeOptions.map((option) => <OptionButton key={option.value} active={value.theme === option.value} icon={option.icon} label={option.label} onClick={() => update({ theme: option.value })} />)}</div></section>
      {pending && <p className="text-right text-xs text-muted-foreground">正在保存配置…</p>}
    </div>
  </SheetContent></Sheet>;
}
