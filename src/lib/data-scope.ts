import type { DataScope } from "@/db/schema";

export type PermissionDataGrant = {
  scope: DataScope;
  tenantId: string;
  anchorOrganizationId: string;
  anchorOrganizationPath: string;
};

export type ScopedRecord = {
  tenantId: string;
  organizationId: string;
  organizationPath: string;
  ownerUserId: string;
};

const dataScopeRank: Record<DataScope, number> = {
  SELF: 0,
  CURRENT_ORG: 1,
  ORG_SUBTREE: 2,
  TENANT: 3,
  PLATFORM: 4,
};

export function canDelegateScopeForRole(input: {
  grants: PermissionDataGrant[];
  requestedScope: DataScope;
  targetTenantId: string | null;
}) {
  const { grants, requestedScope, targetTenantId } = input;
  return grants.some((grant) => {
    if (grant.scope === "PLATFORM") return true;
    if (!targetTenantId || grant.tenantId !== targetTenantId) return false;
    return dataScopeRank[grant.scope] >= dataScopeRank[requestedScope];
  });
}

export function canDelegateScopeToUser(input: {
  actorUserId: string;
  grants: PermissionDataGrant[];
  requestedScope: DataScope;
  targetUserId: string;
  targetTenantId: string;
  targetOrganizationId: string;
  targetOrganizationPath: string;
}) {
  const {
    actorUserId,
    grants,
    requestedScope,
    targetUserId,
    targetTenantId,
    targetOrganizationId,
    targetOrganizationPath,
  } = input;

  return grants.some((grant) => {
    if (grant.scope === "PLATFORM") return true;
    if (grant.tenantId !== targetTenantId || requestedScope === "PLATFORM") return false;
    if (grant.scope === "TENANT") return true;
    if (requestedScope === "TENANT") return false;

    const grantCoversTargetOrganization = grant.scope === "ORG_SUBTREE"
      && (targetOrganizationPath === grant.anchorOrganizationPath
        || targetOrganizationPath.startsWith(`${grant.anchorOrganizationPath}/`));

    if (requestedScope === "ORG_SUBTREE") return grantCoversTargetOrganization;
    if (requestedScope === "CURRENT_ORG") {
      return grantCoversTargetOrganization
        || (grant.scope === "CURRENT_ORG" && grant.anchorOrganizationId === targetOrganizationId);
    }
    if (grantCoversTargetOrganization) return true;
    if (grant.scope === "CURRENT_ORG") return grant.anchorOrganizationId === targetOrganizationId;
    return grant.scope === "SELF" && actorUserId === targetUserId;
  });
}

export function resolvePermissionDataGrants(input: {
  roleCodes: string[];
  tenantId: string;
  organizationId: string;
  permissionGrants: Record<string, PermissionDataGrant[]>;
  permission: string;
}) {
  if (input.roleCodes.includes("SUPER_ADMIN")) {
    return [{
      scope: "PLATFORM" as const,
      tenantId: input.tenantId,
      anchorOrganizationId: input.organizationId,
      anchorOrganizationPath: "",
    }];
  }
  return input.permissionGrants[input.permission] ?? [];
}

export function canAccessScopedRecord(input: {
  userId: string;
  grants: PermissionDataGrant[];
  record: ScopedRecord;
}) {
  const { userId, grants, record } = input;

  return grants.some((grant) => {
    if (grant.scope === "PLATFORM") return true;
    if (grant.tenantId !== record.tenantId) return false;
    if (grant.scope === "TENANT") return true;
    if (grant.scope === "SELF") return record.ownerUserId === userId;
    if (grant.scope === "CURRENT_ORG") return record.organizationId === grant.anchorOrganizationId;

    return record.organizationPath === grant.anchorOrganizationPath
      || record.organizationPath.startsWith(`${grant.anchorOrganizationPath}/`);
  });
}
