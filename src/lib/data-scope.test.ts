import { describe, expect, it } from "vitest";

import {
  canAccessScopedRecord,
  canDelegateScopeForRole,
  canDelegateScopeToUser,
  resolvePermissionDataGrants,
  type PermissionDataGrant,
  type ScopedRecord,
} from "./data-scope";

const grant = (scope: PermissionDataGrant["scope"], tenantId = "tenant-a", anchorOrganizationId = "sales", anchorOrganizationPath = "company/sales"): PermissionDataGrant => ({
  scope,
  tenantId,
  anchorOrganizationId,
  anchorOrganizationPath,
});

describe("delegated authorization ceiling", () => {
  it("cannot define a role scope broader than the actor owns", () => {
    expect(canDelegateScopeForRole({ grants: [grant("ORG_SUBTREE")], requestedScope: "TENANT", targetTenantId: "tenant-a" })).toBe(false);
    expect(canDelegateScopeForRole({ grants: [grant("TENANT")], requestedScope: "ORG_SUBTREE", targetTenantId: "tenant-a" })).toBe(true);
  });

  it("cannot delegate a grant into another tenant", () => {
    expect(canDelegateScopeForRole({ grants: [grant("TENANT")], requestedScope: "SELF", targetTenantId: "tenant-b" })).toBe(false);
    expect(canDelegateScopeToUser({
      actorUserId: "user-1",
      grants: [grant("TENANT")],
      requestedScope: "SELF",
      targetUserId: "user-2",
      targetTenantId: "tenant-b",
      targetOrganizationId: "sales",
      targetOrganizationPath: "company/sales",
    })).toBe(false);
  });

  it("only delegates subtree roles to users inside the actor subtree", () => {
    const base = {
      actorUserId: "user-1",
      grants: [grant("ORG_SUBTREE")],
      requestedScope: "ORG_SUBTREE" as const,
      targetUserId: "user-2",
      targetTenantId: "tenant-a",
    };
    expect(canDelegateScopeToUser({ ...base, targetOrganizationId: "sales-east", targetOrganizationPath: "company/sales/east" })).toBe(true);
    expect(canDelegateScopeToUser({ ...base, targetOrganizationId: "finance", targetOrganizationPath: "company/finance" })).toBe(false);
  });

  it("SELF can only be delegated by a SELF grant to the same user", () => {
    expect(canDelegateScopeToUser({
      actorUserId: "user-1",
      grants: [grant("SELF")],
      requestedScope: "SELF",
      targetUserId: "user-2",
      targetTenantId: "tenant-a",
      targetOrganizationId: "sales",
      targetOrganizationPath: "company/sales",
    })).toBe(false);
  });

  it("PLATFORM is an explicit bypass across tenants", () => {
    expect(canDelegateScopeToUser({
      actorUserId: "platform-admin",
      grants: [grant("PLATFORM")],
      requestedScope: "TENANT",
      targetUserId: "user-2",
      targetTenantId: "tenant-b",
      targetOrganizationId: "company-b",
      targetOrganizationPath: "group/company-b",
    })).toBe(true);
  });
});
const record = (overrides: Partial<ScopedRecord> = {}): ScopedRecord => ({
  tenantId: "tenant-a",
  organizationId: "sales",
  organizationPath: "company/sales",
  ownerUserId: "user-2",
  ...overrides,
});

describe("permission-specific data scopes", () => {
  it("SELF only accepts records owned by the current user", () => {
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("SELF")], record: record({ ownerUserId: "user-1" }) })).toBe(true);
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("SELF")], record: record() })).toBe(false);
  });

  it("CURRENT_ORG excludes child organizations", () => {
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("CURRENT_ORG")], record: record() })).toBe(true);
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("CURRENT_ORG")], record: record({ organizationId: "sales-east", organizationPath: "company/sales/east" }) })).toBe(false);
  });

  it("ORG_SUBTREE accepts the anchor and descendants", () => {
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("ORG_SUBTREE")], record: record({ organizationId: "sales-east", organizationPath: "company/sales/east" }) })).toBe(true);
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("ORG_SUBTREE")], record: record({ organizationId: "finance", organizationPath: "company/finance" }) })).toBe(false);
  });

  it("TENANT cannot cross company boundaries", () => {
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("TENANT")], record: record({ organizationId: "finance" }) })).toBe(true);
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("TENANT")], record: record({ tenantId: "tenant-b" }) })).toBe(false);
  });

  it("PLATFORM is the only scope that can cross company boundaries", () => {
    expect(canAccessScopedRecord({ userId: "user-1", grants: [grant("PLATFORM")], record: record({ tenantId: "tenant-b" }) })).toBe(true);
  });

  it("combines multiple role grants as an allow union", () => {
    expect(canAccessScopedRecord({
      userId: "user-1",
      grants: [grant("SELF"), grant("ORG_SUBTREE", "tenant-a", "finance", "company/finance")],
      record: record({ organizationId: "finance-payroll", organizationPath: "company/finance/payroll" }),
    })).toBe(true);
  });

  it("does not apply a broad scope from one permission to another permission", () => {
    const permissionGrants = {
      "system:user:update": [grant("SELF")],
      "system:operation-log:list": [grant("TENANT")],
    };
    const grants = resolvePermissionDataGrants({
      roleCodes: ["AUDITOR"],
      tenantId: "tenant-a",
      organizationId: "sales",
      permissionGrants,
      permission: "system:user:update",
    });
    expect(grants).toEqual([grant("SELF")]);
  });
});
