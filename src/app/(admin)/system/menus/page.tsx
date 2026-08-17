import { MenusManagement } from "@/components/admin/menus-management";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function MenusPage() { await requirePermission(PERMISSIONS.menuList); return <MenusManagement />; }
