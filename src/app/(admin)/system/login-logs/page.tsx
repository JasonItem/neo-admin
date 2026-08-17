import { LoginLogsDemo } from "@/components/admin/logs-demo";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function LoginLogsPage() { await requirePermission(PERMISSIONS.loginLogList); return <LoginLogsDemo />; }
