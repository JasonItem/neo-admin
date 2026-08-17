"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/actions/account";
import { useDemoStore } from "@/components/demo/demo-store";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator />
    </div>
  );
}

export function ProfileDemo() {
  const store = useDemoStore();
  const user = store.users.find((item) => item.id === store.currentUserId)!;
  const organization = store.organizations.find(
    (item) => item.id === user.organizationId,
  );
  const [values, setValues] = React.useState({
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.displayName.trim()) return toast.error("显示名称不能为空");
    if (values.email && !values.email.includes("@")) {
      return toast.error("请输入正确的邮箱地址");
    }
    store.updateProfile(values);
    toast.success("个人资料已保存");
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="个人资料"
        description="更新你的展示名称和联系方式。账号及所属组织由管理员维护。"
      />
      <form onSubmit={submit}>
        <FieldGroup>
          <Field data-disabled>
            <FieldLabel htmlFor="profile-username">用户账号</FieldLabel>
            <Input id="profile-username" value={user.username} disabled />
            <FieldDescription>登录账号不能在个人设置中修改。</FieldDescription>
          </Field>
          <Field data-disabled>
            <FieldLabel htmlFor="profile-organization">所属组织</FieldLabel>
            <Input
              id="profile-organization"
              value={organization?.name ?? "未分配"}
              disabled
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-display-name">显示名称</FieldLabel>
            <Input
              id="profile-display-name"
              value={values.displayName}
              onChange={(event) =>
                setValues({ ...values, displayName: event.target.value })
              }
            />
            <FieldDescription>该名称会显示在系统导航和操作记录中。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-email">邮箱</FieldLabel>
            <Input
              id="profile-email"
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues({ ...values, email: event.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-phone">手机号</FieldLabel>
            <Input
              id="profile-phone"
              value={values.phone}
              onChange={(event) =>
                setValues({ ...values, phone: event.target.value })
              }
            />
          </Field>
          <Field orientation="horizontal">
            <Button type="submit">保存修改</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}

function PasswordField({
  id,
  label,
  description,
  value,
  autoComplete,
  visible,
  onChange,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  description?: string;
  value: string;
  autoComplete: "current-password" | "new-password";
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            onClick={onToggleVisibility}
            aria-label={visible ? "隐藏密码" : "显示密码"}
          >
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function PasswordDemo() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword) return toast.error("请输入当前密码");
    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      return toast.error("新密码至少 8 位，并同时包含字母和数字");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("两次输入的新密码不一致");
    }

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);
    startTransition(async () => {
      try {
        await changePasswordAction(formData);
        toast.success("密码修改成功，请重新登录");
        router.replace("/login");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "密码修改失败");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="登录密码"
        description="设置新的登录密码。更新后，当前账号的全部会话都会退出。"
      />
      <form onSubmit={submit}>
        <FieldGroup>
          <PasswordField
            id="current-password"
            label="当前密码"
            value={currentPassword}
            autoComplete="current-password"
            visible={visible}
            onChange={setCurrentPassword}
            onToggleVisibility={() => setVisible((value) => !value)}
          />
          <PasswordField
            id="new-password"
            label="新密码"
            description="密码至少 8 位，并同时包含字母和数字。"
            value={newPassword}
            autoComplete="new-password"
            visible={visible}
            onChange={setNewPassword}
            onToggleVisibility={() => setVisible((value) => !value)}
          />
          <PasswordField
            id="confirm-password"
            label="确认新密码"
            value={confirmPassword}
            autoComplete="new-password"
            visible={visible}
            onChange={setConfirmPassword}
            onToggleVisibility={() => setVisible((value) => !value)}
          />
          <Field orientation="horizontal">
            <Button type="submit" disabled={pending}>
              {pending ? "正在更新…" : "更新密码"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
