import { PasswordDemo } from "@/components/admin/account-demo";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function PasswordPage() { await requirePermission(PERMISSIONS.passwordUpdate); return <PasswordDemo />; }
