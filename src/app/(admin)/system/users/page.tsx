import { UsersManagement } from "@/components/admin/users-management";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function UsersPage() { await requirePermission(PERMISSIONS.userList); return <UsersManagement />; }
