import { AccountSettingsNav } from "@/components/admin/account-settings-nav";
import { PageHeader } from "@/components/layout/page-header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="账户设置"
        description="管理你的个人资料和登录安全设置。"
      />
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-12">
        <AccountSettingsNav />
        <div className="w-full min-w-0 max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
