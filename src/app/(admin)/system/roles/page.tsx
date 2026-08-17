import { RolesManagement } from "@/components/admin/roles-management";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function RolesPage() { await requirePermission(PERMISSIONS.roleList); return <RolesManagement />; }
