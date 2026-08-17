import { describe, expect, it } from "vitest";

import { isAllowedOrganizationParent, isPlatformOrganizationType } from "./organization-policy";

describe("organization tenant boundaries", () => {
  it("allows groups to contain groups or independent companies", () => {
    expect(isAllowedOrganizationParent("GROUP", null)).toBe(true);
    expect(isAllowedOrganizationParent("GROUP", "GROUP")).toBe(true);
    expect(isAllowedOrganizationParent("COMPANY", "GROUP")).toBe(true);
  });

  it("does not model a company as the child tenant of another company", () => {
    expect(isAllowedOrganizationParent("COMPANY", "COMPANY")).toBe(false);
  });

  it("keeps branches and departments inside a company tenant", () => {
    expect(isAllowedOrganizationParent("BRANCH", "COMPANY")).toBe(true);
    expect(isAllowedOrganizationParent("DEPARTMENT", "BRANCH")).toBe(true);
    expect(isAllowedOrganizationParent("BRANCH", "GROUP")).toBe(false);
  });

  it("reserves group and company lifecycle for platform administrators", () => {
    expect(isPlatformOrganizationType("GROUP")).toBe(true);
    expect(isPlatformOrganizationType("COMPANY")).toBe(true);
    expect(isPlatformOrganizationType("BRANCH")).toBe(false);
  });
});
