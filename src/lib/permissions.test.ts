import { describe, expect, it } from "vitest";

import { PERMISSION_NAMES, PERMISSIONS } from "./permissions";

describe("permission names", () => {
  it("provides a clear Chinese name for every permission", () => {
    const permissionCodes = Object.values(PERMISSIONS);

    expect(Object.keys(PERMISSION_NAMES)).toHaveLength(permissionCodes.length);
    for (const permissionCode of permissionCodes) {
      expect(PERMISSION_NAMES[permissionCode]).toMatch(/[\u4e00-\u9fff]/);
    }
  });
});
