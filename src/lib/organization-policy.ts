export const organizationTypes = ["GROUP", "COMPANY", "BRANCH", "DEPARTMENT", "TEAM"] as const;
export type OrganizationType = typeof organizationTypes[number];

export function isPlatformOrganizationType(type: OrganizationType) {
  return type === "GROUP" || type === "COMPANY";
}

export function isAllowedOrganizationParent(type: OrganizationType, parentType: OrganizationType | null) {
  if (type === "GROUP") return parentType === null || parentType === "GROUP";
  if (type === "COMPANY") return parentType === null || parentType === "GROUP";
  if (type === "BRANCH") return parentType === "COMPANY" || parentType === "BRANCH";
  if (type === "DEPARTMENT") return parentType === "COMPANY" || parentType === "BRANCH" || parentType === "DEPARTMENT";
  return parentType === "BRANCH" || parentType === "DEPARTMENT" || parentType === "TEAM";
}
