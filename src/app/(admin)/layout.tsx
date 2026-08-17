import { AdminShell } from "@/components/layout/admin-shell";
import { requireUser } from "@/lib/authorization";
import { getManagementState } from "@/lib/admin-data";
import { getWorkspaceExperience } from "@/lib/workspaces";
import { getAppearancePreference } from "@/lib/appearance";
import { DemoStoreProvider } from "@/components/demo/demo-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [workspaceExperience, initialAppearance] = await Promise.all([getWorkspaceExperience(user), getAppearancePreference(user.id)]);
  const demoMode = process.env.APP_DEMO_MODE === "true";
  const initialState = demoMode ? undefined : await getManagementState(user);
  return <DemoStoreProvider initialState={initialState} currentUserId={user.id} permissions={user.permissions} roleCodes={user.roleCodes}><AdminShell {...workspaceExperience} initialAppearance={initialAppearance}>{children}</AdminShell></DemoStoreProvider>;
}
