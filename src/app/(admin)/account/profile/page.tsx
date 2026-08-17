import { ProfileDemo } from "@/components/admin/account-demo";
import { requirePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
export default async function ProfilePage() { await requirePermission(PERMISSIONS.profileUpdate); return <ProfileDemo />; }
