import { OrganizationsManagement } from "@/components/admin/organizations-management";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function OrganizationsPage() { await requirePermission(PERMISSIONS.organizationList); return <OrganizationsManagement />; }
