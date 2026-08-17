import { OperationLogsDemo } from "@/components/admin/logs-demo";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function OperationLogsPage() { await requirePermission(PERMISSIONS.operationLogList); return <OperationLogsDemo />; }
