import { DashboardDemo } from "@/components/dashboard/dashboard-demo";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function DashboardPage() { await requirePermission(PERMISSIONS.dashboardView); return <DashboardDemo />; }
