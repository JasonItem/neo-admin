"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const items = [
  { href: "/account/profile", label: "个人资料", icon: UserRound },
  { href: "/account/password", label: "登录密码", icon: KeyRound },
];

export function AccountSettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="账户设置">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={buttonVariants({
              variant: pathname === item.href ? "secondary" : "ghost",
              className: "shrink-0 justify-start lg:w-full",
            })}
          >
            <Icon data-icon="inline-start" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
